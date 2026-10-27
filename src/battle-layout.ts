import terrainData from './battle-terrain.json';
import {data} from './model';
export type BattleKind='siege'|'quest'|'throne';
type MapRecord={rootFrame:number;blockedCells:number[][];initialSpawns:{cell:number[];team:0|1;hero:boolean;depth:number}[];obstacles:{cell:number[];name:string}[]};
const maps=terrainData.maps as unknown as Record<string,MapRecord>;
/** Town.setBattleMap bases. The original adds d(4), so bases themselves are not maps. */
export const SIEGE_MAP_BASES:Readonly<Record<string,number>>=Object.freeze({
 Trapezus:20,Lutetia:20,Arretium:20,Ravenna:20,Lacrimosa:20,Caesaria:16,Carthage:16,Alexandria:16,
 Jana:4,Konstanz:4,Gerlitz:4,Hoffen:4,Endem:4,Sturmburg:0,Braunburg:0,Wanderburg:0,
 Dubkee:12,Dalnevodye:12,Losevo:12,Medvedevo:12,Grouzeno:12,Dobrov:8,Zlatograd:8,RaGorod:8,
 Omi:28,Kozuke:28,Fukushima:28,Echigo:28,Suo:28,Matsuyama:24,Izumo:24,Nagoya:24,
});
export function chooseBattleMap(kind:BattleKind,town:string,random:()=>number,atHarbor=false){
 if(!Object.hasOwn(data.towns,town))throw new Error('Unknown battle town.');
 const roll=random();if(!Number.isFinite(roll)||roll<0||roll>=1)throw new RangeError('Map RNG must be in [0,1).');
 if(kind==='quest')return 32+Math.floor(roll*8)+1;
 if(kind==='throne')return 60+Math.floor(roll*4)+1;
 return (atHarbor?76:SIEGE_MAP_BASES[town])+Math.floor(roll*4)+1;
}
export function battleLayout(mapId:number){
 if(!Number.isInteger(mapId)||mapId<1||mapId>80)throw new Error('Unknown original battlefield.');
 const map=maps[String(mapId)];
 return {blockedCells:map.blockedCells.map(([x,y])=>({x,y})),initialSpawns:map.initialSpawns.map(spawn=>({x:spawn.cell[0],y:spawn.cell[1],team:spawn.team,hero:spawn.hero})),reinforcementInterval:31};
}
export function battlefieldObjects(mapId:number){return maps[String(mapId)]?.obstacles??[];}
