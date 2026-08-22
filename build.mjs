/**
 * Bundles the page into a single self-contained dist/index.html.
 *
 * The landscape behind the character is pre-rendered (see tools/bake.mjs) and
 * inlined as a data URI, so the browser never generates terrain at runtime —
 * that is what keeps the scenery detailed and the page fast. Only the
 * character is drawn live.
 */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { statSync } from 'node:fs';

const OUT = 'dist';

const jpegDataUri = async (p) =>
  'data:image/jpeg;base64,' + (await readFile(p)).toString('base64');

const result = await build({
  entryPoints: ['src/site.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  write: false,
  legalComments: 'none'
});

const js = result.outputFiles[0].text.split('</script>').join('<\\/script>');
const [valley, grove] = await Promise.all([
  jpegDataUri('assets/bg-valley.jpg'),
  jpegDataUri('assets/bg-grove.jpg')
]);

const html = (await readFile('index.html', 'utf8'))
  .replace('__BUNDLE__', () => js)
  .replace('background-image:var(--shot);', () => `background-image:url("${valley}");`)
  .replace('background-image:var(--shot2);', () => `background-image:url("${grove}");`);

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/index.html`, html);
await copyFile('assets/bg-valley.jpg', `${OUT}/og.jpg`);   // social preview

console.log(
  `dist/index.html  ${(statSync(`${OUT}/index.html`).size / 1024 / 1024).toFixed(2)} MB` +
  `  (js ${(js.length / 1024) | 0} kB)`
);
