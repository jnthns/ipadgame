import Phaser from 'phaser';
import type {Fighter,Item} from './model';
import type {RenderPreset} from './render-presets';
import {factionColor} from './character-rig';
import {projectBattlePixel,sampleFighterPose} from './battle-presentation-state';
import {characterAppearance,HERO_APPEARANCES,TROOP_APPEARANCES,weaponAppearance} from './character-appearance';
import {CHARACTER_FRAME,EQUIPMENT_ARTS,characterHandPosition,equipmentPlacement,equipmentTextureKey,equipmentImageURL,type EquipmentHand,type EquipmentKind} from './character-equipment';
import {battleOffhandItem,sampleWeaponMotion,type WeaponHandMotion,type MotionWeaponKind} from './weapon-motion';

/** Retained as an import-compatible name while older saved view code updates. */
export const COMBAT_SHEET_KEY='combat-actors-stage-2';
export const BATTLE_CHARACTER_SIZE=88;
export function characterTextureKey(id:string){return `character-${id}`;}

/** Each independently padded figure loads whole; there are no neighboring atlas poses to crop. */
export function preloadCharacterTextures(scene:Phaser.Scene){
  for(const appearance of [...Object.values(HERO_APPEARANCES),...Object.values(TROOP_APPEARANCES)]){
    const key=characterTextureKey(appearance.id);
    if(!scene.textures.exists(key))scene.load.image(key,appearance.imageURL);
  }
  for(const art of EQUIPMENT_ARTS){
    const key=equipmentTextureKey(art.kind,art.id),url=equipmentImageURL(art.kind,art.id);
    if(url&&!scene.textures.exists(key))scene.load.image(key,url);
  }
}

/** The public hook remains useful to callers; standalone textures require no cell slicing. */
export function registerCombatFrames(scene:Phaser.Scene){
  return [...Object.values(HERO_APPEARANCES),...Object.values(TROOP_APPEARANCES)].some(a=>scene.textures.exists(characterTextureKey(a.id)));
}

type Attachment={root:Phaser.GameObjects.Container;kind:MotionWeaponKind|null;artId:string|null;image:Phaser.GameObjects.Image|null;fallback:Phaser.GameObjects.Graphics|null;effects:Phaser.GameObjects.Graphics|null};

/** A missing-file fallback still draws the actual equipment class, never an unrelated sword. */
function fallbackEquipment(scene:Phaser.Scene,kind:EquipmentKind){
  const g=scene.add.graphics();
  const shaft=(height:number)=>{g.lineStyle(3,0x8f603a);g.lineBetween(0,8,0,-height);};
  const edge=()=>{g.fillStyle(0xcbdad8);g.lineStyle(1,0x6b7474);};
  switch(kind){
    case 'morningstar':shaft(23);g.fillStyle(0x9ba7ae);g.fillCircle(0,-24,7);for(let i=0;i<8;i++){const a=i*Math.PI/4;g.fillTriangle(Math.cos(a-.25)*6, -24+Math.sin(a-.25)*6,Math.cos(a+.25)*6,-24+Math.sin(a+.25)*6,Math.cos(a)*11,-24+Math.sin(a)*11);}break;
    case 'hammer':shaft(23);g.fillStyle(0xb9c6c8);g.fillRoundedRect(-12,-29,24,12,2);break;
    case 'mace':shaft(23);g.fillStyle(0xa4b5bd);g.fillEllipse(0,-25,11,17);break;
    case 'axe':case 'greataxe':case 'throwingAxe':shaft(kind==='greataxe'?37:23);edge();g.fillPoints([{x:0,y:kind==='greataxe'?-43:-29},{x:15,y:kind==='greataxe'?-41:-27},{x:19,y:kind==='greataxe'?-25:-13},{x:0,y:kind==='greataxe'?-29:-17}],true);break;
    case 'bow':g.lineStyle(3,0x9c7043);g.beginPath();g.arc(0,-10,25,-Math.PI/2,Math.PI/2);g.strokePath();g.lineStyle(1,0xf1d3a4);g.lineBetween(0,-35,0,15);break;
    case 'crossbow':shaft(24);g.lineStyle(3,0x977141);g.beginPath();g.arc(0,-22,20,Math.PI,Math.PI*2);g.strokePath();g.lineStyle(1,0xe6d0a4);g.lineBetween(-20,-22,20,-22);break;
    case 'spear':case 'naginata':shaft(53);edge();g.fillPoints(kind==='naginata'?[{x:-2,y:-50},{x:4,y:-67},{x:11,y:-72},{x:9,y:-53},{x:2,y:-47}]:[{x:0,y:-67},{x:6,y:-52},{x:0,y:-46},{x:-6,y:-52}],true);break;
    case 'staff':shaft(60);g.lineStyle(2,0xd9b95b);g.lineBetween(0,-51,0,-59);break;
    case 'shield':g.fillStyle(0x5a7384);g.fillPoints([{x:-13,y:-30},{x:13,y:-30},{x:12,y:-9},{x:0,y:1},{x:-12,y:-9}],true);g.lineStyle(2,0xd1ae65);g.strokePoints([{x:-13,y:-30},{x:13,y:-30},{x:12,y:-9},{x:0,y:1},{x:-12,y:-9}],true);break;
    case 'shuriken':edge();g.fillPoints([{x:0,y:-13},{x:3,y:-6},{x:11,y:-7},{x:6,y:0},{x:8,y:8},{x:0,y:4},{x:-7,y:8},{x:-5,y:0},{x:-11,y:-6},{x:-3,y:-6}],true);break;
    case 'fire':g.fillStyle(0xa66b35);g.fillEllipse(0,-7,17,20);g.fillStyle(0xd8af6b);g.fillRect(-4,-20,8,7);g.fillStyle(0xffb74e);g.fillTriangle(-3,-22,1,-30,5,-21);break;
    default:{const height=kind==='greatsword'?48:kind==='dagger'||kind==='throwingKnife'?21:kind==='katana'?43:35;shaft(3);g.fillStyle(0xc6a762);g.fillRect(-7,-6,14,3);edge();g.fillPoints([{x:-2,y:-7},{x:-2,y:-height},{x:2,y:-height-7},{x:5,y:-height},{x:3,y:-7}],true);break;}
  }
  return g;
}

