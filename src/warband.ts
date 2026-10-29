import {data,nations,type Campaign,type Nation} from './model';
import {characterPortraitMarkup} from './character-portraits';
import {VISUAL_IDENTITY} from './render-presets';
import {syncRoster,rankOf,fallenRoll,heroKills,type Soldier} from './soldiers';

const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** One snapshot of the company after something worth remembering. Presentation history only; never read by game rules. */
export type ChronicleEntry={battle:number;label:string;army:Record<string,number>;fallen:number;level:number;towns:number};
type WithChronicle=Campaign&{chronicle?:ChronicleEntry[]};
const MAX_ENTRIES=120;

export function chronicle(c:Campaign):ChronicleEntry[]{
 const list=(c as WithChronicle).chronicle;
 return Array.isArray(list)?list.filter(e=>e&&typeof e.label==='string'&&Number.isFinite(e.battle)&&e.army&&typeof e.army==='object'):[];
}

export function armyCounts(army:readonly string[]){const counts:Record<string,number>={};for(const k of army)counts[k]=(counts[k]??0)+1;return counts;}

export function recordChronicle(c:Campaign,label:string,fallen=0){
 const list=chronicle(c);
 list.push({battle:c.battles,label,army:armyCounts(c.army),fallen,level:c.hero.LEVEL,towns:c.captured.length});
 (c as WithChronicle).chronicle=list.slice(-MAX_ENTRIES);
}

/** The company standing together on open ground: hero in front, veterans in the front rank, named soldiers behind. */
export function musterMarkup(c:Campaign,backdrop:string,limit=48){
 const roster=[...syncRoster(c)].sort((a,b)=>rankOf(b).level-rankOf(a).level||b.kills-a.kills||(data.units[b.key].price??0)-(data.units[a.key].price??0));
 const keys=roster.map(s=>s.key),shown=roster.slice(0,limit),perRank=Math.max(6,Math.ceil(shown.length/3));
 const figures=shown.map((s,i)=>{const rank=Math.floor(i/perRank),file=i%perRank,inRank=Math.min(perRank,shown.length-rank*perRank),honour=rankOf(s);
  const spacing=Math.min(9,84/Math.max(inRank,1)),left=50+(file-(inRank-1)/2)*spacing+(rank%2)*spacing/2,bottom=40-rank*11+(file%2)*2;
  return `<span class="muster-figure rank-${honour.level}" style="left:${left.toFixed(1)}%;bottom:${bottom}%;z-index:${10-rank}" title="${esc(s.name)} · ${honour.title} ${esc(data.units[s.key].NAME)} · ${s.kills} kills">${characterPortraitMarkup(data.units[s.key],s.key,{size:'company',decorative:true})}${honour.level>=2&&i<3?`<span class="muster-tag">${esc(s.name.split(' ')[0])}</span>`:''}${honour.level?`<span class="rank-pips" aria-hidden="true">${'▲'.repeat(honour.level)}</span>`:''}</span>`;}).join('');
 return `<div class="muster" style="background-image:url('${backdrop}')" role="img" aria-label="${esc(c.hero.NAME)} with ${c.army.length} soldiers">
  ${figures}
  <span class="muster-figure hero" style="left:50%;bottom:6%">${characterPortraitMarkup(c.hero,undefined,{size:'hud',decorative:true})}<span class="muster-name">${esc(c.hero.NAME)} · Lv ${c.hero.LEVEL}${heroKills(c)?` · ${heroKills(c)} kills`:''}</span></span>
  ${keys.length>limit?`<span class="muster-more">+${keys.length-limit} more</span>`:''}
  ${!keys.length?'<span class="muster-empty">No soldiers yet. Recruit at a barracks.</span>':''}
 </div>`;
}

