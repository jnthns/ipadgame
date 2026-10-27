# Original-runtime replay: first controlled battle

The committed capture runs the original Feudalism SWF under **Ruffle 0.7.1**, with a research bootstrap and observer. This is actual execution of the original AS2 class bodies and sprite timelines, rather than the narrow source/bytecode interpreters used by other tests. It is not Adobe Flash verification or whole-game parity.

## Result and corrections

Map 1, a stationary manual hero, two allies and two enemies, 300 frames: **1,500/1,500 fighter snapshots and 300/300 RNG states match** the reconstruction. Each fighter snapshot compares team, logical X/Y, pixel X/Y, HP, attack windup, recovery, weapon category, target ID and movement X/Y. Numeric tolerance is 0.000001 pixels, below Flash's 0.05-pixel coordinate quantum.

The capture exposed three errors: actors must update in reverse creation order, MovieClip position writes truncate to integer twips (1/20 pixel), and existing projectiles update before fighters. New arrows therefore start moving on the following frame. Hero ID zero is independent from its actual place in the display-list creation sequence. The formation adapter already had the correct creation order.

The original root clock also has a 31-frame period. Its raw AVM1 callback is checked over all 31 starting phases, with and without a hero. A shared `RootClock` now carries phase through simulated world travel and battle transitions. DOM-only city/equipment screens do not advance this clock yet; this remains a transition fidelity limit.

## Provenance

- Original distribution: `https://cache.armorgames.com/files/games/feudalism-433.swf`.
- Original SHA-256: `31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca`.
- Research SWF SHA-256: `4cda5e4118892b6d31b323dd70efc880d2298f40cea9ea5cd403437a566165df`.
- Runtime package: `@ruffle-rs/ruffle@0.7.1`; package checksum is recorded in the fixture.
- Raw exported lines, with additive provenance metadata: `tests/fixtures/runtime/map1-ruffle-0.7.1.json`.
- Browser evidence: [runtime-verification.jpg](runtime-verification.jpg).

`tools/make-runtime-probe.py` leaves the original file untouched. It appends a bootstrap/observer to root initialization, removes only the Mochibot tracking loader from the research copy, and preserves the original class and timeline bodies. The bootstrap waits until the required source frames have loaded, initializes the controlled battle, overrides d/dice/Math.random with a seeded Park–Miller stream, and samples actors after their callbacks. The full recorded trace includes preload diagnostics; those diagnostics depend on network streaming and are not gameplay assertions.

## Reproduce

Acquire the original distribution into ignored `reference/feudalism.swf`, then run from the repository root:

```sh
mkdir -p reference/runtime
npm pack @ruffle-rs/ruffle@0.7.1 --pack-destination reference/runtime
tar -xzf reference/runtime/ruffle-rs-ruffle-0.7.1.tgz -C reference/runtime
python tools/make-runtime-probe.py
npm run dev
```

Open `/reference/replay/index.html` on the development server, click Run 300, wait for DONE 300, then export the trace. Compare the export with:

```sh
node --import tsx tools/compare-runtime-trace.ts /path/to/export.json
npm test
```

The runtime package, original SWF and generated research movie remain ignored and are excluded from the production build. The comparator rejects incomplete captures and fails on mismatches. The committed regression runs without a SWF or Ruffle installation.

## Remaining acceptance gaps

This single seeded case does not establish callback ordering for all cross-team/reinforcement combinations, projectile-to-projectile ordering, reserve ability scheduling, every battlefield, body animation/busy flags, world collision edges, or scene lifecycle equivalence. The observer records additional fields that the comparator does not yet assert. The bootstrap bypasses normal menu interaction. Cloud-browser wall-clock speed is not a performance measurement. Adobe Flash and physical iPad/iPhone Safari validation remain outstanding. Presentation and bulk art generation remain paused.
