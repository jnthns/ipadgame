import {data,parseSave,type Campaign,type Hero,type Item} from './model';
import enchantments from './enchantments.json';
export type Slot='WEAPON_PRI'|'WEAPON_SEC'|'ARMOR'|'HELMET';
export type StoredItem={key:string;enchantment:number;count:number};
export type Economy={version:1;inventory:StoredItem[]};
type ItemData=Item&{twohanded?:boolean;ENCH_ID?:number};
type CampaignWithEconomy=Campaign&{economy?:Economy};
export function itemKey(item:Item){return (['Clothes','Helmet'].includes(item.TYPE)?'Armor':'WeaponClass')+item.TYPE+item.NATION+item.LEVEL;}
export function economy(c:Campaign):Economy{const extended=c as CampaignWithEconomy;if(!extended.economy)extended.economy={version:1,inventory:[]};return extended.economy;}
export function inventoryItem(ref:StoredItem):ItemData{const base=data.items[ref.key];if(!Object.hasOwn(data.items,ref.key))throw new Error('Unknown inventory item.');const item={...structuredClone(base),ENCH_ID:ref.enchantment};const e=(enchantments as Record<string,{prefix:string;suffix:string;price_bonus:number}>)[ref.enchantment];if(e){item.NAME=e.prefix+item.NAME+e.suffix;item.price=Math.round(item.price*e.price_bonus);}return item;}
export function addInventory(c:Campaign,item:Item,count=1){if(!Number.isSafeInteger(count)||count<1)return false;const key=itemKey(item);if(!data.items[key])return false;const ench=(item as ItemData).ENCH_ID??0;const inv=economy(c).inventory,entry=inv.find(x=>x.key===key&&x.enchantment===ench);if(entry)entry.count+=count;else inv.push({key,enchantment:ench,count});return true;}
function removeOne(c:Campaign,index:number){const inv=economy(c).inventory;if(--inv[index].count===0)inv.splice(index,1);}
export function townServicesOpen(c:Campaign){const town=data.towns[c.town];return !c.hostile.includes(town.NATION)||c.captured.includes(town.ID);}
/** Source Hero.equipItemInfo restrictions. Validation performs no mutations. */
export function equipmentError(hero:Hero,requested:Slot,item:ItemData):string|null{
 if(requested==='ARMOR'&&item.TYPE!=='Clothes'||requested==='HELMET'&&item.TYPE!=='Helmet'||(requested==='WEAPON_PRI'||requested==='WEAPON_SEC')&&['Clothes','Helmet'].includes(item.TYPE))return 'This item does not fit that slot.';
 if(item.require_param&&((hero as unknown as Record<string,number>)[item.require_param]??0)<(item.require_value??0))return `Requires ${item.require_value} ${item.require_param}.`;
 if(requested==='ARMOR'||requested==='HELMET')return null;
 const other=hero[requested==='WEAPON_PRI'?'WEAPON_SEC':'WEAPON_PRI'] as ItemData|null;
 if(hero.HORSE){if(['Katana','NinjaTo','Dagger','Staff'].includes(item.TYPE))return 'This weapon cannot be used from a horse.';if(requested==='WEAPON_SEC'&&item.TYPE!=='Shield'&&!item.twohanded&&(hero.WEAPON_PRI?.rng??0)===0)return 'Dual weapons cannot be used from a horse.';}
 if(item.TYPE==='Shield'&&requested==='WEAPON_PRI')return 'A shield must go in the secondary hand.';
 if(item.TYPE==='Shield'&&!other)return 'Equip a weapon before a shield.';
 if(item.TYPE==='Shield'&&other?.twohanded)return 'A shield cannot be combined with a two-handed weapon.';
 if(other){if((item.rng??0)>0&&(other.rng??0)>0)return 'Two ranged weapons cannot be equipped together.';if((item.rng??0)===0&&(other.rng??0)===0&&(item.twohanded||other.twohanded))return 'Two melee weapons cannot be combined if either is two-handed.';}
 return null;
}
/** Purchase goes to inventory, preserving the original buy-then-equip flow. */
export function buyItem(c:Campaign,key:string):string|null{const t=data.towns[c.town],item=data.items[key];if(!townServicesOpen(c))return 'This town is hostile.';if(!item||!t.forge.some(r=>r.CATEGORY+r.TYPE+r.NATION+r.LEVEL===key))return 'This item is not sold here.';if(c.gold<item.price)return 'Not enough gold.';c.gold-=item.price;addInventory(c,item);return null;}
export function sellItem(c:Campaign,index:number,count=1):string|null{const inv=economy(c).inventory,ref=inv[index];if(!townServicesOpen(c))return 'This town is hostile.';if(!ref||!Number.isSafeInteger(count)||count<1||count>ref.count)return 'Invalid sale quantity.';const item=inventoryItem(ref);c.gold+=Math.floor(item.price/2)*count;ref.count-=count;if(!ref.count)inv.splice(index,1);return null;}
export function equipInventory(c:Campaign,index:number,requested:Slot):string|null{const ref=economy(c).inventory[index];if(!ref)return 'Item no longer exists.';const item=inventoryItem(ref),err=equipmentError(c.hero,requested,item);if(err)return err;const slot=!c.hero.WEAPON_PRI&&requested==='WEAPON_SEC'&&(item.rng??0)===0?'WEAPON_PRI':requested;const old=c.hero[slot];removeOne(c,index);if(old)addInventory(c,old);c.hero[slot]=item;return null;}
export function unequipItem(c:Campaign,slot:Slot):string|null{const item=c.hero[slot];if(!item)return 'That slot is empty.';if(slot==='WEAPON_PRI'&&c.hero.WEAPON_SEC?.TYPE==='Shield')return 'Remove the shield before the primary weapon.';if(!addInventory(c,item))return 'This item cannot be stored.';c.hero[slot]=null as unknown as Item;return null;}
export function collectLoot(c:Campaign,items:Item[]){for(const item of items)addInventory(c,item);}
export function validateEconomy(c:Campaign){const e=(c as CampaignWithEconomy).economy;if(!e)return;if(e.version!==1||!Array.isArray(e.inventory)||e.inventory.length>2000||e.inventory.some(r=>!r||typeof r.key!=='string'||!Object.hasOwn(data.items,r.key)||!Number.isSafeInteger(r.count)||r.count<1||r.count>1e6||!Number.isSafeInteger(r.enchantment)||r.enchantment<0||r.enchantment>24))throw new Error('Invalid inventory save.');}
export function readCampaignSave(text:string){const c=parseSave(text);validateEconomy(c);return c;}
/** Source WorldMap.init clears a nation's hostility once all of its towns are owned. */
export function settleConquest(c:Campaign,townId:string){if(!c.captured.includes(townId))c.captured.push(townId);const n=data.towns[townId].NATION;if(n!==c.hero.NATION&&!c.hostile.includes(n))c.hostile.push(n);c.hostile=c.hostile.filter(nation=>!Object.values(data.towns).filter(t=>t.NATION===nation).every(t=>c.captured.includes(t.ID)));c.town=townId;}

export function initializeEconomy(c:Campaign,heroIndex:number){economy(c);const starting=(data.heroes[heroIndex] as unknown as {INVENTORY?:{CATEGORY:string;TYPE:string;NATION:string;LEVEL:number;COUNT?:number;ENCH_ID?:number}[]}).INVENTORY??[];for(const r of starting){const item=data.items[r.CATEGORY+r.TYPE+r.NATION+r.LEVEL];if(item)addInventory(c,{...item,ENCH_ID:r.ENCH_ID??0} as Item,r.COUNT??1);}}
