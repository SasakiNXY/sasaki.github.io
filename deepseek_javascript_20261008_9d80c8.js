import { State } from '../core/Game.js';

export class Menu {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.root.innerHTML = '';
    this.root.style.display = 'none';
  }

  _show(html) {
    this.root.innerHTML = html;
    this.root.style.display = 'flex';
    this._bind();
  }

  hide() {
    this.root.style.display = 'none';
    this.root.innerHTML = '';
  }

  _bind() {
    const btn = this.root.querySelector('#btn-play');
    if (btn) btn.onclick = () => this.game.startGame();
    const btnResume = this.root.querySelector('#btn-resume');
    if (btnResume) btnResume.onclick = () => {
      this.hide();
      this.game.setState(State.PLAYING);
    };
    const btnRestart = this.root.querySelector('#btn-restart');
    if (btnRestart) btnRestart.onclick = () => this.game.startGame();
  }

  showMain() {
    const best = this.game.save.getBest();
    this._show(`
      <div class="menu-screen">
        <div class="menu-title">KINO DER TOTEN</div>
        <div class="menu-subtitle">ZOMBIES</div>
        <button class="menu-btn" id="btn-play">LANCER LA PARTIE</button>
        <div class="menu-stats">
          Meilleure manche : <b>${best.round}</b><br>
          Meilleur score : <b>${best.score}</b><br>
          Parties jouées : <b>${best.games}</b>
        </div>
      </div>
    `);
  }

  showPause() {
    this._show(`
      <div class="menu-screen">
        <div class="menu-title" style="font-size:48px">PAUSE</div>
        <button class="menu-btn" id="btn-resume">REPRENDRE</button>
        <button class="menu-btn" id="btn-play">NOUVELLE PARTIE</button>
      </div>
    `);
  }

  showGameOver(stats) {
    const mins = Math.floor(stats.time / 60);
    const secs = Math.floor(stats.time % 60);
    this._show(`
      <div class="menu-screen">
        <div class="menu-title gameover-title">VOUS ÊTES MORT</div>
        <div class="stats-grid">
          <div class="k">Manche atteinte</div><div class="v">${stats.round}</div>
          <div class="k">Score</div><div class="v">${stats.score}</div>
          <div class="k">Zombies tués</div><div class="v">${stats.zombiesKilled}</div>
          <div class="k">Headshots</div><div class="v">${stats.headshots}</div>
          <div class="k">Points dépensés</div><div class="v">${stats.pointsSpent}</div>
          <div class="k">Temps de survie</div><div class="v">${mins}m ${secs}s</div>
          <div class="k">Perks achetés</div><div class="v">${stats.perksBought.length}</div>
        </div>
        <button class="menu-btn" id="btn-restart">REJOUER</button>
      </div>
    `);
  }
}