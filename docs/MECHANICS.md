# Mechanics and fidelity ledger

Inspected build: Armor Games `feudalism-433.swf`, SHA-256 `31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca`. FFDec 26.4.0 exported 618 script blocks. It is a Flash 8 / ActionScript 2 movie, 800×600, 30 fps, 92 root frames. Evidence below uses paths relative to `reference/decompiled/scripts/`. These are recovered source semantics, not a claim of observation in a running Flash player.

## Recovered data

| System | Original evidence | Alpha implementation |
|---|---|---|
| Troops | `__Packages/Unit.as`: 76 constructor definitions, including 6 rogue definitions | All definitions extracted; rogue random equipment/nation calls sampled at deterministic lowest rolls during extraction, not a complete rogue distribution |
| Towns | `__Packages/Town.as`: 32 towns, barracks, normal/advanced defenders, forge references | All town rosters available; garrison and throne room fights implemented |
| Heroes | Eight `DefineButton2_*/BUTTONCONDACTION on(release).as` handlers | Original names, stats, skills, equipment and starting armies extracted |
| Item definitions | `__Packages/WeaponClass.as`, `Armor.as` | 205 weapon/armor definitions extracted; limited immediate purchase/equip interface |
| Map | `WorldMap.as`, placement matrices in DefineSprite 1979 | Original converted map and town positions; town travel is immediate |
| Animation | Body sprite 543 frame labels and nested timeline | Default-config sword/bow/run/death frames converted to an atlas; original per-unit appearance is not applied |

`Viz`, `Ger`, `Rus`, `Jap` and `Rog` are the source’s nation identifiers. UI region names are descriptive labels, not verified original faction names. Troop and hero names retain original spellings.

## Combat formulas verified in source

`__Packages/Creature.as: initUnit`, `strike`, `takeDamage`; `__Packages/Weapon.as`:

- Base maximum HP = `CON * 5 + LEVEL * 20`; a horse adds `bonus_HP`.
- Defense sums armor, helmet and horse defense, before applicable enchantments.
- Flee = `floor(DEX * 0.8)` through DEX 100; above that, `80 + floor((DEX - 100) * 0.15)`.
- Attacker anti-flee = `(100 - round(attacker.DEX / 3)) / 100`.
- Primary melee damage adds `floor(STR / 2)` to the weapon’s base damage; ranged damage does not.
- Weapon hit value is the corresponding weapon skill, subject to dual wield handling.
- Critical chance = weapon `crit + floor(skill / 10)`.
- Facing-dependent shield avoidance is added when the attacker and target face opposite directions; a back attack omits the shield contribution.
- Melee hit roll threshold = `weapon.HIT * (100 - (target.FLEE * attacker.ANTI_FLEE + shieldAvoidance)) / 100`.
- `_root.d(n)` returns `floor(random*n)+1`; `dice(n)` returns `floor(random*n)`; `percent(x)` returns `d(100) <= x`. These are integer percentage rolls, not a continuous probability comparison.
- Raw damage = effective weapon damage + `dice(weapon.rnd)`.
- Ordinary damage = `max(0, rawDamage - DEF)`.
- Critical damage = rawDamage: critical hits bypass armor; there is no general ×2 multiplier in `takeDamage`.
- Friendly level-zero troops receive a leadership multiplier: `1 + (floor(hero.INT/2) + floor(hero.ArtOfWar/2) + sameNationPatriotism) / 100`. HP, base damage and damage variance are rounded after multiplication.

For the source Caravan Guard (`MeleeViz1`): STR 23, DEX 5, CON 15, level 0, price 50 gp, Sword skill 40; Gladius base damage 6, variance 5, critical 5, windup 1 and recovery 50. This gives base HP 75, damage 17–21, critical threshold 9, before hero leadership.

**Test evidence:** `tests/fixtures/original-functions.json` stores the unmodified decompiled `takeDamage` function. The tests execute it in a VM with presentation stubs and compare damage against the TypeScript implementation for 1,400 normal/critical/raw/armor combinations. These tests establish damage-function parity only; they do not establish the correctness of hit targeting, animations, projectile collision or the rest of the game.

## AI and reinforcement behavior

`__Packages/Soldier.as`:

- Readiness requires no movement, no busy animation, zero before/after attack timers.
- Melee targeting searches living enemies with an available left/right neighboring tile and chooses the nearest by `Creature.dist` (Manhattan distance).
- Melee hits require horizontal adjacency on the same row, with special consideration for a target’s next movement tile.
- Ranged targeting prioritizes hittable enemies, then nearest distance. Range uses Manhattan distance, requires `abs(deltaX / deltaY) >= S_ANGLE` (`3`), and checks intervening field cells.
- A ranged soldier switches to melee at distance one. A soldier preferring ranged can switch back as separation grows.
- Movement follows destinations or targets; hold position suppresses pursuit. The original searches neighboring free cells to work around blocking tiles.
- Attack windup and recovery are frame counters. Rage changes both. Actual hits are triggered by animation timeline events.