/** Read-only presentation adapter. No pose, attachment, tint or animation can apply a hit. */
export class BattleActor{
  readonly root:Phaser.GameObjects.Container;
  private readonly visual:Phaser.GameObjects.Container;
  private readonly body:Phaser.GameObjects.Image|null;
  private readonly primary:Attachment;
  private readonly secondary:Attachment;
  private readonly affiliation:Phaser.GameObjects.Graphics;
  private readonly selection:Phaser.GameObjects.Graphics;
  private readonly health:Phaser.GameObjects.Graphics;
  private readonly marker:Phaser.GameObjects.Text;
  private readonly horse:Phaser.GameObjects.Graphics|null;
  private lastHP:number;
  private hurtUntil=0;
  private deadSince:number|null=null;
  private readonly teamColor:number;
  private readonly appearanceId:string;

  constructor(private readonly scene:Phaser.Scene,f:Readonly<Fighter>,private readonly preset:RenderPreset){
    this.root=scene.add.container(0,0);this.lastHP=f.hp;
    this.teamColor=f.team===0?0x68c2d3:0xe46e60;
    this.root.add(scene.add.ellipse(1,2,f.hero.HORSE?48:30,f.hero.HORSE?14:10,0x223b3a,preset.contactShadowAlpha));
    this.affiliation=scene.add.graphics();this.selection=scene.add.graphics();this.root.add([this.affiliation,this.selection]);
    this.horse=f.hero.HORSE?scene.add.graphics():null;if(this.horse){this.drawHorse(f);this.root.add(this.horse);}
    this.visual=scene.add.container(0,0);this.root.add(this.visual);
    this.secondary={root:scene.add.container(0,0),kind:null,artId:null,image:null,fallback:null,effects:null};
    const appearance=characterAppearance(f.hero,f.key),textureKey=characterTextureKey(appearance.id);
    this.appearanceId=appearance.id;
    if(scene.textures.exists(textureKey)){
      this.body=scene.add.image(0,0,textureKey).setOrigin(CHARACTER_FRAME.feetX/256,CHARACTER_FRAME.feetY/256).setDisplaySize(BATTLE_CHARACTER_SIZE,BATTLE_CHARACTER_SIZE);
      this.visual.add(this.body);
    }else{
      this.body=null;
      // Explicit missing-art token preserves identity and loadout information without inventing a face.
      const missing=scene.add.text(0,-40,appearance.name.slice(0,2).toUpperCase(),{fontSize:'17px',fontFamily:'serif',color:'#fff1c8',backgroundColor:'#304653',padding:{x:8,y:10}}).setOrigin(.5);
      this.visual.add(missing);
    }
    this.visual.add(this.secondary.root);
    this.primary={root:scene.add.container(0,0),kind:null,artId:null,image:null,fallback:null,effects:null};this.visual.add(this.primary.root);
    this.health=scene.add.graphics();this.root.add(this.health);
    this.marker=scene.add.text(0,-94,f.key==='hero'?'◆':'',{fontSize:'12px',color:'#ffe8a7',stroke:'#34474e',strokeThickness:2}).setOrigin(.5);this.root.add(this.marker);
    this.paint(f,0,f.key==='hero');
  }

