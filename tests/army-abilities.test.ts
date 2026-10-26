import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {data,newCampaign,seedRandom,type Hero} from '../src/model';
import {ArmyAbilities,planArrowShower,planArrowWall,reserveAbilityCounts,resolveArrowShower,armyAbilityDepth,ARMY_ABILITY_TIMELINES,type ArmyAbilityPacket} from '../src/army-abilities';
// Unmodified function bytecode + constant pool from Screen DoInitAction sprite2072,
// original SWF SHA25631b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca.
// Fixtures keep tests independent from ignored reference/SWF assets.
const BYTECODE = {"pool": ["_global", "Screen", "rage_timer", "rage_anim", "_visible", "portrait", "hint", "_xscale", "_yscale", "potion_1_txt", "text", "POTION_HealSmall", "potion_2_txt", "POTION_HealMedium", "potion_3_txt", "POTION_HealBig", "scroll_1_txt", "SCROLL_AllHealSmall", "scroll_2_txt", "SCROLL_AllHealBig", "scroll_3_txt", "SCROLL_Rage", "reinitArrowStorm", "MovieClip", "prototype", "makeThemGo", "SELECTED", "length", "mustMoveOut", "gox", "goy", "makeThemAttack", "field", "who", "attacking", "screenOnPress", "cursor", "_currentframe", "_x", "_xmouse", "_y", "_ymouse", "select_border", "SelectBorder", "attachMovie", "getY", "getX", "makeArrowShower", "gotoAndStop", "control_shower", "gotoAndPlay", "makeArrowWall", "control_wall", "screenOnRelease", "_width", "_height", "free", "empty", "HP", "_name", "hero0", "team", "deselectUnits", "borders", "reloadPortrait", "body", "head", "armor", "onEnterFrame", "unit_hp_txt", "/", "MAX_HP", "", "hp_txt", "hp_bottle", "hp_bar", "times", "RAGE", "makeThemHoldPosition", "holdPosition", "makeThemSwapWeapons", "secAtkAnim", "No", "mustSwapGuns", "preferRanged", "makeThemStop", "makeThemHealHero", "mana", "PRICES", "SPELL_HealHero", "redrawHealthBar", "anim", "HealAnim", "makeThemHealUnits", "HERO", "hero", "Math", "round", "makeThemRage", "FRIENDS", "WEAPON_PRI", "TYPE", "Bow", "dmg", "rnd", "dice", "crit", "percent", "dd", "addArrowShower", "Crossbow", "addArrowWall", "MAX_UNIT_AMOUNT", "getTeamCount", "ASSetPropFlags"], "methods": {"makeThemHealHero": {"start": 3945, "size": 278, "sha256": "9917540bc23485d8e0b73649a4226e73ff51f7950258dbf4b72d2cae1b724b55", "base64": "lgQABAIIV06WCQAGAAAAAAAAAABOlgQABAIIWE6WAgAIWU5IEkwSnQIAHgAXlgQABAEIPE6WAgAIOk6WBAAEAQg8TpYCAAhHTkgSnQIAxgCWBAAEAghXTpYNAAYAAAAAAAAAAAQCCFdOlgkABgAAAAAAAAAATpYEAAQCCFhOlgIACFlOC0+WBAAEAQg8TpYGAAg6BAEIPE6WAgAIOk6WAgAEA0dPlgQABAEIPE6WAgAIOk6WBAAEAQg8TpYCAAhHTmcSnQIAGQCWBAAEAQg8TpYGAAg6BAEIPE6WAgAIR05Plg0ABgAAAAAAAAAABAEIPE6WAgAIWlIXlhIABwEAAAAIWwhcBwMAAAAEAQg8TpYCAAgsUhc="}, "makeArrowShower": {"start": 4648, "size": 369, "sha256": "e2b652d35912841ac60bfc3eab689ecad8d9608d9e5a8fb04974e7f6307a18bf", "base64": "lgkABgAAAAAAAAAAhwEACBeWCQAGAAAAAAAAAACHAQADF5YGAAQDBAIIY06WAgAIG05IEp0CADgBlgQABAIIY06WAgAEA06WAgAIZE6WAgAIZU6WAgAIZkkSnQIAAgGWBAAEAghjTpYCAAQDTpYCAAhkTpYCAAhnTpYEAAQCCGNOlgIABANOlgIACGROlgIACGhOlgkABwEAAAAEAQhpUkeHAQAEF5YEAAQCCGNOlgIABANOlgIACGROlgIACGpOlgkABwEAAAAEAQhrUocBAAUXlhQABAUEBAQGBwIAAAAHAQAAAAQBCGxSR5YQAAQHBwIAAAAHAQAAAAQBCGxSR5YJAAcEAAAABAEIbVIXlhQABAUEBAQGBwIAAAAHAQAAAAQBCGxSR5YQAAQHBwIAAAAHAQAAAAQBCGxSR5YJAAcEAAAABAEIbVIXlgcABAgHCAAAAEgSEp0CAAUAmQIAEACWAgAEA1CHAQADF5kCALH+"}, "makeArrowWall": {"start": 5044, "size": 301, "sha256": "a0d8c78c5a2642a097825b27ea18344596c882ba85791b5572ffe18e1764e22a", "base64": "lgkABgAAAAAAAAAAhwEABheWCQAGAAAAAAAAAACHAQADF5YGAAQDBAIIY06WAgAIG05IEp0CAPQAlgQABAIIY06WAgAEA06WAgAIZE6WAgAIZU6WAgAIbkkSnQIAvgCWAgAEBlCHAQAGF5YEAAQCCGNOlgIABANOlgIACGROlgIACGdOlgQABAIIY06WAgAEA06WAgAIZE6WAgAIaE6WCQAHAQAAAAQBCGlSR4cBAAQXlgQABAIIY06WAgAEA06WAgAIZE6WAgAIak6WCQAHAQAAAAQBCGtShwEABReWFAAEBQQEBAcHAgAAAAcBAAAABAEIbFJHlgsABAgHBAAAAAQBCG9SF5YHAAQGBwUAAABIEhKdAgAFAJkCABAAlgIABANQhwEAAxeZAgD1/g=="}, "button172Release": {"start": 38, "size": 158, "sha256": "cbfb4f67a2a30a6bc91af32d366cf7f72a01e27e049588cfe60450fa2d739f8d", "base64": "iD8ABQBfZ2xvYmFsAFNDUk9MTF9BbGxIZWFsQmlnAHBvdGlvbl8zX3R4dAB0ZXh0AG1ha2VUaGVtSGVhbEhlcm8AlgIACAAclgIACAFOlgkABgAAAAAAAAAAZxKdAgA8AJYCAAgAHJYEAAgBCAAclgIACAFOUU+WAgAIAhyWBAAIAwgAHJYCAAgBTk+WDAAHoIYBAAcBAAAACAQ9FwA="}}};
type Value=any;
function less2(a:Value,b:Value):boolean|undefined{if(typeof a==='string'&&typeof b==='string')return a<b;const x=Number(a),y=Number(b);return Number.isNaN(x)||Number.isNaN(y)?undefined:x<y;}
/** Narrow AVM1 opcode oracle for these original methods; not a Flash player. */
function runMethod(name:keyof typeof BYTECODE.methods,registers:Record<number,Value>,scope:Record<string,Value>={}){
 const code=Buffer.from(BYTECODE.methods[name].base64,'base64'),stack:Value[]=[],stores:number[]=[];let pool=BYTECODE.pool;let pc=0,steps=0;
 const pop=()=>stack.pop();
 while(pc<code.length){if(++steps>100000)throw new Error('Oracle loop limit');const op=code[pc++];let payload=Buffer.alloc(0);if(op>=128){const n=code.readUInt16LE(pc);pc+=2;payload=code.subarray(pc,pc+n);pc+=n;}
  switch(op){
   case 0:return {stack,registers,stores};
   case 0x88:{const count=payload.readUInt16LE(0);let q=2;pool=[];for(let i=0;i<count;i++){const end=payload.indexOf(0,q);pool.push(payload.toString('utf8',q,end));q=end+1;}break;}
   case 0x1c:stack.push(scope[pop()]);break;
   case 0x3d:{const name=pop(),count=pop(),args=Array.from({length:count},()=>pop());stack.push(scope[name]?.(...args));break;}
   case 0x51:stack.push(Number(pop())-1);break;
   case 0x96:{let q=0;while(q<payload.length){const t=payload[q++];let value:Value;if(t===0){const end=payload.indexOf(0,q);value=payload.toString('utf8',q,end);q=end+1;}else if(t===1){value=payload.readFloatLE(q);q+=4;}else if(t===2)value=null;else if(t===3)value=undefined;else if(t===4)value=registers[payload[q++]];else if(t===5)value=!!payload[q++];else if(t===6){const n=Buffer.concat([payload.subarray(q+4,q+8),payload.subarray(q,q+4)]);value=n.readDoubleLE();q+=8;}else if(t===7){value=payload.readInt32LE(q);q+=4;}else if(t===8)value=pool[payload[q++]];else if(t===9){value=pool[payload.readUInt16LE(q)];q+=2;}else throw new Error('Push type '+t);stack.push(value);}break;}
   case 0x87:registers[payload[0]]=stack[stack.length-1];stores.push(payload[0]);break;
   case 0x17:pop();break;
   case 0x4e:{const key=pop(),obj=pop();stack.push(obj?.[key]);break;}
   case 0x4f:{const value=pop(),key=pop(),obj=pop();if(obj!=null)obj[key]=value;break;}
   case 0x52:{const key=pop(),obj=pop(),count=pop();const args=Array.from({length:count},()=>pop());stack.push(obj?.[key]?.apply(obj,args));break;}
   case 0x47:{const b=pop(),a=pop();stack.push(a+b);break;}
   case 0x0b:{const b=pop(),a=pop();stack.push(Number(a)-Number(b));break;}
   case 0x48:{const b=pop(),a=pop();stack.push(less2(a,b));break;}
   case 0x67:{const b=pop(),a=pop();stack.push(less2(b,a));break;}
   case 0x49:{const b=pop(),a=pop();stack.push(a==b);break;}
   case 0x12:stack.push(!pop());break;
   case 0x4c:stack.push(stack[stack.length-1]);break;
   case 0x50:stack.push(Number(pop())+1);break;
   case 0x9d:if(pop())pc+=payload.readInt16LE();break;
   case 0x99:pc+=payload.readInt16LE();break;
   default:throw new Error('Unsupported original opcode '+op.toString(16));
  }
 }
 return {stack,registers,stores};
}
const bow=()=>structuredClone(data.units.RangedViz1);
const crossbow=()=>{const h=structuredClone(data.units.RangedViz1);h.WEAPON_PRI=structuredClone(data.items.WeaponClassCrossbowViz1);return h;};
function bytecodePlan(kind:'shower'|'wall',reserves:Hero[],point:{x:number;y:number},rng:()=>number){
 const packets:ArmyAbilityPacket[]=[];const root={dice:(n:number)=>Math.floor(rng()*n),dd:(n:number)=>Math.floor(rng()*(2*n+1))-n,percent:(n:number)=>Math.floor(rng()*100)+1<=n,addArrowShower:(x:number,y:number,damage:number,critical:boolean)=>packets.push({kind:'shower',x,y,damage,critical}),addArrowWall:(x:number,y:number,damage:number,critical:boolean)=>packets.push({kind:'wall',x,y,damage,critical})};
 const method=kind==='shower'?'makeArrowShower':'makeArrowWall';const reg=kind==='shower'?{1:root,2:{FRIENDS:reserves},7:point.x,6:point.y}:{1:root,2:{FRIENDS:reserves},8:point.x,7:point.y};return {packets,execution:runMethod(method,reg)};
}

