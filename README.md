# BASTION — Frontier Protocol

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
- **Sunspire Ruins** — sandstone ruins around an oasis, three tiered Egyptian pyramids above the northern road and a southern hairpin for overlapping fire. Oasis water blocks construction; pyramids are background scenery and preserve all existing buildable cells and saves.

Each has its own route, cover illustration, terrain, keep and ambient effects. All four support the existing thirty waves, endless mode, upgrades, selling, pinch zoom and FIT. Terrain is rendered into the static board cache; the modest particle count follows the existing quality and reduced-motion preferences.

Each map has its own journey and best-wave record for each guest/account. Schema v3 adds `mapId`; v1/v2 saves migrate to Orchid without copying towers into other maps. Local saves are separated by account and map. Firebase stores the `orchid`, `ember`, `frost` and `sunspire` slots under `mapSaves` and matching `mapRecords`; the legacy `save` field remains an Orchid backup. Owner-only Firestore rules continue to cover these fields.

Run `npm run test:maps` with Node 22.6+ for route, bridge, save migration and account-isolation checks. `?devtest=1` runs the in-game checks on the selected battlefield.

## Character animation

Each mechanical type uses a distinct cached 24-frame gait. Footstep phase follows actual path distance, including slows, haste and game-speed changes. Boss legs use inverse kinematics with a grounded support foot; shades have a 16-frame flowing cloak. Turning eases the body and facing, while brief weighted hit reactions affect presentation only. Mechanical deaths break the current sprite into falling armor fragments; shades dissolve upward. At most 12 death echoes are retained, with fewer fragments at low quality. Pause freezes the pose and reduced motion uses still sprites.

Run `npm run test:motion` for frame-rate independence, slow/speed behavior, pause, stopped units, shortest-path turns, grounded boss feet and hit decay. The existing in-game tests also lock gameplay balance. A development-only `?animationlab=1&devtest=1` fixture previews all eight enemy types, slow/hit/death effects and a 40-unit crowd without saving or connecting to player accounts. This fixture is disabled in production builds.

## Map armories

Orchid restores the actual original tower painters and steel bases from the release before map skins, including recoil, frost motion and Tesla effects. Ember keeps the approved forge vents and basalt armor. The other two armories have entirely different silhouettes and foundations for each role: Frostwatch uses a harpoon ballista, snowflake reactor, icy counterweight trebuchet, floating aurora lenses and branching antler conductor; Sunspire uses a six-legged scarab, paired cobra fountain, solar ritual bombard, feathered Eye of Ra and jackal-headed Anubis guardian. All four damage-upgrade levels have distinct details, with matching shop/inspector portraits and firing colors. Fully upgrading **both damage and rate** adds persistent legendary ornaments and a LEGENDARY label; damage MK-IV alone still unlocks the normal ability. Skins do not change combat stats, prices, tower keys or save format.

`frontier-towers.ts` draws the ten redesigned frontier towers. `tower-skins.ts` caches the selected map's five bases and twenty heads, with portraits reused for the shop and inspector; the five original Orchid bases are retained for switching back. Orchid uses its original live head painters during battle. Reduced motion keeps the ornaments. A development-only `?towerlab=1&devtest=1` gallery shows all twenty skins and every upgrade level, plus on-map fixtures. It skips player-save writes and account observation; the fixture is excluded from production builds.

## Mobile controls

Tap a tower type and then a free cell to build. Hold a tower type for details. Tap a built tower to upgrade or sell. Drag with one finger; pinch with two fingers to zoom. FIT shows the whole map.

## Frontier Protocol (frontier-protocol-1)

The start menu adds **Commander Journal** and **Field Feedback**, also available from the journal button during battle. Opening either pauses combat; closing restores the previous pause state. Feedback keeps a separate form, so an account callback cannot replace a message being typed.

### Balance and map events

