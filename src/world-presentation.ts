import {data,expand,nations,type Campaign} from './model';
import {townFacilities,type WorldState} from './world-campaign';
import {icon} from './interface-icons';
import {VISUAL_IDENTITY} from './render-presets';
const factionHex=(n:string)=>VISUAL_IDENTITY.factionColors[n as keyof typeof VISUAL_IDENTITY.factionColors]??'#897d70';

const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** Presentation of a selected town. Action IDs bind to existing campaign actions. */
export function townDossier(c:Campaign,w:WorldState,selected:string,cityArt:string){
  const t=data.towns[selected],current=w.town===selected,owned=c.captured.includes(selected);
  const hostile=c.hostile.includes(t.NATION)&&!owned,facilities=townFacilities(selected);
  const defenders=expand(t.defenders).length+expand(t.adv_defenders).length;
  return `<section class="town-dossier" style="--faction:${factionHex(t.NATION)}">
    <div class="town-vignette" style="background-image:url('${cityArt}')" role="img" aria-label="Representative illustrated medieval town">
      <span class="faction-pennant">${icon('banner')}</span><span class="location-tag">${current?'Your location':'Selected destination'}</span>
    </div>
    <div class="dossier-body">
      <div class="row"><span class="eyebrow">${nations[t.NATION].name}</span><span class="town-allegiance ${hostile?'hostile':''}">${owned?'Your banner':hostile?'Hostile':'Neutral'}</span></div>
      <h2 class="town-name">${esc(t.NAME)}</h2><p class="town-description">${esc(nations[t.NATION].blurb)}</p>
      <dl class="town-facts"><div><dt>${icon('shield')}Garrison</dt><dd>${defenders}</dd></div><div><dt>${icon('banner')}Troop types</dt><dd>${t.barracks.length}</dd></div></dl>
      ${!current?`<p class="destination-note">Select a destination, then set out. Use waypoints around coastlines.</p><button class="primary full" id="travel">Travel here ${icon('arrow')}</button>`:`<p class="destination-note">Your company is stationed here.</p><button class="primary full" id="enter-city">Enter town ${icon('arrow')}</button>`}
      ${current?`<div class="town-services" aria-label="Town services">${!hostile?`<button id="all-troops" ${!owned?'disabled title="Recruitment requires an owned town"':''}>${icon('banner')}Recruit</button><button id="forge">${icon('swords')}Armory</button><button id="contract">${icon('book')}Town hall</button>${facilities?.harbor?`<button id="harbor">${icon('anchor')}Harbor</button>`:''}${facilities?.stables?`<button id="stables">${icon('shield')}Stables</button>`:''}`:'<p>Capture this town to reopen its services.</p>'}</div>${!owned?`<button class="full ghost danger" id="siege">${icon('swords')}Attack garrison</button>`:''}`:`<div class="destination-services">${facilities?.harbor?`${icon('anchor')} Harbor available`:'Land destination'}${facilities?.stables?' · Stables':''}</div>`}
    </div>
  </section>
  <section class="conquest-note"><div class="row"><span class="eyebrow">A world to unite</span><span>${c.captured.length}<small> / 32</small></span></div><div class="conquest-track" role="progressbar" aria-label="Towns captured" aria-valuenow="${c.captured.length}" aria-valuemin="0" aria-valuemax="32"><i style="width:${c.captured.length/32*100}%"></i></div><p>Build your company. Raise your banner.</p></section>
  ${w.delivery&&w.delivery.accepted!==false?`<section class="atlas-contract"><span class="eyebrow">Delivery contract</span><p>Deliver to <b>${esc(data.towns[w.delivery.to].NAME)}</b>. Collect ${w.delivery.gold} gold at its town hall.</p></section>`:''}`;
}

export function atlasMarkup(c:Campaign,w:WorldState,selected:string,cityArt:string,paused:boolean){
  return `<div class="atlas-title"><div><span class="eyebrow">The campaign atlas</span><h2>The known world<span>.</span></h2></div><p>Four lands. Thirty-two towns.<br>One banner to raise.</p></div>
  <div class="world-layout"><section class="map-panel world-map">
    <div class="atlas-toolbar"><div class="atlas-key">${(['Ger','Rus','Viz','Jap'] as const).map(n=>`<span><i style="--faction:${factionHex(n)}"></i>${nations[n].name}</span>`).join('')}</div><button id="map-labels" aria-pressed="false" title="Show all town names">Town names</button></div>
    <div class="atlas-canvas"><div id="game" class="canvas-wrap" role="img" aria-label="World map. Choose a town using the selector below, or tap the map to travel."></div><div class="atlas-compass" aria-hidden="true"><span>N</span>${icon('compass')}</div></div>
    <div class="atlas-map-bottom"><div class="atlas-legend"><span><i class="legend-owned"></i>Your town</span><span><i class="legend-selected"></i>Selected</span><span><i class="legend-company"></i>Your company</span></div><label class="town-picker">Find a town<select id="town-select" aria-label="Select town">${Object.values(data.towns).map(t=>`<option value="${t.ID}" ${t.ID===selected?'selected':''}>${esc(t.NAME)} · ${nations[t.NATION].name}</option>`).join('')}</select></label></div>
    <div class="journey-bar"><div class="journey-copy"><i id="journey-light"></i><span id="journey-status">${paused?'Journey paused':w.town?`At ${esc(data.towns[w.town].NAME)}`:w.sailing?'At sea':'On the road'}</span></div><div class="journey-actions"><button id="pause-world" aria-pressed="${paused}">${paused?'Resume':icon('pause')+'Pause'}</button><button id="stop-world">${icon('stop')}Stop</button>${c.quest?'<button id="quest-route">Track rogues</button>':''}</div></div>
  </section><aside class="atlas-side" aria-label="Selected town">${townDossier(c,w,selected,cityArt)}</aside></div>`;
}
