# iPad mini A17 Pro — validation plan

## Status and evidence boundary

**Physical iPad mini A17 Pro testing has not been performed in this development environment.** An actual device is unavailable here. Browser checks, build results and automated simulation tests can support implementation confidence, but they cannot establish iPad Safari frame rate, thermal behavior, battery use, offline installation or touch comfort.

This document is a concrete device checklist. Performance values below are **targets or test procedures**, not measured results. Fill in the observation table only after performing each test on the physical device. Do not describe the game as validated on iPad until that evidence exists.

The same principle applies to iPhone. Responsive layout checks do not substitute for a device run.

## Test setup

Record the exact build/commit, published HTTPS URL, device model, iPadOS version, Safari version if available, battery percentage, brightness, Low Power Mode state, orientation and whether the game is running in Safari or from its Home Screen icon. Use the same brightness, workload, network state and starting battery range when comparing presets.

Begin with a representative campaign save and a repeatable battle. Keep the save and battle inputs identical across presets. Close unrelated heavy applications if practical, and note any interruptions rather than silently attributing their effects to the game.

## Preset matrix

Run every core check in **Quality**, **Balanced** and **Battery Saver**. Quality is the default. Confirm that a selected preset survives a normal reload when browser storage is available.

| Preset | Configured render target | Device observation |
|---|---:|---|
| Quality | 60 FPS; full illustrated appearance | Not measured |
| Balanced | 45 FPS; reduced visual workload | Not measured |
| Battery Saver | 30 FPS; flatter/simplified environment and minimal effects | Not measured |

The configured target is a display/rendering goal, not a guarantee. The fixed-step battle simulation remains 30 Hz for every preset. Lower display cadence must not slow or alter the game simulation.

## Visual and touch acceptance

For each preset, inspect the representative world map, battlefield, city screen and four-character lineup in both landscape and portrait.

- [ ] Confirm shared character designs, proportions, equipment silhouettes, faction colors and interface styling across presets.
- [ ] Confirm identical logical town placement and ownership information, including after switching presets.
- [ ] Verify every action control has at least a **44×44 CSS-pixel** touch target; record any smaller target rather than assuming visual size equals hit area.
- [ ] Check top and bottom safe areas, rounded screen corners, Safari bars and the Home indicator; no text, button or interactive map target should be obscured.
- [ ] Check that portrait layout does not produce horizontal overflow or force controls outside the usable viewport.
- [ ] Rotate during map browsing, city interactions and combat; controls and selected state should survive rotation.
- [ ] Tap neighboring towns and closely spaced controls; confirm that hit regions select the intended item without requiring precision taps.
- [ ] Give hero and group movement orders near every battlefield edge and corner; verify touch coordinates map to the same logical destinations in all presets.
- [ ] Check tap, scroll and drag behavior for unwanted page scrolling while interacting with the battlefield, and confirm ordinary panels can still scroll.
- [ ] Inspect text, health bars, faction banners and equipment silhouettes at normal playing distance.
- [ ] Confirm that simplified terrain or reduced effects do not hide gameplay information.

A 44 CSS-pixel target is an acceptance target for this project. It is not a claim that the current implementation has already passed a physical touch audit.

## Gameplay independence

- [ ] Start the same saved scenario in each preset, use the same orders where reproducible, and compare enemy composition, initial HP, troop count and logical positions.
- [ ] Switch presets during a live battle and verify there is no restart, extra simulation step, lost order, changed unit count, altered HP or duplicated reward.
- [ ] Confirm that pause/resume and speed controls retain their state when a preset changes.
- [ ] Compare combat progression over equivalent simulation time rather than judging speed from animation smoothness.
- [ ] Confirm that graphics preferences are stored independently from campaign data and do not alter exported campaign JSON.
- [ ] Confirm all presets preserve the same campaign actions, recruitment costs, equipment requirements and save behavior.

Automated deterministic model tests compare battle state and rewards across preset-dependent render schedules. They are evidence that the model can stay independent; they do not replace testing the actual rendering integration on the device.

## Frame rate, responsiveness and heat

