import { Zombie } from './Zombie.js';

export class ZombieManager {
  constructor(game) {
    this.game = game;
    this.zombies = [];
    this.alive = 0;
    this.toSpawn = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.6;
    this.maxAlive = 24;
    this.hellhoundRound = false;
  }

  startRound(round) {
    this.hellhoundRound = (round % 5 === 0 && round >= 5);
    if (this.hellhoundRound) {
      this.toSpawn = 4 + Math.floor(round / 5) * 2;
    } else {
      // Formule proche de BO1
      const base = 6;
      const inc = Math.floor(round * 1.5);
      this.toSpawn = Math.min(base + inc, 60);
    }
    this.spawnTimer = 0.5;
  }

  update(dt) {
    // Spawn
    if (this.toSpawn > 0 && this.alive < this.maxAlive) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this._spawnOne();
        this.spawnTimer = this.spawnInterval;
      }
    }

    // Update zombies
    const player = this.game.player;
    for (const z of this.zombies) {
      if (!z.isDead) z.update(dt, player);
    }
  }

  _spawnOne() {
    const barricades = this.game.map.barricades;
    const b = barricades[Math.floor(Math.random() * barricades.length)];
    const spawnPos = b.group.position.clone();
    // Décaler légèrement pour ne pas tous les empiler
    spawnPos.x += (Math.random() - 0.5) * 1.5;
    spawnPos.z += (Math.random() - 0.5) * 1.5;
    spawnPos.y = 0;

    const z = new Zombie(this.game, spawnPos, this.game.rounds.currentRound, this.hellhoundRound);
    this.zombies.push(z);
    this.alive++;
    this.toSpawn--;
  }

  remove(z) {
    const i = this.zombies.indexOf(z);
    if (i > -1) this.zombies.splice(i, 1);
    this.alive = Math.max(0, this.alive - 1);
  }

  clearAll() {
    for (const z of this.zombies) this.game.scene.remove(z.mesh);
    this.zombies = [];
    this.alive = 0;
    this.toSpawn = 0;
  }

  getRemaining() {
    return this.alive + this.toSpawn;
  }
}