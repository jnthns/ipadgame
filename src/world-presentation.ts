import {data,expand,nations,type Campaign} from './model';
import {townFacilities,type WorldState} from './world-campaign';
import {geometry} from './world-geometry';
import {icon} from './interface-icons';
import {VISUAL_IDENTITY} from './render-presets';
import {THREAT_LABELS,type ThreatEstimate} from './threat';
import type {Recommendation} from './recommendation';
const factionHex=(n:string)=>VISUAL_IDENTITY.factionColors[n as keyof typeof VISUAL_IDENTITY.factionColors]??'#897d70';

const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const MAP_WIDTH=806,MAP_HEIGHT=601,TRAVEL_SPEED=2*30;
type Point={x:number;y:number};
const townPoint=(id:string)=>(geometry.towns as Record<string,Point>)[id];
export type ThreatLookup=(town:string)=>ThreatEstimate|null;

/** The town a journey is heading for, when its target is a town gate. */
export function destinationTown(w:WorldState){if(!w.target)return null;return Object.keys(data.towns).find(id=>{const p=townPoint(id);return p&&Math.abs(p.x-w.target!.x)<1&&Math.abs(p.y-w.target!.y)<1;})??null;}
/** Straight-line travel time at the original two pixels per tick; detours make it longer. */
export function travelSeconds(w:WorldState,to:Point){return Math.max(1,Math.round(Math.hypot(to.x-w.x,to.y-w.y)/TRAVEL_SPEED));}

function objectives(c:Campaign,w:WorldState,town:string){
 const notes:{kind:'delivery'|'payment'|'rogues'|'here';text:string}[]=[];
 if(w.town===town)notes.push({kind:'here',text:'Your company is here.'});
 const reward=w.rewards.find(r=>r.town===town),delivering=w.delivery&&w.delivery.accepted!==false&&w.delivery.to===town;
 if(delivering)notes.push({kind:'delivery',text:`Delivery destination. Collect ${(reward?.gold??w.delivery!.gold).toLocaleString()} gp at its town hall.`});
 else if(reward)notes.push({kind:'payment',text:`${reward.gold.toLocaleString()} gp waiting at the town hall.`});
 if(c.quest?.town===town)notes.push({kind:'rogues',text:`Defeat ${c.quest.count} rogues on the road, then collect ${c.quest.reward.toLocaleString()} gp here.`});
 return notes;
}
const objectiveIcon={delivery:'crate',payment:'coin',rogues:'swords',here:'pin'} as const;

function threatBadge(t:ThreatEstimate|null){
 if(!t)return `<span class="threat-badge pending" title="Estimating garrison strength">${icon('shield')}<b>…</b></span>`;
 return `<span class="threat-badge ${t.tier}" title="${THREAT_LABELS[t.tier].label} · ${t.garrison} defenders">${icon(t.tier==='owned'?'banner':'shield')}${t.tier==='owned'?'':`<b>${t.garrison}</b>`}</span>`;
}

/** One accessible button per town, positioned over the painted map in map-space percentages. */
export function townMarkers(c:Campaign,w:WorldState,selected:string,threat:ThreatLookup,recommended:string|null=null){
 return Object.values(data.towns).map(t=>{const p=townPoint(t.ID),owned=c.captured.includes(t.ID),hostile=c.hostile.includes(t.NATION)&&!owned,f=townFacilities(t.ID),goals=objectives(c,w,t.ID).filter(o=>o.kind!=='here');
  const classes=['atlas-town',owned?'owned':'',hostile?'hostile':'',t.ID===selected?'selected':'',w.town===t.ID?'here':'',goals.length?'goal':'',t.ID===recommended?'recommended':''].filter(Boolean).join(' ');
  return `<button type="button" class="${classes}" data-town="${t.ID}" style="left:${(p.x/MAP_WIDTH*100).toFixed(2)}%;top:${(p.y/MAP_HEIGHT*100).toFixed(2)}%;z-index:${Math.round(p.y)};--faction:${factionHex(t.NATION)}" aria-label="${esc(t.NAME)}, ${nations[t.NATION].name}${owned?', your town':hostile?', hostile':''}" aria-pressed="${t.ID===selected}">
   <span class="town-hit" aria-hidden="true"></span>${owned?`<span class="own-flag" aria-hidden="true" style="--own:${factionHex(c.hero.NATION)}"></span>`:''}
   <span class="town-tag" aria-hidden="true">${threatBadge(threat(t.ID))}<span class="town-label">${esc(t.NAME)}</span>${goals.map(g=>`<span class="goal-badge ${g.kind}">${icon(objectiveIcon[g.kind])}</span>`).join('')}<span class="service-badges">${f?.harbor?icon('anchor'):''}${f?.stables?icon('horse'):''}${t.adv_defenders.length?icon('castle'):''}</span></span>
  </button>`;}).join('');
}

