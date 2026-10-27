/** Diagnostic comparison, deliberately reports mismatches instead of hiding them. */
import {readFileSync} from 'node:fs';
import {Battle,data,newCampaign} from '../src/model';
import {battleLayout} from '../src/battle-layout';
export function compareRuntimeTrace(input:{runtime:string;lines:string[]}) {
const boot=input.lines.find(line=>line.startsWith('BOOT|'))?.split('|');if(!boot||boot[2]!=='5')throw new Error('Trace did not enter original battlefield frame5.');
const c=newCampaign();c.hero=structuredClone(data.units.MeleeViz1);c.hero.LEVEL=1;c.army=['MeleeViz1','RangedViz1'];const b=new Battle(c,['MeleeViz1','RangedViz1'],'quest',c.town,1,{heroControl:'manual',...battleLayout(1)});
let seed=Number(boot[1]);b.random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
const frameSeeds=new Map<number,number>();const frames=new Map<number,string[][]>();for(const line of input.lines){const a=line.split('|');if(a[0]==='FRAME')frameSeeds.set(Number(a[1]),Number(a[3]));if(a[0]==='UNIT'){const frame=Number(a[1]);if(!frames.has(frame))frames.set(frame,[]);frames.get(frame)!.push(a);}}
if(frames.size!==300||frameSeeds.size!==300||Array.from({length:300},(_,i)=>frames.get(i+1)?.length!==5||!frameSeeds.has(i+1)).some(Boolean)||!input.lines.includes('DONE|300'))throw new Error('Expected a complete 300-frame, five-fighter capture.');
const fields=['team','x','y','pixelX','pixelY','hp','windup','recovery','weaponType','targetId','moveX','moveY'];
const diffs:Record<string,unknown>[]=[];let matching=0,total=0,rngMatching=0;const rngDifferences:unknown[]=[];
for(let frame=1;frame<=Math.max(...frames.keys());frame++){b.step();if(seed===frameSeeds.get(frame))rngMatching++;else if(rngDifferences.length<8)rngDifferences.push({frame,expected:frameSeeds.get(frame),actual:seed});for(const a of frames.get(frame)??[]){const f=b.fighters.find(f=>f.id===Number(a[2]));if(!f){diffs.push({frame,id:a[2],missing:true});continue;}const expected=[...a.slice(3,11).map(Number),a[14],a[15]==='undefined'?null:Number(a[15].slice(4)),Number(a[16]),Number(a[17])];const actual=[f.team,f.x,f.y,f.pixelX,f.pixelY+300,f.hp,f.windup,f.recovery,f.weapon.range>0?'Ranged':'Melee',f.targetId,f.moveX,f.moveY];const errors=fields.flatMap((field,i)=>typeof expected[i]==='number'&&typeof actual[i]==='number'?Math.abs((expected[i] as number)-(actual[i] as number))>1e-6?[{field,expected:expected[i],actual:actual[i]}]:[]:expected[i]===actual[i]?[]:[{field,expected:expected[i],actual:actual[i]}]);total++;if(errors.length===0)matching++;else if(diffs.length<20)diffs.push({frame,id:f.id,errors});}}
return {runtime:input.runtime,frames:frames.size,matchingRngFrames:rngMatching,rngDifferences,matchingUnitFrames:matching,totalUnitFrames:total,firstDifferences:diffs};
}
if(process.argv[1]?.endsWith('compare-runtime-trace.ts')){const path=process.argv[2];if(!path)throw new Error('Pass the exported original trace JSON.');const result=compareRuntimeTrace(JSON.parse(readFileSync(path,'utf8')));console.log(JSON.stringify(result,null,2));if(!result.frames||result.matchingUnitFrames!==result.totalUnitFrames||result.matchingRngFrames!==result.frames)process.exitCode=1;}

