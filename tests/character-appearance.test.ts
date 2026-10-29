import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,data,newCampaign,type Hero,type Item} from '../src/model';
import {ALL_CHARACTER_APPEARANCES,characterAppearance,equippedAppearance,HERO_APPEARANCES,TROOP_APPEARANCES,weaponAppearance} from '../src/character-appearance';
import {createEncounterUnit} from '../src/encounter-units';
import {EQUIPMENT_ARTS,EQUIPMENT_VARIANTS,equipmentArt} from '../src/equipment-art';

test('all original heroes and troop classes have unique complete character art identities',()=>{
  assert.equal(ALL_CHARACTER_APPEARANCES.length,84);
  assert.equal(new Set(ALL_CHARACTER_APPEARANCES.map(x=>x.id)).size,84);
  assert.equal(new Set(ALL_CHARACTER_APPEARANCES.map(x=>x.imagePath)).size,84);
  assert.equal(Object.keys(HERO_APPEARANCES).length,8);
  assert.equal(Object.keys(TROOP_APPEARANCES).length,76);
  assert.equal(new Set(Object.values(HERO_APPEARANCES).map(x=>x.description)).size,8);
  for(const {MAIN_HERO:hero} of data.heroes){
    const art=characterAppearance(hero,'hero');
    assert.equal(art.name,hero.NAME);
    assert.equal(art.nation,hero.NATION);
    assert.equal(art.kind,'hero');
  }
  for(const [key,unit] of Object.entries(data.units)){
    const art=characterAppearance(unit,key);
    assert.equal(art.id,`unit-${key}`);
    assert.equal(art.name,unit.NAME);
    assert.ok(art.imageURL.endsWith(`/${art.id}.webp`));
    assert.ok(art.frame.column>=0&&art.frame.column<art.frame.columns);
    assert.ok(art.frame.row>=0&&art.frame.row<art.frame.rows);
  }
});

test('Karl presents a morningstar and buckler instead of a shared sword hero',()=>{
  const hero=newCampaign(0).hero,art=characterAppearance(hero,'hero'),equipment=equippedAppearance(hero);
  assert.equal(art.id,'hero-karl');
  assert.match(art.description,/short brown beard/);
  assert.equal(equipment.primary.kind,'morningstar');
  assert.equal(equipment.secondary.kind,'shield');
  assert.equal(equipment.primary.label,'Morningstar');
  assert.notEqual(art.id,characterAppearance(newCampaign(4).hero,'hero').id);
});

test('Japanese classes retain distinct martial, staff, ninja, samurai and ranged identities',()=>{
  assert.equal(weaponAppearance(data.units.MeleeJap1.WEAPON_PRI).kind,'fists');
  assert.equal(characterAppearance(data.units.MeleeJap1,'MeleeJap1').role,'unarmed martial artist');
  assert.equal(weaponAppearance(data.units.MeleeJap2.WEAPON_PRI).kind,'staff');
  assert.equal(weaponAppearance(data.units.MeleeJap4.WEAPON_PRI).kind,'naginata');
  assert.equal(weaponAppearance(data.units.MeleeJap7.WEAPON_PRI).kind,'ninjato');
  assert.equal(weaponAppearance(data.units.MeleeJap10.WEAPON_PRI).kind,'katana');
  assert.equal(characterAppearance(data.units.MeleeJap10,'MeleeJap10').role,'samurai');
  assert.match(characterAppearance(data.units.MeleeJap11,'MeleeJap11').description,/samurai mask/);
  assert.equal(weaponAppearance(data.units.RangedJap4.WEAPON_PRI).kind,'shuriken');
  assert.equal(weaponAppearance(data.units.RangedJap6.WEAPON_PRI).kind,'bow');
});

test('rogue class keys and generated encounter names retain rogue identity despite sampled nation',()=>{
  for(const key of ['MeleeRog1','MeleeRog2','MeleeRog3','RangedRog1','RangedRog2','RangedRog3']){
    assert.equal(data.units[key].NATION,'Viz');
    assert.equal(characterAppearance(data.units[key],key).nation,'Rog');
    const unit=createEncounterUnit(key.startsWith('Melee')?'Melee':'Ranged','Rog',Number(key.at(-1)),()=>.76);
    assert.equal(characterAppearance(unit,'encounter-enemy-3').id,`unit-${key}`);
  }
});

