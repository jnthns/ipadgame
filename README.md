# Feudalism — Mechanics First

A personal reverse-engineering study of Vitaly Zaborov’s 2007 Flash game, implemented in **Phaser 3 + TypeScript** with a static, offline-capable PWA build for iPad/iPhone and GitHub Pages.

**Active priority: finish original mechanics. Presentation is frozen as a representative slice on a separate branch. Status: playable alpha, not a complete or behavior-identical port.** Original unit/town/hero data and core damage formulas are recovered. Navigation, combat simulation, rendering and controls are reconstructed. See [mechanics and fidelity](docs/MECHANICS.md) and [research provenance](docs/PROVENANCE.md).

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
- Tap the battlefield to move the hero; select Army to give group orders. Hero combat is assisted/automatic in range. Hold/Charge, pause, 2× speed and retreat are available. WASD/arrows move the hero, Space pauses.
- Saves occur between battles. Reload/retreat/defeat returns to the pre-battle checkpoint. A successful battle applies casualties and rewards. Progression is supported through level 29; original level 30–39 thresholds are absent in the recovered table and require investigation.

## Validation

`npm test` currently passes 42 checks and covers source-oracle damage, targeting, projectile, quest and equipment behavior as well as damage parity against an unmodified decompiled function across 1,400 inputs, recovered table integrity, original stat/leadership formulas, recruitment transactions, save validation, seeded simulation, reinforcement limits and battle termination for all eight heroes. These are source-level regression tests, **not recorded Flash-vs-browser gameplay replay parity**.

## Reproduce the research

See `tools/acquire.mjs`, `tools/extract-data.mjs`, `tools/export-assets.py`, and `tools/inspect.sh`. The original SWF and raw decompiled scripts remain in ignored `reference/`; only derived tables, source-oracle fixtures and representative remaster artwork are in the working source. All source paths in the evidence ledger refer to FFDec’s export paths. Research hash: `31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca`.

## Known gaps

Original movement/reservations, manual hero controls, battlefield terrain import, reinforcement scheduling, consumables, horses, delivery collection, world travel/encounters/boats, Flash SharedObject import, high-level source edge cases and recorded whole-game replay comparison remain unfinished. Inventory, equipment constraints, loot/enchantments, quest rogue generation, attack hit-event timing and projectile behavior now have source-based implementations. There is no multiplayer, analytics, ad SDK, account system or save sync. See the mechanics ledger for deliberate alpha differences.

Original game, artwork and data belong to their respective rights holders. Availability of the original distribution is not an open-source license; this project does not grant rights to third-party content. See NOTICE.md.
