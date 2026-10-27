import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,newCampaign,seedRandom} from '../src/model';
import fixture from './fixtures/root-bytecode.json';
import {runBytecode} from './helpers/avm1';

type Cell={empty:boolean;free:boolean};
function originalFreeRow(field:Cell[][],x:number,random:()=>number){
 let draws=0;
 const row=runBytecode(fixture.methods.getFreeY,fixture.pool,{1:{field},4:x},{F_HEIGHT:8,d:(n:number)=>{draws++;return Math.floor(random()*n)+1;}}).stack.at(-1) as number;
 return {row,draws};
}
function setup(allies:number,enemies:number,reserveAllies:number,reserveEnemies:number){
 const c=newCampaign();c.army=[];
 const b=new Battle(c,[],'quest',c.town,1,{heroControl:'manual',initialSpawns:[{x:2,y:3,team:0,hero:true}]});
 if(allies===0)b.fighters[0].hp=0;
 for(let i=1;i<allies;i++)b.spawn(c.hero,'ally',0,2+Math.floor(i/8),i%8);
 for(let i=0;i<enemies;i++)b.spawn(c.hero,'enemy',1,17-Math.floor(i/8),i%8);
 b.reserves=[Array(reserveAllies).fill('MeleeViz1'),Array(reserveEnemies).fill('MeleeViz1')];
 return b;
}

test('original commandAI/getTeamCount/getFreeY bytes match reserve limits, team order and RNG over 675 cases',()=>{
 let cases=0;
 for(const allies of [0,1,9,10,11])for(const enemies of [0,1,9,10,11])for(const reserveAllies of [0,1,3])for(const reserveEnemies of [0,1,3])for(const seed of [1,7,19]){
  // Exercise empty source commands too, but retain a hero for gameplay comparisons.
  const b=setup(allies,enemies,reserveAllies,reserveEnemies),start=b.fighters.length;
  b.setTerrainBlocked(0,0);b.setTerrainBlocked(19,7);
  const field=Array.from({length:20},(_,x)=>Array.from({length:8},(_,y)=>{const cell=b.cellState(x,y);return {empty:cell.empty,free:cell.free};}));
  const sourceRandom=seedRandom(seed),modelRandom=seedRandom(seed);let sourceDraws=0,modelDraws=0;
  b.random=()=>{modelDraws++;return modelRandom();};
  const root:Record<string,any>={scr:{reinitArrowStorm:()=>{refreshes++;}},gotoAndStop:(label:string)=>{transition=label;}};
  const global={field,HERO:b.nextId};let refreshes=0,unloaded=false,transition='';
  for(const f of b.fighters)root['hero'+f.id]={HP:f.hp,team:f.team};
  const friends=[...b.reserves[0]],foes=[...b.reserves[1]],spawned:{team:number;x:number;y:number}[]=[];
  const scope:Record<string,any>={MAX_UNIT_AMOUNT:10,FRIENDS:friends,ENEMIES:foes,unloadMap:()=>{unloaded=true;},getTeamCount:(team:number)=>runBytecode(fixture.methods.getTeamCount,fixture.pool,{1:root,2:global,5:team}).stack.at(-1)};
  scope.reinforceUnit=(_unit:string,team:number)=>{const x=19*team;const {row:y,draws}=originalFreeRow(field,x,()=>sourceRandom());sourceDraws+=draws;spawned.push({team,x,y});field[x][y].empty=false;root['hero'+global.HERO++]={HP:100,team};};
  runBytecode(fixture.methods.commandAI,fixture.pool,{1:root},scope);
  b.reinforce();
  assert.deepEqual(b.reserves,[friends,foes]);
  assert.deepEqual(b.fighters.slice(start).map(f=>({team:f.team,x:f.x,y:f.y})),spawned);
  assert.equal(modelDraws,sourceDraws);
  assert.equal(refreshes,spawned.some(f=>f.team===0)?1:0);
  assert.equal(unloaded,enemies===0&&reserveEnemies===0);
  assert.equal(transition,unloaded?'VICTORY':'');
  cases++;
 }
 assert.equal(cases,675);
});

test('source free-row retry guard consumes 152 draws including the initial sample',()=>{
 const field=Array.from({length:20},()=>Array.from({length:8},()=>({empty:false,free:false})));
 field[0][6]={empty:true,free:true};field[0][7]={empty:true,free:true};
 let draws=0;const result=originalFreeRow(field,0,()=>++draws===152?.99:0);
 assert.deepEqual(result,{row:7,draws:152});
 const b=setup(1,1,1,0);for(let y=0;y<6;y++)b.setTerrainBlocked(0,y);draws=0;b.random=()=>++draws===152?.99:0;b.reinforce();
 assert.equal(draws,152);assert.equal(b.fighters.at(-1)?.y,7);
});

test('fully blocked source edge exhausts 152 draws and returns an overlap, while port deliberately defers',()=>{
 const field=Array.from({length:20},()=>Array.from({length:8},()=>({empty:false,free:false})));
 assert.deepEqual(originalFreeRow(field,0,()=>.5),{row:4,draws:152});
 const b=setup(1,1,1,0);for(let y=0;y<8;y++)b.setTerrainBlocked(0,y);let draws=0;b.random=()=>{draws++;return .5;};b.reinforce();
 assert.equal(draws,0);assert.equal(b.reserves[0].length,1);assert.equal(b.alive(0).length,1);
});
