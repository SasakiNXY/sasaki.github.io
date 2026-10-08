import * as THREE from 'three';

export class Effects {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.muzzle = null;
    this._buildMuzzle();
  }

  _buildMuzzle() {
    const sprite = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 })
    );
    this.muzzle = sprite;
    this.game.camera.add(sprite);
  }

  muzzleFlash() {
    this.muzzle.position.set(0.28, -0.2, -0.85);
    this.muzzle.material.opacity = 1;
    this.muzzle.rotation.z = Math.random() * Math.PI;
    setTimeout(() => { this.muzzle.material.opacity = 0; }, 40);
  }

  impact(point, normal, type = 'spark') {
    const color = type === 'blood' ? 0xaa0000 : 0xffaa44;
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 4, 4),
      new THREE.MeshBasicMaterial({ color })
    );
    particle.position.copy(point);
    particle.userData.vel = normal.clone().multiplyScalar(2);
    particle.userData.life = 0.4;
    this.game.scene.add(particle);
    this.particles.push(particle);
  }

  bloodBurst(pos) {
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x880000 })
      );
      p.position.copy(pos);
      p.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      );
      p.userData.life = 0.6;
      this.game.scene.add(p);
      this.particles.push(p);
    }
  }

  explosion(pos, radius = 4) {
    const flash = new THREE.PointLight(0xff8800, 8, radius * 2);
    flash.position.copy(pos);
    this.game.scene.add(flash);
    setTimeout(() => this.game.scene.remove(flash), 200);

    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.9 })
      );
      p.position.copy(pos);
      p.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 8,
        (Math.random() - 0.5) * 10
      );
      p.userData.life = 0.5;
      this.game.scene.add(p);
      this.particles.push(p);
    }
  }

  screenShake(magnitude, duration) {
    // Non implémenté finement — ajoute du bruit à la caméra pour X secondes
    const start = performance.now();
    const basePitch = this.game.player.pitch;
    const baseYaw = this.game.player.yaw;
    const self = this;
    function shake() {
      const t = (performance.now() - start) / (duration * 1000);
      if (t >= 1) return;
      const intensity = magnitude * (1 - t);
      self.game.player.pitch = basePitch + (Math.random() - 0.5) * intensity;
      self.game.player.yaw = baseYaw + (Math.random() - 0.5) * intensity;
      requestAnimationFrame(shake);
    }
    shake();
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.life -= dt;
      if (p.userData.life <= 0) {
        this.game.scene.remove(p);
        this.particles.splice(i, 1);
        continue;
      }
      p.userData.vel.y -= 12 * dt;
      p.position.addScaledVector(p.userData.vel, dt);
    }
  }
}