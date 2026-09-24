/* 음악 아이콘 세트 (직접 그린 선 아이콘, 24×24, currentColor). GH.icon(name, {size, cls, title}) → <svg> */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const NS = 'http://www.w3.org/2000/svg';
  /* 각 아이콘: 선(path d) 목록. 'F:' 로 시작하면 채움 */
  const P = {
    note: ['M9 17.5V4.5l8 2.2', 'F:M9 17.5a2.8 2.3 -20 1 1-5.4 1.2a2.8 2.3 -20 1 1 5.4-1.2z', 'M17 6.7c-.6 2.2-2.4 3-4 3.3'],
    notes: ['M8 17V6l11-2.5V15', 'M8 9.5l11-2.5', 'F:M8 17a2.5 2 -20 1 1-4.8 1a2.5 2 -20 1 1 4.8-1z', 'F:M19 15a2.5 2 -20 1 1-4.8 1a2.5 2 -20 1 1 4.8-1z'],
    clef: ['M12.2 21.2c1.8.4 3-1.2 2.3-2.5-.6-1.1-2.3-1-2.6.3', 'M13.6 20.4 10.7 4.6c-.3-1.8 1.4-3.1 2.4-1.8 1.4 1.8.2 4.8-2.3 7-2.5 2.2-4.2 3.9-4 6.3.2 2.4 2.4 3.9 4.9 3.6 2.6-.3 4.2-2.2 3.9-4.3-.3-2-2.3-3.2-4.3-2.8-1.7.4-2.6 1.9-2 3.2.4.9 1.4 1.2 2.1.8'],
    staff: ['M3 6h18', 'M3 9.5h18', 'M3 13h18', 'M3 16.5h18', 'M3 20h18', 'F:M14.5 11.2a2.4 1.9 -20 1 1-4.6 1a2.4 1.9 -20 1 1 4.6-1z', 'M14.4 11.3V3'],
    guitar: ['M14.6 9.4 20 4l1 1-5.4 5.4', 'M19.2 3.2l1.6 1.6', 'M14.9 9.1c-1.6-1.3-3.6-1.2-4.6.4-.5.8-.4 1.7-1.3 2.1-1.4.6-3.4.2-4.6 1.6-1.9 2.1-1 5.4 1.1 6.9 2.1 1.6 5.2 1.4 6.4-.6.9-1.4.3-3.1 1.1-4.3.5-.8 1.5-.8 2.2-1.3 1.3-1 1.2-3.3-.3-4.8z', 'M8.4 14.2a1.5 1.5 0 1 0 2.2 2.1 1.5 1.5 0 0 0-2.2-2.1z', 'M11.2 12.9l3.5-3.5'],
    pick: ['M12 21c-2.8-2.6-7.5-8.2-7.5-12.3C4.5 5.4 7.8 3 12 3s7.5 2.4 7.5 5.7C19.5 12.8 14.8 18.4 12 21z', 'M12 8.2v5.2l3-.8', 'F:M12 13.4a1.7 1.4 -20 1 1-3.3.7 1.7 1.4 -20 1 1 3.3-.7z'],
    metronome: ['M9 3h6l4.5 18h-15z', 'M7.3 15h9.4', 'M12 15l5-9', 'F:M17.8 5.3a1.3 1.3 0 1 1-2.2-1.3 1.3 1.3 0 0 1 2.2 1.3z'],
    headphones: ['M4 15v-3a8 8 0 0 1 16 0v3', 'M4 14h3v6H5.5A1.5 1.5 0 0 1 4 18.5z', 'M20 14h-3v6h1.5a1.5 1.5 0 0 0 1.5-1.5z'],
    ear: ['M7 9a5 5 0 0 1 10 0c0 3-2.6 3.8-3.2 6.2-.4 1.8-1.4 3.8-3.6 3.8', 'M10 9.3a2 2 0 0 1 4 0c0 1.3-1.2 1.6-1.4 2.7', 'M19.5 6.5c1 1.4 1.5 2.8 1.5 4.5', 'M3 11c0-1.7.5-3.1 1.5-4.5'],
    piano: ['M3 5h18v14H3z', 'M8 5v14', 'M13 5v14', 'M18 5v14', 'F:M6.5 5h3v8h-3zM11.5 5h3v8h-3zM16.5 5h3v8h-3z'],
    chord: ['M5 4h14', 'M5 4v16', 'M9.7 4v16', 'M14.3 4v16', 'M19 4v16', 'M5 9h14', 'M5 14h14', 'F:M11.3 11.5a1.8 1.8 0 1 1-3.3 0 1.8 1.8 0 0 1 3.3 0zM20.6 11.5a1.8 1.8 0 1 1-3.3 0 1.8 1.8 0 0 1 3.3 0zM16 16.5a1.8 1.8 0 1 1-3.3 0 1.8 1.8 0 0 1 3.3 0z'],
    stack: ['F:M14 7a3 2.3 -18 1 1-5.8 1.4A3 2.3 -18 1 1 14 7zM14 12.2a3 2.3 -18 1 1-5.8 1.4 3 2.3 -18 1 1 5.8-1.4zM14 17.4a3 2.3 -18 1 1-5.8 1.4 3 2.3 -18 1 1 5.8-1.4z', 'M14.1 18V3'],
    fretboard: ['M2 7h20', 'M2 12h20', 'M2 17h20', 'M2 5v14', 'M8 5v14', 'M14 5v14', 'M20 5v14', 'F:M12.5 9.5a1.6 1.6 0 1 1-3 0 1.6 1.6 0 0 1 3 0zM18.5 14.5a1.6 1.6 0 1 1-3 0 1.6 1.6 0 0 1 3 0zM6.5 14.5a1.6 1.6 0 1 1-3 0 1.6 1.6 0 0 1 3 0z'],
    triad: ['F:M14.5 5a2.5 2 -18 1 1-4.9 1.2A2.5 2 -18 1 1 14.5 5zM9 16a2.5 2 -18 1 1-4.9 1.2A2.5 2 -18 1 1 9 16zM20 16a2.5 2 -18 1 1-4.9 1.2A2.5 2 -18 1 1 20 16z', 'M11 8.5 7.8 14.5', 'M13.2 8.5l3.2 6', 'M9.2 17.6h5.8'],
    doublestop: ['M3 7h18', 'M3 12h18', 'M3 17h18', 'F:M13.6 6.1a2.6 2 -18 1 1-5 1.3 2.6 2 -18 1 1 5-1.3zM13.6 11.1a2.6 2 -18 1 1-5 1.3 2.6 2 -18 1 1 5-1.3z', 'M13.6 12V2.5'],
    melody: ['M3 16c3-8 5-8 7-3s4 5 7-2c1-2.3 2.4-3.4 4-3.5', 'F:M5.2 17.4a1.6 1.3 -18 1 1-3.1.7 1.6 1.3 -18 1 1 3.1-.7zM11.8 13.9a1.6 1.3 -18 1 1-3.1.7 1.6 1.3 -18 1 1 3.1-.7zM18.4 9.2a1.6 1.3 -18 1 1-3.1.7 1.6 1.3 -18 1 1 3.1-.7z'],
    harmony: ['M6 19V8l12-3v11', 'F:M6 19a2.2 1.8 -18 1 1-4.3.9A2.2 1.8 -18 1 1 6 19zM18 16a2.2 1.8 -18 1 1-4.3.9A2.2 1.8 -18 1 1 18 16zM6 12.6a2.2 1.8 -18 1 1-4.3.9 2.2 1.8 -18 1 1 4.3-.9zM18 9.6a2.2 1.8 -18 1 1-4.3.9 2.2 1.8 -18 1 1 4.3-.9z'],
    scale: ['F:M6 19a2 1.6 -18 1 1-3.9.8A2 1.6 -18 1 1 6 19zM11 15a2 1.6 -18 1 1-3.9.8A2 1.6 -18 1 1 11 15zM16 11a2 1.6 -18 1 1-3.9.8A2 1.6 -18 1 1 16 11zM21 7a2 1.6 -18 1 1-3.9.8A2 1.6 -18 1 1 21 7z', 'M3 22h18'],
    interval: ['F:M8.5 17a2.6 2 -18 1 1-5 1.3 2.6 2 -18 1 1 5-1.3zM20.5 9a2.6 2 -18 1 1-5 1.3 2.6 2 -18 1 1 5-1.3z', 'M8.5 17.6V7', 'M20.5 9.6V3', 'M6 4.5h6', 'M9 3v3', 'M10.2 13.5l5-3'],
    progression: ['M3 6h5v12H3z', 'M9.5 6h5v12h-5z', 'M16 6h5v12h-5z', 'M5.5 10v4', 'M11 10l1 4 1-4', 'M18 10l1 4 1-4'],
    modes: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'F:M12 3a9 9 0 0 1 9 9h-9z', 'F:M13.4 5.1a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0zM8.2 8a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0zM7.5 15.2a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0zM13.4 18.9a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0z'],
    reharm: ['M4 8h13l-3-3', 'M20 16H7l3 3', 'F:M8 13a1.8 1.4 -18 1 1-3.5.8A1.8 1.4 -18 1 1 8 13zM19.5 10a1.8 1.4 -18 1 1-3.5.8 1.8 1.4 -18 1 1 3.5-.8z'],
    backing: ['M5 3h14v18H5z', 'M12 9a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', 'M12 12a1 1 0 1 1 0 2 1 1 0 0 1 0-2z', 'M12 5.3h.01', 'M8 6h.01', 'M16 6h.01'],
    drum: ['M4 9c0-1.9 3.6-3.5 8-3.5s8 1.6 8 3.5-3.6 3.5-8 3.5S4 10.9 4 9z', 'M4 9v6.5c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5V9', 'M7 12l2.5 6.6', 'M17 12l-2.5 6.6', 'M9 2.5l3.4 5', 'M17 2l-3 5'],
    finder: ['M10.5 3.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z', 'M15.6 15.6 21 21', 'M10.8 14V7.2l3 .8', 'F:M10.8 14a1.6 1.3 -18 1 1-3.1.7 1.6 1.3 -18 1 1 3.1-.7z'],
    search: ['M10.5 3.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z', 'M15.6 15.6 21 21', 'M10.6 13.4V7.6l2.6.7', 'F:M10.6 13.4a1.5 1.2 -18 1 1-2.9.7 1.5 1.2 -18 1 1 2.9-.7z'],
    settings: ['M6 3v18', 'M12 3v18', 'M18 3v18', 'F:M3.5 12.5h5v3h-5zM9.5 6.5h5v3h-5zM15.5 14.5h5v3h-5z'],
    songs: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z', 'M12 6a6 6 0 0 1 6 6', 'M6 12a6 6 0 0 0 6 6'],
    book: ['M4 4.5c2.8-.9 5.5-.6 8 1v14c-2.5-1.6-5.2-1.9-8-1z', 'M20 4.5c-2.8-.9-5.5-.6-8 1v14c2.5-1.6 5.2-1.9 8-1z', 'M15 9.8v4.4', 'F:M15 14.2a1.4 1.1 -18 1 1-2.7.6 1.4 1.1 -18 1 1 2.7-.6z'],
    learn: ['M3 6h18', 'M3 10h18', 'M3 14h18', 'M3 18h18', 'M15.2 20.2 12.8 3.8c-.3-1.6 1.2-2.7 2.1-1.6 1.2 1.6.2 4.2-2 6.1-2.2 1.9-3.6 3.4-3.4 5.5.2 2.1 2.1 3.4 4.3 3.1 2.3-.3 3.6-1.9 3.4-3.7-.3-1.7-2-2.8-3.7-2.4'],
    ball: ['F:M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z'],
    sharp: ['M9.5 3.5v17', 'M14.5 3v17', 'M6 10l12-3', 'M6 16l12-3'],
    flat: ['M8 3v17c3-1 8-3.5 8-7.5 0-2.6-3-3.2-8-.5'],
    natural: ['M8 3v13.5l8-2.5', 'M16 21V7.5L8 10'],
    fermata: ['M3.5 16a8.5 8.5 0 0 1 17 0', 'F:M13.5 15a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z'],
    back: ['M20 12H5', 'M11 6 5 12l6 6'],
    arrow: ['M4 12h15', 'M13 6l6 6-6 6'],
    close: ['M6 6l12 12', 'M18 6 6 18'],
    check: ['M4.5 12.5l4.5 4.5L19.5 6.5'],
    play: ['F:M8 5l11 7-11 7z'],
    spark: ['M12 3v5', 'M12 16v5', 'M3 12h5', 'M16 12h5', 'M5.6 5.6l3.2 3.2', 'M15.2 15.2l3.2 3.2', 'M18.4 5.6l-3.2 3.2', 'M8.8 15.2l-3.2 3.2']
  };
  function icon(name, opts) {
    opts = opts || {};
    const paths = P[name] || P.note;
    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('viewBox', '0 0 24 24'); el.setAttribute('class', 'ic ic-' + name + (opts.cls ? ' ' + opts.cls : ''));
    el.setAttribute('width', opts.size || 24); el.setAttribute('height', opts.size || 24);
    el.setAttribute('fill', 'none'); el.setAttribute('stroke', 'currentColor'); el.setAttribute('stroke-width', opts.stroke || 1.7);
    el.setAttribute('stroke-linecap', 'round'); el.setAttribute('stroke-linejoin', 'round');
    if (opts.title) { const t = document.createElementNS(NS, 'title'); t.textContent = opts.title; el.appendChild(t); } else el.setAttribute('aria-hidden', 'true');
    paths.forEach(d => { const p = document.createElementNS(NS, 'path'); if (d.startsWith('F:')) { p.setAttribute('d', d.slice(2)); p.setAttribute('fill', 'currentColor'); p.setAttribute('stroke', 'none'); } else p.setAttribute('d', d); el.appendChild(p); });
    return el;
  }
  /* 경로 → 아이콘 이름 (메뉴 · 허브 카드 · 미션에서 공통) */
  const ROUTE_ICONS = {
    '/learn': 'learn', '/guitar': 'guitar', '/theory': 'piano', '/practice': 'metronome',
    '/guitar/voicings': 'chord', '/guitar/scales': 'fretboard', '/guitar/triads': 'triad', '/guitar/doublestops': 'doublestop', '/guitar/phrasing': 'melody', '/guitar/licks': 'pick',
    '/theory/intervals': 'interval', '/theory/chords': 'stack', '/theory/scales': 'scale', '/theory/progressions': 'progression', '/theory/modes': 'modes', '/theory/reharm': 'reharm',
    '/ear': 'headphones', '/backing': 'drum', '/rhythm': 'metronome', '/tools/finder': 'finder', '/tools/melody': 'notes', '/tools/harmony': 'harmony', '/songs': 'songs', '/glossary': 'book', '/chord': 'stack'
  };
  function routeIcon(path) {
    let best = null;
    Object.keys(ROUTE_ICONS).forEach(p => { if ((path === p || path.startsWith(p + '/')) && (!best || p.length > best.length)) best = p; });
    return best ? ROUTE_ICONS[best] : 'note';
  }
  GH.icon = icon;
  GH.icon.names = Object.keys(P);
  GH.icon.forRoute = routeIcon;
})();
