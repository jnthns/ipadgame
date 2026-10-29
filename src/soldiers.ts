import {data,type Battle,type Campaign,type Nation} from './model';

/**
 * Named soldiers: a presentation record kept beside `campaign.army`, in the same order.
 * Game rules never read it; ranks are honours, not stat bonuses.
 */
export type Soldier={id:number;key:string;name:string;kills:number;battles:number;joined:number};
export type FallenSoldier={name:string;key:string;kills:number;battles:number;fell:string};
type WithSoldiers=Campaign&{soldiers?:Soldier[];fallen?:FallenSoldier[];nextSoldierId?:number;heroKills?:number};
const MAX_FALLEN=100;

const FIRST:Record<Nation,string[]>={
 Ger:['Hans','Otto','Konrad','Friedrich','Ulrich','Dietrich','Wilhelm','Heinrich','Lukas','Matthias','Bertram','Gunther','Ekkehard','Rudolf','Albrecht','Sigmund'],
 Rus:['Ivan','Dmitri','Mikhail','Yaroslav','Boris','Gleb','Svyatoslav','Fyodor','Vasily','Oleg','Pyotr','Stepan','Rurik','Mstislav','Igor','Vsevolod'],
 Viz:['Marcus','Lucius','Theodoros','Nikephoros','Basil','Leon','Gaius','Andronikos','Septimus','Demetrios','Kyros','Aurelius','Manuel','Titus','Isaakios','Valens'],
 Jap:['Takeshi','Hiroshi','Kenji','Masaru','Ryuu','Daichi','Haruto','Isamu','Jiro','Katsu','Noboru','Sora','Tadashi','Yoshi','Akira','Goro'],
 Rog:['Mad','One-Eyed','Quick','Black','Red','Lucky','Old','Silent','Grim','Crooked','Tall','Little','Sly','Iron','Ragged','Wild'],
};
const LAST:Record<Nation,string[]>={
 Ger:['Becker','Krüger','Vogt','Hartmann','Brandt','Ritter','Wolff','Keller','Lang','Schreiber','Eisen','Falk'],
 Rus:['Volkov','Sokolov','Morozov','Orlov','Belov','Zaitsev','Kuznetsov','Lebedev','Medvedev','Romanov','Gromov','Petrov'],
 Viz:['Doukas','Komnenos','Phokas','Laskaris','Vatatzes','Kantakouzenos','Galerius','Severus','Varro','Palaiologos','Argyros','Skleros'],
 Jap:['Sato','Tanaka','Mori','Kato','Ishida','Oda','Takeda','Honda','Ikeda','Shimazu','Date','Ueda'],
 Rog:['Jack','Wolf','Rat','Crow','Tom','Boar','Fox','Will','Pike','Hound','Ned','Snake'],
};

export const RANKS=[
 {title:'Recruit',kills:0,battles:0},
 {title:'Blooded',kills:1,battles:1},
 {title:'Veteran',kills:5,battles:3},
 {title:'Elite',kills:12,battles:6},
 {title:'Champion',kills:25,battles:10},
] as const;
export type RankTitle=typeof RANKS[number]['title'];
export function rankOf(s:Pick<Soldier,'kills'|'battles'>):{title:RankTitle;level:number}{let level=0;RANKS.forEach((r,i)=>{if(s.kills>=r.kills&&s.battles>=r.battles)level=i;});return {title:RANKS[level].title,level};}

function nationOf(key:string):Nation{return (data.units[key]?.NATION??'Rog') as Nation;}
/** Deterministic from the soldier's id, so a name never changes between sessions. */
export function soldierName(key:string,id:number){const n=nationOf(key),first=FIRST[n],last=LAST[n],a=(id*7919+13)%first.length,b=(id*104729+5)%last.length;return `${first[a]} ${last[b]}`;}

function valid(s:unknown):s is Soldier{const x=s as Soldier;return !!x&&typeof x.key==='string'&&typeof x.name==='string'&&Number.isInteger(x.id)&&Number.isFinite(x.kills)&&Number.isFinite(x.battles);}

/** Keeps one named soldier per army entry, in army order. New recruits get new names; known soldiers keep theirs. */
export function syncRoster(c:Campaign):Soldier[]{
 const w=c as WithSoldiers,pool=(Array.isArray(w.soldiers)?w.soldiers:[]).filter(valid);
 let next=Number.isInteger(w.nextSoldierId)?w.nextSoldierId!:pool.reduce((m,s)=>Math.max(m,s.id+1),1);
 const roster=c.army.map(key=>{const i=pool.findIndex(s=>s.key===key);if(i>=0)return pool.splice(i,1)[0];const id=next++;return {id,key,name:soldierName(key,id),kills:0,battles:0,joined:c.battles};});
 w.soldiers=roster;w.nextSoldierId=next;return roster;
}
export function fallenRoll(c:Campaign):FallenSoldier[]{const list=(c as WithSoldiers).fallen;return Array.isArray(list)?list.filter(f=>f&&typeof f.name==='string'):[];}
export function heroKills(c:Campaign){const k=(c as WithSoldiers).heroKills;return Number.isFinite(k)?k!:0;}

export type BattleRecord={survivors:Soldier[];fallen:Soldier[];promoted:{soldier:Soldier;rank:RankTitle}[];topKiller:Soldier|null;heroKills:number};

/**
 * After a victory: the battle spawns soldiers from the front of the army list, so the n-th
 * allied soldier to appear is roster[n]. Credits kills, counts the battle, retires the fallen.
 * `before` is the roster as it stood when the battle began; `c.army` already holds the survivors.
 */
export function recordBattle(c:Campaign,b:Battle,before:readonly Soldier[],label:string):BattleRecord{
 const w=c as WithSoldiers,allies=b.fighters.filter(f=>f.team===0&&f.key!=='hero').sort((x,y)=>x.id-y.id);
 const roster=before.map(s=>({...s}));
 const fought=roster.slice(0,allies.length),waiting=roster.slice(allies.length);
 const promoted:BattleRecord['promoted']=[],fallen:Soldier[]=[],standing:Soldier[]=[];let topKiller:Soldier|null=null,best=0;
 allies.forEach((f,i)=>{const s=fought[i];if(!s||s.key!==f.key)return;const was=rankOf(s).level;const kills=b.killCredits[f.id]??0;if(kills>best){best=kills;topKiller=s;}s.kills+=kills;s.battles+=1;const now=rankOf(s);if(now.level>was&&f.hp>0)promoted.push({soldier:s,rank:now.title});(f.hp>0?standing:fallen).push(s);});
 const hero=b.fighters.find(f=>f.key==='hero'),gained=hero?b.killCredits[hero.id]??0:0;w.heroKills=heroKills(c)+gained;
 const survivors=[...standing,...waiting];
 // If anything disagrees with the model's survivor list, fall back to matching by type so names are never lost.
 w.soldiers=survivors;if(survivors.map(s=>s.key).join()!==c.army.join())syncRoster(c);
 w.fallen=[...fallenRoll(c),...fallen.map(s=>({name:s.name,key:s.key,kills:s.kills,battles:s.battles,fell:label}))].slice(-MAX_FALLEN);
 return {survivors:w.soldiers!,fallen,promoted,topKiller,heroKills:gained};
}
