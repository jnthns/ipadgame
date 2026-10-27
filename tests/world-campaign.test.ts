import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {newCampaign,data,recruit,maxHP,UNARMED} from '../src/model';
import {readCampaignSave,buyConsumable} from '../src/campaign-actions';
import {WorldTravel,world,boardShip,enterTown,collectTownReward,acceptDelivery,completeCombatContract,buyHorse,sellHorse,townFacilities} from '../src/world-campaign';
import {geometry,worldHit,townAt,questAt,maskContains} from '../src/world-geometry';

const originalFrame=`function(){var a,nx,ny;if(this.gox!=null&&this.goy!=null){a=Math.atan2(this.goy-this.avatar._y,this.gox-this.avatar._x);nx=this.avatar._x+this.speed*Math.cos(a);ny=this.avatar._y+this.speed*Math.sin(a);if(Math.abs(this.avatar._x-this.gox)<this.speed&&Math.abs(this.avatar._y-this.goy)<this.speed)this.stopMoving();if(!_global.SAILING_SHIP?this.ground.hitTest(nx,ny,true):this.sea.hitTest(nx,ny,true)){this.randomEncounter();this.avatar._x=nx;this.avatar._y=ny;}else{this.gox=null;this.goy=null;}}}`;

test('world movement matches original onEnterFrame for land, sea, strict arrival and blocked steps',()=>{
 for(const sailing of [false,true])for(const [start,target] of [[{x:38.3,y:437.15},{x:63,y:455}],[{x:300,y:400},{x:400,y:420}],[{x:790,y:590},{x:780,y:580}]] as const){
  const c=newCampaign();const w=world(c);Object.assign(w,{...start,town:null,target:{...target},sailing});const travel=new WorldTravel(c);travel.random=()=>.99;
  const a={avatar:{_x:start.x,_y:start.y},gox:target.x as number|null,goy:target.y as number|null,speed:2,ground:{hitTest:(x:number,y:number)=>worldHit('ground',{x,y})},sea:{hitTest:(x:number,y:number)=>worldHit('sea',{x,y})},stopMoving(){this.gox=this.goy=null;},randomEncounter(){}};
  const run=vm.runInNewContext('('+originalFrame+')',{Math,_global:{SAILING_SHIP:sailing}});
  for(let i=0;i<25;i++){const event=travel.step();run.call(a);assert.ok(Math.abs(w.x-a.avatar._x)<1e-10);assert.ok(Math.abs(w.y-a.avatar._y)<1e-10);assert.equal(!!w.target,a.gox!==null);if(event?.type==='arrive')break;}
 }
});

test('source collision geometry, map placements and facility frames are complete',()=>{
 assert.equal(Object.keys(geometry.towns).length,32);assert.equal(Object.keys(geometry.questAvatars).length,15);assert.equal(Object.keys(geometry.masks).length,7);
 for(const [id,t] of Object.entries(geometry.towns)){assert.equal(worldHit('ground',t),true,id);assert.equal(townAt(t),id);assert.equal(townFacilities(id).stables,!!data.towns[id].barn.length);}
 for(let id=0;id<15;id++){const p=(geometry.questAvatars as Record<string,{x:number;y:number}>)[`quest_avatar_${id}`];assert.equal(questAt(id,p),true);}
 assert.equal(worldHit('ground',{x:790,y:590}),false);assert.equal(worldHit('sea',{x:790,y:590}),true);assert.equal(worldHit('landViz',geometry.towns.Trapezus),true);assert.equal(worldHit('landGer',geometry.towns.Jana),true);
});

