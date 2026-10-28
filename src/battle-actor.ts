import Phaser from 'phaser';
import type {Fighter} from './model';
import type {RenderPreset} from './render-presets';
import {CharacterRig,factionColor} from './character-rig';
import {combatRole,projectBattlePixel,sampleFighterPose,type CombatPose,type CombatRole} from './battle-presentation-state';

export const COMBAT_SHEET_KEY='combat-actors-stage-2';
export const COMBAT_SHEET_COLUMNS=6;
export const COMBAT_SHEET_ROWS=4;
const ROLES:readonly CombatRole[]=['hero','sword','archer','spear'];
const POSES:readonly CombatPose[]=['idle','walkA','walkB','attack','hurt','defeated'];
const WEAPON_LABELS={blade:'',spear:'SPEAR',bow:'BOW',crossbow:'XBOW',axe:'AXE',mace:'MACE',staff:'STAFF',unarmed:'FISTS',throwing:'THROW'};
// Measured opaque-component bounds of the approved 1536×1024 sheet, with a
// three-pixel antialias margin. Some weapons intentionally exceed a nominal
// 256px cell, so equal-cell slicing would clip them or leak them into a neighbor.
// Each tuple is [left,top,right,bottom,feetY]. The X anchor remains the original
// column center, not the crop center; attack extensions cannot shift the body.
const FRAME_BOUNDS:readonly (readonly (readonly number[])[])[]=[
  [[40,63,218,251,248],[285,63,468,251,248],[543,63,720,250,247],[782,66,1057,249,246],[1060,65,1250,250,247],[1303,124,1506,256,253]],
  [[45,300,219,495,492],[303,301,474,496,493],[556,301,721,499,496],[791,303,1037,495,492],[1093,305,1252,495,492],[1308,345,1500,496,493]],
  [[50,544,225,739,736],[294,543,477,739,736],[546,544,728,739,736],[798,533,1012,739,736],[1070,548,1265,739,736],[1319,587,1509,743,740]],
  [[58,774,218,977,974],[297,778,489,976,973],[547,778,755,976,973],[788,785,1074,976,973],[1090,780,1291,976,973],[1299,819,1511,977,974]],
];

function spriteLayout(role:CombatRole,pose:CombatPose){
  const row=ROLES.indexOf(role),col=POSES.indexOf(pose),[left,top,right,bottom,feetY]=FRAME_BOUNDS[row][col];
  return {left,top,right,bottom,originX:(col*256+128-left)/(right-left),originY:(feetY-top)/(bottom-top)};
}

/** The sheet remains one image; Phaser samples explicit rectangles without copying pixels. */
export function registerCombatFrames(scene:Phaser.Scene):boolean{
  if(!scene.textures.exists(COMBAT_SHEET_KEY))return false;
  const texture=scene.textures.get(COMBAT_SHEET_KEY),source=texture.getSourceImage() as HTMLImageElement;
  const width=source.width,height=source.height;
  if(width<COMBAT_SHEET_COLUMNS||height<COMBAT_SHEET_ROWS)return false;
  for(let row=0;row<COMBAT_SHEET_ROWS;row++)for(let col=0;col<COMBAT_SHEET_COLUMNS;col++){
    const name=`${ROLES[row]}-${POSES[col]}`;
    if(texture.has(name))continue;
    const layout=spriteLayout(ROLES[row],POSES[col]),sx=width/1536,sy=height/1024;
    const x=Math.round(layout.left*sx),y=Math.round(layout.top*sy);
    texture.add(name,0,x,y,Math.round(layout.right*sx)-x,Math.round(layout.bottom*sy)-y);
  }
  return true;
}

