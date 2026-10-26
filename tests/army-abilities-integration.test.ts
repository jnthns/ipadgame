import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,data,newCampaign,type Hero} from '../src/model';
function setup(type:'Bow'|'Crossbow'){
 const c=newCampaign(),key=Object.keys(data.units).find(key=>data.units[key].WEAPON_PRI.TYPE===type)!;
 c.army=Array(11).fill(key);
 const b=new Battle(c,['MeleeViz1'],'quest',c.town,123,{heroControl:'manual',reinforcementInterval:100000,initialSpawns:[{x:1,y:3,team:0,hero:true},{x:18,y:7,team:1}]});
 for(const f of b.fighters){f.recovery=1e9;f.hp=f.max=1e6;}
 b.spawn(structuredClone(data.units.MeleeViz1),'friendly',0,5,3);const target=b.fighters.at(-1)!;Object.assign(target,{recovery:1e9,hp:1000,max:1000,flee:0,shieldFlee:0});b.random=()=>.5;
 return {b,c,target,weapon:data.units[key].WEAPON_PRI};
}
test('a reserve bow cast enters the model queue and damages a friendly cell at source effect intervals',()=>{
 const {b,target,weapon}=setup('Bow');for(let i=0;i<44;i++)b.step();assert.equal(b.castArmyAbility('shower',{x:5,y:3}),true);assert.equal(b.castArmyAbility('shower',{x:5,y:3}),false);
 for(let i=0;i<8;i++)b.step();assert.equal(target.hp,1000);b.step();const damage=Math.max(0,(weapon.dmg??0)+Math.floor(.5*(weapon.rnd??0))-target.def);assert.equal(target.hp,1000-damage);
 for(let i=0;i<9;i++)b.step();assert.equal(target.hp,1000-damage*2);assert.equal(b.reserves[0].length,11,'ability does not consume reserve troops');
});
test('shower collision ignores a unit on blocked terrain and ended battles reject casts',()=>{
 const {b,target}=setup('Bow');b.setTerrainBlocked(5,3);for(let i=0;i<44;i++)b.step();b.castArmyAbility('shower',{x:5,y:3});for(let i=0;i<18;i++)b.step();assert.equal(target.hp,1000);b.result='defeat';assert.equal(b.castArmyAbility('wall',{x:5,y:3}),false);
});
test('wall arrows preserve neutral-team friendly fire, d(0)=1, and source xscale shield orientation',()=>{
 for(const facing of [-1,1]){const {b,target,weapon}=setup('Crossbow');target.facing=facing;target.shieldFlee=100;for(let i=0;i<64;i++)b.step();assert.equal(b.castArmyAbility('wall',{x:5,y:3}),true);for(let i=0;i<14;i++)b.step();const damage=Math.max(0,(weapon.dmg??0)+Math.floor(.5*(weapon.rnd??0))+1-target.def);assert.equal(target.hp,facing===-1?1000-damage:1000);if(facing===1){assert.ok(b.projectiles.some(p=>p.team===-1&&p.facing===-1));}}
});
