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
    instrument: 'auto',  // auto (고른 세션에 맞춤: 기타 · 베이스는 그 악기, 나머지는 피아노) | guitar | piano | bass
    guitarTone: 'steel', // 기타 소리를 낼 때의 음색: steel | nylon | electric
    compTone: 'auto',    // 백킹 트랙 컴핑 음색: auto | steel | nylon | electric | piano
    sound: 'sample',     // sample (실제 악기 녹음) | synth (합성음)
    reverb: 0.3,
    level: 'basic'       // basic | all : 메뉴에 심화 항목 표시 여부
  };
  let settings = Object.assign({}, defaults);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      /* 예전 설정: instrument 가 기타 음색이었다 → 음색은 guitarTone 으로, 악기는 세션에 맞춤으로 */
      if (['steel', 'nylon', 'electric'].includes(d.instrument)) { d.guitarTone = d.instrument; d.instrument = 'auto'; }
      settings = Object.assign({}, defaults, d);
    }
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
    /* 지금 낼 소리: 설정이 '세션에 맞춤'이면 이 페이지의 세션(없으면 설문에서 처음 고른 세션)을 따른다 */
    soundId(sess) {
      const tone = ['steel', 'nylon', 'electric'].includes(settings.guitarTone) ? settings.guitarTone : 'steel';
      const i = settings.instrument;
      if (i === 'guitar') return tone;
      if (i === 'piano' || i === 'bass') return i;
      if (['steel', 'nylon', 'electric'].includes(i)) return i;
      const s = sess || (GH.soundSession ? GH.soundSession() : 'guitar');
      return s === 'bass' ? 'bass' : s === 'guitar' || !s ? tone : 'piano';
    },
    /* 백킹 트랙 컴핑: 고른 음색, 아니면 지금 소리 (베이스 세션이면 기타 음색) */
    compId() { const c = settings.compTone; if (['steel', 'nylon', 'electric', 'piano'].includes(c)) return c; const id = state.soundId(); return id === 'bass' ? (['steel', 'nylon', 'electric'].includes(settings.guitarTone) ? settings.guitarTone : 'steel') : id; },
    tuningMidi() { return (TUNINGS[settings.tuning] || TUNINGS.standard).midi; },
    isStandardTuning() { return settings.tuning === 'standard'; }
  };
  applyTheme();
  GH.state = state;
})();
