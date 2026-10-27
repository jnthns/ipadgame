# Acquisition and provenance

Research performed 2026-10-25.

| Item | Evidence |
|---|---|
| Original developer distribution listing | https://www.kongregate.com/en/games/vitaly/feudalism (listed by Vitaly; September 21, 2007) |
| Original distributor listing | https://armorgames.com/play/433/feudalism |
| SWF acquired | https://cache.armorgames.com/files/games/feudalism-433.swf |
| Acquired bytes | 961,010 |
| SHA-256 | `31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca` |
| Header | `CWS`, SWF version 8; ZLIB-compressed |
| Uncompressed declared size | 1,485,764 bytes |
| Frame metadata | 800×600, 30 fps, 92 root frames |
| Tool | JPEXS FFDec 26.4.0, official GitHub release |
| Tool distribution | https://github.com/jindrapetrik/jpexs-decompiler/releases/tag/version26.4.0 |
| Code export | 618 script blocks, ActionScript 2 |

The SWF was acquired directly from the original distributor’s public CDN, rather than an unverified mirror. The distributor’s HTML returned 403 to direct fetching, but the CDN returned a valid SWF. The developer’s Kongregate listing independently corroborates title, author, controls and gameplay. Public availability establishes distribution provenance; it does not establish an open redistribution license. No creator permission or source-code release was claimed or obtained.

## Commands actually used

```sh
java -jar /tmp/ffdec/ffdec.jar -cli -export script reference/decompiled reference/feudalism.swf
java -jar /tmp/ffdec/ffdec.jar -cli -export image,shape reference/assets reference/feudalism.swf
java -jar /tmp/ffdec/ffdec.jar -cli -selectid 1979 -select 1 -export sprite reference/world-export reference/feudalism.swf
java -jar /tmp/ffdec/ffdec.jar -cli -selectid 543 -select 1-12 -export sprite reference/body reference/feudalism.swf
java -jar /tmp/ffdec/ffdec.jar -cli -swf2xml reference/feudalism.swf reference/feudalism.xml
node tools/extract-data.mjs
```

FFDec’s sprite export exported all 855 body frames despite the `-select` frame range; the selection parameter did not limit this sprite export. Conversion retained ten sampled frames each for sword, bow, running and death. Nested defaults mean these are not the unit’s configured equipment/nation skins. Map position matrices were read from DefineSprite 1979, in twips divided by 20. Shapes were extracted as SVG; raster images were exported in their original JPEG/PNG formats. Raw exports are available in ignored local `reference/` and are not loaded into the browser build.

## Data extraction semantics

`tools/extract-data.mjs` adapts only the AS2 data classes to JS class syntax and executes them in a Node VM, with deterministic stubs for `_root` random helpers. It does not execute the root timeline, network calls, external SWFs, or the full game. AS2 Array named properties are converted to JSON maps so hero skills are not silently lost during serialization. This is not a general AS2 compatibility layer. Rogue equipment/nation variations are one deterministic sample per constructor.

## Network behavior

The original root frame contains MochiBot external telemetry loading code (`frame_1/DoAction_2.as`). It is preserved only in the ignored research export; none of it is used by the reconstructed runtime. The published build bundles Phaser and its game data locally, registers a same-origin service worker, and contains no advertising or telemetry SDK. The only UI link to an external service is the original-game attribution link, opened on user action.

## Tool/framework references

- JPEXS: https://github.com/jindrapetrik/jpexs-decompiler
- Phaser: https://docs.phaser.io/phaser/getting-started/what-is-phaser
- GitHub Pages workflow: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Verification performed

- Source decompilation and asset export completed successfully.
- Ten regression/simulation tests passed, including 1,400 damage-oracle comparisons.
- TypeScript type check and production build passed.
- Browser inspection covered hero selection, map rendering and contract initiation. Additional acceptance checks are recorded in `VALIDATION.md`.
- Actual iOS Safari PWA installation remains pending. One controlled original-SWF replay under Ruffle is now recorded; see the milestone below.
- GitHub deployment status must be verified separately; existence of a workflow is not proof of publication.

## Movement and battlefield milestone (2026-10-26)

The committed terrain extractor reads the original SWF with a standard-library parser and verifies its SHA-256 before parsing. It uses original display-list placement origins and `Tree.init`, not inferred sprite collision bounds. It recovers all 80 map layouts, 556 collision cells and 21 initial formation markers per map. See `docs/MOVEMENT_AND_TERRAIN.md` for source formations, reservations, manual controls, 31-tick reserve commands, source overlaps and remaining AVM1 ordering uncertainty.

The local suite now passes 78 checks, including extractor reproduction against the retained SWF. A clean checkout skips the single raw-SWF reproduction check unless `reference/feudalism.swf` has been acquired; all committed-fixture tests still run. CI runs tests and the production build on the mechanics-first branch without publishing Pages. Physical iPad validation remains pending.

### 2026-10-26 — consumables and reserve army abilities

Recovered potion/shop buttons, Screen group healing/rage and Soldier rage attack gates. Added raw original AVM1 bytecode fixtures for Screen reserve volleys, healing comparison and Button172; verified RNG evaluation order, uncapped shower counter and wrong large-scroll stock reference. Port deliberately corrects large-potion stock and rage UI count, and documents original construction/scheduling limits. Added supplies validation/migration, shop transactions, manual battle controls and fixed-tick ability queues; presentation assets unchanged.

### 2026-10-26 — world campaign

Parsed original world Shape/Shape4 edges, stroke widths, matrices, static town/quest bounds and Cities harbor/stable placements directly from the hash-verified SWF. Ported WorldMap movement/collision and encounter selection, Cities docking/payment and BarnIcon/Hero horse transactions. Added delivery/quest map routing, town-hall payment queues, persisted travel RNG and validation. Eleven new tests; sampled roaming-rogue equipment and scene/quest lifecycle differences remain explicit fidelity limits.

### 2026-10-26 — roaming constructors and quest replacement

Added original Unit AVM1 fixtures (class sprite 2058), 76 type initializers plus constructor, with constant pool/register metadata/body hashes. Dynamic runtime units match 3,040 seeded bytecode cases including RNG draw counts. Added original Quest/Cities function fixtures for 192 offer transitions and payout checks. Replaced sampled roaming instances, restored random offer selection and delivery-note replacement/approval, and retained explicit battle-checkpoint/runtime parity limits.

### 2026-10-26 — presentation boundary and progression bytecode

Extracted Hero constructor/experience, Creature.strike and root percent raw AVM1 fixtures with method/register/offset hashes. Verified the sparse XP table and 400 experience boundary cases, resolving the former incorrect level-29 cap. Restored source upgrade costs/caps and terrain strike RNG (three draws; percent(NaN) follows Greater/Not). Added model troop commands and atomic, idempotent victory settlement so presentation replacement cannot duplicate rewards. No new art assets.

### 2026-10-26 — first original-runtime capture

Executed a research copy of the original SWF under Ruffle 0.7.1, retaining original class/timeline bodies with an appended seeded bootstrap/observer and removed tracking loader. Map 1 matches 300 RNG states and 1,500 fighter snapshots after callback-order, twip-rounding and projectile-phase corrections. Added strict replay regression and raw root-clock AVM1 checks. See [runtime evidence, reproduction and limits](RUNTIME_REPLAY.md). This does not establish Adobe Flash or full-game parity.
