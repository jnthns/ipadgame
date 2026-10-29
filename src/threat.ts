import {Battle,data,expand,type Campaign} from './model';

/** How a siege of one town is likely to go for the current company. */
export type ThreatTier='owned'|'favorable'|'even'|'hard'|'overwhelming';
export type ThreatEstimate={tier:ThreatTier;winRate:number;enemyLosses:number;garrison:number;throne:number;samples:number};

export const THREAT_LABELS:Record<ThreatTier,{label:string;advice:string}>={
 owned:{label:'Your town',advice:'This town flies your banner.'},
 favorable:{label:'Favorable',advice:'Your company should carry this assault.'},
 even:{label:'Even fight',advice:'Winnable, but expect losses. Bring potions.'},
 hard:{label:'Very hard',advice:'You will hurt the garrison but probably lose. Recruit or re-equip first.'},
 overwhelming:{label:'Overwhelming',advice:'This garrison would rout your company. Earn gold from contracts and recruit before attacking.'},
};

const SAMPLES=6,MAX_TICKS=30*150;
const cache=new Map<string,ThreatEstimate>();

/** Inputs that change the outcome; everything else (gold, world position) leaves the estimate valid. */
function signature(c:Campaign,town:string){const h=c.hero;return JSON.stringify([town,[...c.army].sort(),h.LEVEL,h.STR,h.DEX,h.CON,h.INT,h.SKILL,h.WEAPON_PRI?.NAME,h.WEAPON_SEC?.NAME,h.ARMOR?.NAME,h.HELMET?.NAME,h.HORSE?.skin_color]);}

export function tierFor(winRate:number,enemyLosses:number):Exclude<ThreatTier,'owned'>{
 if(winRate>=.75)return 'favorable';
 if(winRate>=.35)return 'even';
 if(enemyLosses>=.4)return 'hard';
 return 'overwhelming';
}

/** Cached result only; never runs a simulation. */
export function cachedThreat(c:Campaign,town:string):ThreatEstimate|null{
 if(c.captured.includes(town))return ownedEstimate(town);
 return cache.get(signature(c,town))??null;
}

function ownedEstimate(town:string):ThreatEstimate{const t=data.towns[town];return {tier:'owned',winRate:1,enemyLosses:1,garrison:expand(t.defenders).length,throne:expand(t.adv_defenders).length,samples:0};}

/**
 * Runs the real battle model on a copy of the campaign with the hero held back (no manual input),
 * so the estimate measures the company against the first-stage garrison. It is presentation only:
 * the copy is discarded and the live campaign, RNG and saves are untouched.
 */
export function estimateSiege(c:Campaign,town:string):ThreatEstimate{
 const cached=cachedThreat(c,town);if(cached)return cached;
 const samples=Array.from({length:SAMPLES},(_,i)=>runSample(c,town,i+1));
 return remember(c,town,samples);
}

function runSample(c:Campaign,town:string,sample:number){
 const enemies=expand(data.towns[town].defenders),b=new Battle(structuredClone(c),enemies,'siege',town,sample*7919,{heroControl:'manual'});
 for(let i=0;i<MAX_TICKS&&!b.result;i++)b.step();
 return {win:b.result==='victory',losses:b.fighters.filter(f=>f.team===1&&f.hp<=0).length/Math.max(1,enemies.length)};
}

function remember(c:Campaign,town:string,samples:{win:boolean;losses:number}[]):ThreatEstimate{
 const t=data.towns[town],winRate=samples.filter(s=>s.win).length/samples.length,enemyLosses=samples.reduce((a,s)=>a+s.losses,0)/samples.length;
 const estimate:ThreatEstimate={tier:tierFor(winRate,enemyLosses),winRate,enemyLosses,garrison:expand(t.defenders).length,throne:expand(t.adv_defenders).length,samples:samples.length};
 cache.set(signature(c,town),estimate);
 return estimate;
}

/** Fills the cache one simulated battle at a time so the map never stalls. Stops once isCurrent() is false. */
export function warmThreats(c:Campaign,onUpdate:(town:string,e:ThreatEstimate)=>void,isCurrent:()=>boolean){
 const snapshot=structuredClone(c),queue=Object.keys(data.towns).filter(id=>!cachedThreat(snapshot,id));let town:string|undefined,samples:{win:boolean;losses:number}[]=[];
 const idle=(fn:()=>void)=>typeof requestIdleCallback==='function'?requestIdleCallback(fn,{timeout:500}):setTimeout(fn,16);
 const work=()=>{if(!isCurrent())return;const started=performance.now();while(performance.now()-started<10){if(!town){town=queue.shift();samples=[];if(!town)return;}samples.push(runSample(snapshot,town,samples.length+1));if(samples.length===SAMPLES){onUpdate(town,remember(snapshot,town,samples));town=undefined;}}idle(work);};
 if(queue.length)idle(work);
}
