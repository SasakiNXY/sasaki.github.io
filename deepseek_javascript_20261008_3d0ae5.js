import * as THREE from 'three';
import { MYSTERY_BOX_POOL } from '../weapons/WeaponData.js';

export class InteractionSystem {
  constructor(game) {
    this.game = game;
    this.currentTarget = null;
    this.currentPrompt = '';
    this.raycaster = new THREE.Raycaster();
  }

  update(dt) {
    // Gérer les traps actifs
    this._updateTraps(dt);
    this._updateTeleporter(dt);
    this._updateMysteryBox(dt);

    // Raycast depuis la caméra pour trouver un interactable
    const origin = this.game.camera.position;
    const dir = new THREE.Vector3(); this.game.camera.getWorldDirection(dir);
    this.raycaster.set(origin, dir);
    this.raycaster.far = 4;

    const hits = this.raycaster.intersectObjects(this.game.scene.children, true);

    let target = null;
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData && (
          o.userData.isDoor ||
          o.userData.isWallBuy ||
          o.userData.isPerkMachine ||
          o.userData.isMysteryBox ||
          o.userData.isPowerSwitch ||
          o.userData.isTrap ||
          o.userData.isTeleporter ||
          o.userData.isMainframe ||
          o.userData.isPackAPunch ||
          o.userData.isBoard
        )) { target = o; break; }
        o = o.parent;
      }
      if (target) break;
    }

    this.currentTarget = target;
    this.currentPrompt = target ? this._promptFor(target) : '';
    this.game.hud.setInteractPrompt(this.currentPrompt);

    // Interaction
    if (target && this.game.input.wasPressed('KeyE')) {
      this._interact(target);
    }
  }

  _promptFor(t) {
    if (t.userData.isBoard) {
      const bar = t.userData.barricadeRef;
      return `[E] Réparer (${bar.userData.currentBoards}/${bar.userData.maxBoards})`;
    }
    if (t.userData.isDoor) {
      const d = t.userData.doorData;
      if (d.opened) return '';
      return `[E] Ouvrir — ${d.cost} pts (vers ${d.to})`;
    }
    if (t.userData.isWallBuy) {
      const w = this.game.weapons;
      const hasThis = w.slots.some(s => s && s.name === t.userData.weapon);
      return hasThis
        ? `[E] Munitions ${t.userData.weapon} — ${t.userData.cost / 2} pts`
        : `[E] Acheter ${t.userData.weapon} — ${t.userData.cost} pts`;
    }
    if (t.userData.isPerkMachine) {
      if (this.game.player.perks[t.userData.perk]) return `${t.userData.perk} — déjà possédé`;
      return `[E] ${t.userData.perk} — ${t.userData.cost} pts`;
    }
    if (t.userData.isMysteryBox) {
      if (t.userData.busy) return 'Mystery Box...';
      return `[E] Mystery Box — ${t.userData.cost} pts`;
    }
    if (t.userData.isPowerSwitch) {
      if (t.userData.on) return 'Courant activé';
      return '[E] Activer le courant';
    }
    if (t.userData.isTrap) {
      if (!this.game._power) return 'Courant requis';
      if (t.userData.active) return 'Piège actif';
      if (t.userData.cooldown > 0) return `Cooldown ${t.userData.cooldown.toFixed(1)}s`;
      return `[E] Piège — ${t.userData.cost} pts`;
    }
    if (t.userData.isTeleporter) {
      if (!t.userData.linked) return 'Téléporteur non lié au mainframe';
      if (t.userData.active) return 'Téléporteur actif';
      return '[E] Utiliser le téléporteur';
    }
    if (t.userData.isMainframe) {
      if (t.userData.linked) return 'Mainframe déjà lié';
      return '[E] Lier le mainframe au téléporteur';
    }
    if (t.userData.isPackAPunch) {
      if (!this.game._power) return 'Courant requis';
      return `[E] Pack-a-Punch — ${t.userData.cost} pts`;
    }
    return '';
  }

  _interact(t) {
    if (t.userData.isBoard) return this._repairBarricade(t);
    if (t.userData.isDoor) return this._buyDoor(t);
    if (t.userData.isWallBuy) return this._buyWallWeapon(t);
    if (t.userData.isPerkMachine) return this._buyPerk(t);
    if (t.userData.isMysteryBox) return this._useMysteryBox(t);
    if (t.userData.isPowerSwitch) return this._togglePower(t);
    if (t.userData.isTrap) return this._activateTrap(t);
    if (t.userData.isTeleporter) return this._useTeleporter(t);
    if (t.userData.isMainframe) return this._linkMainframe(t);
    if (t.userData.isPackAPunch) return this._usePackAPunch(t);
  }

  _repairBarricade(board) {
    const bar = board.userData.barricadeRef;
    if (bar.userData.currentBoards >= bar.userData.maxBoards) return;
    bar.userData.currentBoards++;
    this.game.player.addPoints(10);
    // Réafficher la planche
    const idx = bar.userData.currentBoards - 1;
    if (bar.userData.boards[idx]) bar.userData.boards[idx].visible = true;
    this.game.audio.playRepair();
  }

  _buyDoor(door) {
    const d = door.userData.doorData;
    if (d.opened) return;
    if (!this.game.spendPoints(d.cost)) return;
    d.opened = true;
    // Animation : la porte coulisse vers le haut
    const start = door.position.y;
    const end = start + 3;
    const startT = performance.now();
    const self = this;
    function anim() {
      const t = (performance.now() - startT) / 500;
      if (t >= 1) {
        door.position.y = end;
        door.visible = false;
        // Retirer du collider
        const idx = self.game.physics.colliders.indexOf(door);
        if (idx > -1) self.game.physics.colliders.splice(idx, 1);
        return;
      }
      door.position.y = start + (end - start) * t;
      requestAnimationFrame(anim);
    }
    anim();
    if (door.userData.priceSprite) door.userData.priceSprite.visible = false;
    this.game.audio.playDoor();
    this.game.showNotification(`Ouvert : ${d.to}`);
  }

  _buyWallWeapon(wb) {
    const name = wb.userData.weapon;
    const cost = wb.userData.cost;
    const wm = this.game.weapons;
    const hasThis = wm.slots.some(s => s && s.name === name);

    if (hasThis) {
      const half = Math.floor(cost / 2);
      if (!this.game.spendPoints(half)) return;
      const w = wm.slots.find(s => s && s.name === name);
      w.refill();
      wm.updateAmmoHud();
      this.game.showNotification(`Munitions ${name}`);
    } else {
      if (!this.game.spendPoints(cost)) return;
      wm.giveWeapon(name, false);
      this.game.showNotification(`Acheté : ${name}`);
    }
    this.game.audio.playBuy();
  }

  _buyPerk(pm) {
    const perk = pm.userData.perk;
    const cost = pm.userData.cost;
    if (this.game.player.perks[perk]) return;
    if (!this.game.spendPoints(cost)) return;
    this.game.player.perks[perk] = true;
    this.game.stats.perksBought.push(perk);
    this.game.hud.updatePerks(this.game.player.perks);
    this.game.showNotification(`Perk : ${perk}`);
    this.game.audio.playPerk();

    // Effets immédiats
    if (perk === 'Jugger-Nog') {
      this.game.player.health = this.game.player.maxHealth;
    } else if (perk === 'Bowie Knife') {
      // déjà géré dans les perks joueur
    }
  }

  _useMysteryBox(mb) {
    if (mb.userData.busy) return;
    if (!this.game.spendPoints(mb.userData.cost)) return;
    mb.userData.busy = true;

    // Animation : la boîte s'ouvre, faisceau change de couleur, arme aléatoire
    const pool = MYSTERY_BOX_POOL;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    mb.userData.currentWeapon = chosen;

    // Animation de "roulement" ~2s
    const startT = performance.now();
    const beam = mb.userData.beam;
    const sprite = mb.userData.priceSprite;
    const self = this;
    const originalSpriteTex = sprite.material.map;
    let tick = 0;
    const rollTimer = setInterval(() => {
      const rnd = pool[Math.floor(Math.random() * pool.length)];
      tick++;
      beam.material.color.setHSL((tick * 0.1) % 1, 1, 0.5);
      // Changer le texte du sprite
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'center'; ctx.fillText(rnd, 128, 42);
      const tex = new THREE.CanvasTexture(canvas);
      sprite.material.map = tex;
      sprite.material.needsUpdate = true;
    }, 120);

    setTimeout(() => {
      clearInterval(rollTimer);
      beam.material.color.set(0xffaa00);
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center'; ctx.fillText(chosen, 128, 42);
      const tex = new THREE.CanvasTexture(canvas);
      sprite.material.map = tex;
      sprite.material.needsUpdate = true;

      // Donner l'arme
      self.game.weapons.giveWeapon(chosen, false);
      self.game.showNotification(`Mystery Box : ${chosen}`);
      self.game.audio.playMysteryBox();
      mb.userData.busy = false;
      // Restaurer le sprite après un délai
      setTimeout(() => {
        const c2 = document.createElement('canvas');
        c2.width = 256; c2.height = 64;
        const x2 = c2.getContext('2d');
        x2.fillStyle = '#111'; x2.fillRect(0, 0, 256, 64);
        x2.fillStyle = '#ffcc00'; x2.font = 'bold 36px monospace';
        x2.textAlign = 'center'; x2.fillText('???', 128, 45);
        sprite.material.map = new THREE.CanvasTexture(c2);
        sprite.material.needsUpdate = true;
      }, 3000);
    }, 2400);
  }

  _togglePower(ps) {
    if (ps.userData.on) return;
    ps.userData.on = true;
    this.game._power = true;
    ps.userData.lever.material.color.set(0x00ff00);
    ps.userData.lever.material.emissive.set(0x006600);
    this.game.showNotification('Le courant est activé');
    this.game.audio.playPower();
  }

  _activateTrap(trap) {
    if (!this.game._power) return;
    if (trap.userData.active) return;
    if (trap.userData.cooldown > 0) return;
    if (!this.game.spendPoints(trap.userData.cost)) return;

    trap.userData.active = true;
    trap.userData.timer = 8;
    trap.userData.cooldown = 20;

    for (const f of trap.userData.flames) {
      f.material.opacity = 0.9;
      f.userData.baseY = f.position.y;
    }
    trap.userData.light.intensity = 3;
    this.game.audio.playTrap();
  }

  _updateTraps(dt) {
    for (const trap of Object.values(this.game.map.interactables)) {
      if (!trap.userData || !trap.userData.isTrap) continue;
      if (trap.userData.cooldown > 0) trap.userData.cooldown -= dt;
      if (!trap.userData.active) continue;

      trap.userData.timer -= dt;
      // Anim flamme
      for (const f of trap.userData.flames) {
        f.position.y = f.userData.baseY + Math.sin(performance.now() * 0.02 + f.position.x * 3) * 0.1;
      }
      // Dégâts aux zombies dans la zone
      const center = trap.position.clone();
      for (const z of this.game.zombies.zombies) {
        if (z.isDead) continue;
        if (z.position.distanceTo(center) < 2.5) {
          z.takeDamage(200 * dt, false);
        }
      }

      if (trap.userData.timer <= 0) {
        trap.userData.active = false;
        for (const f of trap.userData.flames) f.material.opacity = 0;
        trap.userData.light.intensity = 0;
      }
    }
  }

  _useTeleporter(tp) {
    if (!tp.userData.linked) return;
    if (tp.userData.cooldown > 0) return;
    if (tp.userData.active) return;
    if (tp.userData.inUse) return;

    tp.userData.inUse = true;
    this.game.showNotification('Téléportation en cours...');
    this.game.audio.playTeleport();

    // Animation de charge
    let progress = 0;
    const ring = tp.userData.ring;
    const start = performance.now();
    const self = this;
    const charge = setInterval(() => {
      progress += 0.02;
      ring.material.emissiveIntensity = 0.4 + progress * 2;
      ring.scale.setScalar(1 + progress * 0.3);
      if (progress >= 1) {
        clearInterval(charge);
        // Téléporter le joueur dans la salle du Pack-a-Punch
        self.game.player.position.set(0, 1.7, 88);
        self.game.showNotification('Vous êtes dans la salle du Pack-a-Punch');
        self.game.effects.screenShake(0.6, 0.5);
        tp.userData.inUse = false;
        tp.userData.cooldown = 15;
        ring.material.emissiveIntensity = 0.4;
        ring.scale.setScalar(1);
      }
    }, 50);
  }

  _updateTeleporter(dt) {
    for (const it of Object.values(this.game.map.interactables)) {
      if (!it.userData || !it.userData.isTeleporter) continue;
      if (it.userData.cooldown > 0) it.userData.cooldown -= dt;
    }
  }

  _linkMainframe(mf) {
    if (mf.userData.linked) return;
    mf.userData.linked = true;
    const tp = this.game.map.interactables.teleporter;
    tp.userData.linked = true;
    tp.userData.ring.material.emissiveIntensity = 0.9;
    mf.userData.core.material.emissiveIntensity = 2.0;
    this.game.showNotification('Téléporteur lié au mainframe');
    this.game.audio.playLink();
  }

  _usePackAPunch(pap) {
    if (!this.game._power) return;
    const w = this.game.weapons.current;
    if (!w) return;
    if (w.upgraded) {
      this.game.showNotification('Arme déjà améliorée');
      return;
    }
    if (!this.game.spendPoints(pap.userData.cost)) return;
    this.game.weapons.giveWeapon(w.name, true);
    this.game.showNotification(`Pack-a-Punch : ${w.name} améliorée`);
    this.game.audio.playPackAPunch();
  }

  _updateMysteryBox(dt) {
    const mb = this.game.map.interactables.mysteryBox;
    if (!mb) return;
    // La boîte peut se déplacer tous les 5 usages (à implémenter)
  }
}