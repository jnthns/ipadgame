# Mechanics status — active workstream

Presentation is frozen on the `presentation-slice` branch. The priority is a source-faithful game loop before further visual generation. Current status: **playable alpha with a substantial source-based mechanics port; not a complete faithful recreation**.

Inspected build: Armor Games `feudalism-433.swf`, SHA-256 `31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca`. FFDec 26.4.0 exported 618 script blocks. Flash 8/AS2, 800×600, 30 fps. Evidence paths below are relative to `reference/decompiled/scripts/`.

## Current implementation

| System | Implemented | Verification and limits |
|---|---|---|
| Data | 32 towns, 76 troop definitions,8 heroes, 205 weapons/armor definitions, 24 enchantments | Recovered constructors; standard troop/town tables checked. Six generic rogue constructor exports are deterministic samples; quest rogues are now generated from the original formulas. |
| Core combat | HP, defense, accuracy, dexterity avoidance, criticals, leadership, equipment enchant effects | Decompiled `Creature.as`, `Weapon.as` and Enchant definitions; damage oracle covers 1,400 cases. |
| Targeting | Rounded Euclidean distance, melee accessibility checks, ranged hittable-first preference and terrain line of sight | Source functions exercised as regression oracles. Original terrain shapes are not yet imported into the terrain API. |
| Timing | Windup, concurrent recovery, human/mounted attack hit-event offsets, secondary weapon switching | Recovered sprite timelines; full Flash movie ordering still needs replay comparison. |
| Projectiles | Arrows, scatter, flight/collision avoidance, moving-target misses, grenade splash | Source-derived logic and tests; rendering and simulation remain separate. |
| Equipment/economy | Buy-to-inventory, stacking, equip/unequip, retain replaced equipment, sale atfloor(price/2), shield/two-handed/ranged/mounted restrictions | 24 item/slot cases compared against original `Hero.equipItemInfo`; transactional purchase/equip/sale tests. |
| Loot | Gear dropped on enemy death, enchantment roll, XP/gold, inventory collected on victory | Source `Creature.die`; all 24 enchantment combat modifiers supported. |
| Quests | Original offers, reward before enemy-countcap, faction-specific rogue stats/gear/skills,5 melee/5 ranged blocks | Original Quest methods executed in a VM: 192 offer cases and 80 rogue cases, including RNG draw counts. Combat quests integrated; delivery offer generator exists but travel/collection UI is unfinished. |
| Conquest | Original normal/elite defender rosters and two-stage sieges; foreign hostility and full-nation hostility clear | Whole encounter is committed only after success, with pre-battle restore on defeat/retreat. This is an explicit alpha checkpoint adaptation. |
| Saves | Versioned localStorage JSON, export/import, inventory, unarmed hero state, validation | Round trips and malformed/prototype-name records tested. Not compatible with original Flash `.sol` saves; no cross-device sync. |
| Graphics independence | Fixed 30 Hz simulation;3 rendering presets share the same game state | Complete battle-state/reward comparison across preset-switch schedules. Physical iPad performance not measured. |

## Corrections to early assumptions

The initial alpha used Manhattan distance and instantaneous hits. Source inspection establishes **rounded Euclidean distance**, not Manhattan. Melee damage adds`dice(rnd)`(0throughrnd−1); arrow/grenade damage adds`d(rnd)`(1throughrnd). Arrows make a separate defender avoidance roll on collision. Critical hits **bypass defense** rather than applying a general 2× multiplier.

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
- Battlefield logical grid 20×8, active team cap 10, reserve queues, hero death loses the encounter.

## Not finished — mechanics completion gate

1. **Movement/reservations:** replace instantaneous tile moves and reconstructed delays with the original pixel movement, occupied-next-cell reservations, obstacle routing and collision behavior.
2. **Hero controls:** port original manual directional attack reach, weapon-swap controls and timing; current touch hero combat is assisted/automatic.
3. **Terrain/reinforcements:** import actual original battlefield objects and validate original reinforcement scheduling and free-edge spawning.
4. **Consumables/abilities:** healing potions, group heals, rage timing and ranged army abilities remain unfinished; investigate suspicious original UI variable references against p-code before reproducing or fixing them.
5. **World campaign:** world movement/encounters, shipping/harbor costs, horses, delivery collection and original quest-avatar travel are unfinished. Direct town travel is currently an explicit alpha shortcut.
6. **Progression/source edge cases:** original XP thresholds 30–39 are absent from the recovered Hero table; advancement currently stops at 29. Determine intended versus actual behavior with original execution.
7. **End-to-end parity:** record original runs with controlled inputs/randomness; compare combat/state/save traces. Source-level oracle tests are not whole-game equivalence.
8. **Device acceptance:** Safari touch controls, offline launch and save persistence on the actual iPad mini A17 Pro/iPhone remain untested.

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