test('volley planning and RNG order match original AVM1 bytecode, including the uncapped shower counter',()=>{
 const reserves=Array.from({length:23},(_,i)=>i%4===0?newCampaign().hero:i%3===0?crossbow():bow());
 for(const kind of ['shower','wall'] as const){const point={x:5,y:3},r1=seedRandom(717),r2=seedRandom(717);const actual=kind==='shower'?planArrowShower(reserves,point,r1):planArrowWall(reserves,point,r1);const oracle=bytecodePlan(kind,reserves,point,r2);assert.deepEqual(actual,oracle.packets);assert.equal(r1(),r2());if(kind==='shower'){assert.equal(oracle.execution.registers[8],0);assert.equal(oracle.execution.stores.filter(r=>r===8).length,1);assert.ok(actual.length>16);}else assert.equal(actual.length,5);}
 for(const m of Object.values(BYTECODE.methods))assert.equal(createHash('sha256').update(Buffer.from(m.base64,'base64')).digest('hex'),m.sha256);
});

test('each reserve bow shares one raw damage and critical roll between its two scatter arrows',()=>{
 const values=[.5,0,.1,.9,.3,.7];let n=0;const packets=planArrowShower([bow()],{x:0,y:0},()=>values[n++]);assert.equal(n,6);assert.equal(packets.length,2);assert.deepEqual(packets.map(p=>[p.x,p.y]),[[2,-2],[1,-1]]);assert.equal(packets[0].damage,packets[1].damage);assert.equal(packets[0].critical,packets[1].critical);assert.equal(packets[0].critical,true);
});