/** The selected town, presented on the map itself so the choice and its actions never need a scroll. */
export function townCard(c:Campaign,w:WorldState,selected:string,threat:ThreatEstimate|null){
 const t=data.towns[selected],current=w.town===selected,owned=c.captured.includes(selected);
 const hostile=c.hostile.includes(t.NATION)&&!owned,f=townFacilities(selected),notes=objectives(c,w,selected).filter(o=>o.kind!=='here');
 const throne=expand(t.adv_defenders).length,heading=destinationTown(w)===selected;
 const threatHTML=owned?'':threat?`<div class="card-threat ${threat.tier}"><div class="row"><span class="threat-pill">${icon('shield')}${THREAT_LABELS[threat.tier].label}</span><span>${threat.garrison} defenders${throne?` + ${throne} throne guards`:''}</span></div><p>${THREAT_LABELS[threat.tier].advice}</p></div>`:`<div class="card-threat pending"><span class="threat-pill">${icon('shield')}Estimating…</span></div>`;
 const services=`<ul class="card-services" aria-label="What is here">
   <li>${icon('banner')}<span>${t.barracks.length} troop types</span></li>
   <li class="${f?.harbor?'':'absent'}">${icon('anchor')}<span>${f?.harbor?'Harbor':'No harbor'}</span></li>
   <li class="${f?.stables?'':'absent'}">${icon('horse')}<span>${f?.stables?'Stables':'No stables'}</span></li>
   ${throne?`<li>${icon('castle')}<span>Throne room</span></li>`:''}
 </ul>`;
 const actions=current?`<button class="primary full" id="enter-city">Enter town ${icon('arrow')}</button>
   ${!hostile?`<div class="town-services" aria-label="Town services"><button id="all-troops" ${!owned?'disabled title="Recruitment requires an owned town"':''}>${icon('banner')}Recruit</button><button id="forge">${icon('swords')}Armory</button><button id="contract">${icon('book')}Town hall</button>${f?.harbor?`<button id="harbor">${icon('anchor')}Harbor</button>`:''}${f?.stables?`<button id="stables">${icon('horse')}Stables</button>`:''}</div>`:'<p class="card-note">Capture this town to reopen its services.</p>'}
   ${!owned?`<button class="full ghost danger" id="siege">${icon('swords')}Attack garrison</button>`:''}`
  :`<button class="primary full" id="travel">${heading?'Travelling here…':`Travel here · about ${travelSeconds(w,townPoint(selected))} s`} ${icon('arrow')}</button>`;
 return `<section class="town-dossier atlas-card-body" style="--faction:${factionHex(t.NATION)}" aria-label="Selected town">
   <div class="card-head"><div><span class="eyebrow">${nations[t.NATION].name}</span><h2 class="town-name">${esc(t.NAME)}</h2></div><span class="town-allegiance ${hostile?'hostile':owned?'owned':''}">${owned?'Your banner':hostile?'Hostile':'Neutral'}</span><button class="card-close" id="card-close" aria-label="Hide town details">${icon('close')}</button></div>
   ${current?`<p class="card-here">${icon('pin')}Your company is here.</p>`:''}
   ${notes.map(n=>`<p class="card-goal ${n.kind}">${icon(objectiveIcon[n.kind])}${esc(n.text)}</p>`).join('')}
   ${threatHTML}${services}${actions}
 </section>`;
}

const recommendationIcon={collect:'coin',delivery:'crate',rogues:'swords',siege:'castle',recruit:'banner',contract:'book'} as const;
/** The single suggested next step, with one button that goes there (or acts, if the company is already there). */
export function recommendationMarkup(rec:Recommendation|null,w:WorldState){
 if(!rec)return '';
 const travelling=!!rec.town&&destinationTown(w)===rec.town;
 // A company in town is drawn at the gate; measure from there, as travel will.
 const origin=w.town?townPoint(w.town):w,eta=!rec.here&&!travelling?` · about ${travelSeconds({...w,x:origin.x,y:origin.y},rec.point)} s`:'';
 return `<div class="atlas-recommend-body" data-kind="${rec.kind}"><span class="recommend-icon" aria-hidden="true">${icon(recommendationIcon[rec.kind])}</span><div class="recommend-copy"><span class="eyebrow">Recommended next</span><b>${esc(rec.title)}</b><small>${esc(rec.reason)}</small></div><button class="primary" id="follow-recommendation" ${travelling?'disabled':''}>${travelling?'On the way…':`${esc(rec.cta)}${eta}`} ${icon('arrow')}</button></div>`;
}

