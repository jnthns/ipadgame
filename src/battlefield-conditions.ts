import type {AttackAnimation,Fighter,Nation,WeaponStats} from './model';

/**
 * Battlefield conditions are a deliberate departure from the original game: each battle rolls
 * one weather, terrain or morale condition that changes the fight. Stat effects are applied
 * once as fighters take the field; pulses run on their own RNG so the battle's combat RNG
 * sequence is unchanged by which condition was drawn.
 */
export type BattleKind='siege'|'quest'|'throne'|'encounter';
export type ConditionId='downpour'|'fog'|'tailwind'|'headwind'|'heat'|'frost'|'mud'|'thunderstorm'|'night'|'goodOmen'|'bloodMoon'|'fortified'|'springs'|'smoke'|'warDrums'|'narrowHalls'|'highGround';
export type ConditionVisual='rain'|'fog'|'wind'|'heat'|'snow'|'mud'|'storm'|'night'|'omen'|'blood'|'walls'|'springs'|'smoke'|'drums'|'halls'|'hill';
export type ConditionPulse={kind:'lightning'|'regen'|'smoke';every:number};
/** Multipliers default to 1, additions to 0. Ranged and melee apply to each weapon by its range. */
export type ConditionMods={
 ranged?:{hit?:number;damage?:number;range?:number;crit?:number};
 melee?:{hit?:number;damage?:number;crit?:number};
 /** Scales windup and recovery; recovery never drops below the animation's minimum attack time. */
 tempo?:number;speed?:number;mountedSpeed?:number;heavySpeed?:number;flee?:number;def?:number;hp?:number;
};
export type BattlefieldCondition={
 id:ConditionId;name:string;visual:ConditionVisual;
 /** One-line flavor shown with the condition. */
 flavor:string;
 /** Plain statements of each mechanical effect, in the order a player should care about them. */
 effects:string[];
 /** Whose side the condition tilts toward, for the HUD accent. */
 favors:'you'|'enemy'|'neutral';
 kinds:readonly BattleKind[];
 /** Lands where this condition is twice as likely. */
 lands?:readonly Nation[];
 all?:ConditionMods;you?:ConditionMods;enemy?:ConditionMods;
 /** Caps every ranged weapon's reach, including the hero's fixed forward shot. */
 rangeCap?:number;
 pulse?:ConditionPulse;
};

const OUTDOOR=['siege','quest','encounter'] as const,FIELD=['quest','encounter'] as const,ANY=['siege','quest','throne','encounter'] as const;
/** Units at or above this armor + helmet + barding defense count as heavily armored. */
export const HEAVY_ARMOR=25;
/** Pulses can wound the hero but never decide the battle by themselves. */
export const HERO_HAZARD_FLOOR=1;