  private drawHorse(f:Readonly<Fighter>){
    const g=this.horse!,skin=f.hero.HORSE?.skin_color??'brown';
    const coat=skin==='black'?0x45505a:skin==='white'?0xdad6bd:skin==='yellow'?0xba935a:0x956844;
    g.lineStyle(5,0x69543e);g.lineBetween(-15,-10,-17,6);g.lineBetween(13,-9,16,6);g.fillStyle(coat);g.fillEllipse(-2,-15,48,20);
    g.fillPoints([{x:11,y:-17},{x:19,y:-38},{x:27,y:-37},{x:24,y:-15}],true);g.fillRoundedRect(20,-39,17,12,4);g.fillTriangle(22,-38,22,-47,28,-38);
    g.fillStyle(0x57493e);g.fillPoints([{x:14,y:-16},{x:17,y:-39},{x:22,y:-39},{x:18,y:-18}],true);g.lineStyle(4,0x57493e);g.lineBetween(-24,-16,-32,-7);
    g.fillStyle(0x433c35);g.fillCircle(30,-35,1.3);g.lineStyle(1,0xe9d29a);g.lineBetween(34,-29,15,-18);g.fillStyle(factionColor(f.hero.NATION));g.fillRoundedRect(-11,-25,20,11,3);
    g.lineStyle(2,0xd1ad69);g.strokeRoundedRect(-11,-25,20,11,3);
  }

  private paintAttachment(attachment:Attachment,item:Item|null,hand:EquipmentHand,motion:WeaponHandMotion){
    const weapon=weaponAppearance(item),placement=equipmentPlacement(weapon.kind,hand,this.appearanceId,weapon.artId??undefined);
    const anchor=placement??characterHandPosition(this.appearanceId,hand);
    if(attachment.kind!==weapon.kind||attachment.artId!==weapon.artId){
      attachment.root.removeAll(true);attachment.kind=weapon.kind;attachment.artId=weapon.artId;attachment.image=null;attachment.fallback=null;
      if(placement){
        const key=equipmentTextureKey(placement.kind,placement.artId);
        if(this.scene.textures.exists(key)){
          attachment.image=this.scene.add.image(0,0,key).setOrigin(placement.originX,placement.originY).setDisplaySize(BATTLE_CHARACTER_SIZE*placement.width,BATTLE_CHARACTER_SIZE*placement.height);
          attachment.root.add(attachment.image);
        }else{attachment.fallback=fallbackEquipment(this.scene,placement.kind);attachment.root.add(attachment.fallback);}
      }
      attachment.effects=this.scene.add.graphics();attachment.root.add(attachment.effects);
    }
    // The grip stays exactly on the hand. Lunges/recoil move the complete body group.
    attachment.root.setPosition((anchor.x-.5)*BATTLE_CHARACTER_SIZE,(anchor.y-CHARACTER_FRAME.feetY/256)*BATTLE_CHARACTER_SIZE).setRotation(motion.rotation);
    attachment.image?.setAlpha(motion.alpha);attachment.fallback?.setAlpha(motion.alpha);
    const g=attachment.effects!;g.clear();
    if(this.preset.maxParticles<=0)return;
    if(weapon.kind==='bow'&&motion.draw>0){
      const pull=-motion.draw*8,radius=23;g.lineStyle(1,0xf2e2b7,.9);g.lineBetween(0,-radius,pull,0);g.lineBetween(pull,0,0,radius);
      g.lineStyle(1.3,0xbfa477,.9);g.lineBetween(pull,0,22,0);g.fillStyle(0xece9d6,.9);g.fillTriangle(23,-2,27,0,23,2);
    }
    if(motion.trail<=0)return;
    const alpha=motion.trail*.65;
    if(motion.style==='arc'){
      const radius=Math.min(27,BATTLE_CHARACTER_SIZE*(placement?.height??.6)*.43);
      g.lineStyle(3,0xffd78b,alpha*.35);g.beginPath();g.arc(0,0,radius,-Math.PI/2-.75,-Math.PI/2);g.strokePath();
      g.lineStyle(1.3,0xfff1c2,alpha);g.beginPath();g.arc(0,0,radius,-Math.PI/2-.50,-Math.PI/2);g.strokePath();
    }else if(motion.style==='thrust'){
      g.lineStyle(2,0xffe8aa,alpha);g.lineBetween(-2,-12,-2,-29);g.lineStyle(1,0xffffff,alpha*.65);g.lineBetween(2,-19,2,-30);
    }else if(motion.style==='punch'){
      g.lineStyle(2,0xffedb8,alpha);g.lineBetween(0,0,9,0);g.strokeCircle(10,0,3);g.lineStyle(1,0xffedb8,alpha*.5);g.lineBetween(8,-5,13,-7);g.lineBetween(8,5,13,7);
    }else{
      g.lineStyle(1.5,0xffefbc,alpha);g.lineBetween(-4,-18,-7,-25);g.lineBetween(4,-18,7,-25);g.lineBetween(0,-20,0,-29);
    }
  }

