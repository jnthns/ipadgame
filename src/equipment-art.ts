/** Base silhouettes determine motion; named artwork can vary without changing combat. */
export const EQUIPMENT_KINDS=Object.freeze(['morningstar','hammer','mace','sword','greatsword','katana','ninjato','axe','greataxe','bow','crossbow','spear','naginata','staff','dagger','shuriken','throwingAxe','throwingKnife','fire','shield'] as const);
export type EquipmentKind=typeof EQUIPMENT_KINDS[number];

export const EQUIPMENT_VARIANTS=Object.freeze([
  {id:'spikedStaff',kind:'staff'},
  {id:'goldNaginata',kind:'naginata'},
  {id:'holySpear',kind:'spear'},
  {id:'blackKatana',kind:'katana'},
  {id:'goldKatana',kind:'katana'},
  {id:'holyNinjato',kind:'ninjato'},
  {id:'blackShuriken',kind:'shuriken'},
  {id:'silverShuriken',kind:'shuriken'},
  {id:'forgedCrossbow',kind:'crossbow'},
  {id:'eliteCrossbow',kind:'crossbow'},
  {id:'holyBow',kind:'bow'},
  {id:'samuraiBow',kind:'bow'},
  {id:'longAxe',kind:'axe'},
  {id:'holyAxe',kind:'axe'},
  {id:'eliteGreataxe',kind:'greataxe'},
  {id:'peacekeeperMace',kind:'mace'},
  {id:'starbringerSword',kind:'sword'},
  {id:'silverThrowingKnife',kind:'throwingKnife'},
  {id:'ironBuckler',kind:'shield'},
  {id:'kiteShield',kind:'shield'},
] as const satisfies readonly {id:string;kind:EquipmentKind}[]);

export type EquipmentVariantId=typeof EQUIPMENT_VARIANTS[number]['id'];
export type EquipmentArtId=EquipmentKind|EquipmentVariantId;
export type EquipmentArt={readonly id:EquipmentArtId;readonly kind:EquipmentKind;readonly imagePath:string;readonly imageURL:string};

const definitions:readonly {id:EquipmentArtId;kind:EquipmentKind}[]=[...EQUIPMENT_KINDS.map(kind=>({id:kind,kind})),...EQUIPMENT_VARIANTS];
export const EQUIPMENT_ARTS:readonly EquipmentArt[]=Object.freeze(definitions.map(({id,kind})=>{
  const imagePath=`art/remastered/identities/equipment/${id}.webp`;
  return Object.freeze({id,kind,imagePath,imageURL:new URL(imagePath,typeof document==='undefined'?'https://feudalism.invalid/':document.baseURI).href});
}));

/** Reject a mismatched variant instead of using another weapon class's artwork. */
export function equipmentArt(kind:string,artId?:string|null):EquipmentArt|null{
  return EQUIPMENT_ARTS.find(art=>art.id===(artId??kind)&&art.kind===kind)
    ??EQUIPMENT_ARTS.find(art=>art.id===kind&&art.kind===kind)
    ??null;
}
