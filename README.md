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

## Accounts and saves

The start menu offers New Game, Continue and Settings. Google sign-in uses the `bastion-game` Firebase project owned by `aisign369@gmail.com`. The game stores each signed-in player's email, display name, save, and update-email preference in `players/{uid}`. Email updates are **off by default** and require the player to check the box in the menu. Firestore rules in `firestore.rules` allow a player to read or write only their own record. The game also keeps a local backup and separates guest and account saves on the same device. A guest save can be imported from the menu after sign-in.

After Google sign-in, the player chooses a unique, case-insensitive player ID before starting or continuing. IDs are 3–16 Latin letters, digits or underscores and start with a letter. The ID can be changed later. Firestore reserves normalized IDs in `usernames/{id}` and stores the displayed ID and `bestWave` together in the player's private `players/{uid}` document, so the owner can identify records in Firebase Console. `bestWave` advances when each wave is cleared. This is a client-reported record, not an anti-cheat leaderboard.

Firebase's web configuration is in `.env.production`. These four values identify the public web app and are included in the browser build; they are not server credentials. `.env.local` is ignored by Git and can override them for local development. Google Authentication must list `bastion-eight-henna.vercel.app` as an authorized domain. The default Firestore database uses Standard edition in `me-central1` (Doha), and the rules in `firestore.rules` have been published in Firebase Console.

The Firebase Console's Authentication → Users and Firestore → Data pages show signed-in players and their saved profiles. An email-sending service and owner-facing dashboard are not part of this release; collecting update consent here prepares for those features later.

## Battlefields

Choose **Orchid Reserve** or **Ember Rift** from the start menu. Ember Rift is a basalt caldera with a new route, three riveted bridges over a molten fault, warm lighting and drifting embers. Lava cells cannot hold towers. Both maps support the existing thirty waves, endless mode, upgrades, selling, pinch zoom and FIT.

Each map has its own journey and best-wave record for each guest/account. Schema v3 adds `mapId`; v1/v2 saves migrate to Orchid without copying towers into Ember. Local saves are separated by account and map. Firebase stores `mapSaves.orchid`, `mapSaves.ember` and matching `mapRecords`; the legacy `save` field remains an Orchid backup. Owner-only Firestore rules continue to cover these fields.

Run `npm run test:maps` with Node 22.6+ for route, bridge, save migration and account-isolation checks. `?devtest=1` runs the in-game checks on the selected battlefield.

## Mobile controls

Tap a tower type and then a free cell to build. Hold a tower type for details. Tap a built tower to upgrade or sell. Drag with one finger; pinch with two fingers to zoom. FIT shows the whole map.

