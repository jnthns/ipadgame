# Feudalism Remastered — art direction

## Definitive reference

The user-supplied reference board’s **Option B: Stylized 2.5D (Hand-Painted)** is the visual source of truth. This is a colorful, cartoon-inspired medieval strategy RPG. Higher quality means more cohesive drawing, cleaner silhouettes, smoother expressive animation and better polish within that style; it does not mean greater realism.

The reference board is an art-direction guide. Sample place names, character names, equipment numbers, UI labels and map positions on the board are not replacements for the recovered game data.

## Stage one: representative visual slice

Create and review these four representatives before producing a complete asset library:

1. **World map:** charming castles and villages, simplified forests and mountains, warm green land, blue water, gold roads and clear faction accents. Retain original logical town placement and map interactions.
2. **Battlefield:** an illustrated medieval field with a readable combat area, uncluttered background landmarks, expressive cartoon combatants and restrained effects. Combatants and touch targets must remain easy to distinguish during an active battle.
3. **City screen:** a welcoming illustrated street or square with simplified timber, stone, bright roofs and faction banners. Give recruitment, shops and quests one coherent touch-friendly interface.
4. **Four-character lineup:** representative hero/troop designs with shared proportions, expressive faces, bold silhouettes and clearly readable equipment. The lineup demonstrates the visual language; it is not a complete roster of final character skins.

The representative art images are newly generated using the built-in image-generation tool, informed by the supplied board. Live combat now uses a representative four-role illustrated sprite sheet, with the shared cartoon rig retained as a loading fallback; it does **not** constitute the complete appearance library for all 76 recovered troop definitions. Generated images and runtime rigs must be assessed separately: a polished backdrop does not establish that animated units, equipment attachment or combat readability are finished.

Do not start large-scale asset generation until the representative scenes conform to this direction and have been reviewed. The next production stages should reuse approved shapes, proportions, faction palettes, equipment motifs and environment components.

## Visual rules

| Element | Required treatment |
|---|---|
| Characters | Simplified expressive faces, slightly exaggerated proportions, recognizable silhouettes, readable hands/weapons and clear faction accents |
| Equipment | Broad, simple forms that communicate weapon type and armor class at gameplay scale; avoid intricate engraving or dense detail |
| Color | Bright, harmonious warm greens, clear blues, gold accents and distinct faction colors; preserve those colors across graphics presets |
| Environment | Hand-painted illustrated appearance, simplified shapes and controlled detail; charming exaggerated castles, towns, forests and mountains |
| Shading | Soft, minimal shading with restrained contact shadows; no physically realistic lighting or cinematic post-processing |
| Animation | Clean readable anticipation, motion and recovery; expressive but restrained, with no distracting screen-filling effects |
| Interface | Modern, touch-friendly controls with subtle medieval fantasy styling, clear text hierarchy and consistent visual components |
| Composition | Keep the active gameplay area clear, with landmarks supporting navigation rather than competing with units or controls |

Avoid photorealistic or painterly-realistic scenery, realistic human anatomy, elaborate armor textures, excessive foliage, dense clutter, heavy shadows, dramatic cinematic lighting, gritty/desaturated palettes and unnecessarily complex 3D models.

## Graphics presets

Every preset presents the same game and visual identity. Character designs, body proportions, equipment silhouettes, faction colors, logical town positions, world layout, interface and gameplay rules stay shared.

| Preset | Appearance | Rendering workload |
|---|---|---|
| **Quality — default** | Full Option B illustrated terrain, expressive animation, colorful restrained effects and moderate environment detail | Highest configured resolution, animation cadence, ambient detail and particle budget |
| **Balanced** | The same illustrated appearance and assets with reduced visual activity | Reduced resolution, animation cadence, particles and decorative foliage |
| **Battery Saver** | Option D-inspired simplification of Option B, with flatter shading and simplified environments | Lower resolution and animation cadence, minimal effects and fewer decorative objects |

Battery Saver is a simplified rendering of the same art direction, not a separate style, alternate character roster or different map. Detail reductions must not remove information required to identify units, equipment, faction ownership, destinations, attacks or available actions. Presets are manual rendering choices; their names do not establish measured device performance or battery savings.

The preset definitions live in `src/render-presets.ts`. They contain presentation settings only. The battle simulation remains a fixed **30 Hz** process independent from display cadence and rendering resolution. Rendering may read model snapshots; it must not modify combat timing, target selection, damage, movement rules, spawn counts, random rolls or save state. Shared assets and rigs should be used wherever possible.

## Consistency across systems

The approved direction must eventually carry through the world map, battlefields, heroes, troops, cities, shops, equipment, inventory, recruitment, quests, faction banners, buildings and environmental objects. Stage one establishes the visual vocabulary for those systems. It does not imply that every listed system already has a finished bespoke screen or final asset set.

Use shared building silhouettes, foliage clusters, banner geometry, equipment motifs, character rigs and interface components rather than independently inventing a new style for each screen. Keep iconography consistent between map markers, city services, recruitment cards and equipment panels.

## Review gate

Before approving the representative slice, inspect all four scenes in Quality and Battery Saver, then check Balanced to ensure it retains the same identity. Review at actual gameplay scale, not only as enlarged artwork.

- Characters and weapons remain recognizable without realistic detail.
- Landmarks, town ownership and interaction targets remain readable.
- Bright colors remain harmonious, with faction distinctions that survive simplification.
- Battlefield decoration leaves clear space for troops, health bars and orders.
- UI remains legible and touch-friendly in portrait and landscape.
- Preset switching preserves campaign state, selections, logical positions and battle behavior.
- No scene drifts into realistic, gritty or cinematic styling.
- Remaining representative-only assets are explicitly identified before planning a full library.

Physical-device acceptance is tracked separately in `docs/IPAD_VALIDATION.md`.
