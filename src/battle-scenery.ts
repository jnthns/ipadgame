import Phaser from 'phaser';
import {battlefieldObjects} from './battle-layout';
import {projectBattlePixel} from './battle-presentation-state';
import type {Nation} from './model';

type Region=Exclude<Nation,'Rog'>;
type BattleKind='siege'|'quest'|'throne'|'encounter';

// Literal URLs let Vite fingerprint each backdrop and keep relative paths for GitHub Pages.
const BACKDROPS:Record<string,string>={
 'field-Ger':new URL('../public/art/remastered/battlefields/field-Ger.webp',import.meta.url).href,
 'field-Rus':new URL('../public/art/remastered/battlefields/field-Rus.webp',import.meta.url).href,
 'field-Viz':new URL('../public/art/remastered/battlefields/field-Viz.webp',import.meta.url).href,
 'field-Jap':new URL('../public/art/remastered/battlefields/field-Jap.webp',import.meta.url).href,
 'siege-Ger':new URL('../public/art/remastered/battlefields/siege-Ger.webp',import.meta.url).href,
 'siege-Rus':new URL('../public/art/remastered/battlefields/siege-Rus.webp',import.meta.url).href,
 'siege-Viz':new URL('../public/art/remastered/battlefields/siege-Viz.webp',import.meta.url).href,
 'siege-Jap':new URL('../public/art/remastered/battlefields/siege-Jap.webp',import.meta.url).href,
 'throne-Ger':new URL('../public/art/remastered/battlefields/throne-Ger.webp',import.meta.url).href,
 'throne-Rus':new URL('../public/art/remastered/battlefields/throne-Rus.webp',import.meta.url).href,
 'throne-Viz':new URL('../public/art/remastered/battlefields/throne-Viz.webp',import.meta.url).href,
 'throne-Jap':new URL('../public/art/remastered/battlefields/throne-Jap.webp',import.meta.url).href,
};
const region=(n:Nation):Region=>n==='Rog'?'Ger':n;

/** Open country for road and contract fights, the defender's castle for sieges, dusk for the final assault. */
export function battleBackdropURL(kind:BattleKind,nation:Nation){
 const setting=kind==='siege'?'siege':kind==='throne'?'throne':'field';
 return BACKDROPS[`${setting}-${region(nation)}`];
}

const FOLIAGE:Record<Region,{leaf:number[];trunk:number;blossom?:number}>={
 Ger:{leaf:[0x2f7a3b,0x3f9147,0x58a957],trunk:0x6b4a2f},
 Rus:{leaf:[0x1f5b3a,0x2b7044,0x3c8752],trunk:0x5a3e2a},
 Viz:{leaf:[0x5f7b2f,0x7a9437,0x96aa48],trunk:0x7a5a36},
 Jap:{leaf:[0x2f6e45,0x3e8656,0x52a066],trunk:0x5b3b33,blossom:0xf2a7c0},
};

/**
 * Draws the original battlefield's recovered obstacle placements as painted scenery.
 * Purely decorative: blocking cells come from the battle model, never from these drawings.
 */
export function drawBattleScenery(scene:Phaser.Scene,mapId:number,nation:Nation){
 const palette=FOLIAGE[region(nation)];
 battlefieldObjects(mapId).forEach((o,index)=>{
  const [ox,oy]=o.originPixels;
  if(oy<300)return;
  const p=projectBattlePixel(ox,oy-300),g=scene.add.graphics().setDepth(p.y-1);
  g.fillStyle(0x24382c,.28).fillEllipse(p.x+3,p.y+3,38,12);
  const name=o.name.replace(/_\d+$/,'');
  if(name==='Tree')tree(g,p.x,p.y,palette,index);
  else if(name==='TreeBroken')stump(g,p.x,p.y,palette.trunk);
  else if(name==='Bush')bush(g,p.x,p.y,palette.leaf);
  else if(name==='Crate')crate(g,p.x,p.y);
  else if(name==='Barrel')barrel(g,p.x,p.y);
  else if(name==='Well')well(g,p.x,p.y);
  else if(name==='Lantern')lantern(g,p.x,p.y);
  else if(name==='Ammun')weaponRack(g,p.x,p.y);
  else if(name==='SkullTower')cairn(g,p.x,p.y);
  else if(name==='Sword_in_ground')sword(g,p.x,p.y);
  else if(name==='Head_on_spear')spear(g,p.x,p.y);
  else if(name==='Sign')sign(g,p.x,p.y);
  else bush(g,p.x,p.y,palette.leaf);
 });
}

