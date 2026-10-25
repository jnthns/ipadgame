/**
 * Presentation controls only. The fixed-step simulation must never read these
 * values: changing graphics is safe during a battle and cannot change its rules.
 */
export type RenderPresetId = 'quality' | 'balanced' | 'battery';
export type TerrainVariant = 'illustrated' | 'simplified';

/** Shared across every preset, including Battery Saver. */
export const VISUAL_IDENTITY = Object.freeze({
  direction: 'option-b-stylized-2.5d' as const,
  characterDesign: 'expressive-cartoon-medieval' as const,
  characterProportions: 'shared-exaggerated-silhouette' as const,
  worldLayout: 'original-32-towns' as const,
  interface: 'shared-touch-fantasy' as const,
  factionColors: Object.freeze({
    Viz: '#efb94f',
    Ger: '#2d85d5',
    Rus: '#6ca64f',
    Jap: '#df5354',
    Rog: '#897d70',
  }),
});

export interface RenderPreset {
  readonly id: RenderPresetId;
  readonly label: string;
  readonly description: string;
  readonly identity: typeof VISUAL_IDENTITY;
  /** Same characters/layout; only the environment illustration complexity varies. */
  readonly terrainVariant: TerrainVariant;
  readonly renderingScale: number;
  readonly maxPixelRatio: number;
  readonly targetFPS: number;
  readonly animationFPS: number;
  readonly maxParticles: number;
  readonly foliageDensity: number;
  readonly ambientMotion: boolean;
  readonly animateBanners: boolean;
  readonly contactShadowAlpha: number;
}

export const DEFAULT_RENDER_PRESET: RenderPresetId = 'quality';
export const RENDER_PRESET_STORAGE_KEY = 'feudalism-render-preset-v1';

export const RENDER_PRESETS: Readonly<Record<RenderPresetId, RenderPreset>> = Object.freeze({
  quality: Object.freeze({
    id: 'quality',
    label: 'Quality',
    description: 'Full illustrated terrain, expressive animation and colorful effects.',
    identity: VISUAL_IDENTITY,
    terrainVariant: 'illustrated',
    renderingScale: 1,
    maxPixelRatio: 2,
    targetFPS: 60,
    animationFPS: 18,
    maxParticles: 24,
    foliageDensity: 1,
    ambientMotion: true,
    animateBanners: true,
    contactShadowAlpha: 0.18,
  }),
  balanced: Object.freeze({
    id: 'balanced',
    label: 'Balanced',
    description: 'The same illustrated appearance with lighter effects and animation.',
    identity: VISUAL_IDENTITY,
    terrainVariant: 'illustrated',
    renderingScale: 0.85,
    maxPixelRatio: 1.5,
    targetFPS: 45,
    animationFPS: 12,
    maxParticles: 10,
    foliageDensity: 0.6,
    ambientMotion: false,
    animateBanners: true,
    contactShadowAlpha: 0.12,
  }),
  battery: Object.freeze({
    id: 'battery',
    label: 'Battery Saver',
    description: 'Flatter terrain and minimal effects, with the same heroes, colors and world.',
    identity: VISUAL_IDENTITY,
    terrainVariant: 'simplified',
    renderingScale: 0.7,
    maxPixelRatio: 1,
    targetFPS: 30,
    animationFPS: 8,
    maxParticles: 0,
    foliageDensity: 0.2,
    ambientMotion: false,
    animateBanners: false,
    contactShadowAlpha: 0.08,
  }),
});

export const RENDER_PRESET_IDS = Object.freeze(['quality', 'balanced', 'battery'] as const);

/** Unknown/stale preference values return the advertised default. */
export function getRenderPreset(id: unknown): RenderPreset {
  return typeof id === 'string' && Object.hasOwn(RENDER_PRESETS, id)
    ? RENDER_PRESETS[id as RenderPresetId]
    : RENDER_PRESETS[DEFAULT_RENDER_PRESET];
}

type PreferenceReader = Pick<Storage, 'getItem'>;
type PreferenceWriter = Pick<Storage, 'setItem'>;

/** Handles SSR, restricted storage, Safari privacy restrictions and stale values. */
export function loadRenderPreset(storage?: PreferenceReader | null): RenderPreset {
  try {
    const source = storage === undefined ? globalThis.localStorage : storage;
    return getRenderPreset(source?.getItem(RENDER_PRESET_STORAGE_KEY));
  } catch {
    return RENDER_PRESETS[DEFAULT_RENDER_PRESET];
  }
}

/** Return false if this browser cannot persist preferences; rendering can continue. */
export function saveRenderPreset(id: RenderPresetId, storage?: PreferenceWriter | null): boolean {
  try {
    const destination = storage === undefined ? globalThis.localStorage : storage;
    if (!destination) return false;
    destination.setItem(RENDER_PRESET_STORAGE_KEY, getRenderPreset(id).id);
    return true;
  } catch {
    return false;
  }
}

/** Effective canvas scale, independent from world coordinates and input hit areas. */
export function renderPixelRatio(preset: RenderPreset, devicePixelRatio = 1): number {
  const ratio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.min(ratio, preset.maxPixelRatio) * preset.renderingScale;
}
