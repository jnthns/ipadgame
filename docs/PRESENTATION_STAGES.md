# Sequential presentation work

## Direction and scope

Source: the existing **Feudalism Remastered Style Guide** and **Feudalism Remastered Visual Style Guide** reference boards. Option B remains the direction: colorful stylized 2.5D, warm greens, clear blue water, expressive silhouettes, restrained shading and touch-friendly medieval UI. Stage 1 uses the board's charcoal framing, parchment surfaces, gold accents and faction pennants.

This work starts from current `main` (`1490004`), preserving the mechanics milestone. The older `presentation-slice` is an archive. The user's request to resume presentation authorizes this focused stage; it does not establish original-game parity, close device acceptance, or approve bulk asset production.

| Stage | Focus | State |
|---|---|---|
| 1 | Campaign shell and world map | Implemented; earlier painted map retained following review |
| 2 | Battlefield, combat HUD and command readability | Implemented; browser checks and regression suite passed |
| 3 | City environment and service navigation | Planned |
| 4 | Hero and troop silhouettes, equipment attachments and representative motion | Planned |
| 5 | Recruitment, inventory, equipment, shops and quest panels | Planned |
| 6 | Cross-screen polish and physical iPad preset acceptance | Planned |

Review each stage before expanding it. Representative assets are not a finished appearance library for all recovered units, equipment and regions.

## Stage 1 implementation

- The earlier illustrated `world.webp` map is retained following user review, while the new campaign shell and other designs stay. The flatter code-drawn atlas was rejected as the visual direction.
- The illustrated coastline is approximate. A quiet source-boundary overlay remains a travel aid; ground/sea hit tests, 800×600 logical positions, town locations and `WorldTravel` remain authoritative. Future terrain work should preserve this illustrated look while aligning the artwork to those source masks.
- Charcoal campaign frame, coherent line icons, faction key, selected-town dossier, garrison count, service actions, conquest progress and company roster. The town vignette is the existing representative city artwork, not a bespoke picture of each town.
- All-town name toggle and keyboard-accessible town selector. Small map targets keep the existing 44 CSS-pixel-aware hit areas. Every visible HTML button/select was checked against the 44×44 project target at tested landscape and phone sizes; dense map targets still need physical touch acceptance.
- Landscape layout fits the whole map and journey controls, with extra sea space around the map when height-constrained; portrait places town details below the map. The company roster follows the map in DOM and visual order.
- Quality, Balanced and Battery Saver share coastlines, controls, faction identity and campaign state. Terrain rendering and animation budgets vary only in presentation.

## Verification and review

Review update: the user prefers the earlier painted world map and wants the other designs retained. That map has been restored locally; the subsequent user instruction authorizes building and merging the presentation work. A production build was rerun for this visual-only change. The broader checks below describe the shared shell and controls tested in Stage 1.

Automated baseline: `npm test` completed 157 checks: 155 passed, two source-dependent checks skipped, zero failures. Production TypeScript/Vite build and offline asset generation passed. The existing bundle-size warning remains.

Browser review used 1133×744 and 744×1133 tablet frames and a 390×844 phone frame (the browser's scrollbar reduces content width). Checks include no page-level horizontal overflow, visible landscape journey controls, town selection, all three graphics presets, name-toggle state, city/army return navigation, pause/stop, and unchanged visible gold/roster counts during inspection and preset changes.

These checks are browser evidence, not physical iPad mini A17 Pro/Safari validation. Device comfort, frame rate, heat, battery use, Home Screen installation, offline launch and save survival remain tracked in `IPAD_VALIDATION.md`.

Review Stage 1's composition, terrain language, town-marker scale, faction readability, label density and parchment/charcoal balance before moving to the battlefield pass. The retained painted map and the existing battlefield, city and character illustrations remain representative artwork, with production asset expansion reserved for later review.


## Stage 2: live representative battlefield

Four illustrated sprite roles (hero, swordsman, archer, spearman) sample idle, two walking poses, attack, hurt and defeat. The source model determines movement, attack phase, damage, projectile position, death, reinforcements and rewards; animation never applies them. A separate read-only sampler provides the view state, with an inset X projection to keep edge-spawned silhouettes visible and a tested inverse for touch destinations. Team rings/health bars and actual-faction pennants remain distinct. Mounted fighters retain a simple representative horse silhouette.

The HUD presents hero health and actual equipped weapon name, manual attack/switch controls, troop orders, field counts, reserves, time, pause, retreat and reserve-archer targeting. Supplies live in an accessible drawer. Help, roster and retreat modals synchronize pause state with the HUD. Core simulation remains fixed at 30 Hz. Combat text/particles are bounded and cosmetic; pause freezes visual sampling, and preset changes preserve the battle object and tick.

These four costumes are representative; they do not replace the full 76-unit appearance library. Hero artwork is a representative blue-cloaked design, with a category badge and actual weapon name where equipment differs. Exact per-weapon attachments, regional costumes and polished multi-direction animation remain later art work.

Validation: 159 automated checks, 157 passed, 2 original-source extraction skips, 0 failures; production TypeScript/Vite build and offline cache generation passed. New checks round-trip all 160 battlefield cells and compare 300 seeded ticks against a model that is never sampled by the view. Browser checks cover 1133×744 and 744×1133 tablet frames plus 390×844 phone, 44px visible HTML action targets, no horizontal overflow, live unit movement, orders, targeting cancellation, Help/roster pause, retreat cancellation, and all 3 presets. A paused battle retained tick 76 across Quality/Balanced/Battery Saver changes. Physical Safari touch comfort, performance, thermal/battery behavior and offline installation remain unmeasured.
