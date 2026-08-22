# Dior's Overworld

Portfolio landing page: a pre-rendered voxel landscape with a real-time 3D
character standing in front of it. Scroll and the character changes with the
role beside it.

**Live:** https://abdunazarov.web.app

Also served at `dior-abdunazarov.web.app` and `dior-portfolio-5182.web.app`, so older
links keep working.

## How it is put together

The scenery is **not** generated in the browser. `src/render.js` builds the
landscape offline and `tools/bake.mjs` renders it to `assets/bg-*.jpg` at
2048×1152. That is what keeps it detailed without costing anything at runtime.

Only the character is live: `src/site.js` draws his skin as a classic 64×64
Minecraft layout (at 8 canvas pixels per skin pixel, so seams and stitching are
real detail), builds him out of boxes, and renders him with three.js over the
baked photo. He tracks the cursor, spins when you drag him, and reassembles out
of scattered blocks when the section changes.

Every texture and skin here is painted in code. No Mojang assets are used.

## Commands

```bash
npm install
npm run build     # -> dist/index.html, one self-contained file
npm run bake      # re-render the backgrounds (needs playwright + chromium)
```

`npm run bake` is only needed when the landscape itself changes; the committed
JPGs are what ships.

## Deploying

Pushes to `master` deploy to Firebase Hosting via GitHub Actions. The workflow
needs one repository secret:

- `FIREBASE_SERVICE_ACCOUNT` — JSON key for a service account with the
  Firebase Hosting Admin role on project `dior-portfolio-5182`.