/** Read-only presentation adapter. All motion, damage and rewards remain in Battle. */
export class BattleActor{
  readonly root:Phaser.GameObjects.Container;
  private sprite:Phaser.GameObjects.Image|null=null;
  private spriteScale=88/256;
  private fallback:CharacterRig|null=null;
  private affiliation:Phaser.GameObjects.Graphics;
  private selection:Phaser.GameObjects.Graphics;
  private health:Phaser.GameObjects.Graphics;
  private marker:Phaser.GameObjects.Text;
  private weaponBadge:Phaser.GameObjects.Text;
  private horse:Phaser.GameObjects.Graphics|null=null;
  private lastHP:number;
  private hurtUntil=0;
  private deadSince:number|null=null;
  private role:CombatRole;
  private readonly teamColor:number;

  constructor(private scene:Phaser.Scene,f:Readonly<Fighter>,private preset:RenderPreset){
    this.root=scene.add.container(0,0);
    this.role=combatRole(f);this.lastHP=f.hp;
    this.teamColor=f.team===0?0x68c2d3:0xe46e60;
    const shadow=scene.add.ellipse(1,2,f.hero.HORSE?48:30,f.hero.HORSE?14:10,0x223b3a,preset.contactShadowAlpha);
    this.root.add(shadow);
    this.affiliation=scene.add.graphics();this.root.add(this.affiliation);
    this.selection=scene.add.graphics();this.root.add(this.selection);
    if(f.hero.HORSE){this.horse=scene.add.graphics();this.drawHorse(f);this.root.add(this.horse);}
    if(registerCombatFrames(scene)){
      this.sprite=scene.add.image(0,f.hero.HORSE?-15:0,COMBAT_SHEET_KEY,`${this.role}-idle`);
      const source=scene.textures.get(COMBAT_SHEET_KEY).getSourceImage() as HTMLImageElement;
      this.spriteScale=88*COMBAT_SHEET_COLUMNS/source.width;
      this.sprite.setScale(this.spriteScale);this.root.add(this.sprite);
    }else{
      this.fallback=new CharacterRig(scene,this.role,factionColor(f.hero.NATION),preset);
      this.fallback.bar.setVisible(false);this.fallback.marker.setVisible(false);this.fallback.shadow.setVisible(false);
      this.fallback.root.y=f.hero.HORSE?-15:0;this.root.add(this.fallback.root);
    }
    this.health=scene.add.graphics();this.root.add(this.health);
    this.marker=scene.add.text(0,-91,f.key==='hero'?'◆':'',{fontSize:'12px',color:'#ffe8a7',stroke:'#34474e',strokeThickness:2}).setOrigin(.5);
    this.root.add(this.marker);
    this.weaponBadge=scene.add.text(0,-75,'',{fontFamily:'sans-serif',fontSize:'8px',fontStyle:'bold',color:'#fff0c7',backgroundColor:'#2b444d',padding:{x:3,y:2}}).setOrigin(.5).setVisible(false);
    this.root.add(this.weaponBadge);
    this.paint(f,0,f.key==='hero');
  }

  private drawHorse(f:Readonly<Fighter>){
    const g=this.horse!;
    const skin=f.hero.HORSE?.skin_color??'brown';
    const coat=skin==='black'?0x45505a:skin==='white'?0xdad6bd:skin==='yellow'?0xba935a:0x956844;
    g.lineStyle(5,0x69543e);g.lineBetween(-15,-10,-17,6);g.lineBetween(13,-9,16,6);
    g.fillStyle(coat);g.fillEllipse(-2,-15,48,20);
    g.fillPoints([{x:11,y:-17},{x:19,y:-38},{x:27,y:-37},{x:24,y:-15}],true);
    g.fillRoundedRect(20,-39,17,12,4);g.fillTriangle(22,-38,22,-47,28,-38);
    g.fillStyle(0x57493e);g.fillPoints([{x:14,y:-16},{x:17,y:-39},{x:22,y:-39},{x:18,y:-18}],true);
    g.lineStyle(4,0x57493e);g.lineBetween(-24,-16,-32,-7);
    g.fillStyle(0x433c35);g.fillCircle(30,-35,1.3);
    g.lineStyle(1,0xe9d29a);g.lineBetween(34,-29,15,-18);
    g.fillStyle(factionColor(f.hero.NATION));g.fillRoundedRect(-11,-25,20,11,3);
    g.lineStyle(2,0xd1ad69);g.strokeRoundedRect(-11,-25,20,11,3);
  }