test('weapon art follows live model hand exchanges without changing the hero identity',()=>{
  const battle=new Battle(newCampaign(1),['MeleeGer1'],'siege','Jana',5701,{heroControl:'manual'});
  const fighter=battle.fighters[0],id=characterAppearance(fighter.hero,fighter.key).id;
  assert.equal(weaponAppearance(fighter.weaponItem).kind,'staff');
  assert.equal(battle.switchWeapons(fighter),true);
  for(let tick=0;tick<19;tick++)battle.step();
  assert.equal(weaponAppearance(fighter.weaponItem).kind,'bow');
  assert.equal(characterAppearance(fighter.hero,fighter.key).id,id);
  assert.equal(weaponAppearance(fighter.secondaryItem).kind,'staff');
});

test('weapon appearance covers every recovered item type and never defaults unknown or unarmed gear to swords',()=>{
  for(const item of Object.values(data.items)){
    if(['Clothes','Helmet'].includes(item.TYPE))continue;
    if(item.TYPE==='Fists'){assert.equal(weaponAppearance(item).kind,'fists');continue;}
    assert.notEqual(weaponAppearance(item).kind,'fists',`${item.TYPE} ${item.NAME} needs a weapon silhouette`);
  }
  assert.equal(weaponAppearance(null).kind,'fists');
  assert.equal(weaponAppearance(null).artId,null);
  assert.equal(weaponAppearance(undefined).assetFrame,null);
  assert.equal(weaponAppearance({TYPE:'unknown',NAME:'Unknown item',NATION:'All',LEVEL:0,price:0} as Item).kind,'fists');
  const hero=structuredClone(data.heroes[0].MAIN_HERO) as Hero;
  hero.WEAPON_PRI=data.units.RangedRus4.WEAPON_PRI;
  assert.equal(equippedAppearance(hero).primary.kind,'throwingAxe');
  assert.equal(characterAppearance(hero).id,'hero-karl');
});

test('all twenty named weapon variants are reachable from recovered items with the correct base silhouette',()=>{
  assert.equal(EQUIPMENT_ARTS.length,40);
  assert.equal(new Set(EQUIPMENT_ARTS.map(art=>art.id)).size,40);
  const resolved=Object.values(data.items).map(item=>weaponAppearance(item));
  for(const variant of EQUIPMENT_VARIANTS){
    const matches=resolved.filter(art=>art.artId===variant.id);
    assert.ok(matches.length>0,`${variant.id} must be selected by actual recovered equipment`);
    assert.ok(matches.every(art=>art.kind===variant.kind),`${variant.id} must retain its correct weapon motion class`);
  }
  const starbringer=Object.values(data.items).find(item=>item.NAME==='Starbringer')!;
  assert.equal(starbringer.TYPE,'OnehandedSword');
  assert.deepEqual([weaponAppearance(starbringer).kind,weaponAppearance(starbringer).artId],['sword','starbringerSword']);
  const mislabelled={...starbringer,TYPE:'OnehandedMace'};
  assert.deepEqual([weaponAppearance(mislabelled).kind,weaponAppearance(mislabelled).artId],['mace','mace']);
  assert.equal(weaponAppearance({...starbringer,TYPE:'unknown'}).artId,null);
  assert.equal(equipmentArt('bow','starbringerSword')?.id,'bow','A variant cannot replace a different weapon class.');
});

test('every canonical hero and troop loadout resolves to a matching base or named art asset',()=>{
  for(const unit of [...data.heroes.map(start=>start.MAIN_HERO),...Object.values(data.units)]){
    for(const item of [unit.WEAPON_PRI,unit.WEAPON_SEC]){
      const visual=weaponAppearance(item);
      assert.equal(visual.label,item?.NAME??'Unarmed');
      if(visual.kind==='fists'){assert.equal(visual.artId,null);continue;}
      assert.ok(visual.artId,`${unit.NAME}: ${item?.NAME} needs art`);
      const asset=equipmentArt(visual.kind,visual.artId);
      assert.equal(asset?.id,visual.artId,`${unit.NAME}: ${item?.NAME} references an unknown variant`);
      assert.equal(asset?.kind,visual.kind);
      assert.ok(asset?.imagePath.endsWith(`/${visual.artId}.webp`));
    }
  }
});

test('a canonical samurai hand exchange changes named art as well as its motion class',()=>{
  const battle=new Battle(newCampaign(0),['MeleeJap10'],'siege','Omi',5701,{heroControl:'manual'});
  const fighter=battle.fighters.find(unit=>unit.key==='MeleeJap10')!;
  assert.equal(weaponAppearance(fighter.weaponItem).artId,'goldKatana');
  assert.equal(battle.switchWeapons(fighter),true);
  for(let tick=0;tick<19;tick++)battle.step();
  assert.equal(weaponAppearance(fighter.weaponItem).artId,'silverShuriken');
  assert.equal(weaponAppearance(fighter.secondaryItem).artId,'goldKatana');
  assert.equal(characterAppearance(fighter.hero,fighter.key).id,'unit-MeleeJap10');
});
