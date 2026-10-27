# Campaign acceptance scenarios

`tests/campaign-acceptance.test.ts` joins production campaign APIs into three repeatable scenarios. Battles run the real fixed-step model until victory or defeat; the tests never assign a battle result, kill fighters directly or manufacture battle loot/XP. These checks support a hands-on testing candidate. They do not establish full original-game runtime parity or physical Safari behavior.

| Scenario | Integrated behavior | Deliberate fixture boundary |
|---|---|---|
| New campaign to level two | Buy/equip and retain old gear; recruit with starting gold; generate/approve combat contracts; run quest-marker arrival branch; deny remote services; simulate victories; settle loot/XP/army once; collect town-hall rewards once; export/reload between steps; purchase upgrades; approve/deliver/collect a delivery note | World coordinates are positioned at the quest marker to test the transition, rather than replaying a full overland path; town entry uses the production transition API. The manual hero remains stationary while soldiers fight. |
| Foreign two-stage siege | Simulate the complete Sturmburg garrison and elite rosters on source-selected maps; carry casualties/rewards between stages; delay capture until final victory; persist ownership and hostility; permit owned-town recruitment/services while foreign uncaptured shops close | A level-50/attribute-200 hero with a large allied army is a late-campaign fixture. It checks integration, not difficulty/balance or whether the setup can be earned naturally. |
| Defeat and checkpoint data | Spend a potion; simulate adjacent high-tier enemy killing the manual hero; reject victory settlement; restore a serialized checkpoint containing the exact pre-battle gold, supplies, quest, inventory and battle counter | The headless test calls save parsing to restore the checkpoint. Browser handlers for Restore/Retreat and persistence after a tab reload require separate UI testing. |

Run the scenarios with:

```sh
node --import tsx --test tests/campaign-acceptance.test.ts
```

The broader suite independently checks source formulas, terrain data, control rules, deterministic rendering schedules, save validation and a controlled original-SWF/Ruffle battle replay. These campaign scenarios add coverage across system boundaries; they do not replace those narrower oracles.

Hands-on acceptance still needs real touch play, menu navigation, pause/background behavior, reload during combat, two-stage siege retreat/restore, offline installation and exported-file import on the physical iPad/iPhone. The game should remain labelled an alpha testing candidate while that evidence is absent. Presentation remains frozen.
