import type {Hero,Item} from './model';
import {nations} from './model';
import {characterAppearance,weaponAppearance} from './character-appearance';
import {CHARACTER_FRAME,characterVisualBounds,equipmentImageURL,equipmentPlacement,type EquipmentHand} from './character-equipment';
import {icon} from './interface-icons';

const esc=(value:unknown)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export type CharacterPortraitSize='company'|'hero'|'hud'|'selection';
export interface CharacterPortraitOptions{
  size?:CharacterPortraitSize;
  /** Battle callers supply the currently active item after a weapon exchange. */
  weapon?:Item|null;
  secondary?:Item|null;
  decorative?:boolean;
}

const percent=(value:number)=>`${Number((value*100).toFixed(5))}%`;
/** Includes the complete measured figure and held equipment, including long blades. */
export const CHARACTER_PORTRAIT_SCENE=Object.freeze({width:360,height:336,bodyX:52,bodyY:48,bodySize:256});
const scene=CHARACTER_PORTRAIT_SCENE;
const sceneStyle=`--portrait-scene-ratio:${scene.width/scene.height};--portrait-scene-width:${scene.width};--portrait-scene-height:${scene.height};--portrait-body-left:${percent(scene.bodyX/scene.width)};--portrait-body-top:${percent(scene.bodyY/scene.height)};--portrait-body-width:${percent(scene.bodySize/scene.width)};--portrait-body-height:${percent(scene.bodySize/scene.height)}`;
const HERO_SUMMARIES:Readonly<Record<string,string>>={
  'hero-karl':'A stout guardian with chestnut hair and a close brown beard.',
  'hero-niora':'A focused staff adept with black hair in a high bun.',
  'hero-olga':'A steady-eyed forest archer with a long auburn braid.',
  'hero-vseslav':'A broad-shouldered axe warrior with a thick dark beard.',
  'hero-edgar':'An imperial swordsman with wavy dark hair and determined brows.',
  'hero-elizabth':'A resolute hammer warrior with short honey-blonde hair.',
  'hero-selena':'An alert crossbow scout with a dark curly bob.',
  'hero-sieg':'A sharp-eyed shinobi with black hair tied back.',
};

function equipmentMarkup(item:Item|null|undefined,hand:EquipmentHand,characterId:string){
  const weapon=weaponAppearance(item??null),placement=equipmentPlacement(weapon.kind,hand,characterId,weapon.artId??undefined),url=equipmentImageURL(weapon.kind,weapon.artId??undefined);
  if(!placement||!url)return '';
  const left=(scene.bodyX+placement.x*scene.bodySize)/scene.width,top=(scene.bodyY+placement.y*scene.bodySize)/scene.height;
  return `<img class="character-portrait__equipment character-portrait__equipment--${hand}" data-equipment-art="${esc(weapon.artId)}" src="${esc(url)}" alt="" aria-hidden="true" draggable="false" style="left:${percent(left)};top:${percent(top)};width:${percent(placement.width*scene.bodySize/scene.width)};height:${percent(placement.height*scene.bodySize/scene.height)};transform-origin:${percent(placement.originX)} ${percent(placement.originY)};transform:translate(${-placement.originX*100}%,${-placement.originY*100}%) rotate(${placement.rotation}rad)">`;
}

/** A backup bow/staff stays stowed; a shield or actual dual weapon is held. */
function heldSecondary(primary:Item|null|undefined,secondary:Item|null|undefined){
  if(!secondary)return null;
  if(secondary.TYPE==='Shield')return secondary;
  const oneHanded=(item:Item|null|undefined)=>!!item&&!weaponAppearance(item).twoHanded;
  return oneHanded(primary)&&oneHanded(secondary)?secondary:null;
}

