# World campaign mechanics milestone

Presentation remains frozen. The former direct-town teleport is replaced with fixed 30 Hz world movement and collisions recovered from the original SWF. This is a substantial campaign milestone, not a declaration of complete original-game fidelity.

## Recovered geometry

`tools/extract-world.py` verifies the known SWF SHA-256 and parses Shape/Shape4 records, matrices and display lists directly. `src/world-geometry.json` contains the ground, sea, coastline and four faction masks; all 32 town bounds; 15 quest-avatar bounds; and harbor/stable availability from the 32 Cities frames. It retains original quadratic Bezier control points in twips. No screenshot tracing, inferred regions or guessed town radii are used.

The simulation tests vector fills analytically, including holes and source line widths. Quadratic stroke distance uses stationary points with numerical root refinement. Exact Flash hitTest behavior on pixel boundaries, strokes and movieclip bounds still needs original-runtime comparison. Static town bounds include the exported text fields; dynamic font/name changes can alter original runtime bounds.

The frozen illustrated map is not an exact coastline rendering. A thin source-boundary overlay is a functional navigation aid until presentation resumes. Both graphics presets and rendering resolution use the same collision data and world state.

## Travel and encounters

`WorldMap.onEnterFrame` moves two original map pixels per frame toward the clicked point. Land movement checks ground and sailing checks sea. A straight route stops at a boundary; there is no automatic pathfinding. Select waypoints to go around obstacles. Selecting a town inspects it; the Travel button starts actual movement. Pause and Stop controls are provided for touch, and backgrounding pauses the journey. Travel state checkpoints every 150 moving ticks and when actions save the campaign.

The source's strict arrival condition is abs(dx)<2 and abs(dy)<2. The movement trace retains its final extra step on an ordinary stop. Reaching a town opens its city; rogue contracts trigger at the original quest-avatar bounds instead of launching immediately from town hall. New route selection from an occupied town uses its original marker origin, like WorldMap.init.

Encounter logic ports the source branches: a 1/150 rogue roll per valid moving frame; a second 1/150 roll in hostile land; hero-level enemy counts capped at 24; and source sea, shore and inland battlefield ranges. The seed is persisted so a restored journey continues the remake's random stream. Encounters interrupt movement and use the existing battle/checkpoint flow.

**Constructor milestone update:** roaming rogue gear/nationality and standard-unit constructor random draws are now regenerated and verified against original AVM1 bytecode; see [encounter parity](ENCOUNTER_PARITY.md). **Remaining fidelity limits:** World randomness is deterministic for the remake but is not yet the original full call stream. Ambush probabilities and roster-selection formulas are ported, but seeded whole-game RNG equivalence is not claimed. Arrival suppresses an additional random encounter on the same transition frame; the original frame code can continue after opening a scene. Quest/town overlap precedence, initial movieclip ordering and scene transitions still need replay checks.

## Harbors and horses

Only cities with a source harbor placement offer sailing. Renting costs 4,000 gold, matching SHIP_PRICE. Docking at an encountered town records SHIP_LOCATION and ends sailing; another voyage requires another fare. A siege at the recorded ship town uses source harbor battle maps 77–80. This retains the source's recorded dock location even after later land movement.

Only cities with source stables offer their recovered `Town.barn` horses. Purchases require the full sticker price before trade-in, then charge price minus round(old horse price/3). Selling pays round(price/3). Hero.equipHorse's weapon/dual-wield restrictions are enforced. HP, defense, mounted timelines and battle movement already read horse bonuses; world-map speed remains two, as in the original. Horse data is validated on import.

Recruitment now requires an owned town, matching Cities.openBarracks. Neutral friendly towns still offer merchants and contracts. Traveling outside a town blocks remote purchasing, selling and recruitment; inventory/equipment inspection remains available.

## Contracts and rewards

Town halls now use the original random selection of combat or delivery work; asking for new work replaces the previous task. Delivery destination and reward use the recovered Quest generator. Accepting a delivery queues a payment at its destination. Defeating quest rogues queues payment at the issuing town; battle loot is still granted on victory. Opening the appropriate town hall pays the first matching reward once. Merely arriving does not grant gold. This fixes the previous alpha shortcut that automatically paid combat contract rewards at battle end.

The remake retains one active task and queued completed payments. Source delivery-note replacement, pending approval and first-match collection are implemented; the combat checkpoint adaptation described below and original Flash .sol migration remain differences. Old alpha combat quests receive a valid deterministic marker on world-state initialization. Old saves without world state initialize at their saved town.

The alpha's existing defeat/retreat checkpoint restores pre-encounter state; it is intentionally more forgiving than literal Flash defeat behavior. Combat contracts become completed/rewardable only after victory, while original Quest.prepareBattle queues the note when starting battle. These are documented transaction adaptations.

## Verification

Eleven new checks cover original movement frame traces, geometry completeness and reproduction, curved fills/strokes, real travel and service gates, encounter formulas/maps, town-hall payments, horse trade-ins/requirements, save validation/RNG continuation, quest-marker triggering and owned-town recruitment. Raw SWF extraction reproduction is skipped in clean CI checkouts because the source file is ignored; the committed data and all other checks remain available. Original-runtime full replays and physical iPad/iPhone Safari acceptance are outstanding.
