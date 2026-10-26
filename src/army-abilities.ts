/** Reserve-archer abilities recovered from Screen.as + SWF bytecode/timelines.
 * No rendering dependency. Drive step() once per original 30 Hz simulation tick.
 */
import type {Hero} from './model';
export type ArmyAbilityKind='shower'|'wall';
export type ArmyAbilityPoint={x:number;y:number};
export type ArmyAbilityPacket=ArmyAbilityPoint&{kind:ArmyAbilityKind;damage:number;critical:boolean};
export type ArrowShowerImpact=ArmyAbilityPoint&{kind:'shower-impact';damage:number;critical:boolean};
export type ArrowWallProjectile=ArmyAbilityPoint&{kind:'wall-projectile';damage:number;critical:boolean;random:0;destination:ArmyAbilityPoint;weaponFrame:141;team:-1;facing:1};
export type ArmyAbilityEvent=ArrowShowerImpact|ArrowWallProjectile;
type RNG=()=>number;
const roll=(rng:RNG)=>{const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError('Ability RNG must return a finite value in [0, 1).');return n;};
const dice=(n:number,rng:RNG)=>Math.floor(roll(rng)*n);
const dd=(rng:RNG)=>Math.floor(roll(rng)*5)-2;
const percent=(n:number,rng:RNG)=>Math.floor(roll(rng)*100)+1<=n;
/** Confirmed in Screen DoInitAction bytecode: shower register8 is initialized
 * once and never incremented, so its >=8 break condition cannot become true.
 * Wall register6 increments and limits the volley to five crossbow reserves.
 */
export function planArrowShower(reserves:readonly Hero[],point:ArmyAbilityPoint,rng:RNG):ArmyAbilityPacket[]{
 const packets:ArmyAbilityPacket[]=[];
 for(const unit of reserves){const weapon=unit?.WEAPON_PRI;if(weapon?.TYPE!=='Bow')continue;const damage=(weapon.dmg??0)+dice(weapon.rnd??0,rng),critical=percent(weapon.crit??0,rng);
  for(let i=0;i<2;i++){// AVM1 pushes function arguments in reverse: Y is rolled before X.
   const y=point.y+dd(rng),x=point.x+dd(rng);packets.push({kind:'shower',x,y,damage,critical});}
 }
 return packets;
}
export function planArrowWall(reserves:readonly Hero[],point:ArmyAbilityPoint,rng:RNG):ArmyAbilityPacket[]{
 const packets:ArmyAbilityPacket[]=[];
 for(const unit of reserves){const weapon=unit?.WEAPON_PRI;if(weapon?.TYPE!=='Crossbow')continue;const damage=(weapon.dmg??0)+dice(weapon.rnd??0,rng),critical=percent(weapon.crit??0,rng);packets.push({kind:'wall',x:point.x,y:point.y+dd(rng),damage,critical});if(packets.length>=5)break;}
 return packets;
}
/** Screen.reinitArrowStorm scans reserves starting at10-activeFriendly. Negative
 * array indices are undefined in AS2 and contribute neither weapon type.
 */
export function reserveAbilityCounts(reserves:readonly Hero[],activeFriendly:number,maxActive=10){
 let bows=0,crossbows=0;for(let i=Math.max(0,maxActive-activeFriendly);i<reserves.length;i++){const type=reserves[i]?.WEAPON_PRI?.TYPE;if(type==='Bow')bows++;if(type==='Crossbow')crossbows++;}return {bows,crossbows};
}
export const ARMY_ABILITY_TIMELINES=Object.freeze({shower:Object.freeze({readyFrame:45,disabledFrame:46,impactFrame:10}),wall:Object.freeze({readyFrame:65,disabledFrame:66,impactFrame:15})});
type Control={frame:number;playing:boolean;ready:boolean};
type Effect={kind:ArmyAbilityKind;x:number;y:number;frame:number;playCount:number;packets:{damage:number;critical:boolean}[]};
/** The root uses the same as_<depth> namespace for both abilities. Do not split
 * effects by kind or clamp scatter coordinates: either would change source behavior.
 */