/** Soldiers after each recorded moment, one column each; the tooltip and the list carry composition. */
export function chronicleChart(c:Campaign,limit=24){
 const entries=chronicle(c).slice(-limit);
 if(entries.length<2)return '<p class="subtle">Fight a few battles and your company’s story will chart here.</p>';
 const sizes=entries.map(e=>Object.values(e.army).reduce((a,n)=>a+n,0)),max=Math.max(10,...sizes),top=Math.ceil(max/10)*10;
 const W=560,H=170,padL=30,padB=22,padT=16,slot=(W-padL-6)/entries.length,bar=Math.min(24,slot-2),plot=H-padB-padT;
 const y=(v:number)=>padT+plot-(v/top)*plot;
 const ticks=[0,top/2,top].map(v=>`<line x1="${padL}" x2="${W-4}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${padL-6}" y="${y(v)+4}" text-anchor="end" class="tick">${v}</text>`).join('');
 const bars=entries.map((e,i)=>{const x=padL+slot*i+(slot-bar)/2,h=Math.max(2,(sizes[i]/top)*plot),lvUp=i>0&&e.level>entries[i-1].level;
  const mix=Object.entries(e.army).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${n} ${data.units[k]?.NAME??k}`).join(', ')||'no soldiers';
  return `<g class="chronicle-bar" tabindex="0" data-tip="${esc(`${e.label}\n${sizes[i]} soldiers${e.fallen?` · ${e.fallen} fell`:''} · hero level ${e.level} · ${e.towns} towns\n${mix}`)}">
   <rect x="${x-(slot-bar)/2}" y="${padT}" width="${slot}" height="${plot}" fill="transparent"/>
   <path d="M${x},${y(0)} V${y(0)-h+4} q0,-4 4,-4 h${bar-8} q4,0 4,4 V${y(0)} Z" class="bar${e.fallen?' losses':''}"/>
   ${lvUp?`<text x="${x+bar/2}" y="${y(0)-h-5}" text-anchor="middle" class="annotation">Lv ${e.level}</text>`:''}
  </g>`;}).join('');
 return `<figure class="chronicle-chart"><figcaption><b>Soldiers after each battle</b><span>Hover or tap a column for the full company. “Lv” marks a hero level-up.</span></figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Company size over the last ${entries.length} recorded battles">${ticks}${bars}<text x="${padL}" y="${H-5}" class="tick">earlier</text><text x="${W-4}" y="${H-5}" text-anchor="end" class="tick">latest</text></svg><div class="chart-tip" hidden></div></figure>`;
}

/** Thirty-two pips, eight per land, filled as towns fall. */
export function conquestMarkup(c:Campaign){
 const lands:Exclude<Nation,'Rog'>[]=['Ger','Rus','Viz','Jap'];
 return `<section class="conquest-board" aria-label="Conquest by land">${lands.map(n=>{const towns=Object.values(data.towns).filter(t=>t.NATION===n),held=towns.filter(t=>c.captured.includes(t.ID)).length;
  return `<div class="conquest-land" style="--land:${VISUAL_IDENTITY.factionColors[n]}"><span class="land-name">${nations[n].name}</span><span class="land-pips">${towns.map(t=>`<i class="${c.captured.includes(t.ID)?'held':''}" title="${esc(t.NAME)}${c.captured.includes(t.ID)?' · yours':''}"></i>`).join('')}</span><span class="land-count">${held}/${towns.length}</span></div>`;}).join('')}</section>`;
}

/** Every soldier by name, best record first. */
export function soldierCards(c:Campaign){
 const roster=[...syncRoster(c)].sort((a,b)=>b.kills-a.kills||b.battles-a.battles||a.id-b.id);
 if(!roster.length)return '<p class="empty">No soldiers yet. Recruit at a barracks.</p>';
 return `<div class="soldier-grid">${roster.map(s=>soldierCard(c,s)).join('')}</div>`;
}
function soldierCard(_c:Campaign,s:Soldier){const r=rankOf(s);return `<div class="soldier-card rank-${r.level}">${characterPortraitMarkup(data.units[s.key],s.key,{size:'company',decorative:true})}<div><b>${esc(s.name)}</b><small>${r.title} ${esc(data.units[s.key].NAME)}</small><small>${s.kills} ${s.kills===1?'kill':'kills'} · ${s.battles} ${s.battles===1?'battle':'battles'}</small></div></div>`;}

/** Names of those who fell, most recent first. */
export function fallenMarkup(c:Campaign,limit=20){
 const fallen=fallenRoll(c).slice(-limit).reverse();
 if(!fallen.length)return '';
 return `<section class="fallen-roll"><h3>Roll of the fallen</h3><ul>${fallen.map(f=>`<li><b>${esc(f.name)}</b> <span>${rankOf(f).title} ${esc(data.units[f.key]?.NAME??'soldier')} · ${f.kills} ${f.kills===1?'kill':'kills'} in ${f.battles} ${f.battles===1?'battle':'battles'} · ${esc(f.fell)}</span></li>`).join('')}</ul></section>`;
}
