// Gère le fait que les zombies cassent les planches et remontent par les fenêtres.

export class Barricades {
  constructor(game) {
    this.game = game;
    this.breakTimer = 0;
  }

  update(dt) {
    // Les zombies proches d'une barricade cassent les planches progressivement
    this.breakTimer -= dt;
    if (this.breakTimer > 0) return;
    this.breakTimer = 1.5;

    const barricades = this.game.map.barricades;
    for (const b of barricades) {
      const bar = b.group;
      if (bar.userData.currentBoards <= 0) continue;

      // Un zombie est-il proche de cette barricade ?
      for (const z of this.game.zombies.zombies) {
        if (z.isDead) continue;
        const d = z.position.distanceTo(bar.position);
        if (d < 2.0) {
          bar.userData.currentBoards--;
          const idx = bar.userData.currentBoards;
          if (bar.userData.boards[idx]) {
            bar.userData.boards[idx].visible = false;
          }
          break;
        }
      }
    }
  }
}