`frame_1/DoAction.as`: battlefield grid is 20×8, with 40×25 logical-pixel cells and a 10-unit active cap per team. Reinforcements consume queued units and enter from a team’s edge. The hero counts toward active team size. Defeating all active and reserve enemies ends a battle; hero death causes game over.

**Alpha differences:** The simulation uses a deterministic 30 Hz fixed step, an adapted neighbor-search movement rule and instantaneous hit resolution. It does not reproduce occupancy reservations during animation, the hittable-target preference, collision terrain, projectile flight/scatter, rage, dual wield secondary strikes, exact weapon-switch animation, or original per-frame AI ordering. Range/row/angle and core damage formulas are retained. Hero fighting is assisted and automatic; tap/WASD moves the hero. Group orders are a touch adaptation. Movement speed and render coordinates are reconstructed, not measured parity.

## Rewards, conquest and hostility

`Creature.die`: each defeated enemy yields `round(sqrt(unit.price)) * 3` XP and `d(unit.price / 4)` gold; original drops both weapons, armor and helmet, with a 10% enchantment chance and a random enchantment ID.

`Cities.startBattleForCity`: loads the normal town defenders, sets `IS_CAPTURED[town] = true` when the siege starts, and sets hostility for a foreign nation. `DefineButton2_2017/... on(release).as` advances a successful siege into a throne-room fight if `adv_defenders` is nonempty. `WorldMap` checks whether every town of a hostile nation is captured and can clear hostility when that condition is satisfied.

**Alpha differences:** Captures become final only after all town stages succeed. Hero defeat and retreat restore a pre-battle checkpoint rather than ending the campaign. Fallen soldiers are lost on success. Hostility is recorded on completed conquest and prevents shopping in uncaptured towns; the original all-towns hostility-clear rule is not yet ported. The alpha omits loot inventory and enchantments. The original tribe/region diplomatic semantics should be replay-tested before claiming fidelity.

## Quests and progression

`__Packages/Quest.as: initQuestBattle`: encounter count is `d(hero.LEVEL + 5)` (then capped at 20), reward is `d(uncappedEnemyCount) * 100 * ceil(hero.LEVEL / 10)`. Delivery quests select another town and reward `200 + 50 * d(10)`.

**Alpha differences:** Combat contracts persist until completed, and their rogue composition uses sampled low-tier tables. There are no delivery quests or world-map encounter navigation. Reward/count formula matches for levels 1–15; beyond that the alpha caps the count before selecting reward. The town contract is launched directly rather than locating the quest avatar on the world map.

`__Packages/Hero.as`: heroes gain 25 free points on level up and carry a sparse threshold array. Levels 30–39 have no explicit entries in this SWF. The alpha deliberately stops advancement at level 29 until the original sparse-array behavior is understood. It supports spending points on attributes and skills, but uses five-point increment controls. It does not yet reproduce all original UI limits or high-level edge cases.

## Save structure

`frame_1/DoAction.as: saveGame` uses `SharedObject.getLocal('Feudalism_Save_' + slot)` and `flush(32768)`. `Cities` calls `saveGame('auto')` on entry.

Original save fields include:

| Field | Meaning |
|---|---|
| `FRIENDS` | Array of unit references: TYPE, NATION, ID and COUNT |
| `MAIN_HERO` | EXP, LEVEL, NAME, NATION, GENDER, STR, DEX, CON, INT, free_points, SKILL and five equipment slots including HORSE |
| `QUEST` | avatar_id, enemies_amount, cities, rewards, curr_city, curr_gold |
| `INVENTORY` | Item references and stacks |
| `IS_CAPTURED`, `IS_HOSTILE` | Associative town and nation maps |
| `SHIP_LOCATION`, `CURR_TOWN`, `SAILING_SHIP` | Travel state |
| `GOLD` | Campaign gold |
| `POTION_HealSmall/Medium/Big` | Healing potion counts |
| `SCROLL_AllHealSmall/Big`, `SCROLL_Rage` | Scroll counts |

The alpha uses its own versioned JSON schema in localStorage, with validated import/export. It is **not compatible with `.sol` files** and does not sync across devices. Saves are transactional around a complete battle encounter, including both siege stages. Browser storage availability and installation should be tested on the actual user device.

## Next parity milestones, in order

1. Record original gameplay with controlled inputs and random rolls; create replay fixtures for hero movement, attack timing, switching, projectiles and same-seed encounters.
2. Port grid occupancy, terrain, ranged targeting and animation event timing, then compare state traces.
3. Render each nation/gender/equipment combination from original timeline configuration; implement secondary weapon and armor constraints.
4. Complete inventory, loot, enchantments, consumables, horses, shipping, encounters and delivery quests.
5. Investigate sparse high-level XP thresholds and test Flash save migration.
6. Verify offline installation, save persistence, touch targeting, safe areas and resuming on physical iPad/iPhone Safari.