New journeys use balance version 2. Existing journeys keep version 1, their original stats and no new weather, until the player starts a new game. Stinger prices and damage are unchanged. Rime gains 10% reach, Longshot gains 12% damage, mortar edge damage is 60% instead of 45%, and Tesla's chain falloff is 28% per hop instead of 25%. The quadratic health ramp after wave ten is 0.018 instead of 0.022. Upgrade prices, protocol cards, enemy roles and armor/shield counters remain in use. The inspector explains each tower's role and counterplay.

Starting at wave six, each map forecasts an event: 18 seconds calm, five seconds of warning, nine seconds active, then a 42-second repeating cycle. Pause and game speed use the same simulation clock as combat.

| Map | Event | Effect and counterplay |
| --- | --- | --- |
| Orchid | Lumen Bloom | All towers gain 12% reach. |
| Ember | Caldera Eruption | Three marked bridge vents damage enemies; mortar splash radius gains 15%. Towers take no environmental damage. |
| Frostwatch | Whiteout | Enemies slow 18%, bosses 10%, tower fire rate slows 8%; Rime is unaffected. |
| Sunspire | Sandstorm | Tower reach drops 15%; Longshot retains full reach. Shadow wave penalties do not multiply with the storm. |

The original Orchid tower artwork, approved Ember designs and unique Frostwatch/Sunspire armories remain intact.

### Persistent career

Eight honors track first clearance, wave five, 500 kills in a journey, deploying all five roles, a legendary tower, wave five on all four maps, thirty-wave victory and a perfect victory. Five foundation engravings unlock through these honors. They alter presentation only and never boost damage. Progress uses per-map maxima so replaying a checkpoint cannot farm honors. Guest/account careers are isolated locally; signed-in careers merge per-map maxima in a Firestore transaction under `players/{uid}.career`.

### Private feedback

Players choose bug/balance/idea, rate their experience and write 10–1500 characters. The draft is saved under their local guest/account slot. Guests can download a JSON draft; Google sign-in is required to send it. The developer reads received reports in **Firebase Console → Firestore Database → Data → players → player UID → feedback**. Reports include the player ID, battlefield, wave, version and timestamp. Technical diagnostics (screen size, FPS, quality and touch support) are unchecked by default; the report does not include the email. Existing owner-only rules protect this field. A private account can store up to 50 reports; this release does not send emails or create a public report feed.

### Reliable checkpoints and mobile play

Schema v4 retains spawn queue position, live enemies, projectiles, mortar shells, referenced targets, tower cooldowns/abilities, RNG seed, combo, event clock and pending protocol choices. Autosave runs every four seconds during play and at important transitions. A restored active wave starts paused. Backgrounding the page saves and pauses combat. Cloud synchronization keeps the newer timestamp per map, preserves best records, serializes in-flight writes and retries after connection failure; the local copy remains the immediate backup. Closing a browser cannot guarantee an in-flight network write completes.

Auto-launch is now an explicit setting, off by default. Portrait/landscape layouts keep launch, upgrade/sell and FIT reachable, including landscape tablets. Two-finger pinch and one-finger pan cannot place a tower at the end of the gesture. Touch devices initially use medium adaptive quality; reduced motion remains supported. Simulation uses fixed 60 Hz steps and rendering can drop to 30 FPS at low quality without halving game speed.

### Verification

With Node 22.6+ run `pnpm test`, `pnpm test:frontier`, then `pnpm build`. Combat tests execute the production combat functions with presentation/storage adapters, exercise affordable openings on all four maps, mixed thirty-wave defenses and checkpoint replay during weather. They complement route, account isolation, gait, pinch, progression, feedback validation and stale-cloud-save tests. Simulated balance is a baseline; player feedback is needed for difficulty tuning.

A development-only `?playlab=1&devtest=1` fixture previews an active wave, earned honors, a battle snapshot and 180 enemies. It skips player saves and account observation. Like the animation/tower labs, it is excluded from production builds.

