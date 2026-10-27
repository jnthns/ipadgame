# Resuming this project

Repository: https://github.com/jnthns/ipadgame

Mechanics workstream: `mechanics-first`. The hands-on testing candidate is on `device-test-stage`, prepared for release through `main`. Presentation is frozen; earlier art is archived on `presentation-slice`. GitHub Pages must be enabled by the owner before publication can succeed.

Read `docs/MECHANICS.md`, `docs/WORLD_CAMPAIGN.md`, `docs/ENCOUNTER_PARITY.md` and `docs/IPAD_VALIDATION.md` and `docs/PRESENTATION_CONTRACT.md` before choosing the next task. Do not claim mechanics complete or restart broad asset generation while acceptance gaps remain.

Run `npm ci`, `npm test`, and `npm run build`. Current full local suite: 149 checks. Clean CI skips raw-SWF extractor reproduction checks because the original source file is ignored. The first controlled original-SWF/Ruffle replay matches 300 frames; see docs/RUNTIME_REPLAY.md. This is not full Flash replay equivalence.

Completed: source data, combat formulas/timing, manual hero controls, movement/collision reservations, 80 battlefield layouts/formations, reinforcements, inventory/equipment/loot, consumables/army abilities, world vector travel, encounters, harbors, horses, quest travel/rewards/replacement, randomized roaming constructors, bytecode-verified sparse XP progression through level 50, upgrade actions, troop commands and idempotent victory settlement.

Next work: publish the mechanics alpha for physical iPad/iPhone Safari touch/offline/save acceptance using docs/DEVICE_TEST.md; continue broad original-runtime reinforcement/ability/transition capture as fidelity work. DOM-only screens now advance the shared root phase, reinforcement bytecode matches 675 matrix cases and152-draw boundary, and integrated campaign/PWA checks pass. Presentation remains frozen until hands-on acceptance and visual review. Original Flash .sol migration is separate future work.

Keep simulation independent from rendering. Quality, Balanced and Battery Saver must produce identical gameplay behavior. Document deliberate repairs and checkpoint adaptations separately from literal source parity. Do not overwrite uncommitted work or silently change the active branch. User authorization permits continuing mechanics and syncing changes to this repository.

Suggested new-chat prompt: “Continue Feudalism in jnthns/ipadgame on mechanics-first. Read docs/CONTINUATION.md and docs/MECHANICS.md, inspect the current branch and tests, then work through the remaining mechanics acceptance gaps. Keep presentation frozen.”

Concurrent runtime work is integrated: baseline and isolated shower/wall captures each match300 frames. Reinforcement matches1200 RNG states with18 explicit NaN movement differences retained. Actual reserve-control initialization and wider transitions remain fidelity gaps.
