# Roaming units and quest replacement

This milestone replaces fixed sampled roaming-enemy templates with dynamic source constructors and brings town-hall offer replacement closer to the original. Presentation remains frozen.

## Randomized roaming units

`createEncounterUnit` supports the 76 recovered unit entries. Standard units roll gender using the original 70% male test; four source mount constructors also roll the original random horse color. The original `Horse('any')` uses dice(4), so its five-element color array never chooses black. Explicit black mounts remain black.

All six roaming rogue types now roll their own nation, gear, armor, secondary weapons and optional mounts. The source's restricted array ranges are preserved: for example, some three-way nation selections exclude the fourth nation. Ranged rogues with no secondary weapon retain AS2's named `undefined` skill entry. Item data is cloned so generated units cannot mutate recovered templates.

Constructor evaluation order matters. Original AVM1 pushes constructor arguments in reverse order, so a rogue's weapon tier can be rolled before its weapon type. The port follows that bytecode order, rather than assuming the printed decompiled JavaScript order.

`tools/extract-unit-bytecode.py` verifies the original SWF hash and extracts its Unit constructor plus all 76 type initializers. Clean CI fixtures retain the raw bytecode, constant pool, offsets, register metadata and per-method hashes. A narrow test interpreter executes the original bytes with table-backed weapon/armor constructors and the source Horse color roll. It is an oracle for these methods, not a Flash player.

Across **3,040 seeded cases** (76 entries × 40 seeds), the generated unit fields and RNG draw counts match the original constructor bytecode. Travel now creates those unit objects while choosing the encounter roster, so their random draws occur before subsequent enemy and battlefield selections. Generic rogue table entries remain useful as reference samples, but are no longer used as complete roaming encounter instances.

Remaining limits: weapon/armor data and the Hero default fields are shared recovered tables rather than a full execution of every original class initializer. Seeded whole-game RNG parity, frame scheduling and original-player execution are still separate acceptance requirements.

## Town-hall quest lifecycle

Town halls now select combat or delivery work using the original first dice(2) roll. Asking for new work replaces the previous task, rather than blocking until the current task is completed or offering both quest types at once.

`Quest.removeDeliverNote` removes only the first reward note matching the previous delivery destination, regardless of its amount. That unusual destination-only behavior is preserved. The previous destination remains available for subsequent source-style cancellation even after its payment is collected. Completed reward notes for other towns remain queued.

A generated combat offer immediately establishes its map marker, as in `initQuestBattle`; leaving its offer screen does not undo it. A generated delivery offer removes the previous package but adds no payable note until approval, matching `initQuestFedEx` plus `aproveDeliver`. The UI names these actions explicitly. Approval cannot add the same delivery note twice through repeated API calls; this is a guard around a button that the original removes after use.

Legacy world saves without delivery approval metadata treat their existing delivery as accepted. Last-destination metadata is optional and falls back to the saved active delivery during migration. Invalid metadata is rejected on import.

A source-level VM oracle covers **192 replacement transitions**, including old destination notes, new offer RNG use, combat markers and delivery approval. Separate checks execute the original `Cities.checkReward` method to verify first-match payout and repeated collections.

The alpha's battle checkpoint adaptation remains: combat contract payment is queued after victory, rather than during the original `Quest.prepareBattle`, and defeat/retreat restores the pre-encounter campaign. Original Flash save migration remains unimplemented. Do not mark whole-game mechanics fidelity complete on the strength of these tests alone.
