/** Roaming Unit constructors; independent from battle/rendering. See ENCOUNTER_PARITY.md. */
import {data,type Hero,type Item,type Nation} from './model';
export type UnitType='Melee'|'Ranged';
const nations:readonly Nation[]=['Viz','Ger','Rus','Jap'];
const colors=['red','brown','grey','white'] as const; // Original Horse('any') rolls dice(4), excluding black.
const randomHorseKeys=new Set(['MeleeViz6','RangedViz6','RangedGer6','MeleeRus8']);
function roll(rng:()=>number){const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError('Unit RNG must return [0,1).');return n;}
function item(category:string,type:string,nation:string,level:number):Item{const key=category+type+nation+level;if(!Object.hasOwn(data.items,key))throw new Error('Missing recovered encounter gear '+key);return structuredClone(data.items[key]);}
export function createEncounterUnit(type:UnitType,nation:Nation,id:number,rng:()=>number):Hero{
 const key=type+nation+id;if(type!=='Melee'&&type!=='Ranged'||!Object.hasOwn(data.units,key)||!Number.isInteger(id))throw new Error('Unknown encounter unit.');
 const dice=(n:number)=>Math.floor(roll(rng)*n),d=(n:number)=>dice(n)+1;
 const h=structuredClone(data.units[key]);
 if(nation!=='Rog'){h.GENDER=d(100)<=70?'m':'f';if(h.HORSE&&randomHorseKeys.has(key))h.HORSE.skin_color=colors[dice(4)];return h;}
 h.NATION=nations[dice(4)];h.GENDER='m';
 // Clear sampled skill entries, including named 'undefined' entries from null secondary weapons.
 h.SKILL=Object.fromEntries(['Sword','Axe','Mace','FarEast','Spear','Dagger','Staff','Dual','Fist','Bow','Crossbow','Throwing','Patriotism','ArtOfWar'].map(k=>[k,0]));
 h.WEAPON_SEC=null;h.ARMOR=null;h.HELMET=null;h.HORSE=null;
 let secondarySkill:string|undefined='none';
 const armor=(choices:readonly Nation[])=>item('Armor','Clothes',choices[dice(4)],1);
 if(type==='Melee'){
  if(id===1||id===2){
   const ordinary=id===1||dice(4)!==0;
   if(ordinary){const level=d(2),types=id===1?['OnehandedSword','OnehandedAxe','OnehandedMace']:['TwohandedSword','TwohandedAxe','TwohandedMace'];h.WEAPON_PRI=item('WeaponClass',types[dice(3)],'Rog',level);}
   else h.WEAPON_PRI=item('WeaponClass','Spear',nations[dice(3)],1);
   if(id===1)h.WEAPON_SEC=item('WeaponClass','Shield',nations[dice(3)],1);
  }else h.WEAPON_PRI=dice(2)!==0?item('WeaponClass','Staff','Jap',1):item('WeaponClass','Katana','Rog',d(2));
  if(dice(2)===0)h.ARMOR=armor(nations);
  if(dice(4)===0)h.HELMET=item('Armor','Helmet',nations[dice(4)],1);
  if(id!==3&&dice(7)===0){const skin_color=colors[dice(4)];h.HORSE={skin_color,bonus_HP:10,bonus_DEF:0,bonus_speed:1,price:0};}
 }else{
  const choices=id===3?(['Ger','Rus','Jap','Viz'] as const):nations;
  const weaponType=id===1?'Bow':id===2?'Crossbow':'Throwing';h.WEAPON_PRI=item('WeaponClass',weaponType,choices[dice(id===1?4:3)],1);
  if(dice(2)===0)h.WEAPON_SEC=item('WeaponClass',id===3?'Staff':'Dagger',id===3?'Jap':'Viz',1);
  if(dice(id===3?3:2)===0)h.ARMOR=armor(choices);
  secondarySkill=h.WEAPON_SEC?.skill;
 }
 h.SKILL[h.WEAPON_PRI.skill!]=40;h.SKILL[String(secondarySkill)]=type==='Melee'?0:id===1?30:id===2?25:40;
 const extended=h as Hero&{primary_skill:string;secondary_skill:string|undefined};extended.primary_skill=h.WEAPON_PRI.skill!;extended.secondary_skill=secondarySkill;
 return h;
}
