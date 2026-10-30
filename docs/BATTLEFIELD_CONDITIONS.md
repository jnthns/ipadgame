# Auto battle and battlefield conditions

Both features are deliberate departures from the original game. Neither changes the combat RNG sequence of a battle without a condition, so the source-parity tests are unaffected.

## Auto battle

`Battle` accepts a third hero control mode, `auto`, and `setHeroControl(mode)` switches mode mid-battle. The UI toggles between `manual` and `auto` (Auto battle button or T) and remembers the choice in `localStorage` (`feudalism-hero-auto-v1`).

The existing `assisted` mode (the original soldier AI driving the hero) is kept for older callers, but it makes a poor auto battle: the hero charges like any soldier, and hero death loses the battle. In simulation it lost every siege an idle hero could win. `auto` is a guarded policy built from the same targeting, movement and attack timing:

- Engage an enemy only if it is within two cells of the hero, or within two cells of an allied soldier.
- Otherwise wait about two cells behind the allied line's average position.
- Below 35% health, fall back toward the home edge and fight only what reaches the hero.
- With no soldiers left, fight normally.
- Ranged heroes shoot whatever they can hit, and keep a three-cell gap when wounded.

Switching back to manual clears any pending windup, so the hero never gets stuck mid-swing.

## Battlefield conditions

`rollCondition(kind, nation, seed)` picks one of 17 conditions using its own salted RNG, so the same battle seed always gives the same condition and a siege can show it in advance. Each condition is limited to suitable battles: no weather indoors in the throne room, *Fortified garrison* only for sieges, *Narrow halls* only for the throne room. Regional conditions are twice as likely in their land (for example, frost in the forest lands and heat in the southern lands).

Stat effects are applied once per fighter in `Battle.spawn`, so reinforcements get them too. Periodic pulses (lightning, healing springs, smoke) run every N ticks on a separate RNG stream. Hazards ignore armor and can kill soldiers, but they never reduce the hero below 1 HP.

| Condition | Where | Effect |
|---|---|---|
| Downpour | outdoors | ranged accuracy −35%, ranged damage −20% |
| Thick fog | outdoors | ranged reach capped at 5 (including the hero's shot), melee crit +6 |
| Wind at your backs / in your faces | outdoors | ±20% ranged damage and ±2 reach for each side |
| Scorching sun | outdoors | attacks 25% slower; heavily armored fighters (DEF ≥ 25) move slower |
| Frozen ground | outdoors | dodge and shield avoidance halved; everyone moves slower |
| Mud and mire | road/contract | everyone moves slower; mounted fighters slow down more and lose half their dodge |
| Thunderstorm | outdoors | lightning hits a random fighter every 4 s for 30% of their max HP; ranged accuracy −15% |
| Night battle | any | ranged accuracy −25% and reach ≤ 8; melee crit +8 |
| Good omen | any | your accuracy +12%, your crit +6 |
| Blood moon | any | everyone deals +25% damage, crit +10 |
| Fortified garrison | siege | enemy defense +35%, enemy HP +15% |
| Healing springs | road/contract | everyone regains 2% HP every 1.5 s |
| Smoke and embers | siege/throne | everyone above 35% HP loses 2% every 2 s; ranged accuracy −15% |
| War drums | any | attacks 25% faster (never below the animation's minimum attack time); everyone moves faster |
| Narrow halls | throne | ranged reach ≤ 6; melee accuracy +10% |
| Defenders hold the high ground | siege/road | enemy ranged reach +2 and accuracy +15%; your melee accuracy −10% |

Movement speed never drops below 2 pixels per tick.

## Measured impact

With a starting company plus six recruits, an auto hero and 30 seeds per row, the win rate changed by condition as follows:

| | Trapezus | Omi |
|---|---|---|
| No condition | 67% | 87% |
| Wind in your faces / at your backs | 13% / 93% | 23% / 87% |
| Thick fog | 80% | 3% |
| Frozen ground | 50% | 100% |
| Narrow halls (forced, for comparison) | 83% | 3% |

The same condition can help in one fight and ruin another, depending on how much each army relies on archers, armor or speed. The siege threat estimate still ignores conditions; the forecast card is shown next to it.

The presentation (`battle-weather.ts`) draws rain, fog, snow, wind, heat shimmer, smoke, light tints and lightning bolts. Particle counts follow the render preset, and Battery Saver shows only static tints.