function tree(g:Phaser.GameObjects.Graphics,x:number,y:number,palette:typeof FOLIAGE[Region],index:number){
 g.fillStyle(palette.trunk).fillRect(x-3,y-16,6,16);
 if(palette.blossom&&index%2===0){
  g.fillStyle(palette.leaf[0]).fillCircle(x,y-30,16);
  g.fillStyle(palette.blossom).fillCircle(x-8,y-34,11).fillCircle(x+8,y-32,11).fillCircle(x,y-44,11);
  g.fillStyle(0xffd3e1).fillCircle(x-4,y-40,5).fillCircle(x+6,y-38,4);
  return;
 }
 const [dark,mid,light]=palette.leaf;
 g.fillStyle(dark).fillTriangle(x-19,y-14,x+19,y-14,x,y-42);
 g.fillStyle(mid).fillTriangle(x-15,y-28,x+15,y-28,x,y-54);
 g.fillStyle(light).fillTriangle(x-10,y-42,x+10,y-42,x,y-64);
 g.fillStyle(0xffffff,.12).fillTriangle(x-8,y-30,x,y-54,x-2,y-30);
}
function stump(g:Phaser.GameObjects.Graphics,x:number,y:number,trunk:number){g.fillStyle(trunk).fillRect(x-7,y-12,14,12);g.fillStyle(0xc9a171).fillEllipse(x,y-12,14,5);g.lineStyle(2,trunk).lineBetween(x+6,y-12,x+15,y-24);}
function bush(g:Phaser.GameObjects.Graphics,x:number,y:number,leaf:number[]){g.fillStyle(leaf[0]).fillCircle(x-9,y-8,10).fillCircle(x+9,y-8,10);g.fillStyle(leaf[1]).fillCircle(x,y-14,12);g.fillStyle(leaf[2],.8).fillCircle(x-3,y-18,5);}
function crate(g:Phaser.GameObjects.Graphics,x:number,y:number){g.fillStyle(0x9a6b3c).fillRect(x-13,y-24,26,24);g.lineStyle(2,0x6a4524).strokeRect(x-13,y-24,26,24).lineBetween(x-13,y-24,x+13,y).lineBetween(x-13,y-12,x+13,y-12);g.fillStyle(0xc0925b).fillRect(x-13,y-26,26,3);}
function barrel(g:Phaser.GameObjects.Graphics,x:number,y:number){g.fillStyle(0x8a5a32).fillRoundedRect(x-11,y-26,22,26,6);g.fillStyle(0xb07a44).fillEllipse(x,y-26,22,7);g.lineStyle(2,0x4d3a2a).lineBetween(x-11,y-19,x+11,y-19).lineBetween(x-11,y-7,x+11,y-7);}
function well(g:Phaser.GameObjects.Graphics,x:number,y:number){g.fillStyle(0x8e8f8a).fillRoundedRect(x-17,y-16,34,16,4);g.fillStyle(0x3b5e78).fillEllipse(x,y-16,28,8);g.fillStyle(0x6b4a2f).fillRect(x-15,y-44,4,30).fillRect(x+11,y-44,4,30);g.fillStyle(0xb5533c).fillTriangle(x-21,y-42,x+21,y-42,x,y-56);}
function lantern(g:Phaser.GameObjects.Graphics,x:number,y:number){g.fillStyle(0x3d3a36).fillRect(x-2,y-40,4,40);g.fillStyle(0xffd36b,.35).fillCircle(x,y-42,13);g.fillStyle(0xffe08a).fillRoundedRect(x-5,y-48,10,12,2);g.lineStyle(1,0x3d3a36).strokeRoundedRect(x-5,y-48,10,12,2);}
function weaponRack(g:Phaser.GameObjects.Graphics,x:number,y:number){g.fillStyle(0x6b4a2f).fillRect(x-16,y-22,32,4).fillRect(x-14,y-22,3,22).fillRect(x+11,y-22,3,22);g.lineStyle(2,0x8c6a45);for(let i=-10;i<=10;i+=5)g.lineBetween(x+i,y-2,x+i+3,y-36);g.fillStyle(0xc8ccd0);for(let i=-10;i<=10;i+=5)g.fillTriangle(x+i+1,y-36,x+i+5,y-36,x+i+3,y-42);}
function cairn(g:Phaser.GameObjects.Graphics,x:number,y:number){g.fillStyle(0x7b7f78).fillEllipse(x,y-6,30,14);g.fillStyle(0x92968e).fillEllipse(x,y-16,24,12);g.fillStyle(0xa7aaa2).fillEllipse(x,y-25,16,10);g.fillStyle(0xe8e2cf).fillCircle(x-6,y-9,3).fillCircle(x+6,y-11,3).fillCircle(x,y-30,3);}
function sword(g:Phaser.GameObjects.Graphics,x:number,y:number){g.fillStyle(0xd7dce0).fillRect(x-2,y-30,4,28);g.fillStyle(0x7a5a36).fillRect(x-8,y-33,16,3).fillRect(x-1.5,y-42,3,9);g.fillStyle(0xe2b54e).fillCircle(x,y-43,2.5);}
function spear(g:Phaser.GameObjects.Graphics,x:number,y:number){g.lineStyle(3,0x7a5a36).lineBetween(x,y,x,y-48);g.fillStyle(0xc8ccd0).fillTriangle(x-3,y-48,x+3,y-48,x,y-58);g.fillStyle(0x8c9196).fillEllipse(x,y-36,14,10);g.fillStyle(0x6d7176).fillRect(x-7,y-36,14,3);}
function sign(g:Phaser.GameObjects.Graphics,x:number,y:number){g.fillStyle(0x6b4a2f).fillRect(x-2,y-30,4,30);g.fillStyle(0xb0844f).fillRect(x-14,y-34,28,12);g.lineStyle(1,0x6b4a2f).strokeRect(x-14,y-34,28,12);}