export function journeyText(w:WorldState,paused:boolean){
 if(paused)return 'Journey paused';
 const to=destinationTown(w);
 if(w.target)return `${w.sailing?'Sailing':'Travelling'} to ${to?esc(data.towns[to].NAME):'your waypoint'} · about ${travelSeconds(w,w.target)} s`;
 if(w.town)return `At ${esc(data.towns[w.town].NAME)} · tap a town to see what is there`;
 return w.sailing?'At sea':'On the road';
}

export function atlasMarkup(c:Campaign,w:WorldState,selected:string,paused:boolean,threat:ThreatLookup,cardOpen:boolean,labels:boolean,rec:Recommendation|null=null){
 const delivery=w.delivery&&w.delivery.accepted!==false?w.delivery:null;
 const goals=[...(delivery?[`<button class="atlas-chip delivery" data-focus-town="${delivery.to}">${icon('crate')}<span>Deliver to ${esc(data.towns[delivery.to].NAME)}</span></button>`]:[]),
  ...w.rewards.filter(r=>r.town!==delivery?.to).map(r=>`<button class="atlas-chip payment" data-focus-town="${r.town}">${icon('coin')}<span>${r.gold.toLocaleString()} gp at ${esc(data.towns[r.town].NAME)}</span></button>`),
  ...(c.quest?[`<button class="atlas-chip rogues" id="quest-route">${icon('swords')}<span>Track ${c.quest.count} rogues</span></button>`]:[])].join('');
 return `<section class="map-panel world-map atlas" aria-label="World map">
  <div class="atlas-toolbar">
   <div class="atlas-goals"><span class="atlas-chip progress" title="Towns under your banner">${icon('banner')}<span>${c.captured.length} / 32 towns</span></span>${goals}</div>
   <div class="atlas-tools"><label class="town-picker"><span class="sr-only">Find a town</span><select id="town-select" aria-label="Find a town">${Object.values(data.towns).map(t=>`<option value="${t.ID}" ${t.ID===selected?'selected':''}>${esc(t.NAME)} · ${nations[t.NATION].name}</option>`).join('')}</select></label><button id="map-labels" aria-pressed="${labels}" title="Show every town name">Names</button></div>
  </div>
  <section class="atlas-recommend" id="atlas-recommend" aria-label="Recommended next step" ${rec?'':'hidden'}>${recommendationMarkup(rec,w)}</section>
  <div class="atlas-stage${labels?' labels':''}">
   <div class="atlas-canvas"><div id="game" class="canvas-wrap" role="group" aria-label="World map. Tap a town for details, or tap open ground to set a waypoint."><div class="atlas-markers">${townMarkers(c,w,selected,threat,rec?.town??null)}</div><div class="atlas-company" id="atlas-company" aria-hidden="true"><span class="company-pin">${icon('hero')}</span><span class="company-label">You</span></div></div></div>
   <aside class="atlas-card" id="atlas-card" ${cardOpen?'':'hidden'}>${townCard(c,w,selected,threat(selected))}</aside>
  </div>
  <div class="journey-bar"><div class="journey-copy"><i id="journey-light"></i><span id="journey-status">${journeyText(w,paused)}</span></div><div class="journey-actions"><button id="pause-world" aria-pressed="${paused}">${paused?'Resume':icon('pause')+'Pause'}</button><button id="stop-world">${icon('stop')}Stop</button></div></div>
  <details class="atlas-legend-panel"><summary>Map key</summary><div class="atlas-legend">
   <span><span class="legend-pin">${icon('hero')}</span>Your company</span><span><span class="threat-badge owned">${icon('banner')}</span>Your town</span>
   <span><span class="threat-badge favorable">${icon('shield')}</span>Favorable</span><span><span class="threat-badge even">${icon('shield')}</span>Even fight</span><span><span class="threat-badge hard">${icon('shield')}</span>Very hard</span><span><span class="threat-badge overwhelming">${icon('shield')}</span>Overwhelming</span>
   <span><span class="goal-badge delivery">${icon('crate')}</span>Delivery</span><span><span class="goal-badge payment">${icon('coin')}</span>Payment</span><span>${icon('anchor')}Harbor</span><span>${icon('horse')}Stables</span><span>${icon('castle')}Throne room</span>
   <p>Shield numbers are garrison sizes. Strength is estimated from simulated battles against your current company with your hero held back.</p>
  </div></details>
 </section>`;
}
