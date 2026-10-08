import * as THREE from 'three';

export class Player {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.position = new THREE.Vector3(0, 1.7, 0);
    this.velocity = new THREE.Vector3();
    this.pitch = 0;
    this.yaw = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.isDown = false;
    this.isSprinting = false;
    this.isCrouching = false;
    this.isGrounded = true;
    this.points = 500;
    this.perks = {};
    this.grenades = 2;
    this.speedBase = 4.5;
    this.speedSprint = 7.0;
    this.speedCrouch = 2.5;
    this.gravity = -22;
    this.sensitivity = 0.0022;
    this.fov = 75;
    this.fovAds = 55;
    this.halfSize = new THREE.Vector3(0.35, 1.7, 0.35);
  }

  update(dt) {
    if (this.isDown) return;
    this._input(dt);
    this._physics(dt);
    this._camera();
    // régénération lente
    if (this.perks['Jugger-Nog'] && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + 2 * dt);
    }
  }

  _input(dt) {
    const input = this.game.input;
    const mouse = input.consumeMouseDelta();
    this.yaw -= mouse.x * this.sensitivity;
    this.pitch -= mouse.y * this.sensitivity;
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    let move = new THREE.Vector3();
    if (input.isKeyDown('KeyW')) move.add(forward);
    if (input.isKeyDown('KeyS')) move.sub(forward);
    if (input.isKeyDown('KeyA')) move.sub(right);
    if (input.isKeyDown('KeyD')) move.add(right);
    if (move.lengthSq() > 0) move.normalize();

    this.isCrouching = input.isKeyDown('ControlLeft');
    this.isSprinting = input.isKeyDown('ShiftLeft') && move.lengthSq() > 0 && !this.isCrouching;

    let speed = this.speedBase;
    if (this.isCrouching) speed = this.speedCrouch;
    else if (this.isSprinting) speed = this.speedSprint;
    if (this.game.playerView.adsAmount > 0.3) speed *= 0.6;

    this.velocity.x = move.x * speed;
    this.velocity.z = move.z * speed;

    if (input.isKeyDown('Space') && this.isGrounded) {
      this.velocity.y = 7.5;
      this.isGrounded = false;
    }
  }

  _physics(dt) {
    this.velocity.y += this.gravity * dt;
    const next = this.position.clone().addScaledVector(this.velocity, dt);

    // Test collision axe par axe
    const tryPos = this.position.clone();
    tryPos.x = next.x;
    if (!this.game.physics.checkAABB(tryPos, this.halfSize)) this.position.x = next.x;

    const tryPos2 = this.position.clone();
    tryPos2.z = next.z;
    if (!this.game.physics.checkAABB(tryPos2, this.halfSize)) this.position.z = next.z;

    this.position.y += this.velocity.y * dt;

    // Sol
    const eyeHeight = this.isCrouching ? 1.2 : 1.7;
    if (this.position.y <= eyeHeight) {
      this.position.y = eyeHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
  }

  _camera() {
    this.game.camera.position.copy(this.position);
    this.game.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  addPoints(n) {
    this.points += n;
    this.game.hud.setPoints(this.points);
  }

  takeDamage(amount) {
    if (this.isDown) return;
    let dmg = amount;
    if (this.perks['Jugger-Nog']) dmg *= 0.4;
    this.health -= dmg;
    this.game.hud.showDamage();
    if (this.health <= 0) {
      this.health = 0;
      if (this.perks['Quick Revive'] && !this._usedRevive) {
        this._usedRevive = true;
        this.health = this.maxHealth;
        this.perks['Quick Revive'] = false;
        this.game.showNotification('Quick Revive consommé');
        this.game.hud.updatePerks(this.perks);
      } else {
        this.die();
      }
    }
  }

  die() {
    this.isDown = true;
    this.game.gameOver();
  }

  getMuzzlePosition() {
    return this.position.clone()
      .add(new THREE.Vector3(
        Math.cos(this.yaw) * 0.3 + Math.sin(this.yaw) * 0.2,
        -0.15,
        -Math.sin(this.yaw) * 0.3 + Math.cos(this.yaw) * 0.2
      ));
  }
}