export const CONDITIONS:Readonly<Record<ConditionId,BattlefieldCondition>>=Object.freeze({
 downpour:{id:'downpour',name:'Downpour',visual:'rain',flavor:'Sheets of rain soak bowstrings and fletching.',effects:['Ranged accuracy −35%','Ranged damage −20%'],favors:'neutral',kinds:OUTDOOR,lands:['Jap','Ger'],all:{ranged:{hit:.65,damage:.8}}},
 fog:{id:'fog',name:'Thick fog',visual:'fog',flavor:'You can barely see the next rank, let alone the enemy line.',effects:['Ranged reach capped at 5 cells','Melee critical chance +6'],favors:'neutral',kinds:OUTDOOR,lands:['Ger','Rus'],rangeCap:5,all:{melee:{crit:6}}},
 tailwind:{id:'tailwind',name:'Wind at your backs',visual:'wind',flavor:'A strong gale carries your arrows deep into their ranks.',effects:['Your ranged damage +20% and reach +2','Enemy ranged damage −20% and reach −2'],favors:'you',kinds:OUTDOOR,you:{ranged:{damage:1.2,range:2}},enemy:{ranged:{damage:.8,range:-2}}},
 headwind:{id:'headwind',name:'Wind in your faces',visual:'wind',flavor:'The gale favors the enemy archers today.',effects:['Enemy ranged damage +20% and reach +2','Your ranged damage −20% and reach −2'],favors:'enemy',kinds:OUTDOOR,you:{ranged:{damage:.8,range:-2}},enemy:{ranged:{damage:1.2,range:2}}},
 heat:{id:'heat',name:'Scorching sun',visual:'heat',flavor:'Armor bakes in the midday glare.',effects:['Everyone attacks 25% slower','Heavily armored fighters move slower'],favors:'neutral',kinds:OUTDOOR,lands:['Viz'],all:{tempo:1.25,heavySpeed:-1}},
 frost:{id:'frost',name:'Frozen ground',visual:'snow',flavor:'Ice underfoot turns every dodge into a stumble.',effects:['Dodge and shield avoidance halved','Everyone moves slower'],favors:'neutral',kinds:OUTDOOR,lands:['Rus'],all:{flee:.5,speed:-1}},
 mud:{id:'mud',name:'Mud and mire',visual:'mud',flavor:'Churned earth swallows boots and hooves alike.',effects:['Everyone moves slower','Mounted fighters bog down badly','Mounted fighters lose half their dodge'],favors:'neutral',kinds:FIELD,lands:['Rus','Ger'],all:{speed:-1,mountedSpeed:-1}},
 thunderstorm:{id:'thunderstorm',name:'Thunderstorm',visual:'storm',flavor:'Lightning seeks out steel on the open field.',effects:['Lightning strikes a random fighter every 4 seconds for 30% of their health','Ranged accuracy −15%'],favors:'neutral',kinds:OUTDOOR,lands:['Jap','Viz'],all:{ranged:{hit:.85}},pulse:{kind:'lightning',every:120}},
 night:{id:'night',name:'Night battle',visual:'night',flavor:'Torches flicker; blades come out of the dark.',effects:['Ranged accuracy −25%, reach capped at 8 cells','Melee critical chance +8'],favors:'neutral',kinds:ANY,rangeCap:8,all:{ranged:{hit:.75},melee:{crit:8}}},
 goodOmen:{id:'goodOmen',name:'Good omen',visual:'omen',flavor:'A white hawk circles your banner. Your company takes heart.',effects:['Your accuracy +12%','Your critical chance +6'],favors:'you',kinds:ANY,you:{ranged:{hit:1.12,crit:6},melee:{hit:1.12,crit:6}}},
 bloodMoon:{id:'bloodMoon',name:'Blood moon',visual:'blood',flavor:'Under a red moon, every blow lands harder.',effects:['Everyone deals 25% more damage','Critical chance +10 for all'],favors:'neutral',kinds:ANY,all:{ranged:{damage:1.25,crit:10},melee:{damage:1.25,crit:10}}},
 fortified:{id:'fortified',name:'Fortified garrison',visual:'walls',flavor:'The defenders fight from palisades and barricades.',effects:['Enemy defense +35%','Enemy health +15%'],favors:'enemy',kinds:['siege'],enemy:{def:1.35,hp:1.15}},
 springs:{id:'springs',name:'Healing springs',visual:'springs',flavor:'Clear springs and herbs mend wounds between clashes.',effects:['Every fighter regains 2% health every 1.5 seconds','Long battles favor the tougher side'],favors:'neutral',kinds:FIELD,lands:['Jap','Viz'],pulse:{kind:'regen',every:45}},
 smoke:{id:'smoke',name:'Smoke and embers',visual:'smoke',flavor:'Burning thatch fills the air with choking smoke.',effects:['Everyone above 35% health loses 2% every 2 seconds','Ranged accuracy −15%'],favors:'neutral',kinds:['siege','throne'],all:{ranged:{hit:.85}},pulse:{kind:'smoke',every:60}},
 warDrums:{id:'warDrums',name:'War drums',visual:'drums',flavor:'Pounding drums drive both sides into a frenzy.',effects:['Everyone attacks 25% faster','Everyone moves faster'],favors:'neutral',kinds:ANY,all:{tempo:.75,speed:1}},
 narrowHalls:{id:'narrowHalls',name:'Narrow halls',visual:'halls',flavor:'Pillars and corridors leave no room to shoot.',effects:['Ranged reach capped at 6 cells','Melee accuracy +10% for all'],favors:'neutral',kinds:['throne'],rangeCap:6,all:{melee:{hit:1.1}}},
 highGround:{id:'highGround',name:'Defenders hold the high ground',visual:'hill',flavor:'The enemy line looks down on you from a ridge.',effects:['Enemy ranged reach +2 and accuracy +15%','Your melee accuracy −10%'],favors:'enemy',kinds:['siege','encounter'],enemy:{ranged:{range:2,hit:1.15}},you:{melee:{hit:.9}}},
});
export const CONDITION_IDS=Object.keys(CONDITIONS) as ConditionId[];

