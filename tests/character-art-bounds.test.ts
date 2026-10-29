import test from 'node:test';
import assert from 'node:assert/strict';
import artLayout from '../src/character-art-layout.json';
import {ALL_CHARACTER_APPEARANCES,characterAppearance,weaponAppearance} from '../src/character-appearance';
import {EQUIPMENT_ARTS,characterHandPosition,characterVisualBounds,type EquipmentHand} from '../src/character-equipment';
import {battleCellCenter} from '../src/battle-presentation-state';
import {Battle,data,newCampaign,type Fighter,type Hero,type Item} from '../src/model';
import {battleOffhandItem,sampleWeaponMotion,weaponVisualTimeline} from '../src/weapon-motion';

type Bounds=readonly [number,number,number,number];
const layout=artLayout as unknown as {characters:Record<string,{frontX:number;frontY:number;offX:number;offY:number;bounds?:Bounds}>;equipment:Record<string,{gripX:number;gripY:number;bounds?:Bounds}>};

test('every shipped identity and equipment image has measured grip and alpha bounds',()=>{
  assert.equal(ALL_CHARACTER_APPEARANCES.length,84);
  assert.equal(Object.keys(layout.characters).length,84,'All 84 body cutouts need measured layout entries.');
  assert.equal(Object.keys(layout.equipment).length,EQUIPMENT_ARTS.length,'Every base and named weapon cutout needs measured grip entries.');
  const validBounds=(bounds:Bounds|undefined,label:string)=>{
    assert.ok(bounds,`${label}: missing alpha bounds`);assert.ok(bounds.every(Number.isFinite),`${label}: invalid bounds`);
    assert.ok(bounds[0]>=0&&bounds[1]>=0&&bounds[2]<=256&&bounds[3]<=256&&bounds[2]>bounds[0]&&bounds[3]>bounds[1],`${label}: alpha bounds must fit a complete 256px cutout`);
  };
  for(const appearance of ALL_CHARACTER_APPEARANCES){
    const body=layout.characters[appearance.id];assert.ok(body,appearance.id);
    assert.ok([body.frontX,body.frontY,body.offX,body.offY].every(n=>Number.isFinite(n)&&n>=0&&n<=256),`${appearance.id}: hand anchors must be inside the full image`);validBounds(body.bounds,appearance.id);
  }
  for(const art of EQUIPMENT_ARTS){const gear=layout.equipment[art.id];assert.ok(gear,art.id);assert.ok([gear.gripX,gear.gripY].every(n=>Number.isFinite(n)&&n>=0&&n<=256),art.id);validBounds(gear.bounds,art.id);}
});

type Case={id:string;source:Fighter;label:string};
const fixtureBattle=()=>new Battle(newCampaign(0),[],'quest','Jana',479,{heroControl:'manual'});
function spawn(b:Battle,hero:Hero,key:string){b.spawn(hero,key,0,0,0);return b.fighters.at(-1)!;}
function alternate(source:Fighter):Fighter|null{
  if(!source.secondaryWeapon||!source.secondaryItem||!source.secondaryAnimation)return null;
  return {...source,weapon:source.secondaryWeapon,secondaryWeapon:source.weapon,weaponItem:source.secondaryItem,secondaryItem:source.weaponItem,animation:source.secondaryAnimation,secondaryAnimation:source.animation};
}