  paint(f:Readonly<Fighter>,clockMs:number,selected:boolean){
    if(f.hp<this.lastHP&&f.hp>0)this.hurtUntil=clockMs+170;this.lastHP=f.hp;
    const view=sampleFighterPose(f,clockMs,this.preset,this.hurtUntil),position=projectBattlePixel(f.pixelX,f.pixelY);
    this.root.setPosition(position.x,position.y).setDepth(position.y);
    if(f.hp<=0&&this.deadSince===null)this.deadSince=clockMs;
    const deadAge=this.deadSince===null?0:Math.max(0,clockMs-this.deadSince);
    this.root.setAlpha(f.hp<=0?Math.max(.22,1-deadAge/900):1);
    this.affiliation.clear();this.selection.clear();this.health.clear();
    if(f.hp>0){
      this.affiliation.lineStyle(1.6,this.teamColor,.88);this.affiliation.strokeEllipse(0,1,f.hero.HORSE?47:31,f.hero.HORSE?16:11);this.affiliation.fillStyle(this.teamColor);this.affiliation.fillTriangle(-3,7,3,7,0,11);
      if(selected){this.selection.lineStyle(f.key==='hero'?2.5:1.5,0xffdf8f,.95);this.selection.strokeEllipse(0,1,f.hero.HORSE?53:38,f.hero.HORSE?19:15);}
      const y=f.hero.HORSE?-101:-86;this.health.fillStyle(0x20383e,.9);this.health.fillRoundedRect(-18,y,36,6,2);this.health.fillStyle(this.teamColor);this.health.fillRoundedRect(-17,y+1,34*view.health,4,1);
      this.health.lineStyle(.6,0xfff0bd,.6);this.health.strokeRoundedRect(-18,y,36,6,2);this.health.lineStyle(1,0xf4dd9e,.8);this.health.lineBetween(22,y-1,22,y+10);this.health.fillStyle(factionColor(f.hero.NATION));
      this.health.fillPoints([{x:23,y:y-1},{x:31,y:y-1},{x:30,y:y+6},{x:27,y:y+4},{x:23,y:y+6}],true);
    }
    this.marker.setVisible(f.hp>0&&f.key==='hero').setY(f.hero.HORSE?-109:-94);
    const secondary=battleOffhandItem(f);
    const motion=sampleWeaponMotion(f,weaponAppearance(f.weaponItem).kind,weaponAppearance(secondary).kind);
    this.visual.setScale(view.facing*(f.hp<=0?.72:1),f.hp<=0?.72:1);
    this.visual.x=f.hp<=0?0:motion.body.x*view.facing;
    this.visual.y=f.hp<=0?5:(view.mounted?-15:0)+view.bob+motion.body.y;
    this.visual.rotation=f.hp<=0?1.2*view.facing:motion.body.rotation*view.facing;
    if(this.body){if(clockMs<this.hurtUntil-95)this.body.setTintFill(0xffecd2);else this.body.clearTint();}
    this.paintAttachment(this.primary,f.weaponItem,'primary',motion.primary);
    // A shield remains in the off hand; dual weapons follow the actual active/inactive pair.
    this.paintAttachment(this.secondary,secondary,'secondary',motion.secondary);
    if(this.horse){this.horse.setScale(view.facing,1);this.horse.y=f.moving&&f.hp>0?view.bob*.55:0;this.horse.setAlpha(f.hp>0?1:.5);}
  }

  destroy(){this.root.destroy(true);}
}