test('vector hit tests handle curved boundaries, multiple fill regions, holes and strokes',()=>{
 const base={bounds:[0,200,0,200],nonzeroWinding:false,fillCount:1,strokeWidths:[0],matrix:{a:1,b:0,c:0,d:1,tx:0,ty:0},characterId:0};
 const square=[[1,0,0,0,0,200,0],[1,0,0,200,0,200,200],[1,0,0,200,200,0,200],[1,0,0,0,200,0,0]];
 const hole=[[1,0,0,50,50,150,50],[1,0,0,150,50,150,150],[1,0,0,150,150,50,150],[1,0,0,50,150,50,50]];
 assert.equal(maskContains({...base,edges:[...square,...hole]},{x:1,y:1}),true);assert.equal(maskContains({...base,edges:[...square,...hole]},{x:5,y:5}),false);
 const curve={...base,edges:[[1,0,0,0,0,100,200,200,0],[1,0,0,200,0,0,0]]};assert.equal(maskContains(curve,{x:5,y:4}),true);assert.equal(maskContains(curve,{x:5,y:6}),false);
 const stroke={...base,strokeWidths:[0,20],edges:[[0,0,1,0,0,100,200,200,0]]};assert.equal(maskContains(stroke,{x:5,y:5.4}),true);assert.equal(maskContains(stroke,{x:5,y:6}),false);
});

test('world extractor reproduces the committed vectors from the original SWF', {skip:!existsSync('reference/feudalism.swf')},()=>{
 const p=spawnSync('python',['-c',"import importlib.util,pathlib,json;s=importlib.util.spec_from_file_location('w','tools/extract-world.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);print(json.dumps(m.extract(pathlib.Path('reference/feudalism.swf'))))"],{encoding:'utf8',maxBuffer:2e6});assert.equal(p.status,0,p.stderr);assert.deepEqual(JSON.parse(p.stdout),JSON.parse(readFileSync('src/world-geometry.json','utf8')));
});

test('travel takes real ticks, gates remote services and arrival docks a rented ship',()=>{
 const c=newCampaign(),t=new WorldTravel(c),w=world(c);const before={x:w.x,y:w.y};assert.equal(t.moveTo(geometry.towns.Lutetia),true);assert.deepEqual({x:w.x,y:w.y},before);assert.equal(w.town,null);assert.notEqual(buyConsumable(c,'smallPotion'),null);assert.equal(recruit(c,'MeleeViz1'),false);
 enterTown(c,'Ravenna');c.gold=5000;assert.equal(boardShip(c),null);assert.equal(c.gold,1000);assert.equal(w.sailing,true);enterTown(c,'Arretium');assert.equal(w.shipTown,'Arretium');assert.equal(w.sailing,false);assert.equal(boardShip(c),'Not enough gold to rent a ship.');assert.equal(c.gold,1000);
 enterTown(c,'Trapezus');c.gold=5000;assert.match(boardShip(c)!,/harbor/);assert.equal(c.gold,5000);
});

test('random encounter formulas produce valid rosters and all source map ranges',()=>{
 for(const scenario of ['rogue','hostile','sea','shore'] as const){const c=newCampaign(),t=new WorldTravel(c),w=world(c);c.hero.LEVEL=50;c.hostile=['Viz'];Object.assign(w,{x:38.3,y:437.15,town:null,target:{x:45,y:440},sailing:scenario==='sea'});if(scenario==='sea')Object.assign(w,{x:790,y:590,target:{x:780,y:590}});if(scenario==='shore')Object.assign(w,{x:254.05,y:498,target:{x:255,y:500}});
  let calls=0;t.random=()=>{calls++;return scenario==='hostile'&&calls===1?.99:0;};const event=t.step();assert.ok(event?.type==='encounter',scenario);if(event.type!=='encounter')continue;assert.ok(event.enemies.every(h=>h.WEAPON_PRI&&h.CON>0&&h.NAME));assert.equal(event.enemies.length,scenario==='hostile'?9:1);assert.ok(scenario==='sea'?event.mapId>=53&&event.mapId<=56:event.mapId>=41&&event.mapId<=76);assert.equal(w.target,null);
 }
});

