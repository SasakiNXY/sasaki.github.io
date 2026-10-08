import * as THREE from 'three';
import { getWeaponData } from './WeaponData.js';

export class Weapon {
  constructor(game, name, upgraded = false) {
    this.game = game;
    this.name = name;
    this.upgraded = upgraded;
    const base = getWeaponData(name);
    if (!base) throw new Error('Unknown weapon: ' + name);

    // Copie et applique bonus PaP
    this.data = { ...base };
    if (upgraded) {
      this.data.dmg = Math.round((this.data.dmg || 0) * 2.5);
      this.data.mag = Math.round((this.data.mag || 1) * 1.5);
      this.data.reserveMax = Math.round((this.data.reserveMax || 0) * 1.5);
      this.data.reserve = this.data.reserveMax;
      this.data.rpm = Math.round((this.data.rpm || 60) * 1.2);
      this.data.reload = (this.data.reload || 2) * 0.8;
      if (this.data.pellets) this.data.pellets += 4;
    }

    this.ammo = this.data.mag;
    this.reserve = this.data.reserveMax;
    this.isReloading = false;
    this.lastShot = 0;
    this.reloadTimer = 0;

    this.mesh = this._buildMesh();
  }

  _buildMesh() {
    const g = new THREE.Group();
    const cat = this.data.cat;

    const bodyColor = this.upgraded ? 0x6a3aff : (cat === 'Wonder' ? 0x00ffaa : 0x2a2a2a);
    const accentColor = this.upgraded ? 0xaa88ff : 0x555555;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.7,
      roughness: 0.35,
      emissive: this.upgraded ? 0x221133 : (cat === 'Wonder' ? 0x006644 : 0x000000),
      emissiveIntensity: this.upgraded || cat === 'Wonder' ? 0.6 : 0
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor, metalness: 0.8, roughness: 0.3
    });

    // Corps principal (forme selon catégorie)
    let bodyGeo;
    if (cat === 'Pistol') bodyGeo = new THREE.BoxGeometry(0.08, 0.14, 0.22);
    else if (cat === 'SMG') bodyGeo = new THREE.BoxGeometry(0.09, 0.13, 0.42);
    else if (cat === 'Rifle') bodyGeo = new THREE.BoxGeometry(0.09, 0.13, 0.65);
    else if (cat === 'Shotgun') bodyGeo = new THREE.BoxGeometry(0.10, 0.14, 0.60);
    else if (cat === 'LMG') bodyGeo = new THREE.BoxGeometry(0.11, 0.16, 0.75);
    else if (cat === 'Sniper') bodyGeo = new THREE.BoxGeometry(0.08, 0.12, 0.95);
    else if (cat === 'Wonder') bodyGeo = new THREE.BoxGeometry(0.14, 0.16, 0.50);
    else bodyGeo = new THREE.BoxGeometry(0.10, 0.14, 0.55);

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.z = -bodyGeo.parameters.depth / 2 + 0.05;
    g.add(body);

    // Canon
    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -bodyGeo.parameters.depth + 0.05 - 0.15);
    g.add(barrel);

    // Chargeur
    const magGeo = new THREE.BoxGeometry(0.06, 0.18, 0.08);
    const mag = new THREE.Mesh(magGeo, accentMat);
    mag.position.set(0, -0.15, -bodyGeo.parameters.depth / 2 + 0.1);
    g.add(mag);

    // Poignée
    const gripGeo = new THREE.BoxGeometry(0.05, 0.14, 0.06);
    const grip = new THREE.Mesh(gripGeo, accentMat);
    grip.position.set(0, -0.13, 0.02);
    grip.rotation.x = -0.2;
    g.add(grip);

    // Scope (sniper / wonder)
    if (this.data.scope || cat === 'Wonder') {
      const scopeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.15, 8);
      const scopeMat = new THREE.MeshStandardMaterial({
        color: 0x050505, metalness: 0.9, roughness: 0.1,
        emissive: cat === 'Wonder' ? 0x00ffaa : 0x000000,
        emissiveIntensity: cat === 'Wonder' ? 0.8 : 0
      });
      const scope = new THREE.Mesh(scopeGeo, scopeMat);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.12, -0.2);
      g.add(scope);
    }

    // Lumière de wonder weapon
    if (cat === 'Wonder') {
      const light = new THREE.PointLight(0x00ffaa, 0.8, 3);
      light.position.set(0, 0.05, -0.4);
      g.add(light);
    }

    return g;
  }

  canFire() {
    if (this.isReloading) return false;
    if (this.ammo <= 0) return false;
    const interval = 60 / (this.data.rpm || 60);
    return (performance.now() / 1000 - this.lastShot) >= interval;
  }

  fire() {
    if (!this.canFire()) return null;
    this.lastShot = performance.now() / 1000;
    this.ammo--;

    const shots = [];
    const pellets = this.data.pellets || 1;
    const baseSpread = this.game.playerView.adsAmount > 0.5 ? this.data.adsSpread : this.data.spread;

    for (let i = 0; i < pellets; i++) {
      const spread = baseSpread || 0.01;
      const dir = new THREE.Vector3(0, 0, -1);
      dir.x += (Math.random() - 0.5) * spread * 2;
      dir.y += (Math.random() - 0.5) * spread * 2;
      dir.normalize();
      dir.applyEuler(new THREE.Euler(this.game.player.pitch, this.game.player.yaw, 0, 'YXZ'));

      const origin = this.game.camera.position.clone();
      const ray = new THREE.Raycaster(origin, dir);
      ray.far = this.data.range || 100;

      const hits = ray.intersectObjects(this.game.scene.children, true);
      let hitZombie = null;
      let hitPoint = null;
      let hitNormal = null;

      for (const h of hits) {
        // Trouver zombie dans la chaîne
        let o = h.object;
        let zombieRef = null;
        while (o) {
          if (o.userData && o.userData.zombieRef) { zombieRef = o.userData.zombieRef; break; }
          o = o.parent;
        }
        if (zombieRef && !zombieRef.isDead) {
          hitZombie = zombieRef;
          hitPoint = h.point;
          hitNormal = h.face ? h.face.normal.clone() : new THREE.Vector3(0, 1, 0);
          // vérifier si c'est la tête
          let headCheck = h.object;
          while (headCheck) {
            if (headCheck.userData && headCheck.userData.isHead) { hitZombie._lastHitHead = true; break; }
            headCheck = headCheck.parent;
          }
          break;
        } else {
          hitPoint = h.point;
          hitNormal = h.face ? h.face.normal.clone() : new THREE.Vector3(0, 1, 0);
          break;
        }
      }

      const result = { hit: false, point: hitPoint, zombie: null, isHead: false };
      if (hitZombie) {
        result.hit = true;
        result.zombie = hitZombie;
        result.isHead = !!hitZombie._lastHitHead;
        hitZombie._lastHitHead = false;
      }

      shots.push(result);

      // Effets
      if (hitPoint) {
        this.game.effects.impact(hitPoint, hitNormal, hitZombie ? 'blood' : 'spark');
      }
    }

    // Muzzle flash
    this.game.effects.muzzleFlash();

    // Recul viewmodel
    const recoilV = (this.data.dmg || 20) / 5000;
    this.game.playerView.addRecoil(
      recoilV * (0.8 + Math.random() * 0.4),
      (Math.random() - 0.5) * recoilV * 0.4
    );

    // Son
    this.game.audio.playWeaponFire(this.data.cat, this.upgraded);

    // Dégâts zombies
    for (const s of shots) {
      if (s.zombie) {
        s.zombie.takeDamage(this.data.dmg, s.isHead);
      }
    }

    // Armes explosives (lance-roquettes / crossbow)
    if (this.data.explosive || this.data.explosiveBolt) {
      const last = shots.find(s => s.point);
      if (last) {
        this.game.effects.explosion(last.point, 4);
        this.game.audio.playExplosion();
        // dégâts en zone
        for (const z of this.game.zombies.zombies) {
          if (z.isDead) continue;
          const d = z.position.distanceTo(last.point);
          if (d < 6) z.takeDamage(this.data.dmg, false);
        }
      }
    }

    // Ray Gun / Wunderwaffe : splash
    if (this.data.splashDmg && shots[0]?.point) {
      const p = shots[0].point;
      for (const z of this.game.zombies.zombies) {
        if (z.isDead || z === shots[0].zombie) continue;
        const d = z.position.distanceTo(p);
        if (d < (this.data.splashRadius || 3)) z.takeDamage(this.data.splashDmg, false);
      }
      this.game.effects.explosion(p, 2);
    }

    // Thundergun shockwave
    if (this.data.shockwave) {
      const origin = this.game.camera.position;
      const fwd = new THREE.Vector3(); this.game.camera.getWorldDirection(fwd);
      for (const z of this.game.zombies.zombies) {
        if (z.isDead) continue;
        const toZ = z.position.clone().sub(origin);
        const dist = toZ.length();
        if (dist > 15) continue;
        toZ.normalize();
        if (toZ.dot(fwd) > 0.5) z.takeDamage(2000, false);
      }
      this.game.effects.screenShake(0.4, 0.3);
    }

    // Wunderwaffe chain
    if (this.data.chain && shots[0]?.zombie) {
      const first = shots[0].zombie;
      const chained = [first];
      for (let i = 0; i < this.data.chain; i++) {
        let closest = null, closestD = Infinity;
        for (const z of this.game.zombies.zombies) {
          if (z.isDead || chained.includes(z)) continue;
          const d = z.position.distanceTo(chained[chained.length - 1].position);
          if (d < 8 && d < closestD) { closest = z; closestD = d; }
        }
        if (closest) { closest.takeDamage(150, false); chained.push(closest); }
      }
    }

    return shots;
  }

  reload() {
    if (this.isReloading) return;
    if (this.ammo >= this.data.mag) return;
    if (this.reserve <= 0) return;
    this.isReloading = true;
    const dur = this.data.reload * (this.game.player.perks['Speed Cola'] ? 0.6 : 1);
    this.reloadTimer = dur;
    this.game.audio.playReload();
    setTimeout(() => {
      if (!this.isReloading) return;
      const need = this.data.mag - this.ammo;
      const take = Math.min(need, this.reserve);
      this.ammo += take;
      this.reserve -= take;
      this.isReloading = false;
      this.game.hud.setAmmo(this.ammo, this.reserve, this.name);
    }, dur * 1000);
  }

  addAmmo(ratio = 1) {
    this.reserve = Math.min(this.data.reserveMax, this.reserve + Math.ceil(this.data.reserveMax * ratio));
  }

  refill() {
    this.ammo = this.data.mag;
    this.reserve = this.data.reserveMax;
  }
}