export const armyAbilityDepth=(x:number,y:number)=>3000+x*3+y*20*3;
export class ArmyAbilities{
 private controls:Record<ArmyAbilityKind,Control>={shower:{frame:1,playing:true,ready:false},wall:{frame:1,playing:true,ready:false}};
 private effects=new Map<number,Effect>();
 constructor(reserves:readonly Hero[]=[],activeFriendly=0){this.reinit(reserves,activeFriendly);}
 reinit(reserves:readonly Hero[],activeFriendly:number){const {bows,crossbows}=reserveAbilityCounts(reserves,activeFriendly);for(const kind of ['shower','wall'] as const){if((kind==='shower'?bows:crossbows)===0)this.controls[kind]={frame:ARMY_ABILITY_TIMELINES[kind].disabledFrame,playing:false,ready:false};}}
 ready(kind:ArmyAbilityKind){return this.controls[kind].ready;}
 remainingFrames(kind:ArmyAbilityKind){const c=this.controls[kind];return c.ready?0:c.playing?ARMY_ABILITY_TIMELINES[kind].readyFrame-c.frame:null;}
 /** Add packets after a source cast; exposed separately for deterministic queue fixtures. */
 enqueue(packets:readonly ArmyAbilityPacket[]){for(const packet of packets){const depth=armyAbilityDepth(packet.x,packet.y),effect=this.effects.get(depth);if(effect){effect.playCount++;effect.packets.push({damage:packet.damage,critical:packet.critical});}else this.effects.set(depth,{kind:packet.kind,x:packet.x,y:packet.y,frame:1,playCount:0,packets:[{damage:packet.damage,critical:packet.critical}]});}}
 cast(kind:ArmyAbilityKind,point:ArmyAbilityPoint,reserves:readonly Hero[],rng:RNG):{ok:boolean;packetCount:number}{if(!this.ready(kind))return {ok:false,packetCount:0};if(!Number.isInteger(point.x)||!Number.isInteger(point.y)||point.x<0||point.x>=20||point.y<0||point.y>=8)return {ok:false,packetCount:0};const packets=kind==='shower'?planArrowShower(reserves,point,rng):planArrowWall(reserves,point,rng);this.enqueue(packets);this.controls[kind]={frame:1,playing:true,ready:false};return {ok:true,packetCount:packets.length};}
 step():ArmyAbilityEvent[]{
  for(const kind of ['shower','wall'] as const){const c=this.controls[kind];if(!c.playing)continue;c.frame++;if(c.frame>=ARMY_ABILITY_TIMELINES[kind].readyFrame){c.frame=ARMY_ABILITY_TIMELINES[kind].readyFrame;c.ready=true;c.playing=false;}}
  const events:ArmyAbilityEvent[]=[];
  for(const [depth,effect] of this.effects){effect.frame++;if(effect.frame<ARMY_ABILITY_TIMELINES[effect.kind].impactFrame)continue;const packet=effect.packets[effect.playCount];
   if(effect.kind==='shower')events.push({kind:'shower-impact',x:effect.x,y:effect.y,...packet});else events.push({kind:'wall-projectile',x:effect.x,y:effect.y,...packet,random:0,destination:{x:19,y:effect.y},weaponFrame:141,team:-1,facing:1});
   if(effect.playCount>0){effect.playCount--;effect.frame=1;}else this.effects.delete(depth);
  }
  return events;
 }
 snapshot(){return {controls:structuredClone(this.controls),effects:[...this.effects.entries()].map(([depth,e])=>({depth,...structuredClone(e)}))};}
}
/** Shower impacts ignore team and facing, but skip blocked terrain and empty/dead
 * cells. The root can apply rawDamage through its normal damage/death/loot path.
 */
export function resolveArrowShower(impact:ArrowShowerImpact,target:{hp:number;def:number;flee:number;shieldFlee:number}|null,terrainFree:boolean,rng:RNG){
 if(!target||target.hp<=0||!terrainFree)return null;
 const chance=100-(target.flee+target.shieldFlee)*.8;if(!percent(chance,rng))return null;
 return {rawDamage:impact.damage,critical:impact.critical,damage:impact.critical?impact.damage:Math.max(0,impact.damage-target.def)};
}

export const ARMY_ABILITY_PROVENANCE=Object.freeze({
 swfSha256:'31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca',
 screenClassSprite:2072,screenMovieClip:243,
 showerControl:{sprite:233,readyFrame:45,disabledFrame:46},wallControl:{sprite:235,readyFrame:65,disabledFrame:66},
 showerEffect:{sprite:866,eventFrame:10},wallEffect:{sprite:867,eventFrame:15},
 bytecodeConfirmed:['Shower register8 remains0, so no eight-bow cap.','Wall increments register6 and caps at five crossbows.','Shower coordinates rollY beforeX because AVM1 arguments are pushed in reverse order.','Shower/Wall share as_<depth> effects, which resolve packet indices descending.','Button172 decrements SCROLL_AllHealBig rather than POTION_HealBig.','Hero healing uses Less2 thenNot for its mana comparison, not JavaScript >= semantics.'],
 limits:['Frame-script ordering against other MovieClip onEnterFrame handlers still needs original-runtime replay.','Initial cooldown constructor order remains tied to source Screen initialization and reserve shifting.','Wall event facing+1 is a SWF xscale multiplier; model movement-facing should convert it to-1.','This module does not render effects or implement consumable repairs.'],
});
