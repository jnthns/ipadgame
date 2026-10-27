# Movement, manual hero controls and battlefield geometry

Implemented on the mechanics-first branch. This is source-based work; full Flash runtime replay parity is not yet established.

## Movement and occupancy

`Creature.startMove`, `continueMove`, `leavePosition`, `moveOnX/Y`, `moveNewStep` and `moveComplete` define the model’s movement.

- Logical cells are 40×25 pixels. Walking starts at speed 3 horizontal pixels per source frame, with vertical displacement divided by 1.6; mount/enchantment bonuses feed the same speed.
- Starting a move reserves the destination’s `.empty` flag before the unit reaches it. The destination does not have a `.who` occupant yet.
- Crossing a cell boundary transfers the logical occupant to the next cell and releases the old cell. Near the destination center, pixel coordinates snap to that center.
- Player input can add a perpendicular direction before crossing a reserved boundary, matching the original mid-step steering rules.
- Player movement does not use soldier detours. AI soldiers use the source neighbor-search preference to handle a blocked next step.
- Death releases both the occupied and reserved cell in the reconstructed occupancy model.

The renderer reads these pixel coordinates rather than inventing a separate eight-tick tile interpolation.

## Hero controls

The game UI now constructs battles with `heroControl: 'manual'`. Assisted control remains an explicitly named compatibility mode for existing simulation callers and regression tests, rather than the gameplay default.

Keyboard: WASD/arrows move, Space/0 attacks, Shift switches weapons, and P pauses. Touch: hold the direction pad and Attack, or tap the field to produce directional movement input; troop orders are separate. The tap-destination adapter is a touch convenience, not original keyboard behavior.

Manual Player behavior now includes:

- No automatic enemy targeting, pursuit or attacks.
- Original facing-dependent melee target priority: forward, forward-up, forward-down, then two cells forward.
- Friendly units and terrain can absorb that target priority.
- The original facing flip when the forward attack fan is empty but enemies occupy the rear fan.
- Player attack animations begin without the soldier windup; recovery and minimum-attack-time rules gate movement.
- Ranged Player attacks aim a fixed 12 cells forward (six for the relevant grenade frames), rather than tracking a selected enemy.
- Weapon swaps require explicit input.

The input adapter supports simultaneous touch movement/attack, captures quick taps for one simulation tick, and clears held input on pause, backgrounding, focus loss and renderer recreation.

## Battlefield extraction

`tools/extract-terrain.py` reads the verified original SWF directly, using standard-library parsing. It recovers all 80 battlefield display lists and their signed placement matrices.

The original `Tree.init` blocks the single cell containing an object’s placement origin. Its sprite bounds do not define collision. The extraction therefore uses source placement origins and the original cell conversion, rather than guessing from artwork. The committed `src/battle-terrain.json` contains 556 blocked cells and provenance for 31 blocker types.

Each map also contains ten allied troop markers, ten enemy markers and one hero marker. The original hero is always `hero0`; it begins at cell `[0,4]`. A sufficiently large allied army therefore begins with ten soldiers **plus** the hero. The active-team threshold of ten applies to later reinforcements, not initial map placement.

Original map selection is connected to the UI:

| Battle | Source map selection |
|---|---|
| Town siege | `Town.setBattleMap`’s town-specific base plus `d(4)` |
| Combat quest | `32 + d(8)` |
| Throne room | `60 + d(4)` |
| Harbor siege | `76 + d(4)` is supported by the selector; harbor campaign state is not yet implemented |

Reinforcement commands add at most one unit per team every 31 source ticks, matching the root frame counter’s increment/reset sequence. Entry rows use source random retries. The reconstruction safely defers spawning if an entire edge is blocked, rather than reproducing the original retry-limit overlap failure.

Terrain currently uses simple visible collision markers. Full environment artwork remains part of the paused presentation work.

## Verification and limits

Tests execute embedded original Creature/Player function excerpts and compare pixel, logical-cell and reservation traces, including straight/diagonal moves, perpendicular steering, blocking, speed, attack facing, hit priority, recovery and switching. Additional tests check all 80 layouts for fighter/reservation conflicts during simulation. The terrain extractor is reproduced against the verified SWF when the ignored research file is available; clean checkouts skip only that reproduction test.

Known differences or uncertainties:

- AVM1 child-script creation order and full Flash movie-frame event ordering still need runtime replay comparison.
- Maps 2 and 4 contain an original enemy/TreeBroken_1 overlap at `[18,7]`. It is preserved and flagged. Exact `.who` overwrites depend on original child-script order.
- Terrain absorbs a manual strike’s target priority. Original Creature.strike plus root percent bytecode now verifies three consumed RNG draws (critical, accuracy, variance) and no miss/damage effect for a Tree; this side effect is reproduced. Grenade terrain damage draws are retained too.
- Some original soldier weapon-switch side effects and animation busy ordering need replay confirmation.
- The reconstruction’s battle clock starts at a defined phase; the original root frame counter can carry a phase across scene transitions.
- Physical iPad/iPhone behavior and battery use remain untested.
