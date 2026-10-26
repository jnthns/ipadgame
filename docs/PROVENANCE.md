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
- Actual iOS Safari PWA installation and original SWF gameplay replay comparison have not been performed.
- GitHub deployment status must be verified separately; existence of a workflow is not proof of publication.

## Movement and battlefield milestone (2026-10-26)

The committed terrain extractor reads the original SWF with a standard-library parser and verifies its SHA-256 before parsing. It uses original display-list placement origins and `Tree.init`, not inferred sprite collision bounds. It recovers all 80 map layouts, 556 collision cells and 21 initial formation markers per map. See `docs/MOVEMENT_AND_TERRAIN.md` for source formations, reservations, manual controls, 31-tick reserve commands, source overlaps and remaining AVM1 ordering uncertainty.

The local suite now passes 78 checks, including extractor reproduction against the retained SWF. A clean checkout skips the single raw-SWF reproduction check unless `reference/feudalism.swf` has been acquired; all committed-fixture tests still run. CI runs tests and the production build on the mechanics-first branch without publishing Pages. Physical iPad validation remains pending.
