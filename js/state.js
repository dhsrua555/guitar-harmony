/* 전역 설정 (localStorage 저장) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const KEY = 'gh.settings.v1';
  const TUNINGS = {
    standard: { label: '스탠다드 (E A D G B E)', midi: [40, 45, 50, 55, 59, 64] },
    halfdown: { label: '반음 내림 (Eb Ab Db Gb Bb Eb)', midi: [39, 44, 49, 54, 58, 63] },
    dropd: { label: '드롭 D (D A D G B E)', midi: [38, 45, 50, 55, 59, 64] },
    dropc: { label: '드롭 C (C G C F A D)', midi: [36, 43, 48, 53, 57, 62] },
    dadgad: { label: 'DADGAD', midi: [38, 45, 50, 55, 57, 62] },
    openg: { label: '오픈 G (D G D G B D)', midi: [38, 43, 50, 55, 59, 62] },
    opend: { label: '오픈 D (D A D F# A D)', midi: [38, 45, 50, 54, 57, 62] },
    opene: { label: '오픈 E (E B E G# B E)', midi: [40, 47, 52, 56, 59, 64] }
  };
  const defaults = {
    key: 'C',            // 전역 키 (루트 이름)
    accidentals: 'auto', // auto | sharp | flat
    lefty: false,
    tuning: 'standard',
    capo: 0,
    labelMode: 'degree', // degree | name
    symbolStyle: 'standard', // standard | jazz
    theme: 'auto',       // auto | light | dark
    volume: 0.8,
    instrument: 'steel', // steel | nylon | electric | piano
    reverb: 0.3,
    level: 'basic'       // basic | all : 메뉴에 심화 항목 표시 여부
  };
  let settings = Object.assign({}, defaults);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) settings = Object.assign({}, defaults, JSON.parse(raw));
  } catch (e) { /* 저장소를 못 쓰는 환경 */ }

  const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'D', 'G', 'Dm', 'Gm', 'Cm', 'Fm']);
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } }
  function applyTheme() {
    const t = settings.theme;
    document.documentElement.setAttribute('data-theme', t === 'auto' ? '' : t);
  }
  const state = {
    TUNINGS,
    get() { return settings; },
    set(patch) {
      Object.assign(settings, patch);
      persist();
      applyTheme();
      GH.events.emit('settings', settings);
    },
    reset() { settings = Object.assign({}, defaults); persist(); applyTheme(); GH.events.emit('settings', settings); },
    /* 현재 키에 맞는 임시표 선호 ('sharp' | 'flat') */
    pref(root) {
      if (settings.accidentals === 'sharp') return 'sharp';
      if (settings.accidentals === 'flat') return 'flat';
      const k = root || settings.key;
      if (/b/.test(k) && k.length > 1) return 'flat';
      if (/#/.test(k)) return 'sharp';
      return k === 'F' ? 'flat' : 'sharp';
    },
    tuningMidi() { return (TUNINGS[settings.tuning] || TUNINGS.standard).midi; },
    isStandardTuning() { return settings.tuning === 'standard'; }
  };
  applyTheme();
  GH.state = state;
})();
