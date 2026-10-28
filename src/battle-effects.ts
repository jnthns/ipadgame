import Phaser from 'phaser';
import type {BattleEvent,CombatProjectile} from './model';
import type {RenderPreset} from './render-presets';
import {projectBattlePixel,BATTLE_VIEW_SCALE_X} from './battle-presentation-state';

/** Cosmetic only: samples model projectiles/events; never schedules a hit. */
export class BattleEffects {
  private arrows:Phaser.GameObjects.Graphics;
  private labels:{text:Phaser.GameObjects.Text;born:number;originY:number}[]=[];
  private sparks:{dot:Phaser.GameObjects.Arc;born:number;x:number;y:number;dx:number;dy:number}[]=[];
  private clock=0;
  constructor(private scene:Phaser.Scene,private preset:RenderPreset){
    this.arrows=scene.add.graphics().setDepth(1500);
  }
  paint(projectiles:readonly CombatProjectile[],clock:number){
    this.clock=clock;this.arrows.clear();
    for(const p of projectiles){
      const point=projectBattlePixel(p.pixelX,p.pixelY),x=point.x,y=point.y-20;
      const angle=Math.atan2(p.plusY*36/25,p.plusX*BATTLE_VIEW_SCALE_X),dx=Math.cos(angle),dy=Math.sin(angle);
      const color=p.team===1?0xe57d65:p.team===0?0xffe49a:0xe8f7ed;
      if(p.grenade){this.arrows.fillStyle(0x465157).fillCircle(x,y,4);this.arrows.lineStyle(1.5,0xf7d27c).lineBetween(x-1,y-3,x+3,y-7);}
      else{this.arrows.lineStyle(3,0x334b50,.5).lineBetween(x-dx*13,y-dy*13+1,x,y+1);this.arrows.lineStyle(1.8,0x805d39).lineBetween(x-dx*13,y-dy*13,x,y);this.arrows.fillStyle(color).fillTriangle(x+dx*4,y+dy*4,x-dx*3-dy*2.4,y-dy*3+dx*2.4,x-dx*3+dy*2.4,y-dy*3-dx*2.4);}
    }
    this.labels=this.labels.filter(p=>{const age=(clock-p.born)/720;if(age>=1){p.text.destroy();return false;}p.text.setY(p.originY-age*27).setAlpha(Math.min(1,(1-age)*2));return true;});
    this.sparks=this.sparks.filter(p=>{const age=(clock-p.born)/320;if(age>=1){p.dot.destroy();return false;}p.dot.setPosition(p.x+p.dx*age,p.y+p.dy*age+12*age*age).setAlpha(1-age);return true;});
  }
  event(event:BattleEvent){
    const point=projectBattlePixel(event.x*40+20,event.y*25+12.5),x=point.x,y=point.y-76;
    // Bounded effect pools keep massed combat readable and memory predictable.
    if(this.labels.length>=28)this.labels.shift()!.text.destroy();
    const text=this.scene.add.text(x,y,event.text,{fontFamily:'system-ui,sans-serif',fontStyle:event.crit?'bold':'normal',fontSize:event.crit?'18px':'13px',color:event.crit?'#fff0ad':event.text==='miss'?'#e0eadc':'#ffffff',stroke:'#354b43',strokeThickness:3}).setOrigin(.5).setDepth(2000);
    this.labels.push({text,born:this.clock,originY:y});
    const count=Math.min(event.crit?5:2,Math.max(0,this.preset.maxParticles-this.sparks.length));
    if(event.text==='miss')return;
    for(let i=0;i<count;i++){
      const dot=this.scene.add.circle(x,point.y-32,event.crit?2.5:1.8,event.crit?0xffd467:0xc8f0ec).setDepth(2001);
      this.sparks.push({dot,born:this.clock,x,y:point.y-32,dx:(i%2?1:-1)*(8+i*4),dy:-10-i*3});
    }
  }
}
