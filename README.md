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

Choose from four battlefields in the start menu:

- **Orchid Reserve** — the original winding garden road.
- **Ember Rift** — a basalt caldera with three riveted bridges over a molten fault. Lava blocks construction.
- **Frostwatch** — a snowy outpost, fractured glacial lake and eastern switchbacks. Thin lake ice blocks construction.
- **Sunspire Ruins** — sandstone ruins around an oasis, with a southern hairpin for overlapping fire. Oasis water blocks construction.

Each has its own route, cover illustration, terrain, keep and ambient effects. All four support the existing thirty waves, endless mode, upgrades, selling, pinch zoom and FIT. Terrain is rendered into the static board cache; the modest particle count follows the existing quality and reduced-motion preferences.

Each map has its own journey and best-wave record for each guest/account. Schema v3 adds `mapId`; v1/v2 saves migrate to Orchid without copying towers into other maps. Local saves are separated by account and map. Firebase stores the `orchid`, `ember`, `frost` and `sunspire` slots under `mapSaves` and matching `mapRecords`; the legacy `save` field remains an Orchid backup. Owner-only Firestore rules continue to cover these fields.

Run `npm run test:maps` with Node 22.6+ for route, bridge, save migration and account-isolation checks. `?devtest=1` runs the in-game checks on the selected battlefield.

## Character animation

Each mechanical type uses a distinct cached 24-frame gait. Footstep phase follows actual path distance, including slows, haste and game-speed changes. Boss legs use inverse kinematics with a grounded support foot; shades have a 16-frame flowing cloak. Turning eases the body and facing, while brief weighted hit reactions affect presentation only. Mechanical deaths break the current sprite into falling armor fragments; shades dissolve upward. At most 12 death echoes are retained, with fewer fragments at low quality. Pause freezes the pose and reduced motion uses still sprites.

Run `npm run test:motion` for frame-rate independence, slow/speed behavior, pause, stopped units, shortest-path turns, grounded boss feet and hit decay. The existing in-game tests also lock gameplay balance. A development-only `?animationlab=1&devtest=1` fixture previews all eight enemy types, slow/hit/death effects and a 40-unit crowd without saving or connecting to player accounts. This fixture is disabled in production builds.

## Mobile controls

Tap a tower type and then a free cell to build. Hold a tower type for details. Tap a built tower to upgrade or sell. Drag with one finger; pinch with two fingers to zoom. FIT shows the whole map.

