import artLayout from './character-art-layout.json';
import {EQUIPMENT_KINDS,equipmentArt,type EquipmentKind} from './equipment-art';
export {EQUIPMENT_KINDS,EQUIPMENT_ARTS,EQUIPMENT_VARIANTS,equipmentArt,type EquipmentKind,type EquipmentArtId} from './equipment-art';

/** Shared body/hand geometry for HTML portraits and the read-only battle renderer. */
export const CHARACTER_FRAME=Object.freeze({width:256,height:256,feetX:128,feetY:224,frontX:164,frontY:154,offX:87,offY:151});
export const EQUIPMENT_FRAME=Object.freeze({width:256,height:256,gripX:128,gripY:184});
export type EquipmentHand='primary'|'secondary';

const SIZES:Record<EquipmentKind,number>={morningstar:.66,hammer:.66,mace:.62,sword:.74,greatsword:.94,katana:.84,ninjato:.72,axe:.66,greataxe:.90,bow:.90,crossbow:.74,spear:1.08,naginata:1.08,staff:1.04,dagger:.46,shuriken:.34,throwingAxe:.54,throwingKnife:.46,fire:.42,shield:.50};

type PixelBounds=readonly [left:number,top:number,right:number,bottom:number];
type BodyArtLayout={frontX:number;frontY:number;offX:number;offY:number;bounds?:PixelBounds};
type GearArtLayout={gripX:number;gripY:number;bounds?:PixelBounds};
const layout=artLayout as unknown as {characters:Record<string,BodyArtLayout>;equipment:Record<string,GearArtLayout>};

export function characterHandPosition(characterId:string|undefined,hand:EquipmentHand){
  const body=characterId?layout.characters[characterId]:undefined;
  return {x:(hand==='primary'?(body?.frontX??CHARACTER_FRAME.frontX):(body?.offX??CHARACTER_FRAME.offX))/256,y:(hand==='primary'?(body?.frontY??CHARACTER_FRAME.frontY):(body?.offY??CHARACTER_FRAME.offY))/256};
}

/** Ratios are relative to a complete, uncropped 256px body frame. */
export function equipmentPlacement(kind:string,hand:EquipmentHand='primary',characterId?:string,artId?:string){
  if(!Object.hasOwn(SIZES,kind))return null;
  const k=kind as EquipmentKind;
  const art=equipmentArt(k,artId)!,handPosition=characterHandPosition(characterId,hand),gear=layout.equipment[art.id]??layout.equipment[k];
  return {
    kind:k,
    artId:art.id,
    x:handPosition.x,
    y:handPosition.y,
    width:SIZES[k],height:SIZES[k],
    originX:(gear?.gripX??EQUIPMENT_FRAME.gripX)/EQUIPMENT_FRAME.width,
    originY:(gear?.gripY??EQUIPMENT_FRAME.gripY)/EQUIPMENT_FRAME.height,
    rotation:k==='crossbow'?Math.PI/2:hand==='secondary'&&k!=='shield'?-.12:.10,
  };
}

export function equipmentImagePath(kind:string,artId?:string){
  return EQUIPMENT_KINDS.includes(kind as EquipmentKind)?equipmentArt(kind as EquipmentKind,artId)!.imagePath:null;
}
export function equipmentImageURL(kind:string,artId?:string){
  return EQUIPMENT_KINDS.includes(kind as EquipmentKind)?equipmentArt(kind as EquipmentKind,artId)!.imageURL:null;
}

/** Weapon exchanges replace the visual item, rather than hiding it behind a role label. */
export function equipmentTextureKey(kind:EquipmentKind,artId?:string){return `equipment-${equipmentArt(kind,artId)!.id}`;}

export type CharacterVisualBoundsOptions={
  characterId:string;size?:number;facing?:number;rotation?:number;scale?:number;offsetX?:number;offsetY?:number;mounted?:boolean;
  equipment?:readonly {kind:string;artId?:string;hand:EquipmentHand;rotation?:number;offsetX?:number}[];
  decorations?:readonly {left:number;top:number;right:number;bottom:number}[];
};
/**
 * Conservative transformed alpha bounds relative to the fighter's ground point.
 * Includes complete body/equipment rectangles from inspected source images;
 * callers can add the projected ground coordinate and compare with the viewport.
 */
export function characterVisualBounds(options:CharacterVisualBoundsOptions){
  const {characterId,size=88,facing=1,rotation=0,scale=1,offsetX=0,offsetY=0,mounted=false,equipment=[],decorations=[]}=options;
  const body=layout.characters[characterId],bounds=body?.bounds??[0,0,256,256];
  const points:{x:number;y:number}[]=[];
  const addRect=(box:PixelBounds,originX:number,originY:number,width:number,height:number,x:number,y:number,angle:number)=>{
    for(const [px,py] of [[box[0],box[1]],[box[2],box[1]],[box[2],box[3]],[box[0],box[3]]]){
      const localX=(px/256-originX)*width,localY=(py/256-originY)*height;
      points.push({x:x+localX*Math.cos(angle)-localY*Math.sin(angle),y:y+localX*Math.sin(angle)+localY*Math.cos(angle)});
    }
  };
  addRect(bounds,CHARACTER_FRAME.feetX/256,CHARACTER_FRAME.feetY/256,size,size,0,0,0);
  for(const gear of equipment){
    const p=equipmentPlacement(gear.kind,gear.hand,characterId,gear.artId);if(!p)continue;
    const box=(layout.equipment[p.artId]??layout.equipment[p.kind])?.bounds??[0,0,256,256];
    addRect(box,p.originX,p.originY,size*p.width,size*p.height,(p.x-.5)*size+(gear.offsetX??0),(p.y-CHARACTER_FRAME.feetY/256)*size,gear.rotation??p.rotation);
  }
  for(const d of decorations)points.push({x:d.left,y:d.top},{x:d.right,y:d.top},{x:d.right,y:d.bottom},{x:d.left,y:d.bottom});
  const world=points.map(p=>{
    const x=p.x*Math.sign(facing||1)*scale,y=p.y*scale;
    return {x:offsetX+x*Math.cos(rotation)-y*Math.sin(rotation),y:offsetY+x*Math.sin(rotation)+y*Math.cos(rotation)};
  });
  if(mounted)world.push({x:-38,y:-47},{x:38,y:8});
  return {left:Math.min(...world.map(p=>p.x)),top:Math.min(...world.map(p=>p.y)),right:Math.max(...world.map(p=>p.x)),bottom:Math.max(...world.map(p=>p.y))};
}
