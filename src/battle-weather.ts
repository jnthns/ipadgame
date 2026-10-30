import Phaser from 'phaser';
import type {BattleHazard} from './model';
import type {BattlefieldCondition} from './battlefield-conditions';
import type {RenderPreset} from './render-presets';
import {projectBattlePixel} from './battle-presentation-state';

const W=806,H=601;
type Tint={color:number;alpha:number};
const TINTS:Partial<Record<BattlefieldCondition['visual'],Tint>>={
 rain:{color:0x2c4a63,alpha:.16},storm:{color:0x1c2a3c,alpha:.3},fog:{color:0xe6ece8,alpha:.26},heat:{color:0xffa640,alpha:.12},
 snow:{color:0xdcecff,alpha:.2},mud:{color:0x5a4026,alpha:.12},night:{color:0x0d1838,alpha:.42},omen:{color:0xffe7a3,alpha:.1},
 blood:{color:0x6e0f12,alpha:.24},smoke:{color:0x4b4844,alpha:.22},halls:{color:0x1b1410,alpha:.2},springs:{color:0x7fd6c0,alpha:.08},
};
/** Stable pseudo-random layout so particles do not jump between frames. */
const hash=(i:number,k:number)=>{const v=Math.sin(i*127.1+k*311.7)*43758.5453;return v-Math.floor(v);};

/**
 * Cosmetic only: draws the battle's condition as weather and light over the field and flashes
 * lightning where the model reports a strike. Particle counts follow the render preset.
 */
