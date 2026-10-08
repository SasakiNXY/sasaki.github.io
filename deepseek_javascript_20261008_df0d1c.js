// Tous les sons sont synthétisés via Web Audio API. Aucun asset externe.

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    // Init au premier user gesture
    const init = () => {
      if (this.ctx) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.master);
      document.removeEventListener('click', init);
      document.removeEventListener('keydown', init);
    };
    document.addEventListener('click', init);
    document.addEventListener('keydown', init);
  }

  _beep(freq, dur, type = 'square', gain = 0.15, slide = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(freq + slide, 20), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _noise(dur, gain = 0.2, filterFreq = 1000) {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * dur, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(filt).connect(g).connect(this.sfxGain);
    src.start();
    src.stop(this.ctx.currentTime + dur);
  }

  playWeaponFire(cat, upgraded) {
    const base = upgraded ? 1.3 : 1.0;
    if (cat === 'Shotgun') this._noise(0.15, 0.5 * base, 800);
    else if (cat === 'Sniper') this._noise(0.2, 0.6 * base, 600);
    else if (cat === 'Pistol') this._beep(420, 0.06, 'square', 0.25 * base);
    else if (cat === 'Wonder') {
      this._beep(200, 0.4, 'sawtooth', 0.4, 800);
      this._beep(1200, 0.3, 'sine', 0.3, -600);
    }
    else if (cat === 'LMG') this._beep(180, 0.06, 'sawtooth', 0.3 * base);
    else this._beep(260, 0.05, 'square', 0.25 * base);
    // Crépitement
    this._noise(0.05, 0.3 * base, 3000);
  }

  playReload() {
    this._beep(180, 0.08, 'triangle', 0.15);
    setTimeout(() => this._beep(240, 0.06, 'triangle', 0.12), 100);
  }

  playMelee() {
    this._noise(0.08, 0.4, 400);
  }

  playExplosion() {
    this._noise(0.6, 0.7, 200);
    this._beep(60, 0.4, 'sine', 0.4, -20);
  }

  playZombieAttack() {
    this._beep(120, 0.15, 'sawtooth', 0.15, -40);
  }

  playZombieDeath() {
    this._beep(80, 0.3, 'sawtooth', 0.2, -50);
    this._noise(0.25, 0.15, 500);
  }

  playRoundStart(hellhound = false) {
    if (hellhound) {
      this._beep(180, 0.4, 'sawtooth', 0.3, -80);
      this._beep(60, 0.8, 'sine', 0.3);
    } else {
      this._beep(220, 0.3, 'triangle', 0.2, 100);
    }
  }

  playDoor() {
    this._beep(80, 0.5, 'square', 0.3, -30);
    this._noise(0.4, 0.2, 400);
  }

  playBuy() { this._beep(880, 0.1, 'sine', 0.2); }
  playPerk() { this._beep(440, 0.3, 'sine', 0.25, 400); }
  playPower() { this._beep(80, 1.0, 'sawtooth', 0.3, 200); this._noise(1.0, 0.2, 400); }
  playMysteryBox() { this._beep(600, 0.3, 'sine', 0.3, -200); }
  playTeleport() { this._beep(200, 0.8, 'sawtooth', 0.3, 1200); }
  playLink() { this._beep(400, 0.4, 'sine', 0.2, 600); }
  playPackAPunch() { this._beep(300, 0.5, 'square', 0.3, 600); this._noise(0.4, 0.2, 800); }
  playTrap() { this._noise(0.4, 0.3, 900); this._beep(180, 0.3, 'sawtooth', 0.2, 60); }
  playPowerUp() { this._beep(880, 0.15, 'sine', 0.25, 400); }
  playRepair() { this._beep(500, 0.05, 'triangle', 0.1); }
}