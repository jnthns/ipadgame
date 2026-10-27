# Preparing mechanics for the remaster

The intended Option B presentation can replace the current mockup renderer without changing game rules. This milestone makes targeted changes to that boundary; it does not start another art pass or introduce a second gameplay implementation.

## Current interface

| Concern | Core owner | Presentation responsibility |
|---|---|---|
| Hero input and attacks | Battle.setHeroInput, Battle.step | Translate touch/keyboard input; draw model movement and attack state |
| Troop orders and formation | Battle.commandTroops | Request hold, charge or a destination cell |
| Consumables and army abilities | Battle.useConsumable, Battle.castArmyAbility | Display availability; collect an input target; draw effects |
| Victory rewards and conquest | settleBattleVictory | Read its immutable outcome and show results |
| Hero XP and upgrades | progression.ts | Request one upgrade; display current points, caps and requirements |
| World travel and encounters | WorldTravel, world-geometry | Choose waypoints and draw the same source coordinates |
| Shops, quests, mounts and inventory | campaign-actions/world-campaign | Present choices, call actions and persist successful changes |
| Graphics presets | render-presets and rendering adapters | Change resolution, animation workload and effects only |

Victory settlement is now staged on a campaign clone, committed atomically and cached per battle. Recreating a result view cannot duplicate gold, experience, loot, quest notes, history or city capture. A two-stage siege still awards its garrison rewards before the elite stage and captures the city only after the final stage. Existing defeat/retreat checkpoint policy is unchanged. The cache is session-local; reloads use the existing campaign/checkpoint behavior, not a serialized battle.

The result object and its elite-enemy list are frozen. Other model objects remain directly readable by the current renderer; a read-only snapshot API is not yet enforced for every object. Treat those references as read-only. Main.ts still owns application navigation, save I/O, pause/speed controls, encounter setup and scene lifecycle. Moving those controller responsibilities into a session class can wait until a concrete need appears; the art replacement does not require it now.

## Rules for the replacement renderer

- Keep one fixed 30 Hz simulation. Animation completion, frame rate, tween callbacks, particles and camera movement must not apply damage or trigger game rewards.
- Keep model RNG independent of visual variation. Never draw cosmetic randomness from Battle.random or WorldTravel.random.
- Use stable source IDs and metadata (fighter ID; town ID; equipment TYPE/NATION/LEVEL; faction; mounted state) to select assets. Keep sprite sheets, atlases, URLs and animation names in the presentation layer.
- Preserve source world coordinates (800×600), battle logical cells (20×8), and battle-local pixel dimensions (40×25 per cell). A view may project them into stylized 2.5D space; touch targets must be transformed back before issuing commands.
- Render motion and attacks from model state. Hero/soldier attack timelines determine hits; prettier or simpler animation must not change those timings.
- Share character designs, faction colors, layout and command APIs across Quality, Balanced and Battery Saver. Use lighter assets/effects, not another ruleset.
- Review the representative map, battlefield, city and character lineup against Option B before generating a complete asset library. No new bulk assets were generated in this milestone.

## Mechanics corrections discovered while isolating UI rules

Attributes now gain one per action, cost two free points, and cap at 200. Skills gain one, cost one point and cap at 100; ArtOfWar and Patriotism also cap at twice current INT. These restrictions existed in the original Cities inventory UI but were missing from the earlier alpha's five-point upgrade buttons. They now live in core actions.

The original Hero XP table is sparse: indices 30–39 are missing, while 40–50 exist. AVM1 compiles the experience >= comparison as Less2 followed by Not, so missing thresholds pass the loop condition. At 34,000 XP a level-28 hero advances to 39 and receives 275 free points. Later thresholds advance to level 50. The previous alpha cap at 29 was incorrect; this port preserves the verified original behavior instead of filling in guessed thresholds. A raw-bytecode oracle covers 400 level/XP/gain boundary cases and the exact sparse constructor table. Full original-player replay remains a separate requirement.

A related comparison detail resolves terrain RNG: root percent uses Greater followed by Not, so percent(NaN) is true in this AVM1 path. Striking a noncombat Tree consumes critical, accuracy and damage-variance draws; the absent Tree.takeDamage method does nothing. The port now retains those three draws without inventing damage or a miss event. Grenade splash also consumes its damage roll for terrain occupants. Original terrain/spawn overlap ordering and grenade animation-event scheduling still require runtime verification.

Tests additionally cover atomic/idempotent settlement, two-stage conquest, rejected reward data, troop-command formation/exclusions, upgrade caps/costs, root percent behavior and terrain random-draw counts. No physical iPad testing or full Flash runtime equivalence is implied.
