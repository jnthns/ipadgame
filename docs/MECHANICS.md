# Mechanics status — active workstream

Presentation is frozen on the `presentation-slice` branch. The priority is a source-faithful game loop before further visual generation. Current status: **playable alpha with a substantial source-based mechanics port; not a complete faithful recreation**.

Inspected build: Armor Games `feudalism-433.swf`, SHA-256 `31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca`. FFDec 26.4.0 exported 618 script blocks. Flash 8/AS2, 800×600, 30 fps. Evidence paths below are relative to `reference/decompiled/scripts/`.

## Current implementation

| System | Implemented | Verification and limits |
|---|---|---|
| Data | 32 towns, 76 troop definitions,8 heroes, 205 weapons/armor definitions, 24 enchantments | Recovered constructors; standard troop/town tables checked. Generic rogue constructor exports remain reference samples; roaming units now use dynamic constructors checked against original AVM1 bytecode, while quest rogues use the original formulas. |
| Core combat | HP, defense, accuracy, dexterity avoidance, criticals, leadership, equipment enchant effects | Decompiled `Creature.as`, `Weapon.as` and Enchant definitions; damage oracle covers 1,400 cases. |
| Targeting | Rounded Euclidean distance, melee accessibility checks, ranged hittable-first preference and terrain line of sight | Source functions exercised as regression oracles. All 80 original battlefield collision layouts are now imported from source SWF placements. |
| Timing | Windup, concurrent recovery, human/mounted attack hit-event offsets, manual and AI weapon switching | Recovered sprite timelines; full Flash movie ordering still needs replay comparison. |
| Projectiles | Arrows, scatter, flight/collision avoidance, moving-target misses, grenade splash | Source-derived logic and tests; rendering and simulation remain separate. |
| Equipment/economy | Buy-to-inventory, stacking, equip/unequip, retain replaced equipment, sale at `floor(price / 2)`, shield/two-handed/ranged/mounted restrictions | 24 item/slot cases compared against original `Hero.equipItemInfo`; transactional purchase/equip/sale tests. |
| Loot | Gear dropped on enemy death, enchantment roll, XP/gold, inventory collected on victory | Source `Creature.die`; all 24 enchantment combat modifiers supported. |
| Quests | Original offers, reward before enemy-count cap, faction-specific rogue stats/gear/skills, 5 melee/5 ranged blocks | Original Quest methods executed in a VM: 192 offer cases and 80 rogue cases, including RNG draw counts. Combat/ delivery travel and town-hall collection integrated; random offer selection, delivery replacement/approval and town-hall note collection now follow source behavior; combat checkpoint timing remains an adaptation. |
| World campaign | Fixed-tick travel, source vector masks, land/sea ambush formulas, harbors, horse shops and town-hall rewards | Source traces and data extraction tests; unit constructors are bytecode-tested; runtime hitTest edges and combat checkpoint/transition behavior remain fidelity gaps. |
| Conquest | Original normal/elite defender rosters and two-stage sieges; foreign hostility and full-nation hostility clear | Whole encounter is committed only after success, with pre-battle restore on defeat/retreat. This is an explicit alpha checkpoint adaptation. |
| Consumables/abilities | Potions, group healing, rage, reserve arrow shower/wall, stock and shop transactions | Bytecode and source oracles; deliberate large-potion stock repair. Full movieclip scheduling and initial control ordering await replay checks. |
| Saves | Versioned localStorage JSON, export/import, inventory, unarmed hero state, validation | Round trips and malformed/prototype-name records tested. Not compatible with original Flash `.sol` saves; no cross-device sync. |
| Graphics independence | Fixed 30 Hz simulation; 3 rendering presets share the same game state | Complete battle-state/reward comparison across preset-switch schedules. Physical iPad performance not measured. |

## Corrections to early assumptions

The initial alpha used Manhattan distance and instantaneous hits. Source inspection establishes **rounded Euclidean distance**, not Manhattan. Melee damage adds`dice(rnd)` (0 through rnd−1); arrow/grenade damage adds `d(rnd)` (1 through rnd). Arrows make a separate defender avoidance roll on collision. Critical hits **bypass defense** rather than applying a general 2× multiplier.

Source formulas from `Creature.initUnit`, `strike`, `takeDamage` and `Soldier`:

- Maximum HP=`CON*5+LEVEL*20`, with horse/enchantment/leadership adjustments.
- Melee base damage adds`floor(STR/2)`; ranged base damage does not.
- Flee=`floor(DEX*.8)`through DEX 100; above 100,`80+floor((DEX−100)*.15)`.
- Anti-flee=`(100−round(attacker.DEX/3))/100`.
- Melee hit threshold=`skill*(100−(target.FLEE*attacker.ANTI_FLEE+facingDependentShield))/100`.
- Critical threshold=`weapon.crit+floor(skill/10)`; integer`d(100)<=threshold`rolls.
- Ordinary damage=`max(0,raw−DEF)`; critical damage=`raw`.
- Allied level-zero troops receive`1+(floor(hero.INT/2)+floor(ArtOfWar/2)+sameNationPatriotism)/100`on HP, base damage and variance, after equipment enchantments.
- Enemy XP=`round(sqrt(price))*3`; gold=`d(price/4)`.
- Battlefield logical grid 20×8; original formations can begin with ten soldiers plus the hero. Later reserve commands use a ten-unit threshold and add one unit per team every 31 ticks. Hero death loses the encounter.

## Not finished — mechanics completion gate

1. **Movement/reservations — implemented, replay verification pending:** original pixel stepping, destination reservations, logical boundary transfers, blocked movement and soldier neighbor detours now have source-based implementations and trace tests.
2. **Hero controls — implemented, device verification pending:** manual directional movement/attacks, recovery gates and explicit switching are wired to keyboard and touch. The hero no longer automatically targets or attacks in gameplay.
3. **Terrain/reinforcements — implemented, source edge cases pending:** all 80 map layouts and starting formations are extracted and connected. Reinforcements use one-per-team 31-tick commands. Original terrain/spawn overlaps and AVM1 ordering remain flagged.
4. **Consumables/abilities — implemented, replay verification pending:** stock, shops, hero/group healing, rage timing, reserve arrow shower/wall, cooldowns and friendly fire are connected. Original bytecode confirms counter/UI bugs; deliberate large-potion stock correction is documented in [consumables and abilities](CONSUMABLES_AND_ABILITIES.md).
5. **World campaign — implemented, fidelity gaps pending:** source vector land/sea movement, ambush formulas/maps, harbors/docking, horse shops, delivery work and town-hall collection are connected. Dynamic roaming gear/constructor RNG and quest replacement are now implemented; exact Flash collision/transition behavior and remaining checkpoint differences are documented in [world campaign](WORLD_CAMPAIGN.md).
6. **Progression — bytecode verified:** the sparse table and AVM1 comparison advance through missing thresholds to level 39 at 34,000 XP, then continue to 50. Original attribute/skill costs and caps are now model actions; 400 XP boundary cases match the original bytes. Full-player comparison remains part of the runtime gate.
7. **End-to-end parity:** record original runs with controlled inputs/randomness; compare combat/state/save traces. Source-level oracle tests are not whole-game equivalence.
8. **Device acceptance:** Safari touch controls, offline launch and save persistence on the actual iPad mini A17 Pro/iPhone remain untested.

See [movement and terrain details](MOVEMENT_AND_TERRAIN.md) for the completed movement milestone and its remaining parity limits.

Do not mark mechanics complete or resume broad art production until these gaps are resolved or explicitly accepted as planned changes. Do not equate passing unit tests with full original-game fidelity.

## Original save schema

`frame_1/DoAction.as: saveGame` uses`SharedObject.getLocal('Feudalism_Save_'+slot)`and`flush(32768)`. Town entry autosaves.

| Field group | Original fields |
|---|---|
| Army | FRIENDS withTYPE,NATION,ID,COUNT |
| Hero | EXP,LEVEL,NAME,NATION,GENDER,STR,DEX,CON,INT,free_points,SKILL,WEAPON_PRI,WEAPON_SEC,ARMOR,HELMET,HORSE |
| Quest | avatar_id,enemies_amount,cities,rewards,curr_city,curr_gold |
| Inventory | Item references withCATEGORY,TYPE,NATION,LEVEL,ENCH_ID,COUNT |
| Ownership | IS_CAPTURED,IS_HOSTILE |
| Travel | SHIP_LOCATION,CURR_TOWN,SAILING_SHIP |
| Resources | GOLD; small/medium/large potion counts; small/big group heal and rage scroll counts |

The current JSON save is a new format. Original `.sol` migration remains future work.

See [roaming units and quest replacement](ENCOUNTER_PARITY.md) for the completed constructor and offer-lifecycle work.

[Presentation contract](PRESENTATION_CONTRACT.md): victory settlement is atomic/idempotent; progression and troop-order rules no longer live in UI callbacks. Tree strike and grenade terrain RNG consumption are now retained; source scene-ordering limits remain.
