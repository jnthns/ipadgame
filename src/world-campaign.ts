import {data,type Campaign,type Hero,type Horse,type Nation} from './model';
import {createQuestEnemies,questAvatarId} from './quest-mechanics';
import {geometry,worldHit,townAt,questAt,type Point} from './world-geometry';
export type WorldState={version:1;x:number;y:number;town:string|null;target:Point|null;sailing:boolean;shipTown:string|null;tick:number;seed:number;rewards:{town:string;gold:number}[];delivery:{from:string;to:string;gold:number}|null};
export type WorldEvent={type:'arrive';town:string}|{type:'blocked'}|{type:'encounter';enemies:string[];mapId:number}|{type:'quest';enemies:Hero[];mapId:number};
export const SHIP_PRICE=4000;
export function world(c:Campaign):WorldState{if(!c.world){const p=(geometry.towns as Record<string,Point>)[c.town];c.world={version:1,x:p.x,y:p.y,town:c.town,target:null,sailing:false,shipTown:null,tick:0,seed:0x71ac24d,rewards:[],delivery:null};}if(c.quest&&c.quest.avatarId===undefined)c.quest.avatarId=questAvatarId(c.quest.town,()=>.5);return c.world;}
function validPoint(p:unknown):p is Point{return !!p&&typeof p==='object'&&Number.isFinite((p as Point).x)&&Number.isFinite((p as Point).y)&&(p as Point).x>=0&&(p as Point).x<=800&&(p as Point).y>=0&&(p as Point).y<=600;}
const validTown=(id:unknown)=>typeof id==='string'&&Object.hasOwn(data.towns,id);
const gold=(n:unknown)=>Number.isSafeInteger(n)&&(n as number)>=0&&(n as number)<=1e12;
export function validateWorld(c:Campaign){const w=c.world;if(c.quest?.avatarId!==undefined&&(!Number.isInteger(c.quest.avatarId)||c.quest.avatarId<0||c.quest.avatarId>14))throw new Error('Invalid quest map marker.');if(w===undefined)return;if(!w||w.version!==1||!Number.isFinite(w.x)||!Number.isFinite(w.y)||w.x< -2||w.x>802||w.y< -2||w.y>602||w.town!==null&&(!validTown(w.town)||w.town!==c.town)||w.shipTown!==null&&!validTown(w.shipTown)||typeof w.sailing!=='boolean'||w.target!==null&&!validPoint(w.target)||!Number.isSafeInteger(w.tick)||w.tick<0||w.tick>1e12||!Number.isInteger(w.seed)||w.seed<0||w.seed>0xffffffff||!Array.isArray(w.rewards)||w.rewards.length>200||w.rewards.some(r=>!r||!validTown(r.town)||!gold(r.gold))||w.delivery!==null&&(!w.delivery||!validTown(w.delivery.from)||!validTown(w.delivery.to)||!gold(w.delivery.gold)))throw new Error('Invalid world campaign save.');}
export function townFacilities(town:string){return (geometry.facilities as Record<string,{harbor:boolean;stables:boolean}>)[town];}
export function servicesAvailable(c:Campaign){return !!world(c).town&&(!c.hostile.includes(data.towns[c.town].NATION)||c.captured.includes(c.town));}
export function boardShip(c:Campaign):string|null{const w=world(c);if(!servicesAvailable(c)||!townFacilities(c.town)?.harbor)return 'There is no accessible harbor here.';if(w.sailing)return 'Already sailing.';if(c.gold<SHIP_PRICE)return 'Not enough gold to rent a ship.';c.gold-=SHIP_PRICE;w.sailing=true;w.target=null;return null;}
export function enterTown(c:Campaign,town:string){if(!validTown(town))throw new Error('Unknown town.');const w=world(c);c.town=town;w.town=town;w.target=null;if(w.sailing){w.shipTown=town;w.sailing=false;}}
/** Source Cities.checkReward pays the first matching entry, once, on opening hall. */
export function collectTownReward(c:Campaign){if(!servicesAvailable(c))return 0;const w=world(c),i=w.rewards.findIndex(r=>r.town===c.town);if(i<0)return 0;const [reward]=w.rewards.splice(i,1);c.gold+=reward.gold;if(w.delivery?.to===c.town)w.delivery=null;return reward.gold;}
export function acceptDelivery(c:Campaign,to:string,reward:number):string|null{if(!servicesAvailable(c)||!validTown(to)||to===c.town||data.towns[to].NATION!==data.towns[c.town].NATION||!gold(reward))return 'Invalid delivery contract.';const w=world(c);if(w.delivery){const i=w.rewards.findIndex(r=>r.town===w.delivery!.to&&r.gold===w.delivery!.gold);if(i>=0)w.rewards.splice(i,1);}if(w.rewards.length>=200)return 'Collect outstanding rewards first.';w.delivery={from:c.town,to,gold:reward};w.rewards.push({town:to,gold:reward});c.quest=null;return null;}
export function completeCombatContract(c:Campaign){if(!c.quest)return;const w=world(c);w.rewards.push({town:c.quest.town,gold:c.quest.reward});c.quest=null;}
export function horseEquipmentError(h:Hero){const forbidden=['Katana','NinjaTo','Dagger','Staff'];if([h.WEAPON_PRI,h.WEAPON_SEC].some(w=>w&&forbidden.includes(w.TYPE)))return 'This weapon cannot be used from a horse.';if(h.WEAPON_SEC?.TYPE!=='Shield'&&!h.WEAPON_SEC?.twohanded&&!h.WEAPON_PRI?.twohanded)return 'Dual weapons cannot be used from a horse.';return null;}
export function buyHorse(c:Campaign,index:number):string|null{if(!servicesAvailable(c)||!townFacilities(c.town)?.stables)return 'There are no accessible stables here.';const horse=data.towns[c.town].barn[index];if(!Number.isInteger(index)||!horse)return 'Unknown horse.';if(c.gold<horse.price)return 'Not enough gold.';const err=horseEquipmentError(c.hero);if(err)return err;const tradeIn=Math.round((c.hero.HORSE?.price??0)/3);c.gold-=horse.price-tradeIn;c.hero.HORSE=structuredClone(horse);return null;}
export function sellHorse(c:Campaign):string|null{if(!servicesAvailable(c)||!townFacilities(c.town)?.stables||!c.hero.HORSE)return 'There is no horse to sell at these stables.';c.gold+=Math.round(c.hero.HORSE.price/3);c.hero.HORSE=null;return null;}
export function validateHorse(horse:Horse|null){if(horse==null)return;if(!['red','brown','grey','white','black'].includes(horse.skin_color)||['bonus_HP','bonus_DEF','bonus_speed','price'].some(k=>!Number.isFinite(horse[k as keyof Horse])||(horse[k as keyof Horse] as number)<0||(horse[k as keyof Horse] as number)>1e6))throw new Error('Invalid horse save.');}
export class WorldTravel{
 constructor(public campaign:Campaign){}
 get state(){return world(this.campaign);}
 random=()=>{const w=this.state;w.seed=(w.seed+0x6D2B79F5)>>>0;let t=Math.imul(w.seed^w.seed>>>15,1|w.seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
 private dice=(n:number)=>Math.floor(this.random()*n);
 private d=(n:number)=>this.dice(n)+1;
 moveTo(point:Point){if(!validPoint(point))return false;const w=this.state;if(w.town){const p=(geometry.towns as Record<string,Point>)[w.town];w.x=p.x;w.y=p.y;}w.town=null;w.target={...point};return true;}
 stop(){this.state.target=null;}
 private encounter():WorldEvent|null{const c=this.campaign,w=this.state;let enemies:string[]=[];
  if(this.dice(150)===0){const count=Math.min(24,this.d(c.hero.LEVEL+3));for(let i=0;i<count;i++){// AVM1 evaluates constructor arguments right-to-left: ID before type.
   const id=this.d(3),type=this.dice(2)!==0?'Ranged':'Melee';enemies.push(`${type}Rog${id}`);}
  }else if(!w.sailing){const nation=(['Viz','Ger','Rus','Jap'] as Nation[]).find(n=>worldHit(`land${n}` as 'landViz',w));if(nation&&c.hostile.includes(nation)&&this.dice(150)===0){const count=Math.min(24,8+this.d(c.hero.LEVEL));for(let i=0;i<Math.min(count,6);i++)enemies.push(`Melee${nation}${1+this.d(2)}`);for(let i=0;i<count-6;i++)enemies.push(`Ranged${nation}${this.d(2)*2}`);}}
  if(!enemies.length)return null;const mapId=w.sailing?52+this.d(4):worldHit('seashore',w)?56+this.d(4):[10,11,12,16,17,18][this.dice(6)]*4+this.d(4);return {type:'encounter',enemies,mapId};
 }
 step():WorldEvent|null{const w=this.state;if(!w.target)return null;w.tick++;const angle=Math.atan2(w.target.y-w.y,w.target.x-w.x),next={x:w.x+2*Math.cos(angle),y:w.y+2*Math.sin(angle)};let event:WorldEvent|null=null;
  if(Math.abs(w.x-w.target.x)<2&&Math.abs(w.y-w.target.y)<2){w.target=null;const q=this.campaign.quest;if(q&&questAt(q.avatarId??-1,w)){event={type:'quest',enemies:createQuestEnemies(this.campaign.hero,q.count,this.random),mapId:32+this.d(8)};}else{const town=townAt(w);if(town)event={type:'arrive',town};}}
  if(worldHit(w.sailing?'sea':'ground',next)){const encounter=event?null:this.encounter();if(encounter){w.target=null;return encounter;}w.x=next.x;w.y=next.y;}else{w.target=null;if(!event)event={type:'blocked'};}
  if(event?.type==='arrive')enterTown(this.campaign,event.town);return event;
 }
}