export class BattleWeather{
 private layer:Phaser.GameObjects.Graphics;
 private bolts:{x:number;y:number;born:number;seed:number}[]=[];
 private flashUntil=0;
 constructor(private scene:Phaser.Scene,private condition:BattlefieldCondition,private preset:RenderPreset){
  this.layer=scene.add.graphics().setDepth(1800);
  this.drawStatic();
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.layer.destroy());
 }
 /** Ground marks that do not move are drawn once, beneath the fighters. */
 private drawStatic(){
  const g=this.scene.add.graphics().setDepth(1),v=this.condition.visual;
  if(v==='mud')for(let i=0;i<14;i++){const p=projectBattlePixel(hash(i,1)*800,hash(i,2)*200);g.fillStyle(0x4a3520,.28).fillEllipse(p.x,p.y,40+hash(i,3)*50,10+hash(i,4)*8);g.fillStyle(0x8fa6b0,.18).fillEllipse(p.x-4,p.y-1,18,3);}
  if(v==='snow')for(let i=0;i<18;i++){const p=projectBattlePixel(hash(i,5)*800,hash(i,6)*200);g.fillStyle(0xf4f9ff,.35).fillEllipse(p.x,p.y,30+hash(i,7)*40,7+hash(i,8)*6);}
  if(v==='walls'){for(let x=640;x<790;x+=11){const top=228+hash(x,1)*10;g.fillStyle(0x6b4a2f,.85).fillRect(x,top,7,30);g.fillStyle(0x8a6440).fillTriangle(x,top,x+7,top,x+3.5,top-8);}}
  if(v==='hill'){g.fillStyle(0xffffff,.08).fillRect(W*.55,0,W*.45,H);g.fillStyle(0x3a4d2a,.12).fillRect(0,0,W*.3,H);}
  if(v==='springs')for(let i=0;i<5;i++){const p=projectBattlePixel(80+hash(i,9)*640,hash(i,10)*200);g.fillStyle(0x5fb7c9,.35).fillEllipse(p.x,p.y,46,13);g.lineStyle(1,0xd9f6ff,.5).strokeEllipse(p.x,p.y,46,13);}
 }
 hazard(h:BattleHazard,clock:number){
  if(h.kind!=='lightning')return;
  const p=projectBattlePixel(h.pixelX,h.pixelY);this.bolts.push({x:p.x,y:p.y,born:clock,seed:clock%997});
  if(this.preset.ambientMotion)this.flashUntil=clock+140;
 }
 paint(clock:number){
  const g=this.layer.clear(),v=this.condition.visual,t=clock/1000,budget=this.preset.maxParticles*3,moving=this.preset.ambientMotion;
  const tint=TINTS[v];if(tint)g.fillStyle(tint.color,tint.alpha).fillRect(0,0,W,H);
  if(v==='night'||v==='halls'){g.fillStyle(0x000000,.18).fillRect(0,0,W,70).fillRect(0,H-70,W,70);}
  if(v==='blood'){g.fillStyle(0xd23a2a,.85).fillCircle(700,60,26);g.fillStyle(0xff8a6a,.35).fillCircle(700,60,36);}
  if(v==='night'){g.fillStyle(0xf4f1d8,.9).fillCircle(90,55,16);g.fillStyle(0x0d1838,.9).fillCircle(97,50,14);}
  if(v==='rain'||v==='storm'){
   g.lineStyle(1.6,0xdcebf6,.65);const n=Math.max(v==='storm'?30:20,budget);
   for(let i=0;i<n;i++){const speed=700+hash(i,1)*300,x=(hash(i,2)*W+(moving?t*speed*.25:0))%W,y=(hash(i,3)*H+(moving?t*speed:0))%H;g.lineBetween(x,y,x-5,y+16);}
  }
  if(v==='snow'){g.fillStyle(0xffffff,.8);const n=Math.max(14,budget);for(let i=0;i<n;i++){const x=(hash(i,4)*W+(moving?Math.sin(t+i)*14:0))%W,y=(hash(i,5)*H+(moving?t*40*(.6+hash(i,6)):0))%H;g.fillCircle(x,y,1.4+hash(i,7)*1.6);}}
  if(v==='fog'){for(let i=0;i<6;i++){const x=((hash(i,8)*W+(moving?t*(12+i*4):0))%(W+300))-150,y=200+hash(i,9)*300;g.fillStyle(0xf4f7f4,.2).fillEllipse(x,y,320,90);}}
  if(v==='wind'){const dir=this.condition.favors==='you'?1:-1;g.lineStyle(1,0xffffff,.4);const n=Math.max(10,budget/2);for(let i=0;i<n;i++){const x=((hash(i,10)*W+(moving?dir*t*420:0))%W+W)%W,y=hash(i,11)*H;g.lineBetween(x,y,x-dir*38,y+Math.sin(t*3+i)*2);}}
  if(v==='heat'&&moving){g.lineStyle(1,0xfff1c4,.18);for(let i=0;i<6;i++){const y=260+i*45;g.beginPath();for(let x=0;x<=W;x+=20){const yy=y+Math.sin(x/40+t*3+i)*3;if(x===0)g.moveTo(x,yy);else g.lineTo(x,yy);}g.strokePath();}}
  if(v==='smoke'||v==='springs'){const n=Math.max(8,budget/2),color=v==='smoke'?0x9a958e:0xbff5e1;for(let i=0;i<n;i++){const life=(hash(i,12)+(moving?t*.12:0))%1,x=hash(i,13)*W+Math.sin(life*6+i)*20,y=H-life*(H-120);g.fillStyle(color,(v==='smoke'?.3:.5)*(1-life)).fillCircle(x,y,v==='smoke'?14+life*30:2.5);}}
  if(v==='drums'&&moving){const beat=(t*2)%1;g.lineStyle(10,0xc8502e,.16*(1-beat)).strokeRect(5,5,W-10,H-10);}
  if(v==='omen'){const cx=403+Math.cos(t*.6)*240,cy=90+Math.sin(t*1.2)*24,flap=moving?Math.sin(t*9)*4:0;g.lineStyle(2.4,0xffffff,.85).beginPath().moveTo(cx-12,cy-flap).lineTo(cx,cy).lineTo(cx+12,cy-flap).strokePath();}
  if(clock<this.flashUntil)g.fillStyle(0xf2f6ff,.35*(this.flashUntil-clock)/140).fillRect(0,0,W,H);
  this.bolts=this.bolts.filter(b=>{const age=(clock-b.born)/420;if(age>=1)return false;g.lineStyle(3.5,0xfdfbe6,1-age);g.beginPath();let x=b.x+(hash(b.seed,1)-.5)*60,y=0;g.moveTo(x,y);for(let i=1;i<=8;i++){x=b.x+(i===8?0:(hash(b.seed,i+1)-.5)*40*(8-i)/8);y=(b.y-40)*i/8;g.lineTo(x,y);}g.strokePath();g.fillStyle(0xfff6c0,.5*(1-age)).fillCircle(b.x,b.y-40,22);return true;});
 }
}
