import * as THREE from 'three';

export class Zombie {
  constructor(game, position, round, isHellhound = false) {
    this.game = game;
    this.isHellhound = isHellhound;
    this.round = round;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.isDead = false;
    this.hitCooldown = 0;
    this.attackCooldown = 0;
    this.stunTimer = 0;

    if (isHellhound) {
      this.maxHealth = 100 + round * 30;
      this.speed = 4.5 + Math.min(round * 0.05, 1.5);
      this.damage = 25;
      this.pointsValue = 100;
      this._buildHellhoundMesh();
    } else {
      this.maxHealth = this._healthForRound(round);
      this.speed = this._speedForRound(round);
      this.damage = round < 5 ? 15 : 25;
      this.pointsValue = 60;
      this._buildZombieMesh();
    }
    this.health = this.maxHealth;
    this.mesh.position.copy(this.position);
  }

  _healthForRound(r) {
    if (r <= 9) return 150 + (r - 1) * 100;
    if (r <= 20) return 950 + (r - 9) * 250;
    return 3700 + (r - 20) * 500;
  }

  _speedForRound(r) {
    // Les zombies courent de plus en plus vite mais plafonnent
    const base = 1.3;
    const mult = 1 + Math.min((r - 1) * 0.04, 1.2);
    return base * mult;
  }

  _buildZombieMesh() {
    this.mesh = new THREE.Group();
    this.mesh.userData.zombieRef = this;

    const skin = new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.95 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x2a2a1a, roughness: 1.0 });
    const eye = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 1.5 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), cloth);
    torso.position.y = 1.05; torso.castShadow = true;
    this.mesh.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), skin);
    head.position.y = 1.55; head.castShadow = true;
    head.userData.isHead = true;
    this.mesh.add(head);
    this.head = head;

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eye);
    eyeL.position.set(-0.08, 0.05, -0.17); head.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eye);
    eyeR.position.set(0.08, 0.05, -0.17); head.add(eyeR);

    const armGeo = new THREE.BoxGeometry(0.13, 0.6, 0.13);
    const armL = new THREE.Mesh(armGeo, skin);
    armL.position.set(-0.32, 1.15, 0); armL.rotation.x = -1.2; armL.castShadow = true;
    this.mesh.add(armL);
    const armR = new THREE.Mesh(armGeo, skin);
    armR.position.set(0.32, 1.15, 0); armR.rotation.x = -1.2; armR.castShadow = true;
    this.mesh.add(armR);

    const legGeo = new THREE.BoxGeometry(0.16, 0.7, 0.16);
    const legL = new THREE.Mesh(legGeo, cloth);
    legL.position.set(-0.14, 0.35, 0); legL.castShadow = true;
    this.mesh.add(legL);
    const legR = new THREE.Mesh(legGeo, cloth);
    legR.position.set(0.14, 0.35, 0); legR.castShadow = true;
    this.mesh.add(legR);

    this.game.scene.add(this.mesh);
  }

  _buildHellhoundMesh() {
    this.mesh = new THREE.Group();
    this.mesh.userData.zombieRef = this;

    const fur = new THREE.MeshStandardMaterial({ color: 0x1a0a0a, roughness: 1.0, emissive: 0x330000, emissiveIntensity: 0.3 });
    const eye = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.9), fur);
    body.position.y = 0.55; body.castShadow = true;
    this.mesh.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.4), fur);
    head.position.set(0, 0.65, -0.55); head.castShadow = true;
    head.userData.isHead = true;
    this.mesh.add(head);
    this.head = head;

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eye);
    eyeL.position.set(-0.09, 0.05, -0.18); head.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eye);
    eyeR.position.set(0.09, 0.05, -0.18); head.add(eyeR);

    const legGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
    for (const [x, z] of [[-0.2, -0.3], [0.2, -0.3], [-0.2, 0.3], [0.2, 0.3]]) {
      const l = new THREE.Mesh(legGeo, fur);
      l.position.set(x, 0.25, z); l.castShadow = true;
      this.mesh.add(l);
    }

    // Halo feu
    const fireLight = new THREE.PointLight(0xff3300, 1.5, 5);
    fireLight.position.set(0, 0.5, 0);
    this.mesh.add(fireLight);

    this.game.scene.add(this.mesh);
  }

  update(dt, player) {
    if (this.isDead) return;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.stunTimer = Math.max(0, this.stunTimer - dt);

    if (this.stunTimer > 0) return;

    const target = player.position.clone();
    const dir = target.clone().sub(this.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 0.01) return;
    dir.normalize();

    // Face au joueur
    const yaw = Math.atan2(dir.x, dir.z);
    this.mesh.rotation.y = yaw;

    // Attaque
    if (dist < 1.4 && this.attackCooldown <= 0) {
      this.attackCooldown = 1.0;
      player.takeDamage(this.damage);
      this.game.audio.playZombieAttack();
      // Animation attaque (léger bond en avant)
      this.mesh.position.addScaledVector(dir, 0.15);
      return;
    }

    // Avancer
    if (dist > 1.2) {
      const speed = this.isHellhound ? this.speed : (this.round > 3 ? this.speed : this.speed * 0.85);
      this.position.addScaledVector(dir, speed * dt);
      // Collision simple avec murs (approximative)
      const halfSize = new THREE.Vector3(0.3, 1.7, 0.3);
      if (this.game.physics.checkAABB(this.position, halfSize)) {
        // reculer
        this.position.addScaledVector(dir, -speed * dt);
      }
      this.mesh.position.copy(this.position);
    }
  }

  takeDamage(amount, isHead = false) {
    if (this.isDead) return false;
    const mult = isHead ? 2.0 : 1.0;
    this.health -= amount * mult;

    // Stun léger
    this.stunTimer = 0.08;

    // Flash rouge
    this._flash();

    if (this.health <= 0) {
      this.die(isHead);
      return true;
    }
    return false;
  }

  _flash() {
    this.mesh.traverse(c => {
      if (c.isMesh && !c.userData.isHead && !c._origColor) {
        c._origColor = c.material.color.clone();
      }
    });
    this.mesh.traverse(c => {
      if (c.isMesh) c.material.color.set(0xff3333);
    });
    setTimeout(() => {
      this.mesh.traverse(c => {
        if (c.isMesh && c._origColor) c.material.color.copy(c._origColor);
      });
    }, 60);
  }

  die(isHead) {
    this.isDead = true;
    this.mesh.rotation.z = Math.PI / 2;
    this.mesh.position.y = 0.2;

    // Points
    const points = isHead ? 100 : 60;
    this.game.player.addPoints(points);
    this.game.stats.zombiesKilled++;
    if (isHead) this.game.stats.headshots++;
    this.game.audio.playZombieDeath();

    // Effet sang
    this.game.effects.bloodBurst(this.position.clone().setY(1.3));

    // Drop powerup occasionnel
    if (Math.random() < 0.04) {
      this.game.powerups.spawnAt(this.position.clone());
    }

    // Cleanup
    setTimeout(() => {
      this.game.scene.remove(this.mesh);
      this.game.zombies.remove(this);
    }, 2500);
  }
}