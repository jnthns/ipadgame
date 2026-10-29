import test from 'node:test';
import assert from 'node:assert/strict';
import {Battle,HUMAN_ATTACK_TIMELINES,MOUNTED_ATTACK_TIMELINES,newCampaign,type AttackAnimation,type Fighter} from '../src/model';
import {sampleWeaponMotion,weaponVisualTimeline,type MotionWeaponKind} from '../src/weapon-motion';
import {characterHandPosition,characterVisualBounds} from '../src/character-equipment';

function fighter(){return new Battle(newCampaign(0),['MeleeRog1'],'quest','Jana',879,{heroControl:'manual',initialSpawns:[{x:5,y:3,team:0,hero:true},{x:6,y:3,team:1}]}).fighters[0];}
const kinds:Record<AttackAnimation,MotionWeaponKind>={sword:'morningstar',twohanded_sword:'greatsword',twohanded_axe:'greataxe',double:'axe',spear:'spear',bow:'bow',crossbow:'crossbow',dagger:'dagger',katana:'katana',staff:'staff',fists:'fists',suriken:'shuriken'};

test('visual strike and release pulses coincide with actual source-model damage frames',()=>{
  for(const mounted of [false,true])for(const animation of Object.keys(HUMAN_ATTACK_TIMELINES) as AttackAnimation[]){
    const b=new Battle(newCampaign(0),['MeleeRog1'],'quest','Jana',879,{heroControl:'manual',initialSpawns:[{x:5,y:3,team:0,hero:true},{x:6,y:3,team:1}]}),f=b.fighters[0],enemy=b.fighters[1];
    if(mounted)f.hero.HORSE={skin_color:'brown',bonus_HP:10,bonus_DEF:0,bonus_speed:1,price:0};
    f.animation=animation;f.weapon.hit=100;f.weapon.crit=0;f.weapon.range=0;f.weapon.damage=10;f.weapon.random=0;f.weapon.after=1000;
    enemy.flee=0;enemy.shieldFlee=0;enemy.def=0;enemy.hp=enemy.max=1e6;enemy.cooldown=1000;
    b.setHeroInput({attack:true});b.step();b.setHeroInput({attack:false});assert.equal(f.animationAge,0);
    const observed:number[]=[],pulses:number[]=[],timeline=weaponVisualTimeline(animation,mounted);
    for(let frame=1;frame<=timeline.end;frame++){
      const hp=enemy.hp;b.step();const motion=sampleWeaponMotion(f,kinds[animation],animation==='double'?'axe':'fists');
      if(enemy.hp<hp)observed.push(frame);if(motion.impact)pulses.push(frame);
    }
    assert.deepEqual(pulses,observed,`${animation}, mounted=${mounted}`);
    assert.deepEqual(observed,timeline.hits,`the fixture must exercise every actual hit for ${animation}`);
  }
});

test('dual and fist attacks alternate hands while staff delivers both recovered strikes',()=>{
  const f=fighter();
  for(const animation of ['double','fists'] as const){
    f.animation=animation;const timeline=HUMAN_ATTACK_TIMELINES[animation];
    f.animationAge=timeline.hits[0];let pose=sampleWeaponMotion(f,animation==='fists'?'fists':'axe',animation==='fists'?'fists':'axe');
    assert.equal(pose.activeHand,'primary');assert.equal(pose.primary.trail,1);assert.equal(pose.secondary.trail,0);
    f.animationAge=timeline.hits[1];pose=sampleWeaponMotion(f,animation==='fists'?'fists':'axe',animation==='fists'?'fists':'axe');
    assert.equal(pose.activeHand,'secondary');assert.equal(pose.secondary.trail,1);assert.equal(pose.primary.trail,0);
  }
  f.animation='staff';
  const rotations=HUMAN_ATTACK_TIMELINES.staff.hits.map(frame=>{f.animationAge=frame;const pose=sampleWeaponMotion(f,'staff');assert.equal(pose.impact,true);assert.equal(pose.activeHand,'primary');return pose.primary.rotation;});
  assert.notEqual(rotations[0],rotations[1],'the two staff strikes have different thrust/sweep poses');
});

test('bows release at their source frame, crossbows recoil, and thrown weapons leave the hand',()=>{
  const f=fighter();f.animation='bow';f.animationAge=18;
  assert.ok(sampleWeaponMotion(f,'bow').primary.draw>.9);f.animationAge=19;
  const release=sampleWeaponMotion(f,'bow');assert.equal(release.primary.draw,0);assert.equal(release.impact,true);
  f.animation='crossbow';f.animationAge=14;assert.equal(sampleWeaponMotion(f,'crossbow').body.x,0);f.animationAge=15;
  assert.ok(sampleWeaponMotion(f,'crossbow').body.x<0);assert.equal(sampleWeaponMotion(f,'crossbow').primary.rotation,Math.PI/2);
  f.animation='suriken';f.animationAge=16;assert.equal(sampleWeaponMotion(f,'shuriken').primary.alpha,1);f.animationAge=17;
  assert.equal(sampleWeaponMotion(f,'shuriken').primary.alpha,0);assert.equal(sampleWeaponMotion(f,'shuriken').primary.trail,1);
});

test('source-frame sampling is deterministic, paused, mirrored and read-only',()=>{
  const f=structuredClone(fighter());f.animation='twohanded_axe';f.animationAge=24;
  const frozen=JSON.stringify(f),a=sampleWeaponMotion(f,'greataxe');
  for(let i=0;i<100;i++)assert.deepEqual(sampleWeaponMotion(f,'greataxe'),a);
  assert.equal(JSON.stringify(f),frozen);
  const hand=characterHandPosition('hero-karl','primary'),decorations=[{left:(hand.x-.5)*88-32,right:(hand.x-.5)*88+32,top:(hand.y-.875)*88-32,bottom:(hand.y-.875)*88+32}];
  const right=characterVisualBounds({characterId:'hero-karl',rotation:a.body.rotation,offsetX:a.body.x,offsetY:a.body.y,equipment:[{kind:'greataxe',hand:'primary',rotation:a.primary.rotation}],decorations});
  const left=characterVisualBounds({characterId:'hero-karl',facing:-1,rotation:-a.body.rotation,offsetX:-a.body.x,offsetY:a.body.y,equipment:[{kind:'greataxe',hand:'primary',rotation:a.primary.rotation}],decorations});
  assert.ok(Math.abs(left.left+right.right)<1e-9);assert.ok(Math.abs(left.right+right.left)<1e-9);assert.equal(left.top,right.top);assert.equal(left.bottom,right.bottom);
  assert.equal(weaponVisualTimeline('twohanded_sword',true),MOUNTED_ATTACK_TIMELINES.twohanded_sword);
});
