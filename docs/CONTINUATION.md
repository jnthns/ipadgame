# Resuming this project

Repository: https://github.com/jnthns/ipadgame

Active implementation branch: `mechanics-first`. Presentation is frozen; the earlier representative art work is archived on `presentation-slice`. `main` is not the current game implementation, and GitHub Pages has not been published.

Read `docs/MECHANICS.md`, `docs/WORLD_CAMPAIGN.md`, `docs/ENCOUNTER_PARITY.md` and `docs/IPAD_VALIDATION.md` and `docs/PRESENTATION_CONTRACT.md` before choosing the next task. Do not claim mechanics complete or restart broad asset generation while acceptance gaps remain.

Run `npm ci`, `npm test`, and `npm run build`. Current full local suite: 127 checks. Clean CI skips raw-SWF extractor reproduction checks because the original source file is ignored. Source-level and bytecode oracles are not full Flash replay equivalence.

Completed: source data, combat formulas/timing, manual hero controls, movement/collision reservations, 80 battlefield layouts/formations, reinforcements, inventory/equipment/loot, consumables/army abilities, world vector travel, encounters, harbors, horses, quest travel/rewards/replacement, randomized roaming constructors, bytecode-verified sparse XP progression through level 50, upgrade actions, troop commands and idempotent victory settlement.

Next work: original-runtime controlled replay/scheduling comparison; terrain/spawn overlap ordering; original scene clock phase; physical iPad/iPhone Safari touch/offline/save acceptance; then presentation approval and phased remaster work. Original Flash .sol migration is separate future work.

Keep simulation independent from rendering. Quality, Balanced and Battery Saver must produce identical gameplay behavior. Document deliberate repairs and checkpoint adaptations separately from literal source parity. Do not overwrite uncommitted work or silently change the active branch. User authorization permits continuing mechanics and syncing changes to this repository.

Suggested new-chat prompt: “Continue Feudalism in jnthns/ipadgame on mechanics-first. Read docs/CONTINUATION.md and docs/MECHANICS.md, inspect the current branch and tests, then work through the remaining mechanics acceptance gaps. Keep presentation frozen.”
