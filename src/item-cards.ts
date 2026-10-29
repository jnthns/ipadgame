import {weaponAppearance} from './character-appearance';
import {equipmentImageURL} from './character-equipment';
import {icon} from './interface-icons';
import type {Hero,Item} from './model';

const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const isArmor=(item:Item)=>item.TYPE==='Clothes'||item.TYPE==='Helmet';
const averageDamage=(item:Item|null)=>item?(item.dmg??0)+(item.rnd??0)/2:0;

/** Picture of the item: weapon and shield art where it exists, a drawn icon for armor and helmets. */
export function itemThumb(item:Item){
 if(isArmor(item))return `<span class="item-thumb armor" aria-hidden="true">${icon(item.TYPE==='Helmet'?'helmet':'armor')}</span>`;
 const look=weaponAppearance(item);
 if(look.kind==='fists'||!look.artId)return `<span class="item-thumb" aria-hidden="true">${icon('swords')}</span>`;
 return `<span class="item-thumb" aria-hidden="true"><img src="${equipmentImageURL(look.kind,look.artId)}" alt="" loading="lazy"></span>`;
}

export function itemRequirement(hero:Hero,item:Item){
 if(!item.require_param)return {met:true,text:''};
 const has=(hero as unknown as Record<string,number>)[item.require_param]??0,need=item.require_value??0;
 return has>=need?{met:true,text:`Needs ${need} ${item.require_param} ✓`}:{met:false,text:`${esc(hero.NAME)} has ${has} ${item.require_param} · needs ${need}`};
}

/** One-line comparison against what the hero wears or wields now. */
export function itemComparison(hero:Hero,item:Item){
 if(isArmor(item)){const current=item.TYPE==='Helmet'?hero.HELMET:hero.ARMOR,delta=(item.value??0)-(current?.value??0);return delta?`<span class="delta ${delta>0?'up':'down'}">${delta>0?'+':''}${delta} defense vs ${esc(current?.NAME??'nothing')}</span>`:'';}
 if(item.TYPE==='Shield')return hero.WEAPON_SEC?.TYPE==='Shield'?'':'<span class="delta up">Adds a shield</span>';
 const current=hero.WEAPON_PRI,delta=Math.round(averageDamage(item)-averageDamage(current));
 return delta?`<span class="delta ${delta>0?'up':'down'}">${delta>0?'+':''}${delta} avg damage vs ${esc(current?.NAME??'bare hands')}</span>`:'';
}

export function itemSummary(item:Item){
 if(isArmor(item))return `${item.value??0} defense · ${item.TYPE==='Helmet'?'helmet':'body armor'}`;
 if(item.TYPE==='Shield')return 'Shield · makes you harder to hit';
 return `${item.dmg??0}–${(item.dmg??0)+(item.rnd??0)} damage · ${item.rng?'ranged':'melee'}`;
}
