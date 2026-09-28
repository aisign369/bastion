# BASTION — Orchid Protocol

[Play the game](https://bastion-eight-henna.vercel.app)

Tower defense game with mobile landscape layout, one-finger map panning and two-finger pinch zoom.

## Development

The game now builds with Vite, TypeScript and Phaser 3. Phaser owns the game scene and animation loop; the existing Canvas 2D simulation and artwork remain in `game/bastion/src/game.ts` so saved games, controls and visuals stay compatible. New map geometry lives in strictly typed `path.ts`. The legacy simulation is marked `@ts-nocheck` while its systems are migrated in smaller pieces.

```sh
pnpm install
pnpm dev
pnpm build
```

The Vercel build uses pnpm 10.29.3 and publishes `dist/`. The HTML entry is `game/bastion/index.html`.

## Vercel deployment

The Vercel project imports this repository's main branch. Root Directory: repository root (./), Framework: Other. `vercel.json` installs dependencies, builds the game and serves `dist/`. Commits to `main` trigger automatic deployments.

## Mobile controls

Tap a tower type and then a free cell to build. Hold a tower type for details. Tap a built tower to upgrade or sell. Drag with one finger; pinch with two fingers to zoom. FIT shows the whole map.
