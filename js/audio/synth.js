/* Web Audio 악기 엔진: 물리 모델링 기타 + 피아노/베이스/드럼 + 작은 룸 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  let ctx = null, master = null, comp = null, shaper = null, wet = null, convolver = null;
  const chains = {};   /* 프리셋별 바디/톤 체인 입력 노드 */
  const buses = {};    /* 이름별 게인 버스 (chords, bass, drums, melody) */
  const cache = {};    /* 프리셋:미디:변형 → AudioBuffer */
  const bassCache = {};
  const cymbalCache = {};
  const cacheOrder = [], bassCacheOrder = [];
  const active = [];

  /* 기타 프리셋: damp(루프 저역통과 계수), t60(초, 저음 기준), pickPos(피킹 위치 비율), exc(여기 신호 저역통과), body([주파수, dB, Q]...), tone(저역통과 Hz) */
  const PRESETS = {
    steel: { ko: '어쿠스틱 기타 (스틸)', damp: 0.3, t60: 5.4, pickPos: 0.14, exc: 0.36, body: [[105, 3.8, 3.2], [205, 2.6, 2.8], [410, 1.4, 2.1], [2450, 1.2, 1.2]], tone: 7600, shelf: -1.5, pick: 3300 },
    nylon: { ko: '클래식 기타 (나일론)', damp: 0.5, t60: 3.8, pickPos: 0.21, exc: 0.62, body: [[94, 4.2, 3], [188, 3, 2.8], [370, 1.7, 2.1]], tone: 4400, shelf: -4.5, pick: 1850 },
    electric: { ko: '일렉 기타 (클린)', damp: 0.22, t60: 6.2, pickPos: 0.1, exc: 0.28, body: [[240, 1.6, 1.2], [1650, 1.8, 1]], tone: 6100, shelf: -0.5, pick: 2800, chorus: true },
    piano: { ko: '피아노', synth: 'piano' }
  };
  const PRESET_ORDER = ['steel', 'nylon', 'electric', 'piano'];

  function preset() {
    const id = GH.state ? GH.state.get().instrument : 'steel';
    return PRESETS[id] ? id : 'steel';
  }
  function softCurve() {
    const n = 2048, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * 1.25) / Math.tanh(1.25); }
    return c;
  }
  function makeIR(c) {
    const sr = c.sampleRate, len = Math.floor(sr * 1.45);
    const buf = c.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch); let lp = 0, dark = 0;
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const n = Math.random() * 2 - 1;
        lp = 0.72 * lp + 0.28 * n;
        dark = 0.55 * dark + 0.45 * lp;
        const env = Math.exp(-t * 4.15) * Math.min(1, t / 0.006);
        d[i] = (lp * 0.38 + dark * 0.62) * env * 0.58;
      }
      /* 기타가 놓인 작은 방의 짧은 초기 반사음 */
      [[0.013, .34], [0.021, .22], [0.034, .17], [0.052, .11]].forEach(([sec, amp], i) => {
        const p = Math.floor((sec + (ch ? i * .0007 : 0)) * sr);
        if (p < len) d[p] += amp * (ch && i % 2 ? -1 : 1);
      });
    }
    return buf;
  }
  function context() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const s = GH.state ? GH.state.get() : { volume: 0.8, reverb: 0.3 };
      master = ctx.createGain(); master.gain.value = s.volume == null ? 0.8 : s.volume;
      shaper = ctx.createWaveShaper(); shaper.curve = softCurve(); shaper.oversample = '2x';
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -13; comp.ratio.value = 2.4; comp.attack.value = 0.012; comp.release.value = 0.22; comp.knee.value = 10;
      master.connect(comp); comp.connect(shaper); shaper.connect(ctx.destination);
      convolver = ctx.createConvolver(); convolver.buffer = makeIR(ctx);
      const roomTone = ctx.createBiquadFilter(); roomTone.type = 'lowpass'; roomTone.frequency.value = 6200; roomTone.Q.value = 0.25;
      wet = ctx.createGain(); wet.gain.value = (s.reverb == null ? 0.3 : s.reverb) * 0.4;
      convolver.connect(roomTone); roomTone.connect(wet); wet.connect(master);
      GH.events.on('settings', st => {
        if (master) master.gain.setTargetAtTime(st.volume, ctx.currentTime, 0.025);
        if (wet) wet.gain.setTargetAtTime((st.reverb == null ? 0.3 : st.reverb) * 0.4, ctx.currentTime, 0.025);
        ['chords', 'melody'].forEach(n => { if (buses[n]) { try { buses[n].disconnect(); } catch (e) { /* ignore */ } buses[n].connect(chainFor(preset())); } });
      });
    }
    if (ctx.state !== 'running' && ctx.state !== 'closed') { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } /* iOS 는 'interrupted' 상태도 있다 */
    return ctx;
  }
  /* 프리셋의 바디 공명 + 톤 체인 (한 번만 생성) */
  function chainFor(id) {
    if (chains[id]) return chains[id];
    const c = context(); const P = PRESETS[id];
    const input = c.createGain(); input.gain.value = 1;
    let node = input;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = P.synth === 'piano' ? 32 : 58; hp.Q.value = 0.35; node.connect(hp); node = hp;
    if (P.synth === 'piano') { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000; lp.Q.value = 0.4; node.connect(lp); node = lp; }
    if (P.body) P.body.forEach(([f, g, q]) => { const bq = c.createBiquadFilter(); bq.type = 'peaking'; bq.frequency.value = f; bq.gain.value = g; bq.Q.value = q; node.connect(bq); node = bq; });
    if (P.shelf) { const sh = c.createBiquadFilter(); sh.type = 'highshelf'; sh.frequency.value = 3200; sh.gain.value = P.shelf; node.connect(sh); node = sh; }
    if (P.tone) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = P.tone; lp.Q.value = 0.5; node.connect(lp); node = lp; }
    if (P.chorus) {
      /* 얕은 코러스: 원음 + 12ms 지연(느린 LFO) 을 좌우로 */
      const merger = c.createChannelMerger(2); const dl = c.createDelay(0.05); dl.delayTime.value = 0.012;
      const lfo = c.createOscillator(); const lg = c.createGain(); lfo.frequency.value = 0.35; lg.gain.value = 0.0025; lfo.connect(lg); lg.connect(dl.delayTime); lfo.start();
      node.connect(merger, 0, 0); node.connect(dl); dl.connect(merger, 0, 1);
      node = merger;
    }
    node.connect(master);
    const send = c.createGain(); send.gain.value = P.synth === 'piano' ? 0.42 : 0.52; node.connect(send); send.connect(convolver);
    chains[id] = input;
    return input;
  }
  function bus(name) {
    if (buses[name]) return buses[name];
    const c = context(); const g = c.createGain(); g.gain.value = 1;
    buses[name] = g;
    if (name === 'drums') {
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 28;
      g.connect(hp); hp.connect(master);
      const snd = c.createGain(); snd.gain.value = 0.12; hp.connect(snd); snd.connect(convolver);
    }
    else if (name === 'bass') {
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 27; hp.Q.value = 0.5;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3100; lp.Q.value = 0.45;
      const body = c.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 105; body.gain.value = 2.5; body.Q.value = 0.8;
      g.connect(hp); hp.connect(lp); lp.connect(body); body.connect(master);
      const snd = c.createGain(); snd.gain.value = 0.055; body.connect(snd); snd.connect(convolver);
    }
    else g.connect(chainFor(preset()));
    return g;
  }
  function setBusGain(name, v) { const g = bus(name); if (g) g.gain.setTargetAtTime(v, context().currentTime, 0.02); const sg = sbus(name); if (sg) sg.gain.setTargetAtTime(v, context().currentTime, 0.02); }

  /* ---- 실제 악기 녹음 (samples.js) ----
     녹음에는 이미 몸통 울림이 들어 있으니 합성음용 필터를 거치지 않고 방 울림과 마스터로 바로 보낸다 */
  const sbuses = {}; let sampleMain = null;
  const SAMPLE_LEVEL = 0.4;
  const useSamples = () => !!GH.samples && GH.samples.enabled();
  function sampleChain() {
    if (sampleMain) return sampleMain;
    const c = context();
    const input = c.createGain(); input.gain.value = 1;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 34; hp.Q.value = 0.5;
    input.connect(hp); hp.connect(master);
    const send = c.createGain(); send.gain.value = 0.42; hp.connect(send); send.connect(convolver);
    sampleMain = input; return input;
  }
  function sbus(name) {
    if (sbuses[name]) return sbuses[name];
    const c = context(); if (!c) return null;
    const g = c.createGain(); g.gain.value = buses[name] ? buses[name].gain.value : 1;
    if (name === 'bass') {
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 30; hp.Q.value = 0.5;
      g.connect(hp); hp.connect(master);
      const snd = c.createGain(); snd.gain.value = 0.05; hp.connect(snd); snd.connect(convolver);
    } else if (name === 'drums') { /* 녹음에 방 소리가 들어 있어 울림은 조금만 */
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 26; hp.Q.value = 0.5;
      g.connect(hp); hp.connect(master);
      const snd = c.createGain(); snd.gain.value = 0.07; hp.connect(snd); snd.connect(convolver);
    } else g.connect(sampleChain());
    sbuses[name] = g; return g;
  }
  function playSample(v, id, midi, when, dur, opts) {
    const c = context(); const I = GH.samples.INST[id];
    const t0 = Math.max(when, c.currentTime + 0.01);
    const end = t0 + Math.max(0.05, dur);
    const velocity = opts.gain == null ? 1 : opts.gain;
    const rate = Math.pow(2, (midi - v.midi) / 12);
    const src = c.createBufferSource(); src.buffer = v.buf;
    const pr = src.playbackRate;
    if (opts.slideFrom) { pr.setValueAtTime(rate * Math.pow(2, opts.slideFrom / 12), t0); pr.linearRampToValueAtTime(rate, t0 + Math.min(0.12, dur * 0.5)); }
    else if (opts.bend) {
      pr.setValueAtTime(rate, t0); const top = rate * Math.pow(2, opts.bend / 12);
      pr.linearRampToValueAtTime(top, t0 + Math.min(0.18, dur * 0.4));
      if (opts.release) { pr.setValueAtTime(top, end - 0.15); pr.linearRampToValueAtTime(rate, end - 0.02); }
    } else if (opts.vibrato && dur > 0.3) {
      pr.value = rate;
      const steps = 40; const curve = new Float32Array(steps);
      for (let i = 0; i < steps; i++) { const tt = i / steps; curve[i] = rate * Math.pow(2, (Math.sin(tt * dur * 5.5 * Math.PI * 2) * 0.25 * Math.min(1, tt * 4)) / 12); }
      try { pr.setValueCurveAtTime(curve, t0 + 0.05, Math.max(0.1, dur - 0.06)); } catch (e) { /* ignore */ }
    } else pr.value = rate;
    /* 세기: 약하게 칠수록 작고 어둡게, 짧게 끊는 기타 음은 손바닥으로 누른 듯 더 어둡게 */
    const vel = Math.max(0.05, Math.min(1.3, velocity));
    const tone = c.createBiquadFilter(); tone.type = 'lowpass'; tone.Q.value = 0.5;
    const muted = id !== 'piano' && id !== 'bass' && id !== 'upright' && dur < 0.3;
    const bright = I.soft + (I.bright - I.soft) * Math.pow(Math.min(1, vel), 1.6);
    tone.frequency.value = Math.min(18000, muted ? bright * 0.55 : bright);
    const want = Math.pow(vel, 1.25);
    const g = c.createGain(); const level = I.gain * SAMPLE_LEVEL * (v.lv ? v.lv * Math.max(0.5, Math.min(2, want / v.lv)) : want);
    g.gain.setValueAtTime(level, t0);
    g.gain.setValueAtTime(level, end);
    g.gain.setTargetAtTime(0, end, I.release / 3.5);
    const pan = opts.pan != null ? Math.max(-1, Math.min(1, opts.pan)) : id === 'bass' || id === 'upright' ? 0 : Math.max(-0.22, Math.min(0.22, (midi - 60) * 0.008 + (Math.random() - .5) * .035));
    const p = panNode(c, pan);
    src.connect(tone); tone.connect(g); g.connect(p); p.connect(opts.bus ? sbus(opts.bus) : sampleChain());
    const left = ((v.end || v.buf.duration) - v.offset) / rate;
    src.start(t0, v.offset); src.stop(t0 + Math.min(left + 0.02, (end - t0) + I.release * 2.2 + 0.05));
    track(src);
    return src;
  }
  function noteOut(opts) {
    if (opts && opts.bus && opts.bus !== 'chords' && opts.bus !== 'melody') return bus(opts.bus);
    if (opts && opts.bus) return bus(opts.bus);
    return chainFor(preset());
  }

  /* ---- 확장 Karplus-Strong ---- */
  function seeded(seed) {
    let n = seed | 0;
    return () => { n = Math.imul(1664525, n) + 1013904223 | 0; return ((n >>> 0) / 4294967296) * 2 - 1; };
  }
  function ksBuffer(id, midi, variant) {
    const c = context(); if (!c) return null;
    variant = variant || 0;
    const key = id + ':' + Math.round(midi) + ':' + variant;
    if (cache[key]) return cache[key];
    const P = PRESETS[id]; const sr = c.sampleRate;
    const freq = GH.notes.midiToFreq(Math.round(midi));
    const t = Math.max(0, Math.min(1, (midi - 40) / 44));
    const damp = P.damp * (1 - 0.45 * t);                       /* 고음일수록 감쇠 필터를 조금 열어 둔다 */
    const N = Math.max(3, sr / freq - 0.5 - damp / (1 - damp)); /* 평균 필터와 일차 필터의 위상 지연 보정 */
    const Ni = Math.floor(N), frac = N - Ni;
    const t60 = P.t60 * (1 - 0.55 * t);
    const loss = Math.pow(10, -3 / (t60 * freq));
    const sec = midi < 52 ? 3.4 : midi < 64 ? 2.8 : 2.2;
    const len = Math.floor(sr * sec);
    const buf = c.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    /* 여기 신호: 저역통과한 노이즈 → 피킹 위치 콤 필터 */
    const exc = new Float32Array(Ni + 2); const random = seeded((midi + 1) * 7919 + variant * 104729 + id.length * 1543); let lp = 0;
    for (let i = 0; i < exc.length; i++) { lp = P.exc * lp + (1 - P.exc) * random(); exc[i] = lp; }
    const pickVariation = 1 + (variant - 1.5) * 0.028;
    const pp = Math.max(1, Math.round(P.pickPos * pickVariation * N));
    for (let i = Ni; i >= pp; i--) exc[i] -= exc[i - pp];
    for (let i = 0; i <= Ni && i < len; i++) d[i] = exc[i];
    let y = 0, last = 0;
    for (let i = Ni + 1; i < len; i++) {
      const x = (1 - frac) * d[i - Ni] + frac * d[i - Ni - 1];
      const averaged = x * 0.58 + last * 0.42;
      y = damp * y + (1 - damp) * averaged;
      d[i] = loss * y;
      last = x;
    }
    let peak = 0; for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
    if (peak > 0) { const k = 0.94 / peak; for (let i = 0; i < len; i++) d[i] *= k; }
    cache[key] = buf;
    cacheOrder.push(key);
    if (cacheOrder.length > 120) delete cache[cacheOrder.shift()];
    return buf;
  }
  function track(src) { active.push(src); src.onended = () => { const i = active.indexOf(src); if (i >= 0) active.splice(i, 1); }; }

  function panNode(c, value) {
    if (!c.createStereoPanner) return c.createGain();
    const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, value || 0)); return p;
  }
  function pickTransient(P, midi, t0, velocity, out, pan) {
    const c = context(); const n = noise();
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = P.pick * Math.pow(2, (midi - 60) / 48); bp.Q.value = P === PRESETS.nylon ? 0.75 : 1.15;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = P === PRESETS.nylon ? 420 : 850;
    const g = c.createGain(); const p = panNode(c, pan);
    const level = velocity * (P === PRESETS.nylon ? 0.026 : 0.038);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(level, t0 + 0.0015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.018);
    n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(p); p.connect(out);
    const offset = Math.random() * Math.max(0.01, n.buffer.duration - 0.025);
    n.start(t0, offset, 0.024); track(n);
  }

  /* 한 음 재생. opts: {gain, bend(반음), bendAt, release, slideFrom(반음 차이), vibrato, bus, pan(-1 왼쪽 ~ 1 오른쪽)} */
  function pluck(midi, when, dur, opts) {
    const c = context(); if (!c) return null;
    opts = opts || {};
    const id = opts.preset || preset();
    if (useSamples()) { const v = GH.samples.voice(id, midi); if (v) return playSample(v, id, midi, when, dur, opts); }
    if (PRESETS[id].synth === 'piano') return pianoNote(midi, when, dur, opts);
    const P = PRESETS[id];
    const buf = ksBuffer(id, midi, Math.floor(Math.random() * 4)); if (!buf) return null;
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain();
    const velocity = opts.gain == null ? 1 : opts.gain;
    const gain = velocity * (id === 'nylon' ? 0.39 : id === 'electric' ? 0.36 : 0.4);
    const t0 = Math.max(when, c.currentTime + 0.01);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + (id === 'nylon' ? 0.0045 : 0.0025));
    const end = t0 + Math.max(0.05, dur);
    const release = Math.min(0.085, Math.max(0.025, dur * 0.16));
    g.gain.setValueAtTime(gain, Math.max(t0 + 0.005, end - release));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    if (opts.slideFrom) {
      src.playbackRate.setValueAtTime(Math.pow(2, opts.slideFrom / 12), t0);
      src.playbackRate.linearRampToValueAtTime(1, t0 + Math.min(0.12, dur * 0.5));
    } else if (opts.bend) {
      src.playbackRate.setValueAtTime(1, t0);
      const bt = t0 + Math.min(0.18, dur * 0.4);
      src.playbackRate.linearRampToValueAtTime(Math.pow(2, opts.bend / 12), bt);
      if (opts.release) { src.playbackRate.setValueAtTime(Math.pow(2, opts.bend / 12), end - 0.15); src.playbackRate.linearRampToValueAtTime(1, end - 0.02); }
    } else if (opts.vibrato && dur > 0.3) {
      const steps = 40; const curve = new Float32Array(steps);
      for (let i = 0; i < steps; i++) { const tt = i / steps; curve[i] = Math.pow(2, (Math.sin(tt * dur * 5.5 * Math.PI * 2) * 0.25 * Math.min(1, tt * 4)) / 12); }
      try { src.playbackRate.setValueCurveAtTime(curve, t0 + 0.05, Math.max(0.1, dur - 0.06)); } catch (e) { /* ignore */ }
    }
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 54; hp.Q.value = 0.35;
    const tone = c.createBiquadFilter(); tone.type = 'lowpass'; tone.Q.value = 0.45;
    const muted = dur < 0.42;
    const baseTone = Math.max(1900, P.tone * (0.76 + Math.min(1, velocity) * 0.16) * (muted ? 0.52 : 1));
    tone.frequency.setValueAtTime(Math.min(11000, baseTone * 1.35), t0);
    tone.frequency.exponentialRampToValueAtTime(baseTone, t0 + Math.min(0.38, dur * 0.45));
    const pan = opts.pan != null ? Math.max(-1, Math.min(1, opts.pan)) : Math.max(-0.22, Math.min(0.22, (midi - 60) * 0.008 + (Math.random() - .5) * .035));
    const p = panNode(c, pan); const out = noteOut(opts);
    src.connect(hp); hp.connect(tone); tone.connect(g); g.connect(p); p.connect(out);
    pickTransient(P, midi, t0, velocity, out, pan);
    src.start(t0); src.stop(end + 0.05);
    track(src);
    return src;
  }

  /* ---- 피아노 (배음 합성) ---- */
  const PARTIALS = [[1, 1], [1.0024, 0.13], [2, 0.39], [3, 0.17], [4, 0.072], [5, 0.034], [6, 0.014]];
  function pianoNote(midi, when, dur, opts) {
    const c = context();
    const out = noteOut(opts);
    const f = GH.notes.midiToFreq(midi);
    const t0 = Math.max(when, c.currentTime + 0.01);
    const end = t0 + Math.max(0.08, dur);
    const velocity = opts && opts.gain != null ? opts.gain : 1;
    const vel = velocity * 0.275;
    const t = Math.max(0, Math.min(1, (midi - 36) / 50));
    const g = c.createGain(); const p = panNode(c, opts && opts.pan != null ? Math.max(-1, Math.min(1, opts.pan)) : Math.max(-.32, Math.min(.32, (midi - 60) * .012)));
    g.gain.value = 1; g.connect(p); p.connect(out);
    const inh = 0.00035;
    PARTIALS.forEach(([k, a]) => {
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.value = f * k * (1 + inh * k * k);
      o.detune.value = (Math.random() - .5) * (k < 1.1 ? 1.4 : .55);
      const eg = c.createGain();
      const amp = vel * a * (k > 1 ? (1 - 0.5 * t) : 1);
      const tau = (1.65 - 1.02 * t) / (0.72 + 0.52 * k);
      eg.gain.setValueAtTime(0, t0);
      eg.gain.linearRampToValueAtTime(amp, t0 + (k > 2 ? 0.002 : 0.0045));
      eg.gain.setTargetAtTime(amp * 0.25, t0 + 0.01, tau);
      eg.gain.setTargetAtTime(0, end, 0.04); /* 릴리즈 */
      o.connect(eg); eg.connect(g);
      o.start(t0); o.stop(end + 0.3);
      track(o);
    });
    /* 해머 노이즈 */
    const ns = noise(); const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2200 + midi * 18; nf.Q.value = 0.65;
    const ng = c.createGain(); ng.gain.setValueAtTime(vel * (0.24 + velocity * .08), t0); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.024);
    ns.connect(nf); nf.connect(ng); ng.connect(g);
    ns.start(t0, Math.random() * Math.max(.01, ns.buffer.duration - .03), .028); track(ns);
    return g;
  }

  /* ---- 베이스 ---- */
  function bassBuffer(midi, variant) {
    const c = context(); const key = Math.round(midi) + ':' + variant;
    if (bassCache[key]) return bassCache[key];
    const sr = c.sampleRate, f = GH.notes.midiToFreq(Math.round(midi));
    const seconds = midi < 40 ? 3.1 : 2.65; const len = Math.floor(sr * seconds);
    const b = c.createBuffer(1, len, sr); const d = b.getChannelData(0);
    const random = seeded((midi + 17) * 3571 + variant * 65537); let finger = 0;
    const phase = Array.from({ length: 7 }, () => random() * Math.PI);
    for (let i = 0; i < len; i++) {
      const t = i / sr; let v = 0;
      for (let h = 1; h <= 7; h++) {
        const stiffness = 1 + 0.000055 * h * h;
        const pick = Math.sin(Math.PI * h * (0.18 + variant * .006));
        const amp = pick / Math.pow(h, 1.32) * Math.exp(-t * (0.68 + h * .27));
        v += Math.sin(2 * Math.PI * f * h * stiffness * t + phase[h - 1]) * amp;
      }
      finger = .64 * finger + .36 * random();
      const attack = Math.min(1, t / .0045);
      d[i] = attack * (v * .72 + finger * Math.exp(-t * 72) * .12);
    }
    let peak = 0; for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
    if (peak) for (let i = 0; i < len; i++) d[i] *= .92 / peak;
    bassCache[key] = b;
    bassCacheOrder.push(key);
    if (bassCacheOrder.length > 72) delete bassCache[bassCacheOrder.shift()];
    return b;
  }
  function bass(midi, when, dur, opts) {
    const c = context(); if (!c) return null;
    opts = opts || {};
    if (useSamples()) {
      const inst = opts.inst === 'upright' ? 'upright' : 'bass';
      let v = GH.samples.voice(inst, midi, opts.gain); let id = inst;
      if (!v && inst !== 'bass') { v = GH.samples.voice('bass', midi); id = 'bass'; }
      if (v) return playSample(v, id, midi, when, dur, Object.assign({}, opts, { bus: opts.bus || 'bass' }));
    }
    const t0 = Math.max(when, c.currentTime + 0.01);
    const end = t0 + Math.max(0.08, dur);
    const velocity = opts.gain == null ? 1 : opts.gain;
    const vel = velocity * 0.48;
    const out = bus(opts.bus || 'bass');
    const src = c.createBufferSource(); src.buffer = bassBuffer(midi, Math.floor(Math.random() * 3)); src.detune.value = (Math.random() - .5) * 2.2;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(1900 + Math.min(1.1, velocity) * 600, t0); lp.frequency.exponentialRampToValueAtTime(720, t0 + Math.min(.38, dur * .5));
    const body = c.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 120; body.gain.value = 1.5; body.Q.value = .85;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vel, t0 + 0.005);
    g.gain.setValueAtTime(vel, Math.max(t0 + .006, end - .065)); g.gain.exponentialRampToValueAtTime(0.0001, end);
    const p = panNode(c, (Math.random() - .5) * .035);
    src.connect(lp); lp.connect(body); body.connect(g); g.connect(p); p.connect(out);
    /* 손가락이 현에 닿는 짧은 어택을 별도 레이어로 더한다. */
    const n = noise(); const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 820 + Math.max(0, midi - 36) * 22; nf.Q.value = 1.2;
    const ng = c.createGain(); ng.gain.setValueAtTime(.042 * velocity, t0); ng.gain.exponentialRampToValueAtTime(.0001, t0 + .02);
    n.connect(nf); nf.connect(ng); ng.connect(p); n.start(t0, Math.random() * Math.max(.01, n.buffer.duration - .025), .024); track(n);
    src.start(t0); src.stop(end + .06); track(src);
    return g;
  }

  /* ---- 드럼 ---- */
  let noiseBuf = null;
  function noise() {
    const c = context();
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 1.25), c.sampleRate);
      const d = noiseBuf.getChannelData(0); let previous = 0;
      for (let i = 0; i < d.length; i++) { const white = Math.random() * 2 - 1; previous = previous * .035 + white * .965; d[i] = previous; }
    }
    const s = c.createBufferSource(); s.buffer = noiseBuf; return s;
  }
  function hitEnv(param, t0, peak, dur, attack) {
    param.setValueAtTime(0.0001, t0);
    param.linearRampToValueAtTime(Math.max(.0002, peak), t0 + (attack || .0015));
    param.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }
  function startNoise(src, t0, dur) {
    const d = Math.min(dur, src.buffer.duration - .01);
    src.start(t0, Math.random() * Math.max(.005, src.buffer.duration - d - .005), d); track(src);
  }
  function noiseHit(out, t0, peak, dur, type, freq, q, pan) {
    const c = context(); const n = noise(); const f = c.createBiquadFilter();
    f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q == null ? .8 : q;
    const g = c.createGain(); const p = panNode(c, pan || 0); hitEnv(g.gain, t0, peak, dur);
    n.connect(f); f.connect(g); g.connect(p); p.connect(out); startNoise(n, t0, dur + .012); return n;
  }
  function oscHit(out, t0, type, startFreq, endFreq, peak, dur, pan) {
    const c = context(); const o = c.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(startFreq, t0);
    if (endFreq && endFreq !== startFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + Math.min(dur * .72, .13));
    const g = c.createGain(); const p = panNode(c, pan || 0); hitEnv(g.gain, t0, peak, dur);
    o.connect(g); g.connect(p); p.connect(out); o.start(t0); o.stop(t0 + dur + .025); track(o); return o;
  }
  function cymbalBuffer(kind, variant) {
    const c = context(); const key = kind + ':' + variant; if (cymbalCache[key]) return cymbalCache[key];
    const ride = kind === 'ride'; const seconds = ride ? 1.45 : .48; const sr = c.sampleRate;
    const b = c.createBuffer(1, Math.floor(sr * seconds), sr); const d = b.getChannelData(0);
    const base = ride ? 335 : 515; const ratios = ride ? [1, 1.37, 1.71, 2.31, 2.94, 4.13, 5.42] : [1, 1.342, 1.497, 1.811, 2.274, 3.137];
    const random = seeded((ride ? 7717 : 4219) + variant * 997); const phases = ratios.map(() => random() * Math.PI);
    for (let i = 0; i < d.length; i++) {
      const t = i / sr; let v = 0;
      ratios.forEach((r, j) => { v += Math.sin(2 * Math.PI * base * r * (1 + j * j * .00013) * t + phases[j]) * Math.exp(-t * (ride ? .55 + j * .12 : 3.1 + j * .35)) / (1 + j * .24); });
      v += random() * (ride ? .18 : .3) * Math.exp(-t * (ride ? 1.3 : 4.8));
      d[i] = v * .18;
    }
    cymbalCache[key] = b; return b;
  }
  function metalHit(kind, out, t0, peak, dur, pan) {
    const c = context(); const src = c.createBufferSource(); src.buffer = cymbalBuffer(kind, Math.floor(Math.random() * 3)); src.playbackRate.value = .985 + Math.random() * .03;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = kind === 'ride' ? 1900 : 4700; hp.Q.value = .35;
    const g = c.createGain(); const p = panNode(c, pan); hitEnv(g.gain, t0, peak, dur, kind === 'ride' ? .002 : .0008);
    src.connect(hp); hp.connect(g); g.connect(p); p.connect(out); src.start(t0); src.stop(t0 + Math.min(src.buffer.duration, dur + .04)); track(src);
  }
  /* 녹음 드럼 한 타. 종류마다 음량을 조금 맞추고, 하이햇을 닫으면 울리던 열린 하이햇을 끊는다 */
  const KIT_TRIM = { kick: 1.3, snare: 1.0, rim: 1.25, hat: 0.95, hatopen: 1.0, pedal: 1.8, ride: 4.2, shaker: 0.72 };
  const DRUM_LEVEL = 1.5;
  let openHats = [];
  function drumSample(hv, type, t0, v) {
    const c = context();
    const src = c.createBufferSource(); src.buffer = hv.buf;
    const want = Math.pow(Math.min(1.2, Math.max(0.03, v)), 1.6);
    const g = c.createGain(); g.gain.value = KIT_TRIM[type] * DRUM_LEVEL * hv.lv * Math.max(0.35, Math.min(2.5, want / hv.lv));
    src.connect(g); g.connect(sbus('drums'));
    if (type === 'hat' || type === 'pedal') {
      openHats = openHats.filter(o => o.end > t0);
      openHats.forEach(o => { if (o.t0 < t0) { o.g.gain.setTargetAtTime(0, t0, 0.018); try { o.src.stop(t0 + 0.2); } catch (e) { /* ignore */ } } });
      openHats = openHats.filter(o => o.t0 >= t0);
    }
    src.start(t0, hv.offset); src.stop(t0 + (hv.end - hv.offset) + 0.01);
    if (type === 'hatopen') openHats.push({ src, g, t0, end: t0 + (hv.end - hv.offset) });
    track(src);
    return src;
  }
  function drum(type, when, gain) {
    const c = context(); if (!c) return;
    const out = bus('drums'); const t0 = Math.max(when, c.currentTime + 0.005); const v = gain == null ? 1 : gain;
    if (useSamples()) { const hv = GH.samples.hit(type, v); if (hv) return drumSample(hv, type, t0, v); }
    if (type === 'pedal') { /* 합성음: 발로 닫는 하이햇은 짧고 작게 */
      metalHit('hat', out, t0, .12 * v, .045, .24);
      noiseHit(out, t0, .03 * v, .03, 'bandpass', 6200, .5, .2);
      return;
    }
    if (type === 'kick') {
      oscHit(out, t0, 'sine', 145, 47, .82 * v, .36, -.03);
      oscHit(out, t0 + .002, 'triangle', 74, 48, .2 * v, .23, -.03);
      noiseHit(out, t0, .13 * v, .017, 'bandpass', 2850, 1.1, -.03);
    } else if (type === 'snare') {
      noiseHit(out, t0, .48 * v, .22, 'bandpass', 1850 + Math.random() * 260, .62, .08);
      noiseHit(out, t0, .19 * v, .12, 'highpass', 5100, .45, -.08);
      oscHit(out, t0, 'triangle', 212, 154, .27 * v, .13, .03);
      oscHit(out, t0 + .001, 'sine', 335, 285, .09 * v, .085, .03);
    } else if (type === 'hat' || type === 'hatopen') {
      const open = type === 'hatopen'; const dur = open ? .38 : .065;
      metalHit('hat', out, t0, (open ? .19 : .22) * v, dur, .24);
      noiseHit(out, t0, (open ? .07 : .055) * v, dur * .8, 'highpass', 7600, .3, .2);
    } else if (type === 'ride') {
      metalHit('ride', out, t0, .17 * v, .82, .18);
      oscHit(out, t0, 'sine', 3570 + Math.random() * 180, 3500, .034 * v, .13, .16);
    } else if (type === 'rim') {
      noiseHit(out, t0, .22 * v, .032, 'bandpass', 3050, 3.4, -.14);
      oscHit(out, t0, 'triangle', 815, 760, .13 * v, .038, -.12);
      oscHit(out, t0, 'sine', 1510, 1390, .065 * v, .026, -.12);
    } else if (type === 'shaker') {
      noiseHit(out, t0, .12 * v, .078, 'bandpass', 5150 + Math.random() * 400, .85, .2);
      noiseHit(out, t0 + .009, .045 * v, .045, 'highpass', 7800, .35, .26);
    } else if (type === 'tick') { /* 메트로놈 분할음: 작고 짧게 */
      oscHit(master, t0, 'sine', 880, 840, .05 * Math.min(1.6, v), .02, 0);
    } else if (type === 'wood') { /* 리듬 패턴용 우드블록 */
      oscHit(out, t0, 'sine', 1180, 1050, .2 * v, .06, 0);
      oscHit(out, t0, 'triangle', 2350, 2100, .05 * v, .03, 0);
      noiseHit(out, t0, .05 * v, .012, 'bandpass', 3000, 2, 0);
    } else if (type === 'click') {
      const f = v > 1 ? 1560 : 1120;
      oscHit(master, t0, 'sine', f, f * .92, v > 1 ? .16 : .105, .038, 0);
      oscHit(master, t0, 'triangle', f * 1.72, f * 1.62, v > 1 ? .045 : .032, .025, 0);
    }
  }
  function click(when, accent) { drum('click', when, accent ? 1.5 : 1); }
  function stopAll() {
    active.slice().forEach(s => { try { s.stop(); } catch (e) { /* ignore */ } });
    active.length = 0;
  }
  function now() { const c = context(); return c ? c.currentTime : 0; }
  /* ---- 아이폰 · 아이패드에서 소리가 안 나는 문제 ----
     iOS 는 웹 오디오를 벨소리처럼 다뤄서, 옆면의 무음 스위치가 켜져 있으면 소리를 꺼 버린다.
     그래서 처음 화면을 누를 때 (1) 오디오 세션을 '재생'으로 바꾸고 (iOS 17 이상), (2) 예전 iOS 를 위해
     들리지 않는 무음 오디오를 반복 재생해 두며, (3) 멈춰 있는 오디오 엔진을 깨운다 */
  const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let silentEl = null;
  function silentWavUrl(rate) {
    const n = Math.round(rate * 0.5), buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function unlock() {
    try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { /* 지원하지 않는 브라우저 */ }
    const c = context(); if (!c) return false;
    if (c.state !== 'running' && c.state !== 'closed') { const p = c.resume(); if (p && p.catch) p.catch(() => {}); }
    try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, c.sampleRate); s.connect(c.destination); s.start(0); } catch (e) { /* ignore */ }
    if (IOS && !silentEl) {
      try {
        silentEl = document.createElement('audio');
        silentEl.setAttribute('x-webkit-airplay', 'deny'); silentEl.setAttribute('playsinline', '');
        silentEl.preload = 'auto'; silentEl.loop = true; silentEl.src = silentWavUrl(c.sampleRate);
        const p = silentEl.play(); if (p && p.catch) p.catch(() => { silentEl = null; });
      } catch (e) { silentEl = null; }
    }
    return c.state === 'running';
  }
  const GESTURES = ['touchend', 'pointerup', 'mousedown', 'keydown'];
  function warmSamples() {
    if (!useSamples() || !ctx) return;
    GH.samples.ensure(preset()).then(() => GH.samples.ensure('bass'));
  }
  function onGesture() { const ok = unlock(); warmSamples(); if (ok && (!IOS || silentEl)) GESTURES.forEach(ev => window.removeEventListener(ev, onGesture, true)); }
  GESTURES.forEach(ev => window.addEventListener(ev, onGesture, { capture: true, passive: true }));
  /* 소리를 켜기 전에도 파일만 먼저 받아 둔다 (풀기는 오디오가 켜진 뒤) */
  setTimeout(() => { if (useSamples()) { const pf = GH.samples.prefetch(preset()); if (pf) pf.then(() => GH.samples.prefetch('bass')).catch(() => {}); } }, 1500);
  if (GH.events) GH.events.on('settings', () => { if (!useSamples()) return; if (ctx) warmSamples(); else GH.samples.prefetch(preset()); });
  /* 전화 · 잠금 · 앱 전환 뒤에 돌아오면 다시 깨운다 */
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running' && ctx.state !== 'closed') { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } });

  GH.audio = { context, unlock, pluck, bass, drum, click, stopAll, now, setBusGain, PRESETS, PRESET_ORDER, KIT_TRIM, available: () => !!(window.AudioContext || window.webkitAudioContext) };
})();
