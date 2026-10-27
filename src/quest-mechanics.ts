/** Original Quest.as mechanics, independent of rendering and campaign UI. */
import {data,type Hero,type Item,type Nation} from './model';
export type RandomSource=()=>number;
export type QuestNation=Exclude<Nation,'Rog'>;
export type CombatQuestOffer={town:string;count:number;uncappedCount:number;reward:number;avatarId:number};
export type DeliveryQuestOffer={town:string;destination:string;nation:QuestNation;reward:number;avatarId:-1};
export type QuestRogue=Hero&{ID:0;primary_skill:string;secondary_skill:string|undefined};
const NATIONS:readonly QuestNation[]=['Viz','Ger','Rus','Jap'];
const TOWNS:Readonly<Record<QuestNation,readonly string[]>>={
 Viz:['Trapezus','Lutetia','Arretium','Ravenna','Lacrimosa','Caesaria','Carthage','Alexandria'],
 Ger:['Jana','Konstanz','Gerlitz','Sturmburg','Hoffen','Endem','Braunburg','Wanderburg'],
 Rus:['Dubkee','Dalnevodye','Losevo','Dobrov','Zlatograd','Medvedevo','Grouzeno','RaGorod'],
 Jap:['Omi','Kozuke','Matsuyama','Fukushima','Izumo','Suo','Nagoya','Echigo'],
};
const AVATARS:Readonly<Record<string,number|readonly number[]>>={
 Trapezus:[8,9,10],Lutetia:[8,9,10],Arretium:[8,9,10],Ravenna:[8,9,10],Lacrimosa:11,Caesaria:11,Carthage:[8,9,10],Alexandria:[8,9,10],
 Jana:[1,7,8],Konstanz:[1,7,8],Gerlitz:[1,2,3,5],Sturmburg:[1,2,3,5],Hoffen:0,Endem:0,Braunburg:[1,2,3,5],Wanderburg:0,
 Dubkee:[2,5,6,7],Dalnevodye:[2,5,6,7],Losevo:[2,5,6,7],Dobrov:[2,5,6,7],Zlatograd:[2,5,6,7],Medvedevo:4,Grouzeno:4,RaGorod:[2,3,5,6,7],
 Omi:[12,13],Kozuke:[12,13],Matsuyama:[12,13],Fukushima:[5,6],Izumo:[12,13],Suo:11,Nagoya:14,Echigo:14,
};
function random(rng:RandomSource){const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError('Quest RNG must return a finite value in [0, 1).');return n;}
/** Source d accepts fractional dice sizes: do not round its input. */
function d(size:number,rng:RandomSource){return Math.floor(random(rng)*size)+1;}
function anyOf<T>(values:readonly T[],rng:RandomSource){return values[Math.floor(random(rng)*values.length)];}
function checkHero(hero:Hero){if(!Number.isInteger(hero.LEVEL)||hero.LEVEL<1||hero.LEVEL>50||[hero.STR,hero.DEX,hero.CON,hero.INT].some(n=>!Number.isFinite(n)||n<0))throw new RangeError('Quest generation requires a level 1–50 hero with finite non-negative attributes.');}
function checkTown(town:string){if(!Object.hasOwn(data.towns,town))throw new Error(`Unknown quest town: ${town}`);}
export function questAvatarId(town:string,rng:RandomSource){checkTown(town);const choice=AVATARS[town];return typeof choice==='number'?choice:anyOf(choice,rng);}
/** Quest.initQuestBattle chooses avatar first, reward second, and caps enemies LAST. */
export function createCombatQuest(hero:Hero,town:string,rng:RandomSource):CombatQuestOffer{
 checkHero(hero);checkTown(town);const avatarId=questAvatarId(town,rng);const uncappedCount=d(hero.LEVEL+5,rng);const reward=d(uncappedCount,rng)*100*Math.ceil(hero.LEVEL/10);return {town,count:Math.min(20,uncappedCount),uncappedCount,reward,avatarId};
}
/** Source delivery quest: repeatedly sample the nation's eight towns until another is drawn. */
export function createDeliveryQuest(town:string,nation:QuestNation,rng:RandomSource):DeliveryQuestOffer{
 checkTown(town);if(!Object.hasOwn(TOWNS,nation))throw new Error(`Unknown delivery nation: ${nation}`);
 let destination=town;let attempts=0;while(destination===town){if(++attempts>10_000)throw new Error('Quest RNG did not select a different delivery town after 10,000 draws.');destination=anyOf(TOWNS[nation],rng);}
 return {town,destination,nation,reward:200+50*d(10,rng),avatarId:-1};
}
function item(category:'WeaponClass'|'Armor',type:string,nation:QuestNation,level:number):Item{
 const key=category+type+nation+level;const found=data.items[key];if(!found)throw new Error(`Recovered quest item is unavailable: ${key}`);return structuredClone(found);
}
function initialRogue(rng:RandomSource):QuestRogue{
 // Unit('Melee'/'Ranged','Rog',0) inherits Hero defaults and chooses nation, then
 // invokes an absent tier-zero initializer (AS2 treats this as a no-op).
 const SKILL=Object.fromEntries(['Sword','Axe','Mace','FarEast','Spear','Dagger','Staff','Dual','Fist','Bow','Crossbow','Throwing','Patriotism','ArtOfWar'].map(k=>[k,0]));
 return {NAME:'',NATION:anyOf(NATIONS,rng),GENDER:'m',ID:0,STR:0,DEX:0,CON:0,INT:10,LEVEL:0,EXP:0,free_points:25,SKILL,WEAPON_PRI:null as unknown as Item,WEAPON_SEC:null,ARMOR:null,HELMET:null,HORSE:null,primary_skill:'',secondary_skill:undefined};
}
function finishRogue(rogue:QuestRogue,hero:Hero,ranged:boolean){
 const offset=ranged?2:1;
 rogue.ARMOR=hero.ARMOR==null||hero.ARMOR.LEVEL<=offset?null:item('Armor','Clothes',rogue.NATION as QuestNation,hero.ARMOR.LEVEL-offset);
 rogue.HELMET=hero.HELMET==null||hero.HELMET.LEVEL<=offset?null:item('Armor','Helmet',rogue.NATION as QuestNation,hero.HELMET.LEVEL-offset);
 rogue.DEX=Math.min(100,rogue.DEX);rogue.HORSE=null;
 rogue.primary_skill=rogue.WEAPON_PRI.skill!;rogue.secondary_skill=rogue.WEAPON_SEC?.skill;
 rogue.SKILL[rogue.primary_skill]=ranged?75+Math.round(hero.LEVEL/2):50+hero.LEVEL;
 // AS2 stores a named "undefined" skill entry when the secondary weapon is null;
 // shields instead carry the source skill key "none". Retain these entries for source parity instead of inventing another skill.
 rogue.SKILL[String(rogue.secondary_skill)]=ranged?25+hero.LEVEL:50+hero.LEVEL;
 rogue.price=hero.LEVEL*(ranged?15:20);return rogue;
}
export function createQuestMeleeRogue(hero:Hero,rng:RandomSource):QuestRogue{
 checkHero(hero);const r=initialRogue(rng),max=Math.max(hero.STR,hero.DEX,hero.CON,hero.INT),level=hero.LEVEL;const nation=r.NATION as QuestNation;r.NAME='Quest Melee Rogue';
 switch(nation){
  case 'Viz':r.STR=d(max,rng);r.DEX=d(max/3,rng);r.CON=d(max/2,rng);r.WEAPON_PRI=item('WeaponClass','TwohandedSword',nation,Math.ceil(level/10));r.WEAPON_SEC=null;break;
  case 'Ger':r.STR=d(max/1.5,rng);r.DEX=d(max/6,rng);r.CON=d(max,rng);r.WEAPON_PRI=item('WeaponClass','OnehandedMace',nation,Math.ceil(level/13));r.WEAPON_SEC=item('WeaponClass','Shield',nation,Math.ceil(level/25));break;
  case 'Rus':r.STR=d(max,rng);r.DEX=d(max/2,rng);r.CON=d(max/4,rng);r.WEAPON_PRI=item('WeaponClass','OnehandedAxe',nation,Math.ceil(level/13));r.WEAPON_SEC=item('WeaponClass','OnehandedAxe',nation,Math.ceil(level/13));r.SKILL.Dual=75+Math.round(level/2);break;
  case 'Jap':r.STR=d(max,rng);r.DEX=d(max,rng);r.CON=d(max/6,rng);r.WEAPON_PRI=item('WeaponClass',d(2,rng)!==1?'Staff':'Katana',nation,Math.ceil(level/10));r.WEAPON_SEC=null;break;
 }
 return finishRogue(r,hero,false);
}
export function createQuestRangedRogue(hero:Hero,rng:RandomSource):QuestRogue{
 checkHero(hero);const r=initialRogue(rng),max=Math.max(hero.STR,hero.DEX,hero.CON,hero.INT),level=hero.LEVEL;const nation=r.NATION as QuestNation;r.NAME='Quest Ranged Rogue';
 switch(nation){
  case 'Viz':r.STR=d(max/3,rng);r.DEX=d(max,rng);r.CON=d(max/4,rng);r.WEAPON_PRI=item('WeaponClass','Crossbow',nation,Math.ceil(level/17));r.WEAPON_SEC=item('WeaponClass','TwohandedSword',nation,Math.ceil(level/13));break;
  case 'Ger':r.STR=d(max/5,rng);r.DEX=d(max,rng);r.CON=d(max/2,rng);r.WEAPON_PRI=item('WeaponClass','Crossbow',nation,Math.ceil(level/17));r.WEAPON_SEC=item('WeaponClass','TwohandedMace',nation,Math.ceil(level/17));break;
  case 'Rus':r.STR=d(max/2,rng);r.DEX=d(max,rng);r.CON=d(max/5,rng);r.WEAPON_PRI=item('WeaponClass','Bow',nation,Math.ceil(level/25));r.WEAPON_SEC=item('WeaponClass','TwohandedAxe',nation,Math.ceil(level/17));break;
  case 'Jap':r.STR=d(max,rng);r.DEX=d(max,rng);r.CON=d(max/6,rng);r.WEAPON_PRI=item('WeaponClass','Throwing',nation,Math.ceil(level/13));r.WEAPON_SEC=item('WeaponClass',d(2,rng)!==1?'Staff':'Katana',nation,Math.ceil(level/13));break;
 }
 return finishRogue(r,hero,true);
}
/** Quest.prepareBattle alternates blocks of five melee and five ranged units. */
export function createQuestEnemies(hero:Hero,count:number,rng:RandomSource):QuestRogue[]{
 if(!Number.isInteger(count)||count<1||count>20)throw new RangeError('A quest battle must contain 1–20 enemies.');return Array.from({length:count},(_,i)=>Math.floor(i/5)%2!==0?createQuestRangedRogue(hero,rng):createQuestMeleeRogue(hero,rng));
}
