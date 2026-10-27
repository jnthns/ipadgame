# Mechanics alpha: hands-on test stage

This is the mechanics test build. Presentation remains frozen; existing representative art is provisional. Passing automated checks does not establish full original-game fidelity or physical iOS acceptance.

Use the published HTTPS URL supplied with this build. The test candidate is on `device-test-stage`, prepared for release through `main`. Opening source files is not opening the game. GitHub Pages publication must be confirmed separately.

## First session (about 15 minutes; estimate)

1. Open the game in Safari while online and choose a hero. Wait for the offline-cache-ready notice. Record the build commit, device model and iOS/iPadOS version.
2. In your starting owned town, recruit troops, buy an affordable item or supplies, and inspect inventory/equipment. Confirm gold and quantities change once per purchase.
3. Request a town-hall contract, accept it and travel toward its marker or delivery town. Verify Pause and Stop work and a blocked route stops at the shoreline or obstacle.
4. Enter a battle. Move and attack with the touch controls, switch weapons where available and issue troop orders. Confirm scrolling the page does not leave a direction or attack held down.
5. Pause, switch graphics preset and resume. Confirm the army, HP, orders and battle progress survive without a restart or duplicated reward.
6. Switch to another app during battle and return. Confirm the game remains paused, no controls stay held and there is no burst of catch-up simulation. Resume deliberately.
7. Retreat or lose a battle and confirm the pre-battle campaign returns. In a separate encounter, win and confirm loot, survivors and rewards are applied once. Combat-contract payment is collected at its issuing town hall, not automatically on the battlefield.
8. Outside combat, export a campaign from the journal. Reload and compare gold, army, equipment, quest and ownership; then import the export and compare again. Reloading during combat restores the pre-battle checkpoint.
9. Use Safari Share → Add to Home Screen. Launch the installed app once online and wait for the offline-ready message; enable Airplane Mode, close and reopen it, and verify campaign screens and core actions still load.
10. Rotate between portrait and landscape, inspect the notch/Home indicator areas and tap small adjacent controls. Report any clipped panel, accidental action, unreachable button or horizontal page overflow.

## What to report

| Field | Record |
|---|---|
| Build and URL | Exact commit and launch URL |
| Device | Model, OS version, Safari or Home Screen app |
| Scenario | Hero, town, battle type and graphics preset |
| Steps | Short reproducible action sequence |
| Expected / actual | Describe each separately |
| Evidence | Screenshot/video and exported save, when useful |
| Severity | Lost progress; blocked action; changed gameplay; layout; cosmetic |

Prioritize lost progress, repeated rewards, unresponsive controls, offline failures and crashes. Original Flash `.sol` imports, cloud sync and the final visual remaster are outside this test build.

## Updates and offline behavior

The service worker precaches the whole static build. Install failure leaves the previous active build in place. Cache names are isolated by deployment scope, lookup uses only the current build's cache, and query-bearing launch URLs resolve to the cached app shell. Asset paths and contents both contribute to the revision. Unknown resources use the network; the runtime has no external asset/CDN dependency.

A new worker waits while the previous build is open. Close all game tabs and the installed app, then reopen online to pick up a ready update. Do not clear site storage as an update step: that can remove the campaign. Export a save before update testing. A ready offline cache is not a guarantee against later browser/OS storage eviction.

## Automated evidence and remaining device checks

`tests/pwa-worker.test.ts` executes generated worker code with controlled caches and requests. It checks cache population, per-path isolation, old-cache cleanup, stale-cache exclusion, offline query launches, network fallback, ignored external/non-GET requests and renamed-asset revision changes. These checks run without a browser or network.

CSS now retains safe-area insets across responsive breakpoints, sets form controls to at least 44 CSS pixels in each dimension, avoids undersized help buttons, permits narrow headers/control rows to wrap and uses 16-pixel form text to avoid tiny touch input. Computed layout, actual tap accuracy, rotation, thermal behavior, battery use and Safari storage retention still require the physical device. Use [the full iPad validation matrix](IPAD_VALIDATION.md) for longer performance/preset sessions; its unmeasured values are targets, not results.

## Publication prerequisite

The GitHub connector cannot enable Pages because it has no administration access, and the development browser is not signed in. The owner must open [repository Pages settings](https://github.com/jnthns/ipadgame/settings/pages), choose **GitHub Actions** as the source, then rerun the Pages workflow if its initial deployment failed. The deployment workflow reports the actual HTTPS URL; do not treat a predicted github.io address as a verified live site. CI also retains a static build artifact for 14 days.

## Browser evidence this milestone

A normal campaign was opened in the cloud browser, one Caravan Guard was recruited (100→50 gold, 5→6 soldiers), city navigation and a six-rogue/600-gold town-hall contract were exercised, and quest travel started. Journal export/import automation stalled and was not verified. Production-browser offline launch and live Restore/Retreat handlers remain acceptance items; automated tests verify their underlying save/campaign data and generated worker behavior.
