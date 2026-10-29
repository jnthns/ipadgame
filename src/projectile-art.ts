import type {CombatProjectile,Fighter} from './model';
import {weaponAppearance} from './character-appearance';
import type {EquipmentArtId} from './equipment-art';
import {BATTLE_VIEW_SCALE_X} from './battle-presentation-state';

export type ProjectileSource=Readonly<Pick<Fighter,'id'|'weaponItem'>>;
export type ProjectileArtKind='arrow'|'throwingAxe'|'shuriken'|'throwingKnife'|'fire';
export type ProjectileArt=Readonly<{
  kind:ProjectileArtKind;
  /** The released image is captured by value, never a live equipment reference. */
  artId:EquipmentArtId|null;
  size:number;
}>;

const ARROW:ProjectileArt=Object.freeze({kind:'arrow',artId:null,size:0});
const FIRE:ProjectileArt=Object.freeze({kind:'fire',artId:'fire',size:18});

/** Presentation metadata sampled when a projectile first becomes visible. */
export function resolveProjectileArt(projectile:Readonly<Pick<CombatProjectile,'grenade'|'team'|'shooterId'>>,fighters:readonly ProjectileSource[]=[]):ProjectileArt{
  if(projectile.grenade)return FIRE;
  // Reserve arrow abilities use a neutral shooter and do not own held gear.
  if(projectile.team===-1||projectile.shooterId<0)return ARROW;
  const source=fighters.find(fighter=>fighter.id===projectile.shooterId);
  if(!source)return ARROW;
  const weapon=weaponAppearance(source.weaponItem);
  if(weapon.kind==='fire')return FIRE;
  if(weapon.kind!=='throwingAxe'&&weapon.kind!=='shuriken'&&weapon.kind!=='throwingKnife')return ARROW;
  return Object.freeze({kind:weapon.kind,artId:weapon.artId,size:20});
}

/** Active-only storage: hand exchanges cannot turn an airborne star into an arrow. */
export class ProjectileArtCache{
  private readonly art=new Map<number,ProjectileArt>();
  get size(){return this.art.size;}
  get(id:number){return this.art.get(id);}
  sync(projectiles:readonly Readonly<CombatProjectile>[],fighters:readonly ProjectileSource[]=[]):ReadonlyMap<number,ProjectileArt>{
    const active=new Set<number>();
    for(const projectile of projectiles){
      if(!projectile.active)continue;
      active.add(projectile.id);
      if(!this.art.has(projectile.id))this.art.set(projectile.id,resolveProjectileArt(projectile,fighters));
    }
    for(const id of this.art.keys())if(!active.has(id))this.art.delete(id);
    return this.art;
  }
  clear(){this.art.clear();}
}

/** Rotations use the frozen presentation clock, with no simulation timers or callbacks. */
export function projectileArtRotation(art:ProjectileArt,projectile:Readonly<Pick<CombatProjectile,'id'|'plusX'|'plusY'>>,clock:number){
  const angle=Math.atan2(projectile.plusY*36/25,projectile.plusX*BATTLE_VIEW_SCALE_X);
  if(art.kind==='throwingKnife')return angle+Math.PI/2; // Authored blades point up.
  const direction=projectile.plusX<0?-1:1,phase=projectile.id*1.618;
  if(art.kind==='shuriken')return phase+clock*.022*direction;
  if(art.kind==='throwingAxe')return phase+clock*.014*direction;
  if(art.kind==='fire')return Math.sin(clock/110+phase)*.18;
  return angle;
}
