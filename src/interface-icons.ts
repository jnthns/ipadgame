/** One stroke language for the campaign chrome; icons never supply game state. */
const paths = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  town: '<path d="M3 21V9h4v4h3V5h4v8h3V9h4v12ZM10 21v-5h4v5M12 5V2m0 0h5l-2 2h-3"/>',
  banner: '<path d="M5 22V3m0 0c5-4 9 4 15 0v12c-6 4-10-4-15 0M9 20h6"/>',
  hero: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-4a8 8 0 0 1 16 0v4M8 14l4 5 4-5"/>',
  bag: '<path d="M4 8h16l1 13H3ZM8 8V6a4 4 0 0 1 8 0v2m-4 4v5m-2-2h4"/>',
  book: '<path d="M12 5c-3-3-6-3-10-2v17c4-1 7-1 10 2 3-3 6-3 10-2V3c-4-1-7-1-10 2Zm0 0v17"/>',
  art: '<path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4 2 2 0 0 1 0-4h4a3 3 0 0 0 3-3c0-4-4-7-9-7Z"/><circle cx="7" cy="10" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="m12 8-2 4 2 4 2-4Z"/>',
  swords: '<path d="m4 3 14 14m2-14L6 17M3 3l1 5 4-4Zm18 0-1 5-4-4ZM3 15l6 6m6 0 6-6M4 20l2-2m12 0 2 2"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  anchor: '<circle cx="12" cy="5" r="3"/><path d="M12 8v13M3 13c0 11 18 11 18 0M3 13l4 3m14-3-4 3M8 11h8"/>',
  shield: '<path d="M12 2 3 5v7c0 5 5 9 9 11 4-2 9-6 9-11V5ZM12 6v11m-4-7h8"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  horse: '<path d="M4 21v-6l3-4 1-5 3-3 2 3h3l3 3-2 2-3-1-1 3 3 4v4M8 21v-4m8 4v-3M11 6l-1-3"/>',
  crate: '<path d="M3 8 12 3l9 5v9l-9 5-9-5Zm0 0 9 5 9-5m-9 5v9M7.5 5.5l9 5"/>',
  castle: '<path d="M4 21V8h2v2h2V8h2v3h4V8h2v2h2V8h2v13ZM10 21v-4a2 2 0 0 1 4 0v4M12 8V3h4l-1 1.5 1 1.5h-4"/>',
  pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4Z"/><path d="m17 9 5 6m0-6-5 6"/>',
  armor: '<path d="M8 3 4 6v5l2 1v9h12v-9l2-1V6l-4-3-2 2h-4Z"/><path d="M9 10h6M9 14h6"/>',
  helmet: '<path d="M4 15a8 8 0 0 1 16 0v3H4Z"/><path d="M12 7v11M8 18v-4h8v4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01"/>',
};
export type InterfaceIcon = keyof typeof paths;
export function icon(name: InterfaceIcon) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
