import test from 'node:test';
import assert from 'node:assert/strict';
import {data} from '../src/model';
import {CHARACTER_PORTRAIT_SCENE,characterPortraitBounds,characterPortraitMarkup,heroSelectionMarkup,type CharacterPortraitOptions} from '../src/character-portraits';
import type {Hero} from '../src/model';
import {readFileSync} from 'node:fs';

test('hero choices use eight distinct complete body images and their real starting weapons',()=>{
  const choices=data.heroes.map(({MAIN_HERO,CURR_TOWN},index)=>heroSelectionMarkup(MAIN_HERO,index,CURR_TOWN));
  const ids=choices.map(markup=>markup.match(/data-character-id="([^"]+)"/)?.[1]);
  assert.equal(new Set(ids).size,8);
  assert.ok(ids.every(Boolean));
  for(let index=0;index<choices.length;index++){
    const hero=data.heroes[index].MAIN_HERO;
    assert.ok(choices[index].includes(`data-start="${index}"`));
    assert.ok(choices[index].includes('class="character-portrait__body"'));
    assert.ok(choices[index].includes(hero.WEAPON_PRI.NAME));
    assert.ok(!choices[index].includes('lineup.webp'));
  }
  assert.ok(choices[0].includes('data-weapon-kind="morningstar"'));
  assert.ok(choices[0].includes('/equipment/morningstar.webp'));
  assert.ok(choices[0].includes('data-secondary-kind="shield"'));
  assert.ok(choices[7].includes('data-weapon-kind="ninjato"'));
});

test('equipped portraits replace the held item while preserving the selected hero visage',()=>{
  const karl=data.heroes[0].MAIN_HERO,crossbow=data.heroes[6].MAIN_HERO.WEAPON_PRI;
  const original=characterPortraitMarkup(karl),exchanged=characterPortraitMarkup(karl,undefined,{size:'hud',weapon:crossbow,secondary:null});
  assert.ok(original.includes('/equipment/morningstar.webp'));
  assert.ok(exchanged.includes('data-character-id="hero-karl"'));
  assert.ok(exchanged.includes('/equipment/crossbow.webp'));
  assert.ok(!exchanged.includes('/equipment/morningstar.webp'));
  assert.ok(!exchanged.includes('/equipment/shield.webp'));
  assert.ok(exchanged.includes(crossbow.NAME));
});

test('troop portraits retain exact ninja, samurai, and rogue identities',()=>{
  for(const key of ['MeleeJap6','MeleeJap10','MeleeJap11','MeleeRog1']){
    const markup=characterPortraitMarkup(data.units[key],key);
    assert.ok(markup.includes(`data-character-id="unit-${key}"`));
    assert.ok(markup.includes(`/characters/unit-${key}.webp`));
  }
  const unarmed=characterPortraitMarkup(data.units.MeleeJap1,'MeleeJap1');
  assert.ok(unarmed.includes('data-weapon-kind="fists"'));
  assert.ok(!unarmed.includes('/equipment/'));
  const dualNinja=characterPortraitMarkup(data.units.MeleeJap7,'MeleeJap7');
  assert.ok(dualNinja.includes('data-secondary-kind="ninjato"'));
  assert.equal((dualNinja.match(/equipment\/ninjato.webp/g)??[]).length,2);
});

test('class-specific equipment images preserve the named loadout across portraits',()=>{
  const examples=[
    ['MeleeJap3','spikedStaff'],['MeleeJap5','goldNaginata'],['MeleeJap8','holyNinjato'],
    ['MeleeJap10','goldKatana'],['MeleeJap11','blackKatana'],['RangedJap4','blackShuriken'],
    ['RangedJap6','samuraiBow'],['RangedGer4','forgedCrossbow'],['RangedViz5','eliteCrossbow'],
    ['MeleeGer9','peacekeeperMace'],['MeleeGer11','starbringerSword'],['MeleeRus4','longAxe'],
  ];
  for(const [key,artId] of examples){
    const portrait=characterPortraitMarkup(data.units[key],key);
    assert.ok(portrait.includes(`/equipment/${artId}.webp`),`${key} must show ${artId}`);
    assert.ok(portrait.includes(`data-equipment-art="${artId}"`));
    assert.ok(portrait.includes(data.units[key].WEAPON_PRI.NAME));
  }
  const crusader=characterPortraitMarkup(data.units.MeleeGer11,'MeleeGer11');
  assert.ok(crusader.includes('data-weapon-kind="sword"'));
  assert.ok(!crusader.includes('/equipment/mace.webp'));
  const switched=characterPortraitMarkup(data.units.MeleeJap10,'MeleeJap10',{weapon:data.units.MeleeJap10.WEAPON_SEC,secondary:null});
  assert.ok(switched.includes('/equipment/silverShuriken.webp'));
  assert.ok(!switched.includes('/equipment/goldKatana.webp'));
});

test('HTML portraits contain complete figures and actual held gear for every class and hero upgrade',()=>{
  const scene=CHARACTER_PORTRAIT_SCENE;
  const check=(hero:Hero,key?:string,options:CharacterPortraitOptions={})=>{
    const bounds=characterPortraitBounds(hero,key,options),label=`${key??hero.NAME}: ${options.weapon?.NAME??hero.WEAPON_PRI?.NAME}`;
    assert.ok(bounds.left>=0&&bounds.top>=0&&bounds.right<=scene.width&&bounds.bottom<=scene.height,`${label}: ${JSON.stringify(bounds)} outside ${scene.width}×${scene.height}`);
    const markup=characterPortraitMarkup(hero,key,options);
    assert.ok(markup.includes(`--portrait-scene-width:${scene.width};--portrait-scene-height:${scene.height}`),'The actual markup must use the inspected scene dimensions.');
    assert.ok(markup.includes(`--portrait-scene-ratio:${scene.width/scene.height}`));
  };
  for(const [key,hero] of Object.entries(data.units)){
    check(hero,key);
    if(hero.WEAPON_SEC&&hero.WEAPON_SEC.TYPE!=='Shield')check(hero,key,{weapon:hero.WEAPON_SEC,secondary:hero.WEAPON_PRI});
  }
  const weapons=Object.values(data.items).filter(item=>!['Clothes','Helmet'].includes(item.TYPE));
  for(const {MAIN_HERO:hero} of data.heroes){
    check(hero);
    if(hero.WEAPON_SEC&&hero.WEAPON_SEC.TYPE!=='Shield')check(hero,undefined,{weapon:hero.WEAPON_SEC,secondary:hero.WEAPON_PRI});
    for(const weapon of weapons)check(hero,undefined,{weapon,secondary:null});
  }
  const css=readFileSync(new URL('../src/character-identities.css',import.meta.url),'utf8');
  for(const property of ['portrait-scene-ratio','portrait-scene-width','portrait-scene-height','portrait-body-left','portrait-body-top','portrait-body-width','portrait-body-height']){
    assert.ok(css.includes(`var(--${property})`),`CSS must consume inspected ${property} geometry.`);
  }
});
