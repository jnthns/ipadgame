/** Compare reserve controls and shared RNG; fighter snapshots use the separate battle comparator. */
import {readFileSync} from 'node:fs';
import {Battle,data,newCampaign} from '../src/model';
import {battleLayout} from '../src/battle-layout';
export function compareControlTrace(input:{runtime:string;lines:string[]}){
 const boot=input.lines.find(l=>l.startsWith('BOOT|'))?.split('|'),meta=input.lines.find(l=>l.startsWith('CONTROLS|'))?.split('|');
 const duration=Number(input.lines.find(l=>l.startsWith('LENGTH|'))?.split('|')[1]);
 if(!input.lines.includes('SCENARIO|controls')||!boot||!Number.isInteger(Number(boot[1]))||Number(boot[1])<1||Number(boot[1])>=2147483647||boot[2]!=='5'||!meta||!['both','none','deployed'].includes(meta[1])||!['true','false'].includes(meta[2])||!Number.isInteger(duration)||duration<1||duration>3600||!input.lines.includes(`DONE|${duration}`))throw new Error('Invalid control capture metadata');
 const cast=meta[2]==='true';const castLines=input.lines.filter(l=>l.startsWith('CONTROLCAST|'));if((!cast&&castLines.length)||castLines.length>1)throw new Error('Invalid control cast evidence');if(cast&&(meta[1]!=='both'||duration<90||input.lines.filter(l=>l==='CONTROLCAST|90|10|3').length!==1))throw new Error('Invalid control cast evidence');
 const records=new Map<number,string[]>(),seeds=new Map<number,number>();
 for(const line of input.lines){const a=line.split('|'),frame=Number(a[1]);if(a[0]==='CONTROL'){if(a.length!==9||a[2]!=='movieclip'||records.has(frame)||!Number.isInteger(frame)||frame<1||frame>duration||![a[3],a[5],a[7],a[8]].every(v=>/^\d+$/.test(v))||![a[4],a[6]].every(v=>['true','false'].includes(v)))throw new Error('Invalid control frame');records.set(frame,a);}if(a[0]==='FRAME'){const seed=Number(a[3]);if(seeds.has(frame)||!Number.isInteger(seed)||seed<1||seed>=2147483647)throw new Error('Invalid RNG frame');seeds.set(frame,seed);}}
 if(records.size!==duration||seeds.size!==duration||Array.from({length:duration},(_,i)=>!records.has(i+1)||!seeds.has(i+1)).some(Boolean))throw new Error('Incomplete control capture');
 const c=newCampaign();c.hero=structuredClone(data.units.MeleeViz1);c.hero.LEVEL=1;
 c.army=meta[1]==='both'?[...Array(10).fill('MeleeViz1'),'RangedViz1','RangedViz2']:meta[1]==='deployed'?[...Array(8).fill('MeleeViz1'),'RangedViz1','RangedViz2']:Array(10).fill('MeleeViz1');
 const b=new Battle(c,['MeleeViz1','RangedViz1'],'quest',c.town,1,{heroControl:'manual',...battleLayout(1)});let seed=Number(boot[1]);b.random=()=>{seed=seed*16807%2147483647;return seed/2147483647};
 let matchingControlFrames=0,matchingRngFrames=0;const differences:unknown[]=[];
 for(let frame=1;frame<=duration;frame++){b.step();const a=records.get(frame)!,controls=b.armyAbilities.snapshot().controls;
 const expected=[Number(a[3]),a[4]==='true',Number(a[5]),a[6]==='true',Number(a[7]),Number(a[8])];const actual=[controls.shower.frame,controls.shower.ready,controls.wall.frame,controls.wall.ready,b.reserves[0].length,b.alive(0).length];
 if(expected.every((v,i)=>v===actual[i]))matchingControlFrames++;else if(differences.length<10)differences.push({frame,expected,actual});if(seed===seeds.get(frame))matchingRngFrames++;else if(differences.length<10)differences.push({frame,expectedSeed:seeds.get(frame),actualSeed:seed});
 if(cast&&frame===90){if(!b.castArmyAbility('shower',{x:10,y:3})||!b.castArmyAbility('wall',{x:10,y:3}))throw new Error('Model rejected captured reserve cast');}}
 return {runtime:input.runtime,roster:meta[1],cast,frames:duration,matchingControlFrames,matchingRngFrames,differences};
}
if(process.argv[1]?.endsWith('compare-control-trace.ts')){const result=compareControlTrace(JSON.parse(readFileSync(process.argv[2],'utf8')));console.log(JSON.stringify(result,null,2));if(result.differences.length)process.exitCode=1;}
