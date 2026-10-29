import {HUMAN_ATTACK_TIMELINES,MOUNTED_ATTACK_TIMELINES,type AttackAnimation,type Fighter,type Item} from './model';
import type {EquipmentHand,EquipmentKind} from './character-equipment';

export type MotionWeaponKind=EquipmentKind|'fists';
export type WeaponMotionSource=Readonly<Pick<Fighter,'hp'|'animation'|'animationAge'|'windup'|'attackFlash'|'switchRemaining'|'hero'|'weapon'>>;
export type WeaponHandMotion={rotation:number;alpha:number;draw:number;trail:number;style:'arc'|'thrust'|'release'|'punch';active:boolean};
export type WeaponMotion={
  phase:'idle'|'anticipation'|'strike'|'recovery'|'switch'|'defeated';
  sourceFrame:number|null;hitFrame:number|null;hitIndex:number|null;impact:boolean;activeHand:EquipmentHand|null;
  body:{x:number;y:number;rotation:number};primary:WeaponHandMotion;secondary:WeaponHandMotion;
};

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const ranged=new Set<MotionWeaponKind>(['bow','crossbow','throwingKnife','throwingAxe','shuriken','fire']);
const throwing=new Set<MotionWeaponKind>(['throwingKnife','throwingAxe','shuriken','fire']);
const poles=new Set<MotionWeaponKind>(['spear','naginata']);
const heavy=new Set<MotionWeaponKind>(['greatsword','greataxe','hammer','mace','morningstar']);
const twoHandedTypes=new Set(['TwohandedSword','TwohandedAxe','TwohandedMace','Staff','Katana','Spear','Throwing','Bow','Dagger','Fists','Crossbow']);
const twoHanded=(item:Item|null)=>item?.twohanded??twoHandedTypes.has(item?.TYPE??'');

export function battleOffhandItem(source:Readonly<Pick<Fighter,'hero'|'weaponItem'|'secondaryItem'>>):Item|null{
  if(source.hero.WEAPON_SEC?.TYPE==='Shield')return source.hero.WEAPON_SEC;
  return !twoHanded(source.weaponItem)&&!twoHanded(source.secondaryItem)&&source.secondaryItem?.TYPE!=='Shield'?source.secondaryItem:null;
}

/** Same mounted fallback and recovered frame table used by Battle.advanceAnimation. */
export function weaponVisualTimeline(animation:AttackAnimation,mounted:boolean){
  return (mounted?MOUNTED_ATTACK_TIMELINES[animation]:undefined)??HUMAN_ATTACK_TIMELINES[animation];
}

function restHand(kind:MotionWeaponKind,hand:EquipmentHand):WeaponHandMotion{
  return {rotation:kind==='crossbow'?Math.PI/2:hand==='secondary'&&kind!=='shield'?-.12:.10,alpha:1,draw:0,trail:0,style:kind==='fists'?'punch':poles.has(kind)?'thrust':ranged.has(kind)?'release':'arc',active:false};
}

/**
 * Pure view sampling: source animationAge alone controls attacks and releases.
 * There is no animation clock, RNG, hit callback, damage event, or model write.
 * A paused source frame therefore produces the exact same held-item pose.
 */