Use Safari Web Inspector or an available performance tool to measure frame cadence when feasible. If no measurement tool is available, label findings as subjective observations rather than FPS measurements.

Run a **10-minute repeatable battle/map/city workload per preset** as an initial comparison, then a longer session if thermal behavior remains uncertain. Record frame-time spikes, dropped-frame periods, touch response, loading delays, visible stutter and any OS warning. Do not assume the configured render target was reached.

- [ ] Measure or observe initial performance after loading.
- [ ] Repeat the same observation after five and ten minutes.
- [ ] Include a troop-heavy battle with effects active and movement orders being issued.
- [ ] Compare scenes with static artwork against active combat to isolate workload differences.
- [ ] Record whether the back of the device feels cool, mildly warm or noticeably hot, and whether this changes during the run; these labels are subjective unless an instrument is used.
- [ ] Note whether performance degrades after warming, and whether it recovers after a break.
- [ ] Confirm Battery Saver reduces decorative activity and rendering workload without changing the game’s visual identity.

Do not infer a battery-saving percentage or thermal improvement from configuration alone. A lower rendering budget is an implementation fact; actual device savings require measurement.

## Battery observation

For a useful initial comparison, run the same **30-minute workload** for each preset with fixed brightness and equivalent device/network conditions. Record starting and ending charge, run duration, Low Power Mode, background activity and any interruptions. Repeat if results vary materially.

Battery-percentage changes over a short session are coarse observations, not precise power measurements. Report the observed percentage-point change and elapsed time; do not extrapolate an exact battery life or percentage saving without repeatable evidence.

## PWA, offline and save survival

Perform these checks in Safari and again after **Share → Add to Home Screen**.

- [ ] Load the published HTTPS build and wait for the offline-cache-ready notice.
- [ ] Install the Home Screen app and confirm its name, icon, launch screen appearance and standalone layout.
- [ ] Make a recognizable campaign change, leave a battle-free checkpoint and reload; confirm progress survives.
- [ ] Close and reopen the Home Screen app; confirm campaign and preset preference survive.
- [ ] Enable Airplane Mode after the cache is ready, relaunch the game and verify all four representative scenes and core game actions load without missing assets.
- [ ] Export a save, make a different change, then import the exported file; confirm the intended campaign returns.
- [ ] Switch away during combat, lock/unlock the device and return; confirm the game pauses safely and can resume without a large time jump.
- [ ] Reload during combat and confirm the documented pre-battle checkpoint behavior.
- [ ] Reopen after a device restart and verify offline launch and saved campaign where storage remains available.
- [ ] Test a new published build: confirm the cache updates successfully, the campaign remains readable and a normal relaunch does not mix incompatible old/new assets.

Browser/OS storage can be cleared or evicted. The existence of localStorage and an offline cache is not a guarantee of permanent retention; save export/import must remain available as a user-controlled backup path.

## Observation record

| Check | Quality | Balanced | Battery Saver |
|---|---|---|---|
| World-map readability | Not tested on device | Not tested on device | Not tested on device |
| Battlefield readability | Not tested on device | Not tested on device | Not tested on device |
| City-screen readability | Not tested on device | Not tested on device | Not tested on device |
| Character-lineup consistency | Not tested on device | Not tested on device | Not tested on device |
| Landscape safe areas and touch targets | Not tested on device | Not tested on device | Not tested on device |
| Portrait safe areas and touch targets | Not tested on device | Not tested on device | Not tested on device |
| Measured render cadence | Not measured | Not measured | Not measured |
| Ten-minute heat observation | Not observed | Not observed | Not observed |
| Thirty-minute battery change | Not measured | Not measured | Not measured |
| Mid-battle preset switch | Not tested on device | Not tested on device | Not tested on device |
| Offline Home Screen launch | Not tested on device | Not tested on device | Not tested on device |
| Save/export/import survival | Not tested on device | Not tested on device | Not tested on device |

Record failures with a screenshot or short description, exact steps, expected behavior and actual behavior. Prioritize lost progress, changed gameplay, unreachable controls and missing offline assets before cosmetic polish.
