import {data,unitKey,type Campaign} from './model';
import {world,servicesAvailable} from './world-campaign';
import {geometry,worldHit,type Point} from './world-geometry';
import type {ThreatEstimate} from './threat';

/**
 * "Where should I go next?" One suggestion, picked from campaign state and cached siege
 * estimates. Read-only: it never moves the company, spends gold or runs a simulation.
 */
export type RecommendationKind='collect'|'delivery'|'rogues'|'siege'|'recruit'|'contract';
export type Recommendation={
 kind:RecommendationKind;
 /** Destination town, or null for the rogue camp (which is a map point, not a town). */
 town:string|null;
 point:Point;
 /** The company is already there: the action happens in place rather than by travelling. */
 here:boolean;
 title:string;reason:string;cta:string;
};
type ThreatLookup=(town:string)=>ThreatEstimate|null;

const townPoint=(id:string)=>(geometry.towns as Record<string,Point>)[id];
const questPoint=(avatarId:number|undefined)=>(geometry.questAvatars as Record<string,Point>)[`quest_avatar_${avatarId}`];
const name=(id:string)=>data.towns[id].NAME;

/** Travel moves in a straight line and stops at the coast, so only suggest places the company can walk to. */
const reachCache=new Map<string,boolean>();
export function reachable(from:Point,to:Point,sailing=false){
 if(sailing)return true;
 // Coastlines never move, so a route's answer is fixed; the map re-asks often while estimates arrive.
 const key=`${from.x.toFixed(1)},${from.y.toFixed(1)}>${to.x.toFixed(1)},${to.y.toFixed(1)}`;
 let known=reachCache.get(key);if(known===undefined){known=walk(from,to);if(reachCache.size>4000)reachCache.clear();reachCache.set(key,known);}
 return known;
}
function walk(from:Point,to:Point){
 let p={...from};
 for(let i=0;i<2000;i++){
  if(Math.abs(p.x-to.x)<2&&Math.abs(p.y-to.y)<2)return true;
  const angle=Math.atan2(to.y-p.y,to.x-p.x),next={x:p.x+2*Math.cos(angle),y:p.y+2*Math.sin(angle)};
  if(!worldHit('ground',next))return false;
  p=next;
 }
 return false;
}

export function recommendNext(c:Campaign,threat:ThreatLookup):Recommendation|null{
 const w=world(c),here=w.town,from=here?townPoint(here):{x:w.x,y:w.y};
 const distance=(p:Point)=>Math.hypot(p.x-from.x,p.y-from.y);
 const canReach=(p:Point)=>reachable(from,p,w.sailing);
 /** Nearest reachable town from a list; the current town always counts as reachable. */
 const nearest=(towns:string[])=>towns.filter(t=>t===here||canReach(townPoint(t))).sort((a,b)=>distance(townPoint(a))-distance(townPoint(b)))[0];
 const at=(kind:RecommendationKind,town:string,title:string,reason:string,cta:string):Recommendation=>({kind,town,point:townPoint(town),here:town===here,title,reason,cta});
 const friendly=(t:string)=>c.captured.includes(t)||!c.hostile.includes(data.towns[t].NATION);

 // 1. Money already earned: collect it before anything else.
 const delivery=w.delivery&&w.delivery.accepted!==false?w.delivery:null;
 const paymentTown=nearest([...new Set(w.rewards.map(r=>r.town))].filter(friendly));
 if(paymentTown){
  const gold=w.rewards.filter(r=>r.town===paymentTown).reduce((sum,r)=>sum+r.gold,0).toLocaleString();
  if(delivery?.to===paymentTown)return at('delivery',paymentTown,`Deliver the package to ${name(paymentTown)}`,`${gold} gp is waiting at its town hall.`,paymentTown===here?'Collect payment':`Travel to ${name(paymentTown)}`);
  return paymentTown===here&&servicesAvailable(c)?at('collect',paymentTown,'Collect your payment here',`${gold} gp is waiting at this town hall.`,'Collect payment'):at('collect',paymentTown,`Collect ${gold} gp in ${name(paymentTown)}`,'A finished contract has paid out at its town hall.',`Travel to ${name(paymentTown)}`);
 }
 // 2. Finish accepted work.
 if(delivery&&delivery.to!==here&&canReach(townPoint(delivery.to)))return at('delivery',delivery.to,`Deliver the package to ${name(delivery.to)}`,`Worth ${delivery.gold.toLocaleString()} gp on arrival.`,`Travel to ${name(delivery.to)}`);
 const camp=c.quest?questPoint(c.quest.avatarId):undefined;
 if(c.quest&&camp&&canReach(camp))return {kind:'rogues',town:null,point:camp,here:false,title:`Hunt ${c.quest.count} rogues`,reason:`Clear their camp, then collect ${c.quest.reward.toLocaleString()} gp in ${name(c.quest.town)}.`,cta:'March to the rogue camp'};

 // 3. Conquest the company should win.
 const targets=(tier:ThreatEstimate['tier'])=>Object.keys(data.towns).filter(t=>!c.captured.includes(t)&&threat(t)?.tier===tier);
 const siege=(town:string,odds:string)=>{const e=threat(town)!;return at('siege',town,town===here?`Attack ${name(town)}`:`Conquer ${name(town)}`,`${odds}: won ${Math.round(e.winRate*e.samples)} of ${e.samples} trial battles against ${e.garrison} defenders.`,town===here?'Attack garrison':`Travel to ${name(town)}`);};
 const favorable=nearest(targets('favorable'));if(favorable)return siege(favorable,'Favorable');

 // 4. Otherwise grow stronger: recruit if affordable here, then try an even fight, then earn gold.
 if(here&&c.captured.includes(here)&&servicesAvailable(c)&&c.army.length<200){
  const cheapest=Math.min(...data.towns[here].barracks.map(r=>data.units[unitKey(r)]?.price??Infinity));
  if(c.gold>=cheapest)return at('recruit',here,'Recruit soldiers here',`No garrison nearby is an easy win yet. You can afford troops from ${cheapest.toLocaleString()} gp.`,'Open barracks');
 }
 const even=nearest(targets('even'));if(even)return siege(even,'Even fight, bring potions');
 if(!c.quest&&!delivery){
  const hall=nearest(Object.keys(data.towns).filter(friendly));
  // Siege estimates fill in the background; do not call garrisons too strong before they are scouted.
  const scouting=Object.keys(data.towns).some(t=>!c.captured.includes(t)&&!threat(t)&&canReach(townPoint(t)));
  if(hall)return at('contract',hall,hall===here?'Ask the town hall for work':`Find work in ${name(hall)}`,scouting?'Still scouting nearby garrisons. Meanwhile, contracts pay gold for soldiers and gear.':'Every garrison nearby is too strong for now. Contracts pay gold for more soldiers and gear.',hall===here?'Open town hall':`Travel to ${name(hall)}`);
 }
 return null;
}
