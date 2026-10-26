# Consumables and army abilities

This milestone extends the source-based mechanics port; presentation remains frozen. Evidence refers to the verified Armor Games SWF and JPEXS scripts described in PROVENANCE.md. Runtime state is independent of Phaser and graphics presets.

## Supplies and shop

| Supply | Starting stock | Price | Effect |
|---|---:|---:|---|
| Small potion | 5 | 10 | Hero +40 HP |
| Medium potion | 2 | 100 | Hero +300 HP |
| Large potion | 1 | 900 | Hero +100,000 HP, capped at maximum |
| Small group heal | 4 | 50 | Living allies, including hero: +round(max HP × 0.33) |
| Large group heal | 2 | 200 | Living allies, including hero: +round(max HP × 0.66) |
| Rage scroll | 1 | 1,000 | Allied Soldier attack windup becomes 1; recovery uses MIN_ATTACK_TIME |

Starting resources: `DefineSprite_1493/frame_1/DoAction.as`. Shop purchase buttons 1612–1617 support one item or five with Shift; the touch shop provides explicit Buy 1/Buy 5 buttons. Purchases require sufficient gold and open town services. They are atomic; failed purchases do not charge or add stock.

Battle buttons 155 and 171–175 map to keys 1–6. Touch buttons invoke the same model actions. Stock is spent even at full HP, matching the original button behavior. Dead units are never revived and reserve troops are not healed. Rage refreshes to 60 command pulses when reused; pulses occur every 31 simulation frames (about 62 seconds from a pulse boundary). It changes troop attack timing, not damage, and Player's own attack code does not consult rage. Existing windup/recovery are not retroactively rewritten. Pausing stops simulation time and rejects supply use.

Supplies persist in campaign JSON. Older alpha saves without supplies migrate to zero stock, rather than awarding free resources on import. New campaigns use the original starting stock. Present but invalid supplies are rejected; a count must be an integer between zero and one million. This upper bound is a validation guard, not an original gameplay limit.

The existing alpha encounter checkpoint applies to supplies too: victory retains usage, defeat/retreat restores the pre-encounter campaign, and reloading during combat restores the saved checkpoint. In a two-stage siege, stock spent in the garrison is carried into the throne room; failure of the whole siege restores its original checkpoint. This transaction is an acknowledged remake behavior, not source save parity.

## Bytecode caveats and deliberate corrections

The original large-potion button 172 references `SCROLL_AllHealBig` instead of `POTION_HealBig`. This port deliberately spends the large potion's own stock; group-heal stock remains independent. The rage button writes its count into `scroll_2_txt`; the remake displays the rage count in its own control. These are small repairs to the original interface, not claims of literal equivalence.

`Screen.makeThemHealHero` mentions `_global.mana[0]` and `_global.PRICES.SPELL_HealHero`. The decompiler's `>=` expression must not be interpreted as JavaScript: AVM1 bytecode uses `Less2` followed by `Not`, with different undefined-value behavior. The port applies the original positive healing amounts directly and omits unused mana bookkeeping. A narrow interpreter executing the original function bytecode reaches healing with the missing globals; whole-player execution is still required to close the surrounding state and scheduling edge cases. Do not describe the decompiled guard alone as proof that original potions cannot heal.

## Verification boundaries

Tests execute an embedded original group-heal method across HP rounding, saturation, teams and dead units. Other checks cover potion amounts and corrected stock selection, one/five purchases, rejected transactions, save round trips/migration, rage windup/recovery and exact pulse expiry. These are source-level checks, not recorded whole-game replay equivalence. Safari multitouch, offline persistence and physical iPad mini A17 Pro acceptance remain pending.

## Reserve army abilities

Arrow shower uses primary bows remaining in FRIENDS; each bow rolls one raw damage and critical result and creates two scatter packets around the selected cell. The bytecode never increments its intended eight-bow counter, so this port preserves the effective uncapped behavior. Scatter rolls Y before X because AVM1 evaluates the call arguments in reverse order. Arrow wall uses the first five primary crossbows in reserve. Neither ability spends reserve troops. Troop leadership, hero skills and secondary weapons do not change these raw reserve-weapon rolls.

Controls reach readiness after 44 frames for shower and 64 for wall. Availability follows Screen.reinitArrowStorm's unusual reserve scan starting at 10 minus active allied count; a reinforcement rechecks availability. Initial Screen/formation construction order remains an explicit parity gap.

Shower effects impact at frame 10 (nine steps after creation), wall effects emit an arrow at frame 15 (fourteen steps). Same-cell packets share source depth keys and resolve newest first. Both effects share the same namespace, so overlapping shower/wall packets retain the type of the first effect at that depth. Shower hits include friendlies and use full shield avoidance regardless of facing; blocked terrain receives no shower damage. Wall projectiles use team -1, permitting friendly fire, and the original d(0) adds one damage. Their positive SWF xscale maps to model facing -1 for shield comparisons even though flight is rightward.

The simulation processes ability events after fighters and before projectiles. Exact AVM1 movieclip ordering against input, reinforcement and frame handlers still needs original-runtime replay comparison. Rage uses a battle-local 31-frame clock; original phase across scene transitions remains unresolved.

Ten tests execute embedded original AVM1 bytecode or source-derived timeline fixtures. Three additional battle integration tests cover delayed friendly damage, terrain blocking, reserve retention, neutral wall arrows and shield orientation.
