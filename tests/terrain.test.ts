import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import raw from '../src/battle-terrain.json';
type Obstacle={depth:number;characterId:number;name:string;originTwips:number[];originPixels:number[];cell:number[];insideGrid:boolean;placementTagOffset:number};
type Spawn={depth:number;characterId:number;hero:boolean;source:string;team:number;queue:string|null;queueOrdinalHint:number|null;constructSource:string;originTwips:number[];originPixels:number[];cell:number[];placementTagOffset:number};
const terrain=raw as unknown as {schemaVersion:number;provenance:{swfSha256:string;swfBytes:number;fps:number;rootFrameCount:number;mapFrameOffset:number;firstNonBattleFrame:number;collisionModel:string;nestedObstacleCatalogFrames:Record<string,number[]>;spawnOrder:string};grid:{width:number;height:number;cellWidth:number;cellHeight:number;skyHeight:number};blockingTypes:{characterId:number;name:string;registration:string;initializer:string}[];maps:Record<string,{rootFrame:number;blockedCells:number[][];obstacles:Obstacle[];initialSpawns:Spawn[];spawnTerrainOverlaps:{cell:number[];spawnDepth:number;obstacleDepths:number[]}[]}>};

test('terrain covers the exact eighty root battle frames of the verified original SWF',()=>{
 assert.equal(terrain.schemaVersion,1);assert.equal(terrain.provenance.swfSha256,'31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca');
 assert.deepEqual(terrain.grid,{width:20,height:8,cellWidth:40,cellHeight:25,skyHeight:300});
 assert.equal(terrain.provenance.swfBytes,961010);assert.equal(terrain.provenance.fps,30);assert.equal(terrain.provenance.rootFrameCount,92);
 assert.deepEqual(Object.keys(terrain.maps).map(Number),Array.from({length:80},(_,i)=>i+1));
 for(const [id,map] of Object.entries(terrain.maps))assert.equal(map.rootFrame,Number(id)+4);
 assert.equal(terrain.maps['80'].rootFrame,terrain.provenance.firstNonBattleFrame-1);
});

test('all blocked cells reproduce the original Tree.init origin rule, not sprite hit boxes',()=>{
 // Verbatim source expressions from frame_1/DoAction.as, evaluated independently.
 const ctx=vm.createContext({CAGE_W:40,CAGE_H:25,SKY_HEIGHT:300,Math});
 const getX=vm.runInContext('(function getX(xx){return Math.floor(xx / CAGE_W);})',ctx);
 const getY=vm.runInContext('(function getY(yy){return Math.floor((yy - SKY_HEIGHT) / CAGE_H);})',ctx);
 const blockers=new Map(terrain.blockingTypes.map(t=>[t.characterId,t]));assert.equal(blockers.size,31);
 let total=0;
 for(const map of Object.values(terrain.maps)){
  const computed=new Set<string>();
  for(const o of map.obstacles){
   assert.ok(blockers.has(o.characterId));assert.equal(o.name,blockers.get(o.characterId)!.name);
   assert.deepEqual(o.originPixels,o.originTwips.map(n=>n/20));assert.deepEqual(o.cell,[getX(o.originPixels[0]),getY(o.originPixels[1])]);
   assert.equal(o.insideGrid,true);assert.ok(o.cell[0]>=0&&o.cell[0]<20&&o.cell[1]>=0&&o.cell[1]<8);
   assert.ok(Number.isInteger(o.placementTagOffset)&&o.placementTagOffset>0);computed.add(o.cell.join(','));
  }
  assert.deepEqual(new Set(map.blockedCells.map(c=>c.join(','))),computed);total+=map.blockedCells.length;
 }
 assert.equal(total,556);assert.match(terrain.provenance.collisionModel,/no hitTest or sprite-bound inference/);
});

test('audited first-map placements have the original exact matrix translations and resulting cells',()=>{
 assert.deepEqual(terrain.maps['1'].blockedCells,[[4,0],[15,0],[13,1],[8,3],[15,4]]);
 assert.deepEqual(terrain.maps['1'].obstacles.map(o=>[o.depth,o.characterId,o.name,o.originTwips,o.cell]),[
  [247,895,'Barrel',[10780,6838],[13,1]],
  [269,885,'Crate_1',[3577,6327],[4,0]],
  [272,1501,'TreeBroken_1',[12294,8321],[15,4]],
  [275,923,'Well_1',[6867,7853],[8,3]],
  [279,915,'Tree_10',[12412,6282],[15,0]],
 ]);
 assert.deepEqual(terrain.maps['61'].blockedCells,[[6,0],[15,0],[5,7]]);
 assert.deepEqual(terrain.maps['80'].blockedCells,[[3,0],[4,0],[16,0],[3,1],[17,1],[10,2],[11,4],[7,6],[15,7]]);
});

