# Representative combat artwork

`public/art/remastered/combat-sheet.webp` is a project asset generated with the built-in image-generation tool, using the previously approved `lineup.webp` as its character/style reference. The WebP preserves alpha and the generated1536×1024 layout. The original generated PNG is retained outside the source checkout; the shipped WebP is the runtime asset.

The sheet has four rows (hero, swordsman, archer, spearman) and six poses per row (idle, walkA, walkB, attack, hurt, defeated). Explicit frame rectangles and body/foot anchors in `battle-actor.ts` preserve long weapons and avoid neighboring-frame fragments. All presets share the asset, costumes, affiliations and frame anchors; only animation cadence and decorative workload vary.

These are four representative designs, not 76 final unit skins or an exact equipment appearance system. Actual weapon names and mounted/team/faction information remain visible in the HUD or scene. The existing vector rig remains a missing-asset fallback.

## Generation brief

The initial prompt requested one transparent1536×1024 sheet with a strict6-column×4-row grid, the same blue-cloaked hero, blue-tabard swordsman, green-hooded archer and blue-plumed spearman from the approved lineup, facing right. Each row required idle, two walking steps, committed attack, recoil and non-graphic defeat. The requested treatment retained bright faction colors, gold trim, expressive proportions and simplified readable silhouettes, with no text, gridlines, scenery or cast shadows.

The final correction prompt was:

> Edit target: the supplied1536x1024 transparent24-frame game sprite sheet. Precise production layout correction ONLY: retain these exact4 character identities, artwork style, colors, row order and six pose sequence, but shrink EVERY full character and ALL their equipment uniformly to about70 percent of the current size, positioning EACH complete sprite wholly inside its own256x256 cell with generous transparent padding. Keep image1536x1024, exactly6columns x4rows. Row1hero,row2swordsman,row3archer,row4spearman. Column1idle,2walkA,3walkB,4attack,5hurt,6defeated. All living feet must be at cell-relative y208 and bodycenter x128. Maximum opaque bounding box within each cell: x24..232 and y32..212, including weapon tips and capes; shorten or angle weapons to fit when necessary. No part of a sword, spear, bow, cloak, limb or face may cross any cell boundary. The attack swords currently cross into the adjacent hurt frames: FIX that and separate the two sprites with a clear transparent gutter. Nothing else in the transparent gutters, no labels, no gridlines, no blurred background, no cast shadows. Actual alpha transparency. Output the corrected sprite sheet alone.

The generated poses still extend beyond nominal cells in places, so runtime atlas rectangles follow the inspected sprite bounds rather than blindly slicing uniform cells. No simulation data is encoded in the image, and no animation callback applies damage.
