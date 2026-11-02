import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {data,newCampaign} from '../src/model';
import {initializeEconomy,readCampaignSave} from '../src/campaign-actions';
import {RootClock} from '../src/root-clock';
import {IdleSceneClock} from '../src/idle-scene-clock';

// Execute the real UI handlers without loading Phaser's browser renderer.
const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true);
const names=['confirmNewGame','renderStart','resetHeroControls','save'];
const handlers=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&names.includes(node.name?.text??'')).map(node=>node.getText(ast)).join('\n');
assert.equal(ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&names.includes(node.name?.text??'')).length,names.length);
const code=ts.transpileModule(handlers,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
function harness(inBattle=false){
 const original=newCampaign(0);original.gold=0;original.army=[];original.battles=12;
 const store=new Map([['feudalism-campaign-v1',JSON.stringify(original)],['unrelated-app','keep']]);
 const clicks=new Map<string,(event?:unknown)=>void>();
 const content={innerHTML:''};let removed=false,destroyed=0,rendered=0,dialog='',focused=false;
 const rootClock=new RootClock(20);
 const context=vm.createContext({
  campaign:original,battle:inBattle?{setHeroInput(){}}:null,checkpoint:structuredClone(original),
  game:{destroy(){destroyed++;}},battleScene:{input:{keyboard:{resetKeys(){}}}},mapScene:{},
  view:'journal',selected:'Jana',pendingWorldFocus:'Jana',atlasGeneration:7,
  worldPaused:false,paused:false,speed:2,control:'army',resultShown:true,battleMapId:79,
  armyAbilityTarget:'shower',heroControls:{reset(){}},previousFrame:123,rootClock,idleSceneClock:new IdleSceneClock(rootClock),RootClock,IdleSceneClock,
  SAVE:'feudalism-campaign-v1',localStorage:{removeItem(key:string){store.delete(key);},setItem(key:string,value:string){store.set(key,value);}},
  bind(selector:string,handler:(event?:unknown)=>void){clicks.set(selector,handler);},
  modal(html:string){dialog=html;},closeModal(){removed=true;},render(){rendered++;},
  refreshSupplyButtons(){},syncBattleHUD(){},notify(){},data,newCampaign,initializeEconomy,
  heroSelectionMarkup(){return '';},cityURL:'city.webp',
  document:{querySelector(selector:string){return selector==='#content'?content:{focus(){focused=true;}};}},
 });
 vm.runInContext(code,context);
 return {context,store,clicks,original,content,get removed(){return removed;},get destroyed(){return destroyed;},get rendered(){return rendered;},get dialog(){return dialog;},get focused(){return focused;}};
}

test('New Game is available in the campaign header and Journal through the same confirmation',()=>{
 assert.match(source,/id="new-game"[^>]*>New Game/);
 assert.ok(source.includes("bind('#new-game',confirmNewGame)"));
 assert.ok(source.includes("bind('#restart',confirmNewGame)"));
});

test('confirmation pauses travel/combat; cancel preserves the exact save, campaign and checkpoint',()=>{
 for(const inBattle of [false,true])for(const wasPaused of [false,true]){
  const h=harness(inBattle),before=h.store.get('feudalism-campaign-v1'),checkpoint=h.context.checkpoint;
  h.context.paused=wasPaused;h.context.worldPaused=wasPaused;
  vm.runInContext('confirmNewGame()',h.context);
  assert.equal(h.context.paused,true);assert.equal(h.context.worldPaused,true);
  assert.equal(h.context.campaign,h.original);assert.equal(h.store.get('feudalism-campaign-v1'),before);
  assert.match(h.dialog,/permanently deletes all progress/);assert.match(h.dialog,/cannot be undone/);
  h.clicks.get('#cancel-new')!();
  assert.equal(h.context.campaign,h.original);assert.equal(h.context.checkpoint,checkpoint);
  assert.equal(h.store.get('feudalism-campaign-v1'),before);assert.equal(h.destroyed,0);
  assert.equal(h.context.paused,wasPaused);assert.equal(h.context.worldPaused,wasPaused);assert.ok(h.focused);
 }
});

test('confirmed reset clears saved and live progress, then every champion starts and reloads fresh',()=>{
 for(let index=0;index<data.heroes.length;index++){
  const h=harness(true);vm.runInContext('confirmNewGame()',h.context);h.clicks.get('#confirm-new')!();
  assert.equal(h.store.has('feudalism-campaign-v1'),false);assert.equal(h.store.get('unrelated-app'),'keep');
  for(const key of ['campaign','battle','checkpoint','game','battleScene','mapScene'])assert.equal(h.context[key],null,key);
  assert.equal(h.destroyed,1);assert.equal(h.rendered,1);assert.ok(h.removed);
  assert.equal(h.context.view,'world');assert.equal(h.context.selected,'');assert.equal(h.context.pendingWorldFocus,'');
  assert.equal(h.context.atlasGeneration,8);assert.equal(h.context.rootClock.phase,0);assert.equal(h.context.previousFrame,undefined);
  assert.equal(h.context.worldPaused,false);assert.equal(h.context.paused,false);assert.equal(h.context.speed,1);
  assert.equal(h.context.control,'hero');assert.equal(h.context.resultShown,false);assert.equal(h.context.armyAbilityTarget,null);
  // The same selection handler used on first launch must initialize and persist the new hero.
  vm.runInContext('renderStart()',h.context);
  h.clicks.get('[data-start]')!({currentTarget:{dataset:{start:String(index)}}});
  const expected=newCampaign(index);initializeEconomy(expected,index);
  assert.equal(JSON.stringify(h.context.campaign),JSON.stringify(expected));
  assert.equal(h.context.selected,expected.town);
  const reloaded=readCampaignSave(h.store.get('feudalism-campaign-v1')!);
  assert.equal(JSON.stringify(reloaded),JSON.stringify(expected));
 }
});

test('storage deletion failure leaves the campaign recoverable and confirmation open',()=>{
 const h=harness(true),before=h.store.get('feudalism-campaign-v1');
 h.context.localStorage.removeItem=()=>{throw new Error('Storage blocked');};
 vm.runInContext('confirmNewGame()',h.context);h.clicks.get('#confirm-new')!();
 assert.equal(h.context.campaign,h.original);assert.equal(h.store.get('feudalism-campaign-v1'),before);
 assert.equal(h.destroyed,0);assert.equal(h.rendered,0);assert.equal(h.removed,false);
 h.clicks.get('#cancel-new')!();assert.equal(h.context.paused,false);
});