test('reserve eligibility uses the source10-active index and ignores active fighters/secondary bows',()=>{
 const reserves=[bow(),crossbow(),bow(),crossbow()];assert.deepEqual(reserveAbilityCounts(reserves,8),{bows:1,crossbows:1});assert.deepEqual(reserveAbilityCounts(reserves,11),{bows:2,crossbows:2});assert.deepEqual(reserveAbilityCounts(reserves,0),{bows:0,crossbows:0});const secondary=newCampaign().hero;secondary.WEAPON_SEC=bow().WEAPON_PRI;assert.deepEqual(reserveAbilityCounts([secondary],10),{bows:0,crossbows:0});
});

test('cooldowns follow source frames1-to45/65 and reinit disables without resetting a live timer',()=>{
 const a=new ArmyAbilities([bow(),crossbow()],10);assert.equal(a.remainingFrames('shower'),44);assert.equal(a.remainingFrames('wall'),64);
 for(let i=0;i<43;i++)a.step();assert.equal(a.ready('shower'),false);a.step();assert.equal(a.ready('shower'),true);assert.equal(a.ready('wall'),false);
 for(let i=0;i<20;i++)a.step();assert.equal(a.ready('wall'),true);assert.deepEqual(a.cast('wall',{x:4,y:3},[crossbow()],()=>.5),{ok:true,packetCount:1});assert.equal(a.remainingFrames('wall'),64);a.reinit([crossbow()],10);assert.equal(a.remainingFrames('wall'),64);assert.equal(a.remainingFrames('shower'),null);
 assert.equal(ARMY_ABILITY_TIMELINES.shower.disabledFrame,46);assert.equal(ARMY_ABILITY_TIMELINES.wall.disabledFrame,66);
});

