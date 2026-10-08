export class HUD {
  constructor(root) {
    this.root = root;
    this.root.innerHTML = `
      <div class="hud-points" id="hud-points">500</div>
      <div class="hud-round" id="hud-round">Manche 0</div>
      <div class="hud-crosshair" id="hud-crosshair"></div>
      <div class="hud-hitmarker" id="hud-hitmarker"></div>
      <div class="hud-damage" id="hud-damage"></div>
      <div class="hud-ammo" id="hud-ammo">8 <span class="reserve">/ 80</span></div>
      <div class="hud-weapon" id="hud-weapon">M1911</div>
      <div class="hud-perks" id="hud-perks"></div>
      <div class="hud-interact" id="hud-interact"></div>
      <div class="hud-notifications" id="hud-notifications"></div>
      <div class="hud-powerup" id="hud-powerup"></div>
    `;
    this.points = root.querySelector('#hud-points');
    this.roundEl = root.querySelector('#hud-round');
    this.crosshair = root.querySelector('#hud-crosshair');
    this.hitmarker = root.querySelector('#hud-hitmarker');
    this.damageEl = root.querySelector('#hud-damage');
    this.ammoEl = root.querySelector('#hud-ammo');
    this.weaponEl = root.querySelector('#hud-weapon');
    this.perksEl = root.querySelector('#hud-perks');
    this.interactEl = root.querySelector('#hud-interact');
    this.notifsEl = root.querySelector('#hud-notifications');
    this.powerupEl = root.querySelector('#hud-powerup');
  }

  reset() {
    this.setPoints(500);
    this.setRound(0);
    this.updatePerks({});
    this.notifsEl.innerHTML = '';
    this.setGrenades(2);
  }

  update(dt) { /* rien de périodique pour l'instant */ }

  setPoints(n) { this.points.textContent = Math.floor(n); }
  setRound(n) { this.roundEl.textContent = `Manche ${n}`; }
  setAmmo(a, r, name) { this.ammoEl.innerHTML = `${a} <span class="reserve">/ ${r}</span>`; }
  setWeaponName(name) { this.weaponEl.textContent = name; }
  setGrenades() { /* à implémenter plus tard */ }
  setCrosshairAds(isAds) { this.crosshair.classList.toggle('ads', isAds); }

  setInteractPrompt(text) {
    if (!text) { this.interactEl.classList.remove('show'); return; }
    this.interactEl.textContent = text;
    this.interactEl.classList.add('show');
  }

  showHitmarker(isHead) {
    this.hitmarker.classList.remove('show');
    void this.hitmarker.offsetWidth;
    this.hitmarker.classList.add('show');
    this.hitmarker.style.filter = isHead ? 'hue-rotate(0deg) saturate(3)' : 'none';
  }

  showDamage() {
    this.damageEl.classList.add('show');
    clearTimeout(this._dmgTimer);
    this._dmgTimer = setTimeout(() => this.damageEl.classList.remove('show'), 250);
  }

  showRound(n, isHellhound) {
    const el = document.createElement('div');
    el.className = 'hud-round-big';
    el.style.color = isHellhound ? '#aa0000' : '#aa0000';
    el.textContent = isHellhound ? `CHIENS DE L'ENFER` : `Manche ${n}`;
    this.root.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  showNotification(text) {
    const el = document.createElement('div');
    el.className = 'hud-notif';
    el.textContent = text;
    this.notifsEl.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  showPowerUp(name) {
    this.powerupEl.textContent = name;
    this.powerupEl.classList.remove('show');
    void this.powerupEl.offsetWidth;
    this.powerupEl.classList.add('show');
  }

  updatePerks(perks) {
    this.perksEl.innerHTML = '';
    for (const k of Object.keys(perks)) {
      if (!perks[k]) continue;
      const el = document.createElement('div');
      el.className = 'hud-perk';
      el.textContent = k;
      this.perksEl.appendChild(el);
    }
  }
}