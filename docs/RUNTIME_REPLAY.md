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

## Reinforcement capture preparation

Generate `python tools/make-runtime-probe.py --scenario reinforcement` to initialize twelve melee Viz troops per side and observe thirty fighter slots. Extra SLOT records retain undefined slots so creation/removal can be inspected. Export the 300-frame trace using the existing replay player, then pass it to `tools/compare-runtime-trace.ts`. The comparator recognizes the scenario marker, checks additional slot coverage, compares present fighters and RNG, and reports unexpected model fighters. This scenario has not yet been captured or validated against Ruffle; slot lifecycle and spawn ordering remain exploratory.

The current environment recovered the exact original SWF and Ruffle package, but local capture was blocked by a missing browser and an invalid browser download archive. No reinforcement fixture or parity claim was added. The original five-fighter regression remains the only committed original-runtime evidence.

### Optional automated capture

After preparing the SWF and Ruffle package as above, install Playwright separately and its Chromium browser, then run `node tools/capture-runtime.cjs /path/to/trace.json` from the repository root. This optional tool serves the local files on loopback, uses an `en-US` browser locale, waits for the probe's `DONE` marker, and writes the complete trace. Set `FEUDALISM_BROWSER_PATH` to use a specific Chromium executable or `FEUDALISM_CAPTURE_TIMEOUT_MS` to adjust the timeout (default 180000 milliseconds). For the longer scenario, first run `python tools/make-runtime-probe.py --scenario reinforcement --frames 1200`. Playwright and browser binaries are not included in the game or required for ordinary tests.

## Extended reinforcement run — partial equivalence

A 1,200-frame Ruffle 0.7.1 capture now completed using the verified original SWF. The browser required an explicit en-US locale; trace display was capped while export retained all records. Reserve fighters first appeared at frames 434, 496, 527 and 744. The run exposed spawn-frame target acquisition: the original assigns a target immediately when creating a reinforcement, while the port waited until its next fighter update. The port now acquires that target during spawning, with a focused regression check.

This is not a passing parity capture. The first RNG divergence remains frame 489, around simultaneous deaths; the original has fighter 10 at zero HP while the port has three HP. Earlier diagnostic differences include original NaN movement values versus port zeros. These are retained as differences. No damage/death scheduling changes were guessed from this observation. The raw capture is retained locally but is not committed; the baseline five-fighter fixture remains the only committed runtime capture. The earlier browser-download blocker was overcome by a separately obtained local browser.

## Lethal-frame attack correction

The preserved extended replay now matches **all 1,200 RNG states** after retaining an already-running body animation's hit when its parent fighter is killed earlier in that frame. The port previously skipped the dead fighter before delivering that queued animation hit, preventing mutual kills and changing subsequent random draws. Only fighters alive at frame start receive this final animation advance; their normal AI/recovery callback is still skipped after death.

The regression loads the compressed/base64 fixture and asserts all RNG frames and all defined sampled fighter fields except eighteen snapshots containing source NaN movement values versus model zeros. Those eighteen remain strict comparator differences. Removed original corpse clips are counted separately when the retained model record is dead, rather than comparing undefined clip fields against a simulation tombstone; this does not establish visual corpse-lifecycle parity. The committed raw fixture now provides reproducible evidence. Ability scheduling, other maps and scene-transition/device acceptance remain outstanding.

## Isolated army-effect captures — partial acceptance

The `shower` and `wall` probe scenarios invoke the original root addArrowShower/addArrowWall at frame 150 on fighter 1's cell, with raw damage 100 and critical false. They isolate effect scheduling; they deliberately bypass reserve planning, input controls and cooldown acceptance. Both retain 300-frame captures in compressed/base64 fixtures, with source and instrumented SWF hashes.

The original dd scatter helper required its own seeded replacement: its native Math.random path bypassed the assigned seeded callback. The replacement preserves floor(random * (2*n+1)) - n and uses the same Park–Miller stream as d/dice. Earlier captures without this hook are discarded, not used as evidence.

The shower confirms that army effects resolve before normal fighter callbacks, preserving a dying fighter's pre-callback recovery value. Army effects now step after existing projectiles and before fighters; newly emitted wall projectiles still wait until the next simulation frame to move. The baseline and extended reinforcement regressions remain unchanged.

Partial regression windows are explicit: shower compares all fields/RNG through frame 220, wall through frame 200, while retaining the full 300-frame captures. Full default comparison still fails, as intended: shower first differs in fighter 2 windup at frame 272 and RNG at 299; wall first differs at frame 207 when the original damages allied fighter 3 and the port does not. These windows do not establish complete ability parity. Next investigate wall projectile interaction/order at frame 207, then shower later attack/death scheduling; reserve eligibility and initial cooldown construction still need runtime cases.
