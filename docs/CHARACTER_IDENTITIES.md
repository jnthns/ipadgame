# Character identity and equipment art

The character renderer resolves each original hero and all 76 recovered troop definitions to a unique padded body image. Hero selection, hero equipment, recruitment, company rosters and live battle share the same identity resolver. The approved Option B expressive, bright, hand-painted style remains the visual reference.

The old four-role sheet is not an appearance source for named heroes or troop classes. In particular, Karl resolves to his own broad-faced, bearded design and his actual equipped morningstar. A weapon-category badge does not substitute for the weapon image.

## Canonical identity and remaster interpretation

`original-data.json` contains hero names, nation, gender, attributes and starting equipment, but no prose biographies or physical-description fields. Distinct faces and costume details in `character-appearance.ts` are new remaster art direction, rather than claims that these details were recovered from the original game. Canonical names, classes, nations, equipment and combat statistics remain unchanged; this includes the original spellings `Elizabth`, `Rhonin` and `Taekwon`.

| Hero | Nation | Remaster visage | Original starting primary / secondary |
|---|---|---|---|
| Karl | Ger | Broad face, short chestnut hair and brown beard | Morningstar / Small Buckler |
| Niora | Jap | Brown eyes, black high bun, ivory-and-red travel robes | Apprentice Staff / Hunter Bow |
| Olga | Rus | Strong face, auburn braid, green wool tunic | Guard Bow / Forged Twohanded Sword |
| Vseslav | Rus | Square jaw, thick dark beard, leather cap | Peasant Twohanded Axe / Small Throwing Axe |
| Edgar | Viz | Olive complexion, wavy dark hair, determined brows | Iron Twohanded Sword / Long Bow |
| Elizabth | Ger | Short honey-blonde hair, determined squared features | Battle Hammer / Steel Throwing Knife |
| Selena | Viz | Olive complexion, dark curly bob, perceptive eyes | Light Crossbow / Knife |
| Sieg | Jap | Sharp eyes, tied-back straight black hair, indigo travel clothes | Short Ninja-To / Shuriken |

## Regional silhouettes

These are game costumes inspired by historical forms, with the recovered game's mixed-period and fantasy equipment preserved. They are not exact reconstructions of a single historical date.

| Game nation | Art treatment |
|---|---|
| Viz | Byzantine and late Roman inspired belted tunics, scale or lamellar-like armor, bronze and gilt details, cheek-piece helmets and imperial cavalry. |
| Ger | Medieval Central European inspired cloth, mail, coifs and heavier plate, with slate-blue, cream and russet accents. |
| Rus | Medieval Rus inspired wool coats, leather, mail and pointed helmets, with green and burgundy accents. No fantasy Viking horns. |
| Jap | Wrapped robes and practical indigo shinobi clothes, alongside distinct laced lacquered samurai armor. Ninja, samurai, staff users, naginata guards and ranged classes retain different costumes. |
| Rog | Patched travel clothes and mismatched salvaged equipment. A sampled rogue's `NATION: Viz` does not turn its class art into an imperial soldier. |

Historical silhouette references used to constrain the interpretation: [Metropolitan Museum, Japanese Dō-maru armor](https://www.metmuseum.org/art/collection/search/22505), [Japan Tourism Agency, ninja clothing](https://www.mlit.go.jp/tagengo-db/en/R1-01583.html), [Russian Culture portal, pointed helmet](https://ar.culture.ru/en/subject/shlem-9), [Metropolitan Museum, European armor](https://www.metmuseum.org/art/collection/search/33731), and [Metropolitan Museum, Byzantine helmet](https://www.metmuseum.org/art/collection/search/35692).

## Asset and attachment contract

Final standalone bodies use `public/art/remastered/identities/characters/{id}.webp`: `hero-karl`, `hero-niora`, `hero-olga`, `hero-vseslav`, `hero-edgar`, `hero-elizabth`, `hero-selena`, `hero-sieg`, and `unit-{exact recovered unit key}` for troops. Source-sheet row and column metadata remain in `character-appearance.ts`, in the original JSON insertion order, so extraction and review are reproducible. Each final image contains the complete figure with transparent padding; the interface contains the whole image instead of using a crop or `object-fit: cover`.

Body canvases are 256 × 256 with feet at (128,224). Actual leading-hand positions, off-hand anchors and equipment grips are stored per image in `src/character-art-layout.json`; `character-equipment.ts` shares those measured anchors between HTML portraits and live battle. Each opaque silhouette has at least eight pixels of transparent padding. The authoring processor extracts complete connected figures instead of cutting nominal atlas cells, so a boot, plume or hand that crosses a generated grid boundary is retained.

Body images have empty hands. Actual equipped items are separate attachments resolved from `Item.TYPE`, `Item.NAME` and, for nation-specific throwing weapons, `Item.NATION`. Twenty base silhouettes distinguish morningstar, hammer, mace, sword, two-handed sword, katana, ninja-to, axe, two-handed axe, bow, crossbow, spear, naginata, staff, dagger, shuriken, throwing axe, throwing knife, fire vessel and shield. Unarmed characters display empty hands. Unknown item types do not silently become swords. Naginata is named explicitly because the original game's item type is `Staff`.

Combat uses the fighter's current `weaponItem`, including completed weapon exchanges, instead of assuming that the campaign's initial primary hand is still active. Body identity is stable when gear changes. The existing model determines whether a secondary weapon is active, and controls all attack, movement, damage and mount rules.

Roaming encounter constructors can randomize gender, some armor and equipment. Class identity is recovered from the retained class name when an encounter uses a generated key. The body art is the class design; attachments use the actual rolled weapon. This does not claim a bespoke body drawing for every possible procedural appearance.

## Verification

`tests/character-appearance.test.ts` checks complete unique coverage of all 84 identities, correct Karl morningstar/buckler equipment, the distinct Japanese class treatments, rogue key and generated encounter resolution, an actual model weapon exchange from Niora's staff to her bow, and every recovered weapon type. Body art and attachments remain presentation metadata and do not alter the game data or simulation.

## Production assets and provenance

The built-in image-generation tool produced the eight-hero sheet, five regional troop sheets and modular equipment sheet. The complete prompt set is recorded in `docs/CHARACTER_ART_PROMPTS.json`. Final runtime files live in `public/art/remastered/identities/characters/` (84 bodies) and `public/art/remastered/identities/equipment/` (40 equipment images). The original scene art and painted world map are preserved.

`tools/prepare-character-art.py` creates standalone padded cutouts and records inspected alpha bounds plus content hashes in `identities/manifest.json`. `tests/character-assets.test.ts` verifies all 124 shipped files against that manifest, and `tests/character-art-bounds.test.ts` checks actual transformed silhouettes at the battlefield corners, with both facings, seven poses, alternate weapons and the recovered weapon catalogue. Runtime motion uses restrained whole-figure movement and independent weapon anticipation/strike/recovery; these are not separately redrawn frame sequences.

## Named class weapons and combat motion

Twenty additional class variants distinguish spiked staves, golden naginatas, holy spears, black and gold katanas, elite ninja-to, black and silver shuriken, forged and elite crossbows, holy and samurai bows, long and holy axes, elite great axes, Peacekeeper maces, the Starbringer sword, silver throwing knives, iron bucklers and kite shields. `equipment-art.ts` keeps each named image separate from its base motion class; `weaponAppearance` resolves the actual recovered item rather than guessing from a troop label.

The approved source sheets are saved in [art/character-references](art/character-references/README.md), alongside the added class weapon sheet. These design references are separate from the small, padded runtime cutouts.
