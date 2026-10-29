import type {CombatPoint,Fighter} from './model';
import type {RenderPreset} from './render-presets';

export type CombatRole='hero'|'sword'|'archer'|'spear';
export type CombatPose='idle'|'walkA'|'walkB'|'attack'|'hurt'|'defeated';
export type CombatWeapon='blade'|'spear'|'bow'|'crossbow'|'axe'|'mace'|'staff'|'unarmed'|'throwing';

/** Source battle pixels are 40×25 per cell. The view insets X for silhouette clearance and stretches Y. */
export const BATTLE_VIEW_X=80,BATTLE_VIEW_SCALE_X=646/800;
export function projectBattlePixel(x:number,y:number){return {x:BATTLE_VIEW_X+x*BATTLE_VIEW_SCALE_X,y:(y/25-.5)*36+250};}
export function unprojectBattlePoint(x:number,y:number){return {x:(x-BATTLE_VIEW_X)/BATTLE_VIEW_SCALE_X,y:(y-250)/36*25+12.5};}
export function battleCellCenter(point:CombatPoint){return projectBattlePixel(point.x*40+20,point.y*25+12.5);}
/** The caller first converts a pointer through the Phaser camera; no CSS/DPR enters model coordinates. */
export function battleCellAt(x:number,y:number):CombatPoint{
  return {x:Math.max(0,Math.min(19,Math.floor((x-BATTLE_VIEW_X)/BATTLE_VIEW_SCALE_X/40))),y:Math.max(0,Math.min(7,Math.round((y-250)/36)))};
}

export function combatWeapon(f:Readonly<Fighter>):CombatWeapon{
  const type=f.weaponItem.TYPE.toLowerCase();
  if(type.includes('spear'))return 'spear';
  if(type.includes('crossbow'))return 'crossbow';
  if(type.includes('bow'))return 'bow';
  if(type.includes('axe'))return 'axe';
  if(type.includes('mace'))return 'mace';
  if(type.includes('staff'))return 'staff';
  if(type.includes('fist'))return 'unarmed';
  if(type.includes('throw'))return 'throwing';
  return 'blade';
}

/** Legacy pose classification; actual appearance and equipment resolve per identity. */
export function combatRole(f:Readonly<Fighter>):CombatRole{
  if(f.key==='hero')return 'hero';
  if(f.weapon.range>0)return 'archer';
  return combatWeapon(f)==='spear'?'spear':'sword';
}

export function sampleFighterPose(f:Readonly<Fighter>,clockMs:number,preset:Pick<RenderPreset,'animationFPS'|'ambientMotion'>,hurtUntil=0){
  const cadence=Math.max(1,preset.animationFPS);
  const clock=Math.max(0,Math.floor(clockMs*cadence/1000)/cadence);
  const attacking=f.hp>0&&(f.animationAge!==null||f.windup>0||f.attackFlash>0);
  let pose:CombatPose='idle';
  if(f.hp<=0)pose='defeated';
  else if(clockMs<hurtUntil)pose='hurt';
  else if(attacking)pose='attack';
  else if(f.moving)pose=Math.floor(clock*8)%2?'walkB':'walkA';
  const bob=f.hp<=0?0:f.moving?Math.sin(clock*16)*1.5:preset.ambientMotion?Math.sin(clock*3.5+f.id)*.35:0;
  return {
    role:combatRole(f),pose,weapon:combatWeapon(f),attacking,
    facing:f.facing<0?-1:1,health:Math.max(0,Math.min(1,f.hp/Math.max(1,f.max))),
    mounted:!!f.hero.HORSE,bob,
    // Lean only presents the source attack state; it never schedules a hit.
    lean:attacking?(f.windup>0?-.035:f.attackFlash>0?.075:.025):0,
    recovering:f.recovery>0,holding:f.hold,
  };
}