test('initial spawn markers retain twenty troop slots plus the separate hero and audited construct metadata',()=>{
 for(const map of Object.values(terrain.maps)){
  assert.equal(map.initialSpawns.length,21);assert.equal(map.initialSpawns.filter(s=>s.team===0&&!s.hero).length,10);assert.equal(map.initialSpawns.filter(s=>s.team===1).length,10);
  const hero=map.initialSpawns.filter(s=>s.hero);assert.equal(hero.length,1);assert.deepEqual([hero[0].cell,hero[0].team,hero[0].depth],[[0,4],0,241]);
  const seen=new Set<string>();
  for(const s of map.initialSpawns){assert.ok(s.cell[0]>=0&&s.cell[0]<20&&s.cell[1]>=0&&s.cell[1]<8);const k=s.cell.join(',');assert.ok(!seen.has(k));seen.add(k);assert.ok(s.constructSource.startsWith('frame_5/'));assert.equal(s.hero?s.queue===null:s.queue===(s.team===0?'FRIENDS':'ENEMIES'),true);}
 }
 assert.deepEqual(terrain.maps['1'].initialSpawns.filter(s=>s.team===0&&!s.hero).map(s=>s.cell),[[1,0],[1,1],[1,3],[1,6],[1,7],[0,0],[0,1],[0,3],[0,6],[0,7]]);
 assert.match(terrain.provenance.spawnOrder,/not been replay-verified/);
 // Preserve the two actual source overlaps; silently relocating a marker would
 // erase evidence rather than reconstruct the original geometry.
 assert.deepEqual(Object.entries(terrain.maps).filter(([,m])=>m.spawnTerrainOverlaps.length).map(([id,m])=>[id,m.spawnTerrainOverlaps.map(o=>[o.cell,o.spawnDepth])]),[['2',[[[18,7],213]]],['4',[[[18,7],213]]]]);
});

test('nested obstacle catalogue is confined to nonbattle frame two and reinforcement edge columns stay free',()=>{
 assert.deepEqual(terrain.provenance.nestedObstacleCatalogFrames,{'929':[2]});
 for(const map of Object.values(terrain.maps))for(const cell of map.blockedCells)assert.ok(cell[0]!==0&&cell[0]!==19);
});

test('SWF matrix decoder handles signed translations and scale independently of origin-cell collision',()=>{
 const script=`import importlib.util,json
s=importlib.util.spec_from_file_location('terrain','tools/extract-terrain.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
def u(n,b):return format(n if n>=0 else (1<<b)+n,'0'+str(b)+'b')
# HasScale1, NScaleBits19 (signed), scaleX2.0, scaleY0.5; no rotate; NTranslateBits14.
bits='1'+u(19,5)+u(131072,19)+u(32768,19)+'0'+u(14,5)+u(-100,14)+u(6500,14)
bits+='0'*((-len(bits))%8)
raw=int(bits,2).to_bytes(len(bits)//8,'big')
print(json.dumps(m.matrix(raw,0)))`;
 const parsed=JSON.parse(execFileSync('python3',['-c',script],{encoding:'utf8'}));
 assert.deepEqual(parsed,{a:2,b:0,c:0,d:.5,tx:-100,ty:6500});
});

test('extractor reproduces committed terrain and formations from the verified SWF',{
 skip:!existsSync('reference/feudalism.swf')||!existsSync('reference/decompiled/scripts/__Packages/Tree.as'),
},()=>{
 const dir=mkdtempSync(join(tmpdir(),'feudalism-terrain-'));
 try{const output=join(dir,'terrain.json');execFileSync('python3',['tools/extract-terrain.py','--output',output],{encoding:'utf8'});assert.deepEqual(JSON.parse(readFileSync(output,'utf8')),raw);}finally{rmSync(dir,{recursive:true,force:true});}
});