/** Seed salt keeps condition draws independent of the battle's combat RNG. */
const CONDITION_SALT=0x3c6ef372;
function conditionRandom(seed:number){let s=(seed^CONDITION_SALT)|0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/** Deterministic: the same battle seed, kind and land always yield the same condition, so it can be forecast. */
export function rollCondition(kind:BattleKind,nation:Nation,seed:number):BattlefieldCondition{
 const pool=CONDITION_IDS.map(id=>CONDITIONS[id]).filter(c=>c.kinds.includes(kind));
 const weights=pool.map(c=>c.lands?.includes(nation)?2:1),total=weights.reduce((a,b)=>a+b,0);
 let roll=conditionRandom(seed)()*total;
 for(let i=0;i<pool.length;i++){roll-=weights[i];if(roll<0)return pool[i];}
 return pool[pool.length-1];
}
/** Separate stream for pulses (lightning targets and so on). */
export function pulseRandom(seed:number){return conditionRandom(seed^0x1f83d9ab);}

function modifyWeapon(w:WeaponStats,animation:AttackAnimation|null,m:ConditionMods,minAttack:Readonly<Record<AttackAnimation,number>>){
 const ranged=w.range>0,s=ranged?m.ranged:m.melee;
 if(s){if(s.hit!==undefined)w.hit=Math.round(w.hit*s.hit);if(s.damage!==undefined){w.damage=Math.round(w.damage*s.damage);w.random=Math.round(w.random*s.damage);}if(s.crit)w.crit+=s.crit;const reach=ranged?m.ranged?.range??0:0;if(reach)w.range=Math.max(2,w.range+reach);}
 if(m.tempo!==undefined&&animation){const floor=Math.min(w.after,minAttack[animation]);w.before=Math.max(1,Math.round(w.before*m.tempo));w.after=Math.max(floor,Math.round(w.after*m.tempo));}
}
function modifyFighter(f:Fighter,m:ConditionMods,minAttack:Readonly<Record<AttackAnimation,number>>){
 modifyWeapon(f.weapon,f.animation,m,minAttack);if(f.secondaryWeapon)modifyWeapon(f.secondaryWeapon,f.secondaryAnimation,m,minAttack);
 if(m.hp!==undefined){f.max=Math.round(f.max*m.hp);f.hp=f.max;}
 if(m.def!==undefined)f.def=Math.round(f.def*m.def);
 if(m.flee!==undefined){f.flee=Math.round(f.flee*m.flee);f.shieldFlee=Math.round(f.shieldFlee*m.flee);}
 const speed=f.speed+(m.speed??0)+(f.hero.HORSE?(m.mountedSpeed??0):0)+(f.def>=HEAVY_ARMOR?(m.heavySpeed??0):0);
 // Speed 2 still crosses a 40-pixel cell in 20 ticks; slower would make units feel stuck.
 f.speed=Math.max(2,speed);
}
/** Applies a condition to a freshly spawned fighter. Called once per fighter, including reinforcements. */
export function applyCondition(condition:BattlefieldCondition,f:Fighter,minAttack:Readonly<Record<AttackAnimation,number>>){
 for(const m of [condition.all,f.team===0?condition.you:condition.enemy])if(m)modifyFighter(f,m,minAttack);
 if(condition.id==='mud'&&f.hero.HORSE)f.flee=Math.round(f.flee/2);
 if(condition.rangeCap)for(const w of [f.weapon,f.secondaryWeapon])if(w&&w.range>0)w.range=Math.min(w.range,condition.rangeCap);
}