test('source same-cell timeline queue resolves newest packet first, then older packets',()=>{
 const a=new ArmyAbilities();a.enqueue([{kind:'shower',x:3,y:2,damage:10,critical:false},{kind:'shower',x:3,y:2,damage:20,critical:true}]);
 for(let i=0;i<8;i++)assert.deepEqual(a.step(),[]);assert.deepEqual(a.step(),[{kind:'shower-impact',x:3,y:2,damage:20,critical:true}]);
 for(let i=0;i<8;i++)assert.deepEqual(a.step(),[]);assert.deepEqual(a.step(),[{kind:'shower-impact',x:3,y:2,damage:10,critical:false}]);assert.equal(a.snapshot().effects.length,0);
});

test('shower and wall share the source depth namespace and keep the first effect type',()=>{
 assert.equal(armyAbilityDepth(21,0),armyAbilityDepth(1,1));const a=new ArmyAbilities();a.enqueue([{kind:'shower',x:21,y:0,damage:7,critical:false},{kind:'wall',x:1,y:1,damage:11,critical:true}]);for(let i=0;i<8;i++)a.step();assert.deepEqual(a.step(),[{kind:'shower-impact',x:21,y:0,damage:11,critical:true}]);
});

test('wall emits original neutral projectile parameters after its frame15 event',()=>{
 const a=new ArmyAbilities();a.enqueue([{kind:'wall',x:4,y:3,damage:12,critical:false}]);for(let i=0;i<13;i++)assert.deepEqual(a.step(),[]);assert.deepEqual(a.step(),[{kind:'wall-projectile',x:4,y:3,damage:12,critical:false,random:0,destination:{x:19,y:3},weaponFrame:141,team:-1,facing:1}]);
 // facing:+1 is the original projectile xscale multiplier, not the model's
 // movement-facing convention. Root must convert it to model facing:-1.
});

test('shower can hit either team, uses full shield avoidance, and skips blocked or empty cells',()=>{
 const hit={kind:'shower-impact' as const,x:3,y:2,damage:25,critical:false},target={hp:100,def:10,flee:20,shieldFlee:30};
 assert.deepEqual(resolveArrowShower(hit,target,true,()=>.59),{rawDamage:25,critical:false,damage:15});assert.equal(resolveArrowShower(hit,target,true,()=>.6),null);assert.deepEqual(resolveArrowShower({...hit,critical:true},target,true,()=>0),{rawDamage:25,critical:true,damage:25});assert.equal(resolveArrowShower(hit,target,false,()=>{throw new Error('No roll on blocked terrain');}),null);assert.equal(resolveArrowShower(hit,null,true,()=>0),null);
});

test('hero healing bytecode uses Less2+Not, not JavaScript >= behavior for missing mana globals',()=>{
 const hero={HP:25,MAX_HP:100,redrawHealthBar(){},attachMovie(){}};const globals={};runMethod('makeThemHealHero',{1:{hero0:hero},2:globals,3:40});assert.equal(hero.HP,65);assert.deepEqual(globals,{});
 // This narrow opcode check is evidence for AVM1 undefined comparison behavior;
 // it is not a recorded original Flash gameplay replay.
});


test('original large hero potion button consumes the wrong large-group-scroll stock in bytecode',()=>{
 const globals={SCROLL_AllHealBig:1,POTION_HealBig:7};const label={text:''};const calls:number[]=[];
 runMethod('button172Release',{}, {_global:globals,potion_3_txt:label,makeThemHealHero:(amount:number)=>calls.push(amount)});
 assert.equal(globals.SCROLL_AllHealBig,0);assert.equal(globals.POTION_HealBig,7);assert.equal(label.text,0);assert.deepEqual(calls,[100000]);
});
