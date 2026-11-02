import {SKILLS} from './progression';
import {weaponStats,UNARMED,type Hero,type Item} from './model';

const esc=(value:unknown)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const SKILL_INFO:Record<typeof SKILLS[number],{label:string;description:string}>={
 Sword:{label:'Swords',description:'Proficiency for weapons assigned to the Sword skill. Ninja-to and katana use Far East Weapons instead.'},
 Axe:{label:'Axes',description:'Proficiency for weapons assigned to the Axe skill. Check the skill shown on each item.'},
 Mace:{label:'Maces & Hammers',description:'Proficiency for maces, hammers, and morningstars.'},
 FarEast:{label:'Far East Weapons',description:'Proficiency for ninja-to, katana, and shuriken. These do not use Swords or Throwing Weapons.'},
 Spear:{label:'Spears',description:'Proficiency for spears and polearms assigned to this skill.'},
 Dagger:{label:'Daggers',description:'Proficiency for knives and daggers.'},
 Staff:{label:'Staves',description:'Proficiency for staff attacks.'},
 Dual:{label:'Dual Wielding',description:'When fighting with two compatible one-handed weapons, multiplies off-hand accuracy by this value / 100. It does not improve shields or a separate backup weapon.'},
 Fist:{label:'Unarmed',description:'Proficiency for bare-handed attacks only. 100 here does not improve an equipped blade.'},
 Bow:{label:'Bows',description:'Proficiency for bows. Higher accuracy reduces projectile scatter; targets can still dodge.'},
 Crossbow:{label:'Crossbows',description:'Proficiency for crossbows. Higher accuracy reduces projectile scatter; targets can still dodge.'},
 Throwing:{label:'Throwing Weapons',description:'Proficiency for throwing knives, axes, and other items assigned to this skill. Shuriken use Far East Weapons.'},
 Patriotism:{label:'Patriotism',description:'Each point adds 1% to the health and damage bonus of soldiers from your own nation only. Does not boost your hero.'},
 ArtOfWar:{label:'Art of War',description:'Every 2 points add 1% to the health and damage bonus of all your soldiers. Does not boost your hero.'},
};
export function skillLabel(key:string){return SKILL_INFO[key as keyof typeof SKILL_INFO]?.label??key;}
/** Use the actual item metadata, including source exceptions, rather than its appearance. */
export function weaponSkill(item:Item|null){return item?.TYPE==='Shield'||item?.TYPE==='Clothes'||item?.TYPE==='Helmet'?null:item?.skill??'Fist';}
export function equippedSkillWeapons(hero:Hero,key:string){
 return [hero.WEAPON_PRI??UNARMED,hero.WEAPON_SEC].filter((item):item is Item=>!!item&&weaponSkill(item)===key).map(item=>item.NAME);
}
export function skillCardsMarkup(hero:Hero,canUpgrade:(key:string)=>boolean){
 return SKILLS.map(key=>{
  const info=SKILL_INFO[key],value=hero.SKILL[key]??0,weapons=equippedSkillWeapons(hero,key);
  const cap=key==='ArtOfWar'||key==='Patriotism'?Math.min(100,hero.INT*2):100;
  return `<article class="hero-skill-card${weapons.length?' equipped':''}" data-skill-card="${key}"><div class="row"><h4>${esc(info.label)} <span class="text-gold">${value} / ${cap}</span></h4><button class="tiny" data-skill="${key}" aria-label="Increase ${esc(info.label)} by 1" ${canUpgrade(key)?'':'disabled'}>+1</button></div>${weapons.length?`<p class="skill-equipped">Used by: ${weapons.map(esc).join(' · ')}</p>`:''}<p class="subtle">${esc(info.description)}</p>${value>=cap?`<small>${cap===100?'Maximum proficiency reached.':'Current intelligence cap reached; raise INT to increase it.'}</small>`:''}</article>`;
 }).join('');
}
export function weaponSkillMarkup(hero:Hero){
 return [hero.WEAPON_PRI??UNARMED,hero.WEAPON_SEC].filter((item):item is Item=>!!item&&weaponSkill(item)!==null).map(item=>{
  const key=weaponSkill(item)!,stats=weaponStats(hero,item),proficiency=hero.SKILL[key]??0;
  return `<div class="weapon-skill-summary"><b>${esc(item.NAME)}</b><p>${esc(skillLabel(key))} · ${proficiency} / 100 proficiency</p><small>Base accuracy ${stats.hit} · Critical chance ${stats.crit}%</small>${proficiency===0?'<p class="skill-warning">No proficiency: base accuracy is 0. Train this weapon skill before relying on it.</p>':''}</div>`;
 }).join('');
}