export function sampleWeaponMotion(source:WeaponMotionSource,primaryKind:MotionWeaponKind,secondaryKind:MotionWeaponKind='fists'):WeaponMotion{
  const primary=restHand(primaryKind,'primary'),secondary=restHand(secondaryKind,'secondary');
  const out:WeaponMotion={phase:'idle',sourceFrame:source.animationAge,hitFrame:null,hitIndex:null,impact:false,activeHand:null,body:{x:0,y:0,rotation:0},primary,secondary};
  if(source.hp<=0){out.phase='defeated';return out;}
  if(source.switchRemaining>0){
    const tuck=Math.sin(clamp((19-source.switchRemaining)/19)*Math.PI);
    out.phase='switch';primary.rotation+=tuck*.65;secondary.rotation-=tuck*.4;primary.alpha=secondary.alpha=1-tuck*.5;out.body.rotation=-.025*tuck;return out;
  }
  const timeline=weaponVisualTimeline(source.animation,!!source.hero.HORSE),frame=source.animationAge;
  if(frame===null){
    if(source.windup>0){
      const ready=.45+.55*(1-clamp(source.windup/Math.max(1,source.weapon.before)));
      out.phase='anticipation';
      if(!ranged.has(primaryKind))primary.rotation-=ready*.15;
      out.body.x=-ready*.5;out.body.rotation=-ready*.01;
    }
    return out;
  }
  const hits=timeline.hits;
  let index=0;
  while(index<hits.length-1&&frame>(hits[index]+hits[index+1])/2)index++;
  const hit=hits[index],start=index===0?0:(hits[index-1]+hit)/2,end=index===hits.length-1?timeline.end:(hit+hits[index+1])/2;
  const strikeStart=Math.max(start,hit-3),preparation=smooth((frame-start)/Math.max(1,strikeStart-start));
  const strike=smooth((frame-strikeStart)/Math.max(1,hit-strikeStart)),recovery=smooth((frame-hit)/Math.max(1,end-hit));
  const before=frame<strikeStart,contact=frame>=strikeStart&&frame<=hit;
  const activeHand:EquipmentHand=(source.animation==='double'||source.animation==='fists')&&index%2?'secondary':'primary';
  const kind=activeHand==='primary'?primaryKind:secondaryKind,hand=activeHand==='primary'?primary:secondary;
  out.phase=before?'anticipation':contact?'strike':'recovery';out.hitFrame=hit;out.hitIndex=index;out.impact=hits.includes(frame);out.activeHand=activeHand;hand.active=true;
  let ready=heavy.has(kind)?-1.13:-.88,impact=heavy.has(kind)?1.25:1.15,lunge=heavy.has(kind)?5:4;
  if(poles.has(kind)){ready=.30;impact=1.43;lunge=7;}
  else if(kind==='staff'){ready=index%2?-.92:-.40;impact=index%2?1.18:1.43;lunge=5;hand.style='thrust';}
  else if(kind==='dagger'||kind==='ninjato'){ready=.02;impact=1.32;lunge=6;hand.style='thrust';}
  else if(kind==='katana'){ready=-.95;impact=1.24;lunge=5;}
  else if(kind==='fists'){ready=hand.rotation;impact=hand.rotation;lunge=7;}
  if(kind==='bow'){
    hand.rotation=.08;hand.draw=frame<hit?smooth((frame-start)/Math.max(1,hit-start)):0;
    out.body.x=frame<hit?-hand.draw*1.5:-2*Math.max(0,1-(frame-hit)/4);out.body.rotation=frame<hit?-.025*hand.draw:-.025*Math.max(0,1-(frame-hit)/4);
  }else if(kind==='crossbow'){
    hand.rotation=Math.PI/2;const recoil=frame>=hit?Math.max(0,1-(frame-hit)/4):0;
    out.body.x=recoil>0?-3*recoil:0;out.body.rotation=recoil>0?-.03*recoil:0;
  }else{
    if(throwing.has(kind)){ready=-1.10;impact=1.30;lunge=5;}
    hand.rotation=before?mix(restHand(kind,activeHand).rotation,ready,preparation):contact?mix(ready,impact,strike):mix(impact,restHand(kind,activeHand).rotation,recovery);
    out.body.x=before?-2*preparation:contact?mix(-2,lunge,strike):lunge*(1-recovery);
    out.body.rotation=before?-.045*preparation:contact?mix(-.045,.085,strike):.085*(1-recovery);
    out.body.y=before?-.3*preparation:contact?.7*strike:.7*(1-recovery);
  }
  if(throwing.has(kind)&&frame>=hit){hand.alpha=clamp((frame-hit-4)/4);}
  hand.trail=frame>=hit?Math.max(0,1-(frame-hit)/4):0;
  // Shields stay in the off hand; the body and all grips move together.
  if(secondaryKind==='shield')secondary.rotation=.10-hand.trail*.12;
  return out;
}
