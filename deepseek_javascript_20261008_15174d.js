import * as THREE from 'three';

export class PlayerView {
  constructor(game) {
    this.game = game;
    this.adsAmount = 0; // 0 = hip, 1 = full ADS
    this.recoilPitch = 0;
    this.recoilYaw = 0;
    this.bobTime = 0;

    // Viewmodel attaché à la caméra
    this.holder = new THREE.Group();
    game.camera.add(this.holder);

    this.weaponMesh = null;
    this.basePos = new THREE.Vector3(0.28, -0.28, -0.55);
    this.adsPos = new THREE.Vector3(0, -0.19, -0.35);
  }

  setWeaponMesh(mesh) {
    if (this.weaponMesh) this.holder.remove(this.weaponMesh);
    this.weaponMesh = mesh;
    mesh.position.copy(this.basePos);
    mesh.traverse(c => { if (c.isMesh) c.renderOrder = 999; });
    this.holder.add(mesh);
  }

  addRecoil(v, h) {
    this.recoilPitch += v;
    this.recoilYaw += h;
  }

  update(dt) {
    const weapon = this.game.weapons.current;
    const isAds = this.game.input.isMouseDown(2) && !this.game.player.isSprinting;
    const target = isAds ? 1 : 0;
    this.adsAmount += (target - this.adsAmount) * Math.min(1, dt * 12);

    // FOV selon ADS
    const baseFov = this.game.player.fov;
    const adsFov = this.game.player.fovAds;
    this.game.camera.fov = baseFov + (adsFov - baseFov) * this.adsAmount;
    this.game.camera.updateProjectionMatrix();

    // Viewmodel bob
    const moving = (Math.abs(this.game.player.velocity.x) + Math.abs(this.game.player.velocity.z)) > 0.5;
    if (moving && this.game.player.isGrounded) {
      this.bobTime += dt * (this.game.player.isSprinting ? 12 : 8);
    } else {
      this.bobTime += dt * 2;
    }
    const bobY = Math.sin(this.bobTime) * 0.012;
    const bobX = Math.cos(this.bobTime * 0.5) * 0.008;

    // Interpoler position viewmodel hip -> ADS
    if (this.weaponMesh) {
      const p = new THREE.Vector3().lerpVectors(this.basePos, this.adsPos, this.adsAmount);
      this.weaponMesh.position.x = p.x + bobX;
      this.weaponMesh.position.y = p.y + bobY;
      this.weaponMesh.position.z = p.z;

      // Recoil
      this.weaponMesh.rotation.x = this.recoilPitch;
      this.weaponMesh.rotation.y = this.recoilYaw;
      this.recoilPitch *= Math.pow(0.001, dt);
      this.recoilYaw *= Math.pow(0.001, dt);
    }

    // Appliquer recul à la caméra
    this.game.camera.rotation.x += this.recoilPitch * 0.15;
    this.game.camera.rotation.y += this.recoilYaw * 0.15;

    // Crosshair
    this.game.hud.setCrosshairAds(this.adsAmount > 0.5);
  }
}