test('delivery and combat rewards require the right town hall and pay once',()=>{
 const c=newCampaign(),before=c.gold;assert.equal(acceptDelivery(c,'Lutetia',450),null);assert.equal(c.gold,before);assert.equal(collectTownReward(c),0);enterTown(c,'Lutetia');assert.equal(collectTownReward(c),450);assert.equal(collectTownReward(c),0);assert.equal(c.gold,before+450);assert.equal(world(c).delivery,null);
 c.quest={town:'Trapezus',count:2,reward:300,avatarId:8};completeCombatContract(c);assert.equal(c.quest,null);assert.equal(collectTownReward(c),0);enterTown(c,'Trapezus');assert.equal(collectTownReward(c),300);assert.equal(collectTownReward(c),0);
});

test('horse purchases preserve source full-price gate, rounded trade-in and mounted combat bonuses',()=>{
 const c=newCampaign();enterTown(c,'Ravenna');c.gold=2000;c.hero.WEAPON_PRI={...UNARMED};c.hero.WEAPON_SEC=null;const hp=maxHP(c.hero);const first=data.towns.Ravenna.barn[0],next=data.towns.Ravenna.barn[1];assert.equal(buyHorse(c,0),null);assert.equal(maxHP(c.hero),hp+first.bonus_HP);assert.equal(c.gold,2000-first.price);c.gold=next.price-1;const old=structuredClone(c.hero.HORSE);assert.match(buyHorse(c,1)!,/gold/);assert.deepEqual(c.hero.HORSE,old);c.gold=next.price;assert.equal(buyHorse(c,1),null);assert.equal(c.gold,Math.round(first.price/3));assert.equal(sellHorse(c),null);assert.equal(c.hero.HORSE,null);assert.equal(c.gold,Math.round(first.price/3)+Math.round(next.price/3));
 c.hero.WEAPON_PRI=Object.values(data.items).find(i=>i.TYPE==='Staff')!;c.gold=10000;assert.match(buyHorse(c,0)!,/weapon/);assert.equal(c.gold,10000);
});

test('world state round-trips, resumes deterministic RNG, and rejects malformed positions/targets/rewards/horses',()=>{
 const c=newCampaign(),t=new WorldTravel(c);t.moveTo({x:60,y:450});t.random();const restored=readCampaignSave(JSON.stringify(c)),other=new WorldTravel(restored);assert.equal(t.random(),other.random());assert.deepEqual(restored.world,c.world);
 for(const change of [{x:Infinity},{seed:-1},{target:{x:900,y:1}},{town:'constructor'},{rewards:[{town:'Lutetia',gold:-1}]},{delivery:{from:'Trapezus',to:'constructor',gold:400}},{sailing:'yes'}])assert.throws(()=>readCampaignSave(JSON.stringify({...c,world:{...c.world,...change}})),/world/);
 assert.throws(()=>readCampaignSave(JSON.stringify({...c,hero:{...c.hero,HORSE:{skin_color:'white',bonus_HP:-1,bonus_DEF:0,bonus_speed:1,price:100}}})),/horse/);
});


test('combat contracts trigger at their original map marker rather than directly at the town hall',()=>{const c=newCampaign(),w=world(c),t=new WorldTravel(c);c.quest={town:c.town,count:2,reward:300,avatarId:8};const p=geometry.questAvatars.quest_avatar_8;Object.assign(w,{x:p.x,y:p.y,town:null,target:{x:p.x,y:p.y}});t.random=()=>.5;const e=t.step();assert.equal(e?.type,'quest');if(e?.type==='quest'){assert.equal(e.enemies.length,2);assert.ok(e.mapId>=33&&e.mapId<=40);}assert.equal(w.rewards.length,0);assert.equal(c.quest.reward,300);});

test('neutral towns permit merchants but recruitment requires town ownership',()=>{const c=newCampaign();enterTown(c,'Lutetia');c.gold=100000;const r=data.towns.Lutetia.barracks[0],key=r.TYPE+r.NATION+r.ID;assert.equal(recruit(c,key),false);assert.equal(buyConsumable(c,'smallPotion'),null);c.captured.push('Lutetia');assert.equal(recruit(c,key),true);});
