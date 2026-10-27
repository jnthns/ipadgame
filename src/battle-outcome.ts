import {type Battle,data,expand,addXP} from './model';
import {collectLoot,settleConquest} from './campaign-actions';
import {completeCombatContract,enterTown} from './world-campaign';
export type VictoryOutcome=Readonly<{xp:number;gold:number;survivingSoldiers:number;nextEnemies:readonly string[];capturedTown:boolean;worldComplete:boolean}>;
const outcomes=new WeakMap<Battle,VictoryOutcome>();
/** Campaign mutation happens once in the core, independently of result screens,
 * renderer recreation and graphics settings. Failed staging leaves campaign intact.
 */
export function settleBattleVictory(b:Battle):VictoryOutcome{
 const existing=outcomes.get(b);if(existing)return existing;
 if(b.result!=='victory')throw new Error('Only a victorious battle can be settled.');
 if(!Object.hasOwn(data.towns,b.destination))throw new Error('Unknown battle destination.');
 const c=structuredClone(b.campaign);collectLoot(c,b.loot);c.army=b.survivors();c.gold+=b.gold;addXP(c.hero,b.xp);
 if(b.kind==='quest')completeCombatContract(c);
 const nextEnemies=b.kind==='siege'?expand(data.towns[b.destination].adv_defenders):[];
 const capturedTown=(b.kind==='siege'||b.kind==='throne')&&nextEnemies.length===0;
 if(capturedTown){settleConquest(c,b.destination);enterTown(c,b.destination);}
 const label=b.kind==='encounter'?'Road encounter won':b.kind==='quest'?'Contract completed':b.kind==='throne'?'Throne room taken':'Garrison defeated';
 c.history.unshift(`${label} at ${data.towns[b.destination].NAME}. ${b.xp} XP and ${b.gold} battle gold earned.`);c.history=c.history.slice(0,60);
 const outcome=Object.freeze({xp:b.xp,gold:b.gold,survivingSoldiers:c.army.length,nextEnemies:Object.freeze(nextEnemies),capturedTown,worldComplete:c.captured.length===32});
 Object.assign(b.campaign,c);outcomes.set(b,outcome);return outcome;
}
