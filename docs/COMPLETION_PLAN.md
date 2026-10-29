# Feudalism remaster — sequential completion plan

## Shared baseline and working rules

Start every stage from the latest `main`. Read this plan, `CONTINUATION.md`, `CHARACTER_IDENTITIES.md`, and `PRESENTATION_CONTRACT.md` before editing. Keep one integration owner; delegate bounded files, then review the combined diff. Complete the acceptance gate for a stage before starting the next. Use short feature branches and merge passing work back into `main`; do not build on another agent's unpublished checkout.

The original painted world map and approved bright Option B direction remain the visual baseline. Original gameplay data and the fixed 30 Hz simulation remain authoritative. Asset quality, model fidelity, and device performance are separate acceptance claims.

## Completed in this baseline

Eight distinct hero designs and 76 troop identities; contained selection/profile/roster artwork; actual equipped weapon and shield attachments; 40 weapon images including 20 named class variants; source-timeline weapon anticipation, strikes, recovery, dual attacks, bow draw, crossbow recoil and throwing releases; matching thrown-projectile images. Approved source sheets and generation prompts are committed alongside padded runtime assets and measured grip/alpha metadata.

Character bodies currently use whole-figure movement with separate weapon motion. This is not a full skeletal or separately drawn multi-frame animation library. Procedural encounter gender/armor combinations and equipment armor upgrades do not yet have every possible bespoke body appearance.

## Ordered remaining work

| Order | Stage | Concrete work | Acceptance gate |
|---|---|---|---|
| 1 | Device acceptance and defect correction | Play the merged build on iPad mini A17 Pro and iPhone Safari: hero selection, every screen, movement/attacks, pause/background, orientation, weapon changes, retreat and two-stage sieges. Follow IPAD_VALIDATION.md and DEVICE_TEST.md; record build and device. | No crashes, lost progress, clipped art or unreachable controls; any failures reproduced and fixed before adding features. |
| 2 | Equipment and character animation completion | Add armor/helmet upgrade layers and procedural appearance support; refine hand/arm and seated cavalry poses; create directional/body frames where whole-figure motion is inadequate. Preserve the approved visages and regional class silhouettes. | Selection, inventory, roster and battlefield agree on identity and equipped gear; all poses fit bounds, handedness and weapon swaps remain correct, and deterministic combat checks still pass. |
| 3 | Regional town and service presentation | Build distinct regional architecture, barracks, armory, stables, harbor and town hall views; replace generic service lists with visual equipment/recruitment choices and clear affordability/requirements. | All original town inventories and service restrictions remain correct; touch navigation and recruit/equip flows work in both orientations. |
| 4 | Campaign readability and visual progression | Improve travel and encounter feedback, quest destination/reward collection cues, garrison previews, capture banners, recruitment tiers, loot/equipment comparison and level-up presentation. | A new player can choose a hero, recruit, complete a contract, collect payment, equip loot and identify the next destination without external instructions. |
| 5 | Combat feedback and accessibility polish | Refine attack silhouettes, projectile trails, hit/miss/critical feedback, selected-unit contrast, army targeting, optional reduced motion and sound controls. Keep effects bounded. | Hero, allies, enemies, weapon class and combat state remain legible during full formations in every preset; presentation cannot alter hit timing or RNG. |
| 6 | Performance, offline and save resilience | Measure frame pacing, memory, heat and battery on the target devices; optimize texture loading and rendering from measured bottlenecks. Verify offline installation, update handoff, export/import, refresh and interrupted sessions. | Recorded device results meet an agreed target; no save loss or mid-battle update replacement; offline paths have no missing assets. Preset labels are supported by measurements. |
| 7 | Remaining original-game fidelity and balance evidence | Expand original-runtime replay coverage for formations, reinforcements, death/reinitialization, encounters and scene transitions; investigate known NaN movement differences. Assess economy and difficulty with real campaign play before changing source values. | Remaining deviations are reproduced, fixed or explicitly documented; campaign progression and rewards are understandable and tests compare meaningful source evidence. |
| 8 | Release candidate | Run a complete fresh campaign smoke pass, regression suite, asset integrity/bounds checks, production/offline build and device checklist; clean player-facing alpha copy and publish release notes. | One tagged build has green CI, documented device acceptance, known limitations, recovery instructions and a reproducible source/art pipeline. |

## Next assignment

Begin stage 1. Use the merged commit as the test build. Record device evidence and prioritize reproducible defects. Stage 2 can be scoped from those findings, but should not obscure device failures with additional art production.
