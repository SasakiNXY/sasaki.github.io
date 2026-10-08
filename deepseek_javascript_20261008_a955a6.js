import { Weapon } from './Weapon.js';

export class WeaponManager {
  constructor(game) {
    this.game = game;
    this.slots = [null, null]; // 2 armes max
    this.activeSlot = 0;
    this.reset();
  }

  reset() {
    this.slots = [new Weapon(this.game, 'M1911'), null];
    this.activeSlot = 0;
    this._equip();
  }

  get current() { return this.slots[this.activeSlot]; }

  switchTo(slot) {
    if (slot === this.activeSlot) return;
    if (!this.slots[slot]) return;
    this.activeSlot = slot;
    this._equip();
  }

  giveWeapon(name, upgraded = false) {
    const w = new Weapon(this.game, name, upgraded);
    // Si slot 2 vide, mettre là ; sinon remplacer l'arme active
    if (!this.slots[1]) {
      this.slots[1] = w;
      this.activeSlot = 1;
    } else {
      this.slots[this.activeSlot] = w;
    }
    this._equip();
    return w;
  }

  _equip() {
    const w = this.current;
    if (!w) return;
    this.game.playerView.setWeaponMesh(w.mesh);
    this.game.hud.setAmmo(w.ammo, w.reserve, w.name);
    this.game.hud.setWeaponName(w.upgraded ? w.name + ' (PaP)' : w.name);
  }

  updateAmmoHud() {
    const w = this.current;
    if (w) this.game.hud.setAmmo(w.ammo, w.reserve, w.name);
  }

  update(dt) {
    const input = this.game.input;

    // Switching
    if (input.wasPressed('Digit1')) this.switchTo(0);
    if (input.wasPressed('Digit2')) this.switchTo(1);

    const w = this.current;
    if (!w) return;

    // Tir
    if (w.data.mode === 'auto') {
      if (input.isMouseDown(0)) this._tryFire();
    } else {
      if (input.wasPressed('Mouse0')) this._tryFire();
    }

    // Reload
    if (input.wasPressed('KeyR')) w.reload();

    // Auto reload si vide
    if (w.ammo === 0 && !w.isReloading && w.reserve > 0) w.reload();

    // Mêlée
    if (input.wasPressed('KeyV')) this._melee();

    // Grenade
    if (input.wasPressed('KeyG')) this._throwGrenade();
  }

  _tryFire() {
    const before = this.current.ammo;
    const shots = this.current.fire();
    if (shots) {
      this.updateAmmoHud();
      // Hitmarker si au moins un hit
      const anyHit = shots.some(s => s.hit);
      if (anyHit) this.game.hud.showHitmarker(shots.some(s => s.hit && s.isHead));
    }
  }

  _melee() {
    // Coup de couteau à courte portée
    const origin = this.game.camera.position;
    const dir = new THREE.Vector3(); this.game.camera.getWorldDirection(dir);
    const ray = new THREE.Raycaster(origin, dir, 0, 2.5);
    const hits = ray.intersectObjects(this.game.scene.children, true);
    for (const h of hits) {
      let o = h.object; let z = null;
      while (o) { if (o.userData?.zombieRef) { z = o.userData.zombieRef; break; } o = o.parent; }
      if (z && !z.isDead) {
        // Couteau Bowie = one shot jusqu'à la manche 10
        const dmg = this.game.player.perks['Bowie Knife'] ? 1500 : 150;
        z.takeDamage(dmg, false);
        this.game.audio.playMelee();
        break;
      }
    }
  }

  _throwGrenade() {
    if (this.game.player.grenades <= 0) return;
    this.game.player.grenades--;
    this.game.hud.setGrenades(this.game.player.grenades);

    // Spawn grenade simplifiée
    const dir = new THREE.Vector3(); this.game.camera.getWorldDirection(dir);
    const pos = this.game.camera.position.clone().addScaledVector(dir, 0.5);
    const vel = dir.clone().multiplyScalar(15).add(new THREE.Vector3(0, 4, 0));

    const geo = new THREE.SphereGeometry(0.1, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x334422 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.game.scene.add(mesh);

    const start = performance.now();
    const fuse = 3000;
    const self = this;
    function tick() {
      const t = performance.now() - start;
      if (t >= fuse) {
        self.game.scene.remove(mesh);
        self.game.effects.explosion(mesh.position, 8);
        self.game.audio.playExplosion();
        // Dégâts zone
        for (const z of self.game.zombies.zombies) {
          if (z.isDead) continue;
          const d = z.position.distanceTo(mesh.position);
          if (d < 8) z.takeDamage(200 * (1 - d / 8), false);
        }
        self.game.effects.screenShake(0.3, 0.3);
        return;
      }
      vel.y -= 20 * 0.016;
      mesh.position.addScaledVector(vel, 0.016);
      if (mesh.position.y < 0.1) { mesh.position.y = 0.1; vel.y *= -0.4; vel.x *= 0.7; vel.z *= 0.7; }
      requestAnimationFrame(tick);
    }
    tick();
  }
}