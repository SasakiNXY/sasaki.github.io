import * as THREE from 'three';

const TYPES = [
  { id: 'double', name: 'Double Points', color: 0xffcc00, duration: 30 },
  { id: 'insta', name: 'Insta-Kill', color: 0xff0000, duration: 30 },
  { id: 'maxammo', name: 'Max Ammo', color: 0x00ff00, duration: 0 },
  { id: 'nuke', name: 'Nuke', color: 0xffffff, duration: 0 },
  { id: 'carpenter', name: 'Carpenter', color: 0x8844ff, duration: 0 }
];

export class PowerUps {
  constructor(game) {
    this.game = game;
    this.active = null; // powerup en cours sur le terrain
    this.effects = {
      double: 0,
      insta: 0
    };
  }

  spawnAt(pos) {
    if (this.active) return;
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];

    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const mat = new THREE.MeshStandardMaterial({
      color: type.color,
      emissive: type.color,
      emissiveIntensity: 1.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = 1.0;
    mesh.userData.isPowerUp = true;
    mesh.userData.type = type;
    this.game.scene.add(mesh);

    const light = new THREE.PointLight(type.color, 1.5, 5);
    mesh.add(light);

    this.active = mesh;
  }

  update(dt) {
    if (!this.active) return;

    // Rotation
    this.active.rotation.y += dt * 2;
    this.active.rotation.x += dt * 1.5;
    this.active.position.y = 1.0 + Math.sin(performance.now() * 0.003) * 0.15;

    // Ramassage ?
    const p = this.game.player.position;
    if (p.distanceTo(this.active.position) < 1.2) {
      this._collect(this.active.userData.type);
      this.game.scene.remove(this.active);
      this.active = null;
    }

    // Decay des effets
    if (this.effects.double > 0) this.effects.double -= dt;
    if (this.effects.insta > 0) this.effects.insta -= dt;
  }

  _collect(type) {
    this.game.audio.playPowerUp();
    this.game.hud.showPowerUp(type.name);
    switch (type.id) {
      case 'double': this.effects.double = 30; break;
      case 'insta':  this.effects.insta = 30; break;
      case 'maxammo':
        for (const s of this.game.weapons.slots) if (s) s.refill();
        this.game.weapons.updateAmmoHud();
        break;
      case 'nuke':
        // Tuer tous les zombies sur le terrain
        for (const z of this.game.zombies.zombies) {
          if (!z.isDead) z.takeDamage(999999, false);
        }
        this.game.player.addPoints(400);
        break;
      case 'carpenter':
        // Réparer toutes les barricades
        for (const b of this.game.map.barricades) {
          b.group.userData.currentBoards = b.group.userData.maxBoards;
          for (const bo of b.group.userData.boards) bo.visible = true;
        }
        break;
    }
  }

  getPointsMultiplier() {
    return this.effects.double > 0 ? 2 : 1;
  }

  isInstaKill() {
    return this.effects.insta > 0;
  }
}