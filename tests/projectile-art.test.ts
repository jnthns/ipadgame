import {test} from 'node:test';
import assert from 'node:assert/strict';
import {data,type CombatProjectile,type Item} from '../src/model';
import {ProjectileArtCache,projectileArtRotation,resolveProjectileArt} from '../src/projectile-art';

const projectile=(overrides:Partial<CombatProjectile>={}):CombatProjectile=>({id:1,team:0,shooterId:42,facing:1,x:1,y:1,pixelX:60,pixelY:37.5,plusX:20,plusY:0,destination:{x:10,y:1},damage:8,random:2,critical:false,grenade:false,active:true,...overrides});
const item=(name:string)=>Object.values(data.items).find(value=>value.NAME===name)!;
const sources=(weaponItem:Item)=>[{id:42,weaponItem}];

test('throwing projectiles preserve the four nations actual weapon forms and named artwork',()=>{
  const cases=[
    ['Viz','Greek Fire','fire','fire'],
    ['Ger','Holy Touches','throwingKnife','silverThrowingKnife'],
    ['Rus','Rounded Throwing Axe','throwingAxe','throwingAxe'],
    ['Jap','Black Spirits','shuriken','blackShuriken'],
  ];
  for(const [nation,name,kind,artId] of cases){
    const weapon=item(name);assert.ok(weapon,name);assert.equal(weapon.NATION,nation);
    const shot=projectile({grenade:nation==='Viz'}),before=JSON.stringify([shot,weapon]);
    const art=resolveProjectileArt(shot,sources(weapon));
    assert.deepEqual([art.kind,art.artId],[kind,artId]);
    assert.ok(art.size>=16&&art.size<=20);
    assert.equal(JSON.stringify([shot,weapon]),before,'Art selection must not modify model projectiles or equipment.');
  }
});

test('bows, crossbows and neutral reserve abilities remain arrows with safe missing-shooter fallback',()=>{
  for(const name of ['Holy Bow','Samurai Bow','Forged Crossbow','Elite Crossbow']){
    assert.equal(resolveProjectileArt(projectile(),sources(item(name))).kind,'arrow');
  }
  assert.equal(resolveProjectileArt(projectile({team:-1,shooterId:-1}),sources(item('Black Spirits'))).kind,'arrow');
  assert.equal(resolveProjectileArt(projectile({team:-1}),sources(item('Holy Touches'))).kind,'arrow');
  assert.equal(resolveProjectileArt(projectile()).kind,'arrow');
  assert.deepEqual(resolveProjectileArt(projectile({grenade:true})),{kind:'fire',artId:'fire',size:18});
});

test('an airborne projectile retains its captured art after the shooter exchanges weapons',()=>{
  const cache=new ProjectileArtCache(),shot=projectile(),fighter={id:42,weaponItem:item('Black Spirits')};
  const art=cache.sync([shot],[fighter]).get(shot.id);
  assert.equal(art?.artId,'blackShuriken');
  fighter.weaponItem=item('Holy Bow');
  const next=projectile({id:2});
  cache.sync([shot,next],[fighter]);
  assert.equal(cache.get(shot.id),art,'Existing flights retain the original immutable snapshot.');
  assert.equal(cache.get(next.id)?.kind,'arrow','New flights sample the newly active item.');
  cache.sync([{...shot,active:false},next],[fighter]);
  assert.equal(cache.size,1);assert.equal(cache.get(shot.id),undefined);
  cache.sync([],[fighter]);assert.equal(cache.size,0);
});

test('projectile appearance caches remain bounded by active model flights',()=>{
  const cache=new ProjectileArtCache();
  for(let id=0;id<1000;id++){
    cache.sync([projectile({id}),projectile({id:id+1000,active:false})],sources(item('Silver Shuriken')));
    assert.equal(cache.size,1);
  }
  cache.clear();assert.equal(cache.size,0);
});

test('thrown blades align with velocity while axes and shuriken spin only with presentation time',()=>{
  const knife=resolveProjectileArt(projectile(),sources(item('Holy Touches')));
  assert.equal(projectileArtRotation(knife,projectile(),500),Math.PI/2);
  assert.equal(projectileArtRotation(knife,projectile({plusX:-20}),500),Math.PI*1.5);
  for(const name of ['Silver Shuriken','Rounded Throwing Axe']){
    const art=resolveProjectileArt(projectile(),sources(item(name))),shot=projectile();
    const frozen=projectileArtRotation(art,shot,500);
    assert.equal(projectileArtRotation(art,shot,500),frozen,'Paused render clocks cannot advance spin.');
    assert.notEqual(projectileArtRotation(art,shot,550),frozen);
  }
});
