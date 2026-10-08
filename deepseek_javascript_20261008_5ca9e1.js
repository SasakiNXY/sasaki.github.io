export class RoundSystem {
  constructor(game) {
    this.game = game;
    this.currentRound = 0;
    this.intermission = true;
    this.intermissionTimer = 0;
    this.betweenRoundsDelay = 5;
  }

  reset() {
    this.currentRound = 0;
    this.intermission = true;
    this.intermissionTimer = 3;
  }

  start() {
    this.currentRound = 0;
    this.intermission = true;
    this.intermissionTimer = 3;
  }

  update(dt) {
    if (this.intermission) {
      this.intermissionTimer -= dt;
      if (this.intermissionTimer <= 0) this._beginRound();
      return;
    }

    // Fin de manche ?
    if (this.game.zombies.toSpawn <= 0 && this.game.zombies.alive <= 0) {
      this._endRound();
    }
  }

  _beginRound() {
    this.currentRound++;
    this.intermission = false;
    const hh = (this.currentRound % 5 === 0 && this.currentRound >= 5);
    this.game.hud.showRound(this.currentRound, hh);
    this.game.hud.setRound(this.currentRound);
    this.game.audio.playRoundStart(hh);
    this.game.zombies.startRound(this.currentRound);
  }

  _endRound() {
    this.intermission = true;
    this.intermissionTimer = this.betweenRoundsDelay;
    this.game.hud.showNotification(`Manche ${this.currentRound} terminée`);
  }
}