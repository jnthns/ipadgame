import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,newCampaign,weaponStats,UNARMED,type Hero} from '../src/model';
import {SKILLS,canUpgradeSkill} from '../src/progression';
import {SKILL_INFO,weaponSkill,equippedSkillWeapons,skillCardsMarkup,weaponSkillMarkup} from '../src/hero-skills';
import {itemComparison,itemSummary} from '../src/item-cards';

const sieg=()=>newCampaign(7).hero;
function combatHero(hero:Hero){const c=newCampaign(7);c.hero=hero;return new Battle(c,[],'encounter',c.town,1).fighters.find(f=>f.key==='hero')!;}

test('Sieg ninja-to and shuriken use Far East 70; Sword 0 and Unarmed 100 do not drive their combat values',()=>{
 const hero=sieg();
 assert.equal(hero.NAME,'Sieg');assert.equal(hero.SKILL.FarEast,70);assert.equal(hero.SKILL.Sword,0);assert.equal(hero.SKILL.Fist,100);
 for(const item of [hero.WEAPON_PRI,hero.WEAPON_SEC]){
  assert.equal(weaponSkill(item),'FarEast');assert.equal(weaponStats(hero,item).hit,70);
 }
 const before=combatHero(hero);
 const changed=structuredClone(hero);changed.SKILL.Sword=100;changed.SKILL.Fist=0;
 const after=combatHero(changed);
 assert.deepEqual(after.weapon,before.weapon);assert.deepEqual(after.secondaryWeapon,before.secondaryWeapon);
 assert.equal(before.weapon.hit,70);assert.equal(before.weapon.crit,17);
 changed.SKILL.FarEast=80;
 assert.equal(combatHero(changed).weapon.hit,80);assert.equal(combatHero(changed).weapon.crit,18);
 assert.equal(weaponStats(hero,UNARMED).hit,100);
});

test('skill explanations identify both equipped Sieg weapons and do not imply a 100% hit guarantee',()=>{
 const hero=sieg(),names=equippedSkillWeapons(hero,'FarEast');
 assert.deepEqual(names,['Short Ninja-To','Shuriken']);assert.deepEqual(equippedSkillWeapons(hero,'Sword'),[]);
 const markup=skillCardsMarkup(hero,key=>canUpgradeSkill(hero,key));
 for(const key of SKILLS){assert.ok(SKILL_INFO[key].description.length>20);assert.ok(markup.includes(`data-skill-card="${key}"`));}
 assert.match(markup,/Used by: Short Ninja-To · Shuriken/);
 assert.match(markup,/Unarmed/);assert.match(markup,/bare-handed attacks only/);

 const summary=weaponSkillMarkup(hero);
 assert.match(summary,/Far East Weapons · 70 \/ 100 proficiency/);
 assert.match(summary,/Base accuracy 70 · Critical chance 17%/);
 assert.doesNotMatch(summary,/Swords · 0/);
 assert.match(itemSummary(hero.WEAPON_PRI),/Far East Weapons/);
 assert.match(itemComparison(hero,hero.WEAPON_SEC!),/Far East Weapons: 70 \/ 100/);
});

test('weapon explanations follow saved item metadata, flag zero proficiency, and exclude shields/armor',()=>{
 const hero=sieg();hero.WEAPON_PRI={...hero.WEAPON_PRI,skill:'Sword',NAME:'Imported Blade'};
 assert.equal(weaponSkill(hero.WEAPON_PRI),'Sword');
 assert.match(weaponSkillMarkup(hero),/Swords · 0 \/ 100 proficiency/);
 assert.match(itemComparison(hero,hero.WEAPON_PRI),/No proficiency/);
 const karl=newCampaign(0).hero;
 assert.equal(weaponSkill(karl.WEAPON_SEC),null);
 assert.equal(weaponSkill(karl.ARMOR),null);
 assert.doesNotMatch(weaponSkillMarkup(karl),/Small Buckler/);
 assert.equal(weaponSkill(null),'Fist');
});

test('leadership caps and skill upgrade eligibility remain visible and unchanged',()=>{
 const hero=sieg();hero.SKILL.Patriotism=hero.INT*2;hero.free_points=5;
 const markup=skillCardsMarkup(hero,key=>canUpgradeSkill(hero,key));
 assert.match(markup,/Patriotism <span class="text-gold">20 \/ 20/);
 assert.match(markup,/raise INT/);
 assert.equal(canUpgradeSkill(hero,'Patriotism'),false);
 assert.equal(canUpgradeSkill(hero,'Fist'),false);
 assert.equal(canUpgradeSkill(hero,'FarEast'),true);
});
