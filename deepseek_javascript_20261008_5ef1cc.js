const KEY = 'kino_der_toten_save_v1';

export class SaveManager {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { best: { round: 0, score: 0, games: 0 }, settings: {} };
      return JSON.parse(raw);
    } catch {
      return { best: { round: 0, score: 0, games: 0 }, settings: {} };
    }
  }

  _save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {}
  }

  getBest() { return this.data.best; }

  recordGame(round, score, stats) {
    this.data.best.games++;
    if (round > this.data.best.round) this.data.best.round = round;
    if (score > this.data.best.score) this.data.best.score = score;
    this._save();
  }
}