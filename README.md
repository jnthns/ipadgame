# Feudalism — Mechanics First

A personal reverse-engineering study of Vitaly Zaborov’s 2007 Flash game, implemented in **Phaser 3 + TypeScript** with a static, offline-capable PWA build for iPad/iPhone and GitHub Pages.

**Active priority: finish original mechanics. Presentation is frozen as a representative slice on a separate branch. Status: playable alpha, not a complete or behavior-identical port.** Original unit/town/hero data and core damage formulas are recovered. Navigation, combat simulation, rendering and controls are reconstructed. See [mechanics and fidelity](docs/MECHANICS.md) and [research provenance](docs/PROVENANCE.md).

## Presentation work

The campaign shell retains the earlier painted world map. Stage 2 adds four representative illustrated combat roles, movement/attack/hit/defeat poses, team and faction markers, a live health/command HUD, readable projectile effects and touch controls. Simulation and rewards remain in the existing core. See [presentation stages](docs/PRESENTATION_STAGES.md) and [combat artwork](docs/COMBAT_ART.md). Full per-class equipment appearances and physical iPad acceptance remain later work.

## Run

```sh
npm ci
npm test
npm run dev
```

Production: `npm run build`; serve `dist/` over HTTP(S), never `file://`. The build emits a revisioned service worker and precaches all static game assets; runtime has no CDN dependency. Development mode deliberately does not register a worker.

## GitHub Pages

The included `.github/workflows/pages.yml` tests, builds and deploys on pushes to `main`. In the repository, select **Settings → Pages → Source → GitHub Actions**. Relative asset URLs, a relative manifest start URL and a scoped service worker work under a project prefix such as `/ipadgame/`.

Open the resulting HTTPS URL in Safari on the iPad or iPhone. Wait for the offline-ready notice, then **Share → Add to Home Screen**. Each device/browser keeps its own campaign. Export/import JSON in the Journal to move saves. Local preview is not a substitute for testing installation on actual iOS Safari.

## Play

- Choose an original hero; select and travel to towns on the map.
- Recruit local soldiers, earn gold through contracts, purchase equipment and spend hero skill points.
- Attack towns to fight garrisons and, where present, a second throne-room battle.
- Tap the battlefield or use the direction pad to move the hero; select Army to give troop orders. Hero attacks are manual: hold Attack while moving when needed. Hold/Charge, pause, 2× speed and retreat are available. WASD/arrows move the hero, Space/0 attacks, Shift switches weapons, and P pauses.
- Saves occur between battles. Reload/retreat/defeat returns to the pre-battle checkpoint. A successful battle applies casualties and rewards. Progression follows the original sparse XP table through level 50, including its bytecode-verified jump through missing levels 30–39.

## Validation

`npm test` passes 149 checks locally, including consumable stock/healing/rage, bytecode-verified reserve army abilities, source-derived movement, manual controls, all 80 battlefield layouts, and source-oracle damage, targeting, projectile, quest and equipment behavior as well as damage parity against an unmodified decompiled function across 1,400 inputs, recovered table integrity, original stat/leadership formulas, recruitment transactions, save validation, seeded simulation, reinforcement limits and battle termination for all eight heroes. The suite also includes a controlled original-SWF replay under Ruffle: 300 RNG states and 1,500 fighter snapshots match. See [runtime replay evidence and limits](docs/RUNTIME_REPLAY.md); whole-game and Adobe Flash parity remain unverified.

## Reproduce the research

See `tools/acquire.mjs`, `tools/extract-data.mjs`, `tools/export-assets.py`, and `tools/inspect.sh`. The original SWF and raw decompiled scripts remain in ignored `reference/`; only derived tables, source-oracle fixtures and representative remaster artwork are in the working source. All source paths in the evidence ledger refer to FFDec’s export paths. Research hash: `31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca`.

## Known gaps

Consumables, horses, delivery collection, world travel/encounters/boats and quest replacement are implemented. Original Flash SharedObject import, full-game runtime comparison, scene lifecycle details and physical iOS acceptance remain unfinished. The first controlled replay corrected fighter update order, twip coordinate rounding and projectile scheduling. There is no multiplayer, analytics, ad SDK, account system or save sync. See the mechanics ledger for deliberate alpha differences.

Original game, artwork and data belong to their respective rights holders. Availability of the original distribution is not an open-source license; this project does not grant rights to third-party content. See NOTICE.md.

Supply controls: keys 1–6 or touch buttons use small/medium/large potions, 33%/66% group heals and rage. Buy supplies from the armory or inventory. Arrow shower/wall require reserve archers; select the ability and tap a battlefield cell. These arrows can hit allies. See [mechanics details](docs/CONSUMABLES_AND_ABILITIES.md).

World travel now moves at the original two pixels per tick, with extracted land/sea collision shapes. Use waypoints when a straight route is blocked. Harbors rent ships for 4,000 gp; stables sell source horses. Delivery and rogue-contract rewards are collected at town halls. See [campaign implementation and limits](docs/WORLD_CAMPAIGN.md).

Roaming enemies now use randomized constructors verified against original AVM1 bytecode over 3,040 cases; town-hall offer replacement is checked against 192 source lifecycle transitions. See [constructor and quest parity](docs/ENCOUNTER_PARITY.md).

The presentation boundary now routes victory settlement, hero upgrades and troop orders through core actions; see [presentation contract and progression corrections](docs/PRESENTATION_CONTRACT.md).

## Hands-on mechanics test candidate

See [device test steps](docs/DEVICE_TEST.md), [integrated campaign acceptance](docs/CAMPAIGN_ACCEPTANCE.md) and [runtime fidelity limits](docs/RUNTIME_REPLAY.md). CI retains the built static app as the `feudalism-mechanics-test-build` artifact for 14 days. The main-branch workflow publishes GitHub Pages once the repository owner enables Settings → Pages → Source: GitHub Actions. Physical device testing and full original-game parity remain pending; presentation work is paused.