function checkEverySourceFrame(cases:readonly Case[]){
  const overflows:string[]=[],near=battleCellCenter({x:0,y:0}),far=battleCellCenter({x:19,y:7});
  let minimumMargin=Infinity,worst='',sampleCount=0;
  for(const entry of cases){
    const primary=weaponAppearance(entry.source.weaponItem),offhand=battleOffhandItem(entry.source),secondary=weaponAppearance(offhand);
    const timeline=weaponVisualTimeline(entry.source.animation,!!entry.source.hero.HORSE);
    const frames:(number|null)[]=[null,...Array.from({length:timeline.end+1},(_,i)=>i)];
    const samples=frames.map(animationAge=>({...entry.source,animationAge,windup:0,attackFlash:0,switchRemaining:0}));
    samples.push({...entry.source,animationAge:null,windup:Math.max(1,entry.source.weapon.before),attackFlash:0,switchRemaining:0});
    samples.push({...entry.source,animationAge:null,windup:1,attackFlash:0,switchRemaining:0});
    samples.push({...entry.source,animationAge:null,windup:0,attackFlash:0,switchRemaining:10});
    samples.push({...entry.source,animationAge:null,windup:0,attackFlash:0,switchRemaining:0,hp:0});
    for(const source of samples)for(const facing of [-1,1]){
      const motion=sampleWeaponMotion(source,primary.kind,secondary.kind),dead=source.hp<=0;
      const equipment=([{weapon:primary,hand:'primary',motion:motion.primary},{weapon:secondary,hand:'secondary',motion:motion.secondary}] as const).flatMap(({weapon,hand,motion:handMotion})=>weapon.kind==='fists'||handMotion.alpha<=0?[]:[{kind:weapon.kind,artId:weapon.artId??undefined,hand,rotation:handMotion.rotation}]);
      const decorations=([{hand:'primary',motion:motion.primary},{hand:'secondary',motion:motion.secondary}] as const).flatMap(({hand,motion:handMotion})=>{
        if(handMotion.trail<=0&&handMotion.draw<=0)return [];
        const anchor=characterHandPosition(entry.id,hand),x=(anchor.x-.5)*88,y=(anchor.y-.875)*88;
        return [{left:x-34,top:y-34,right:x+34,bottom:y+34}];
      });
      const bounds=characterVisualBounds({characterId:entry.id,size:88,facing,rotation:dead?1.2*facing:motion.body.rotation*facing,scale:dead?.72:1,offsetX:dead?0:motion.body.x*facing,offsetY:dead?5:(source.hero.HORSE?-15:0)+motion.body.y,mounted:!!source.hero.HORSE,equipment,decorations});
      // The two extrema exercise all four viewport corners; include maximum walk
      // bob even though source movement normally interrupts an attack animation.
      const margin=Math.min(near.x+bounds.left,806-far.x-bounds.right,near.y+bounds.top-1.5,601-far.y-bounds.bottom-1.5);
      const label=`${entry.label}, source frame ${source.animationAge??'idle'}, ${dead?'defeated':motion.phase}, facing ${facing}`;
      if(margin<minimumMargin){minimumMargin=margin;worst=label;}
      if(margin<-.001&&overflows.length<12)overflows.push(`${label}: ${(-margin).toFixed(2)}px clipped`);
      sampleCount++;
    }
  }
  assert.equal(overflows.length,0,`${overflows.join('\n')}\nWorst viewport margin ${minimumMargin.toFixed(2)}px: ${worst}`);
  return {minimumMargin,worst,sampleCount};
}

test('all canonical loadouts and alternate weapons fit every source animation frame at all corners',t=>{
  const b=fixtureBattle(),cases:Case[]=[];
  const add=(hero:Hero,key:string)=>{
    const id=characterAppearance(hero,key).id,source=spawn(b,hero,key);cases.push({id,source,label:id});
    const switched=alternate(source);if(switched)cases.push({id,source:switched,label:`${id} switched`});
  };
  for(const start of data.heroes)add(start.MAIN_HERO,'hero');
  for(const [key,hero] of Object.entries(data.units))add(hero,key);
  const result=checkEverySourceFrame(cases);t.diagnostic(`${result.sampleCount} complete motion samples; minimum margin ${result.minimumMargin.toFixed(2)}px (${result.worst}).`);
});

test('all recovered weapon items fit every hero throughout their actual source timelines',t=>{
  const b=fixtureBattle(),cases:Case[]=[];
  const weapons=Object.values(data.items).filter(item=>!['Clothes','Helmet','Shield'].includes(item.TYPE));
  assert.ok(weapons.length>100,'Exercise the recovered weapon catalogue, not only starting gear.');
  for(const {MAIN_HERO:original} of data.heroes)for(const weapon of weapons){
    const hero={...original,WEAPON_PRI:weapon,WEAPON_SEC:null,HORSE:null},id=characterAppearance(hero,'hero').id;
    cases.push({id,source:spawn(b,hero,'hero'),label:`${hero.NAME}: ${weapon.NAME}`});
  }
  const result=checkEverySourceFrame(cases);t.diagnostic(`${result.sampleCount} upgraded-weapon motion samples; minimum margin ${result.minimumMargin.toFixed(2)}px (${result.worst}).`);
});
