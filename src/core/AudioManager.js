// SFX simples générés via WebAudio (aucun asset externe).
// Désactivable. Sons : tir, porte, mort d'ennemi, victoire, défaite, achat.

export class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this._lastShot = 0;
  }

  _ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { this.enabled = false; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _beep({ freq = 440, dur = 0.08, type = 'square', gain = 0.06, slideTo = null }) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }

  shot() {
    // throttle pour éviter la saturation avec de grosses escouades
    const now = performance.now();
    if (now - this._lastShot < 45) return;
    this._lastShot = now;
    this._beep({ freq: 720, dur: 0.05, type: 'square', gain: 0.03, slideTo: 380 });
  }
  gateGood() { this._beep({ freq: 520, dur: 0.14, type: 'sine', gain: 0.08, slideTo: 880 }); }
  gateBad() { this._beep({ freq: 300, dur: 0.16, type: 'sawtooth', gain: 0.07, slideTo: 120 }); }
  enemyDie() { this._beep({ freq: 200, dur: 0.09, type: 'triangle', gain: 0.05, slideTo: 90 }); }
  explode() { this._beep({ freq: 130, dur: 0.22, type: 'sawtooth', gain: 0.09, slideTo: 50 }); }
  win() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this._beep({ freq: f, dur: 0.16, type: 'square', gain: 0.08 }), i * 120));
  }
  lose() {
    [400, 300, 200, 120].forEach((f, i) =>
      setTimeout(() => this._beep({ freq: f, dur: 0.2, type: 'sawtooth', gain: 0.08 }), i * 130));
  }
  buy() { this._beep({ freq: 880, dur: 0.1, type: 'sine', gain: 0.07, slideTo: 1200 }); }

  toggle() { this.enabled = !this.enabled; return this.enabled; }
}
