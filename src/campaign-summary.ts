import {data,type Campaign,type Battle} from './model';
import {world,servicesAvailable} from './world-campaign';

/** Read the living company in combat; campaign.army is the last settled checkpoint. */
export function companyRoster(c:Campaign,battle?:Battle|null){
 const counts=new Map<string,number>();
 for(const key of battle?battle.survivors():c.army)counts.set(key,(counts.get(key)??0)+1);
 return [...counts].map(([key,count])=>({key,count,unit:data.units[key]}));
}
/** Keep wallet cash and uncollected notes separate; never mint or collect from a view. */
export function pendingPayments(c:Campaign){
 const groups=new Map<string,{town:string;total:number;next:number;count:number;canCollect:boolean}>();
 for(const note of world(c).rewards){const group=groups.get(note.town);if(group){group.total+=note.gold;group.count++;}else groups.set(note.town,{town:note.town,total:note.gold,next:note.gold,count:1,canCollect:world(c).town===note.town&&servicesAvailable(c)});}
 return [...groups.values()];
}
