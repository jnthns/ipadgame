import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, newCampaign } from '../src/model';
import {
  DEFAULT_RENDER_PRESET,
  RENDER_PRESETS,
  RENDER_PRESET_IDS,
  RENDER_PRESET_STORAGE_KEY,
  VISUAL_IDENTITY,
  getRenderPreset,
  loadRenderPreset,
  renderPixelRatio,
  saveRenderPreset,
} from '../src/render-presets';

test('all graphics presets preserve one immutable character, faction, world and interface identity', () => {
  assert.equal(DEFAULT_RENDER_PRESET, 'quality');
  for (const preset of Object.values(RENDER_PRESETS)) {
    assert.equal(preset.identity, VISUAL_IDENTITY);
    assert.ok(Object.isFrozen(preset));
    assert.ok(Object.isFrozen(preset.identity));
    assert.ok(Object.isFrozen(preset.identity.factionColors));
  }
  assert.ok(Object.isFrozen(RENDER_PRESETS));
  assert.equal(RENDER_PRESETS.quality.terrainVariant, RENDER_PRESETS.balanced.terrainVariant);
  assert.equal(RENDER_PRESETS.battery.terrainVariant, 'simplified');
});

test('graphics workloads decrease without introducing gameplay settings', () => {
  const [quality, balanced, battery] = RENDER_PRESET_IDS.map(id => RENDER_PRESETS[id]);
  for (const field of ['renderingScale', 'maxPixelRatio', 'targetFPS', 'animationFPS', 'maxParticles', 'foliageDensity', 'contactShadowAlpha'] as const) {
    assert.ok(quality[field] >= balanced[field], field);
    assert.ok(balanced[field] >= battery[field], field);
  }
  const presentationFields = ['id', 'label', 'description', 'identity', 'terrainVariant', 'renderingScale', 'maxPixelRatio', 'targetFPS', 'animationFPS', 'maxParticles', 'foliageDensity', 'ambientMotion', 'animateBanners', 'contactShadowAlpha'];
  for (const preset of Object.values(RENDER_PRESETS)) {
    assert.deepEqual(Object.keys(preset).sort(), [...presentationFields].sort());
  }
});

test('invalid and blocked graphics preferences safely fall back to Quality', () => {
  for (const value of [null, undefined, '', 'ultra', '__proto__', 'constructor', {}, 0]) {
    assert.equal(getRenderPreset(value), RENDER_PRESETS.quality);
  }
  assert.equal(loadRenderPreset(null), RENDER_PRESETS.quality);
  assert.equal(loadRenderPreset({ getItem() { throw new Error('Storage denied'); } }), RENDER_PRESETS.quality);
  const values = new Map<string, string>();
  const storage = {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
  };
  assert.equal(saveRenderPreset('battery', storage), true);
  assert.equal(values.get(RENDER_PRESET_STORAGE_KEY), 'battery');
  assert.equal(loadRenderPreset(storage), RENDER_PRESETS.battery);
  assert.equal(saveRenderPreset('balanced', { setItem() { throw new Error('Quota exceeded'); } }), false);
  assert.equal(saveRenderPreset('quality', null), false);
});

test('canvas scale respects device ratio caps and never changes logical coordinates', () => {
  assert.equal(renderPixelRatio(RENDER_PRESETS.quality, 3), 2);
  assert.equal(renderPixelRatio(RENDER_PRESETS.balanced, 3), 1.275);
  assert.equal(renderPixelRatio(RENDER_PRESETS.battery, 3), 0.7);
  for (const bad of [NaN, Infinity, 0, -1]) {
    assert.equal(renderPixelRatio(RENDER_PRESETS.quality, bad), 1);
  }
});

test('a preset switch schedule cannot change deterministic battle state or rewards', () => {
  // Model time is deliberately advanced at a fixed 30 Hz. Each rendering schedule
  // consumes snapshots at its own cadence; it never writes to the battle model.
  const simulate = (schedule: readonly ('quality' | 'balanced' | 'battery')[]) => {
    const campaign = newCampaign(4);
    const battle = new Battle(campaign, ['MeleeRog1', 'RangedRog1', 'MeleeRog1'], 'quest', campaign.town, 1347);
    let renderedFrames = 0;
    for (let tick = 0; tick < 18000 && !battle.result; tick++) {
      battle.step();
      const preset = RENDER_PRESETS[schedule[Math.floor(tick / 15) % schedule.length]];
      // This emulates drawing at a preset-dependent cadence while the model keeps
      // the same tick count. Reading positions must be harmless.
      if (tick % Math.max(1, Math.round(60 / preset.targetFPS)) === 0) {
        renderedFrames++;
        for (const fighter of battle.fighters) {
          assert.ok(Number.isFinite(fighter.x * renderPixelRatio(preset, 2)));
        }
      }
    }
    assert.ok(battle.result, 'scenario must terminate');
    return { state: JSON.stringify({ fighters: battle.fighters, reserves: battle.reserves, tick: battle.tick, result: battle.result, xp: battle.xp, gold: battle.gold, survivors: battle.survivors(), campaign }), renderedFrames };
  };
  const quality = simulate(['quality']);
  for (const schedule of [['balanced'], ['battery'], ['quality', 'battery', 'balanced']] as const) {
    assert.equal(simulate(schedule).state, quality.state);
  }
  assert.ok(simulate(['battery']).renderedFrames < quality.renderedFrames);
});
