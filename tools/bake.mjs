/**
 * Offline renderer for the background scenery.
 *
 * Builds src/render.js, opens it in headless Chromium and saves the frame as
 * assets/bg-<variant>.jpg. Run this only when the landscape itself changes —
 * the committed JPGs are what the site ships.
 *
 *   npm run bake            # both variants
 *   node tools/bake.mjs valley
 */
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const variants = (process.argv[2] || 'valley,grove').split(',');
const W = 2048, H = 1152, Q = 0.85;

const { outputFiles } = await build({
  entryPoints: ['src/render.js'],
  bundle: true, minify: true, format: 'iife', target: ['es2020'],
  write: false, legalComments: 'none'
});
const page = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#000}</style>
<script>${outputFiles[0].text.split('</script>').join('<\\/script>')}</script>`;
await writeFile('tools/render.built.html', page);

const browser = await chromium.launch();
for (const v of variants) {
  const p = await browser.newPage({ viewport: { width: 600, height: 400 } });
  p.on('pageerror', (e) => console.error('render error:', e.message));
  await p.goto(`file://${process.cwd()}/tools/render.built.html?v=${v}&w=${W}&h=${H}&q=${Q}`);
  await p.waitForFunction('window.__DONE === true', { timeout: 900000 });
  const uri = await p.evaluate(() => window.__IMG);
  const buf = Buffer.from(uri.split(',')[1], 'base64');
  await writeFile(`assets/bg-${v}.jpg`, buf);
  console.log(`assets/bg-${v}.jpg  ${(buf.length / 1024) | 0} kB`);
  await p.close();
}
await browser.close();