  paint(f:Readonly<Fighter>,clockMs:number,selected:boolean){
    if(f.hp<this.lastHP&&f.hp>0)this.hurtUntil=clockMs+170;
    this.lastHP=f.hp;
    const view=sampleFighterPose(f,clockMs,this.preset,this.hurtUntil),position=projectBattlePixel(f.pixelX,f.pixelY);
    this.root.setPosition(position.x,position.y).setDepth(position.y);
    if(f.hp<=0&&this.deadSince===null)this.deadSince=clockMs;
    const deadAge=this.deadSince===null?0:Math.max(0,clockMs-this.deadSince);
    this.root.setAlpha(f.hp<=0?Math.max(.22,1-deadAge/900):1);

    this.affiliation.clear();this.selection.clear();this.health.clear();
    if(f.hp>0){
      this.affiliation.lineStyle(1.6,this.teamColor,.88);this.affiliation.strokeEllipse(0,1,f.hero.HORSE?47:31,f.hero.HORSE?16:11);
      this.affiliation.fillStyle(this.teamColor);this.affiliation.fillTriangle(-3,7,3,7,0,11);
      if(selected){this.selection.lineStyle(f.key==='hero'?2.5:1.5,0xffdf8f,.95);this.selection.strokeEllipse(0,1,f.hero.HORSE?53:38,f.hero.HORSE?19:15);}
      const y=f.hero.HORSE?-101:-86;
      this.health.fillStyle(0x20383e,.9);this.health.fillRoundedRect(-18,y,36,6,2);
      this.health.fillStyle(this.teamColor);this.health.fillRoundedRect(-17,y+1,34*view.health,4,1);
      this.health.lineStyle(.6,0xfff0bd,.6);this.health.strokeRoundedRect(-18,y,36,6,2);
      // Team outline and actual-nation pennant carry separate information.
      this.health.lineStyle(1,0xf4dd9e,.8);this.health.lineBetween(22,y-1,22,y+10);
      this.health.fillStyle(factionColor(f.hero.NATION));
      this.health.fillPoints([{x:23,y:y-1},{x:31,y:y-1},{x:30,y:y+6},{x:27,y:y+4},{x:23,y:y+6}],true);
    }
    this.marker.setVisible(f.hp>0&&f.key==='hero').setY(f.hero.HORSE?-109:-94);
    // Hero identity stays shared while a category badge makes non-sword gear
    // explicit until the later per-equipment attachment library is produced.
    this.weaponBadge.setVisible(f.hp>0&&f.key==='hero'&&view.weapon!=='blade');
    this.weaponBadge.setText(WEAPON_LABELS[view.weapon]).setY(f.hero.HORSE?-88:-73);

    if(this.sprite){
      const nextRole=combatRole(f);if(nextRole!==this.role)this.role=nextRole;
      const layout=spriteLayout(this.role,view.pose);
      this.sprite.setFrame(`${this.role}-${view.pose}`).setOrigin(layout.originX,layout.originY).setScale(view.facing*this.spriteScale,this.spriteScale);
      this.sprite.y=(view.mounted?-15:0)+view.bob;
      this.sprite.rotation=view.pose==='defeated'?0:view.lean*view.facing;
      if(clockMs<this.hurtUntil-95)this.sprite.setTintFill(0xffecd2);else this.sprite.clearTint();
    }else if(this.fallback){
      if(f.hp<=0)this.fallback.die();
      else this.fallback.pose(clockMs,f.moving,view.attacking,view.facing,view.health);
    }
    if(this.horse){this.horse.setScale(view.facing,1);this.horse.y=f.moving&&f.hp>0?view.bob*.55:0;this.horse.setAlpha(f.hp>0?1:.5);}
  }

  destroy(){this.root.destroy(true);}
}
