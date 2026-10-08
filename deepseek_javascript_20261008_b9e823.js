// IA simple : les zombies cherchent toujours le joueur.
// On garde ce fichier pour compatibilité mais la logique est dans Zombie.update.

export class ZombieAI {
  constructor(zombie) {
    this.zombie = zombie;
  }
  update(dt, player) {
    this.zombie.update(dt, player);
  }
}