/** The same equipment selection and geometry used by the actual HTML markup. */
export function characterPortraitBounds(hero:Hero,key?:string,options:CharacterPortraitOptions={}){
  const appearance=characterAppearance(hero,key),primary=options.weapon===undefined?hero.WEAPON_PRI:options.weapon;
  const secondary=heldSecondary(primary,options.secondary===undefined?hero.WEAPON_SEC:options.secondary);
  const equipment=[{item:primary,hand:'primary' as EquipmentHand},{item:secondary,hand:'secondary' as EquipmentHand}].flatMap(({item,hand})=>{
    const visual=weaponAppearance(item);
    return visual.kind==='fists'?[]:[{kind:visual.kind,artId:visual.artId??undefined,hand}];
  });
  const bounds=characterVisualBounds({characterId:appearance.id,size:scene.bodySize,equipment});
  const groundX=scene.bodyX+CHARACTER_FRAME.feetX,groundY=scene.bodyY+CHARACTER_FRAME.feetY;
  return {left:bounds.left+groundX,top:bounds.top+groundY,right:bounds.right+groundX,bottom:bounds.bottom+groundY};
}

/** Complete contained artwork, shared identities and actual equipment. No model writes. */
export function characterPortraitMarkup(hero:Hero,key?:string,options:CharacterPortraitOptions={}):string{
  const appearance=characterAppearance(hero,key),primary=options.weapon===undefined?hero.WEAPON_PRI:options.weapon;
  const secondary=heldSecondary(primary,options.secondary===undefined?hero.WEAPON_SEC:options.secondary);
  const primaryVisual=weaponAppearance(primary??null),secondaryVisual=secondary?weaponAppearance(secondary):null;
  const description=`${hero.NAME}, ${appearance.role}, equipped with ${primaryVisual.label}${secondaryVisual?` and ${secondaryVisual.label}`:''}.`;
  return `<span class="character-portrait character-portrait--${options.size??'company'}" data-character-id="${esc(appearance.id)}" data-weapon-kind="${esc(primaryVisual.kind)}"${secondaryVisual?` data-secondary-kind="${esc(secondaryVisual.kind)}"`:''} style="--character-color:${esc(nations[appearance.nation]?.color??'#a59878')}" ${options.decorative?'aria-hidden="true"':`role="img" aria-label="${esc(description)}"`}><span class="character-portrait__scene" style="${sceneStyle}"><img class="character-portrait__body" src="${esc(appearance.imageURL)}" alt="" draggable="false" decoding="async">${equipmentMarkup(primary,'primary',appearance.id)}${equipmentMarkup(secondary,'secondary',appearance.id)}</span></span>`;
}

/** One canonical hero, including the starting loadout shown in the artwork. */
export function heroSelectionMarkup(hero:Hero,index:number,town:string):string{
  const appearance=characterAppearance(hero),secondary=hero.WEAPON_SEC?.NAME;
  return `<button class="hero-card hero-identity-card" data-start="${index}" style="--character-color:${esc(nations[hero.NATION].color)}" aria-label="Begin campaign as ${esc(hero.NAME)}, ${esc(hero.WEAPON_PRI?.NAME??'unarmed')}">
    <span class="hero-identity-card__art"><span class="hero-identity-card__number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>${characterPortraitMarkup(hero,undefined,{size:'selection',decorative:true})}</span>
    <span class="hero-identity-card__copy"><span class="eyebrow">${esc(nations[hero.NATION].name)} · ${esc(town)}</span><h3>${esc(hero.NAME)}</h3><span class="hero-identity-card__description">${esc(HERO_SUMMARIES[appearance.id]??appearance.description)}</span>
    <span class="hero-identity-card__loadout">${icon('bag')}<span>${esc(hero.WEAPON_PRI?.NAME??'Unarmed')}${secondary?`<small>Backup · ${esc(secondary)}</small>`:''}</span></span>
    <span class="hero-identity-card__stats">${(['STR','DEX','CON','INT'] as const).map(stat=>`<span><b>${hero[stat]}</b><small>${stat}</small></span>`).join('')}</span>
    <span class="hero-identity-card__begin"><span>BEGIN CAMPAIGN</span><span aria-hidden="true">→</span></span></span>
  </button>`;
}
