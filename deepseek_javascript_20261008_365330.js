import * as THREE from 'three';

// Dimensions des pièces (approximations jouables de Kino)
const ROOMS = {
  LOBBY:      { x: 0,   z: 0,   w: 18, d: 22, h: 6 },
  LOWER_HALL: { x: 0,   z: -22, w: 12, d: 14, h: 5 },
  ALLEY:      { x: -22, z: -8,  w: 8,  d: 26, h: 7 },
  UPPER_HALL: { x: 18,  z: -6,  w: 10, d: 16, h: 5 },
  FOYER:      { x: 34,  z: -6,  w: 14, d: 18, h: 6 },
  DRESSING:   { x: 34,  z: 16,  w: 12, d: 14, h: 5 },
  THEATER:    { x: 0,   z: 34,  w: 26, d: 30, h: 12 },
  STAGE:      { x: 0,   z: 62,  w: 22, d: 14, h: 10 },
  PROJECTOR:  { x: 0,   z: 84,  w: 10, d: 8,  h: 5 }
};

export class KinoDerToten {
  constructor(game) {
    this.game = game;
    this.rooms = {};
    this.walls = [];
    this.doors = [];
    this.barricades = [];
    this.wallBuys = [];
    this.perkMachines = [];
    this.interactables = {};

    this._buildRooms();
    this._buildDoors();
    this._buildBarricades();
    this._buildWallBuys();
    this._buildPerkMachines();
    this._buildInteractables();
  }

  _buildRooms() {
    for (const [name, d] of Object.entries(ROOMS)) {
      const room = {
        name,
        bounds: new THREE.Box3(
          new THREE.Vector3(d.x - d.w / 2, 0, d.z - d.d / 2),
          new THREE.Vector3(d.x + d.w / 2, d.h, d.z + d.d / 2)
        ),
        center: new THREE.Vector3(d.x, 0, d.z),
        dims: d
      };
      this.rooms[name] = room;

      // Sol
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(d.w, d.d),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(d.x, 0, d.z);
      floor.receiveShadow = true;
      this.game.scene.add(floor);

      // Plafond
      const ceil = new THREE.Mesh(
        new THREE.PlaneGeometry(d.w, d.d),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1, side: THREE.DoubleSide })
      );
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(d.x, d.h, d.z);
      this.game.scene.add(ceil);

      // Murs
      this._buildWalls(d, room);
    }
  }

  _buildWalls(d, room) {
    const t = 0.3;
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a2a2a, roughness: 0.9 });
    const walls = [
      { x: d.x, z: d.z - d.d / 2, w: d.w + t, dep: t },
      { x: d.x, z: d.z + d.d / 2, w: d.w + t, dep: t },
      { x: d.x - d.w / 2, z: d.z, w: t, dep: d.d + t },
      { x: d.x + d.w / 2, z: d.z, w: t, dep: d.d + t }
    ];
    for (const w of walls) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w.w, d.h, w.dep),
        mat
      );
      mesh.position.set(w.x, d.h / 2, w.z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData.isWall = true;
      this.game.scene.add(mesh);
      this.walls.push(mesh);
      this.game.physics.addCollider(mesh);
    }
  }

  _buildDoors() {
    const doorData = [
      { to: 'LOWER_HALL', cost: 750, pos: new THREE.Vector3(-4, 1.25, -11), axis: 'z' },
      { to: 'UPPER_HALL', cost: 750, pos: new THREE.Vector3(9, 1.25, -3), axis: 'x' },
      { to: 'ALLEY', cost: 1000, pos: new THREE.Vector3(-12, 1.25, -20), axis: 'x' },
      { to: 'FOYER', cost: 1000, pos: new THREE.Vector3(25, 1.25, -6), axis: 'x' },
      { to: 'DRESSING', cost: 750, pos: new THREE.Vector3(34, 1.25, 4), axis: 'z' },
      { to: 'THEATER', cost: 1000, pos: new THREE.Vector3(0, 1.25, 11), axis: 'z' },
      { to: 'STAGE', cost: 1000, pos: new THREE.Vector3(-10, 1.25, 50), axis: 'z' },
      { to: 'PROJECTOR', cost: 1500, pos: new THREE.Vector3(0, 1.25, 76), axis: 'z' }
    ];

    for (const d of doorData) {
      const geo = new THREE.BoxGeometry(d.axis === 'x' ? 0.2 : 2.6, 2.5, d.axis === 'z' ? 0.2 : 2.6);
      const mat = new THREE.MeshStandardMaterial({ color: 0x4a2a15, roughness: 0.8, metalness: 0.2 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(d.pos);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData.isDoor = true;
      mesh.userData.doorData = { to: d.to, cost: d.cost, opened: false };
      this.game.scene.add(mesh);
      this.doors.push(mesh);
      this.game.physics.addCollider(mesh);

      // Panneau de prix
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${d.cost}`, 128, 45);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.scale.set(1.5, 0.4, 1);
      sprite.position.copy(d.pos); sprite.position.y = 2.9;
      this.game.scene.add(sprite);
      mesh.userData.priceSprite = sprite;
    }
  }

  _buildBarricades() {
    const barricadePositions = [
      { pos: new THREE.Vector3(-7, 0, 8),   room: 'LOBBY' },
      { pos: new THREE.Vector3(7, 0, 8),    room: 'LOBBY' },
      { pos: new THREE.Vector3(-7, 0, -8),  room: 'LOBBY' },
      { pos: new THREE.Vector3(7, 0, -8),   room: 'LOBBY' },
      { pos: new THREE.Vector3(-5, 0, -25), room: 'LOWER_HALL' },
      { pos: new THREE.Vector3(5, 0, -25),  room: 'LOWER_HALL' },
      { pos: new THREE.Vector3(-25, 0, -5), room: 'ALLEY' },
      { pos: new THREE.Vector3(-25, 0, 10), room: 'ALLEY' },
      { pos: new THREE.Vector3(-12, 0, 40), room: 'THEATER' },
      { pos: new THREE.Vector3(12, 0, 40),  room: 'THEATER' },
      { pos: new THREE.Vector3(34, 0, 22),  room: 'DRESSING' }
    ];

    for (const bp of barricadePositions) {
      const group = new THREE.Group();
      group.position.copy(bp.pos);
      group.userData.isBarricade = true;
      group.userData.room = bp.room;
      group.userData.maxBoards = 6;
      group.userData.currentBoards = 6;
      group.userData.boards = [];

      // Cadre
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.9 })
      );
      frame.position.y = 1.5;
      frame.castShadow = true;
      group.add(frame);

      // Planches
      for (let i = 0; i < 6; i++) {
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(2.3, 0.22, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.85 })
        );
        board.position.set(0, 0.4 + i * 0.45, 0.1);
        board.userData.isBoard = true;
        board.userData.barricadeRef = group;
        group.add(board);
        group.userData.boards.push(board);
      }

      this.game.scene.add(group);
      this.barricades.push({ group, room: bp.room });
    }
  }

  _buildWallBuys() {
    const positions = [
      { weapon: 'Olympia', cost: 500, pos: new THREE.Vector3(-8, 1.5, -5), rot: 0 },
      { weapon: 'M14', cost: 500, pos: new THREE.Vector3(8, 1.5, -5), rot: Math.PI },
      { weapon: 'MPL', cost: 1000, pos: new THREE.Vector3(4, 1.5, -22), rot: Math.PI },
      { weapon: 'PM63', cost: 1000, pos: new THREE.Vector3(18, 1.5, -8), rot: 0 },
      { weapon: 'MP40', cost: 1000, pos: new THREE.Vector3(34, 1.5, -12), rot: 0 },
      { weapon: 'Stakeout', cost: 1500, pos: new THREE.Vector3(40, 1.5, -6), rot: Math.PI },
      { weapon: 'MP5K', cost: 1000, pos: new THREE.Vector3(34, 1.5, 18), rot: 0 },
      { weapon: 'M16', cost: 1200, pos: new THREE.Vector3(0, 1.5, 66), rot: Math.PI },
      { weapon: 'AK74u', cost: 1200, pos: new THREE.Vector3(-20, 1.5, 0), rot: 0 },
      { weapon: 'Frag Grenade', cost: 250, pos: new THREE.Vector3(0, 1.5, 82), rot: Math.PI }
    ];

    for (const p of positions) {
      const group = new THREE.Group();
      group.position.copy(p.pos);
      group.rotation.y = p.rot;
      group.userData.isWallBuy = true;
      group.userData.weapon = p.weapon;
      group.userData.cost = p.cost;

      // Silhouette d'arme
      const outline = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.4, 0.15),
        new THREE.MeshStandardMaterial({
          color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.4,
          transparent: true, opacity: 0.5
        })
      );
      outline.position.y = 0.5;
      group.add(outline);

      // Prix
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center'; ctx.fillText(`${p.cost}`, 128, 45);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.scale.set(2, 0.5, 1); sprite.position.y = 1.3;
      group.add(sprite);

      this.game.scene.add(group);
      this.wallBuys.push(group);
    }
  }

  _buildPerkMachines() {
    const perks = [
      { name: 'Quick Revive', cost: 500,  pos: new THREE.Vector3(8, 0, 5), rot: -Math.PI / 2, color: 0x00aaff },
      { name: 'Jugger-Nog',   cost: 2500, pos: new THREE.Vector3(10, 0, 40), rot: 0, color: 0xff0000 },
      { name: 'Speed Cola',   cost: 3000, pos: new THREE.Vector3(34, 0, -2), rot: Math.PI, color: 0x00ff00 },
      { name: 'Double Tap',   cost: 2000, pos: new THREE.Vector3(34, 0, 20), rot: 0, color: 0xffcc00 }
    ];

    for (const p of perks) {
      const group = new THREE.Group();
      group.position.copy(p.pos);
      group.rotation.y = p.rot;
      group.userData.isPerkMachine = true;
      group.userData.perk = p.name;
      group.userData.cost = p.cost;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.2, 0.8),
        new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.6, metalness: 0.4, emissive: p.color, emissiveIntensity: 0.15 })
      );
      body.position.y = 1.1; body.castShadow = true; body.userData.isWall = true;
      group.add(body);

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff6600, emissiveIntensity: 1.0 })
      );
      screen.position.set(0, 1.6, 0.41);
      group.add(screen);

      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center'; ctx.fillText(`${p.cost}`, 128, 45);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.scale.set(1.5, 0.4, 1); sprite.position.y = 2.5;
      group.add(sprite);

      this.game.scene.add(group);
      this.perkMachines.push(group);
      this.game.physics.addCollider(body);
    }
  }

  _buildInteractables() {
    // POWER SWITCH (sur la scène)
    this.interactables.power = this._makePowerSwitch(new THREE.Vector3(0, 0, 62));

    // MYSTERY BOX (dans le lobby au départ)
    this.interactables.mysteryBox = this._makeMysteryBox(new THREE.Vector3(-6, 0, 4));

    // TELEPORTER (sur la scène)
    this.interactables.teleporter = this._makeTeleporter(new THREE.Vector3(-8, 0, 62));

    // MAINFRAME (lobby)
    this.interactables.mainframe = this._makeMainframe(new THREE.Vector3(0, 0, -8));

    // PACK-A-PUNCH (salle du projecteur)
    this.interactables.packAPunch = this._makePackAPunch(new THREE.Vector3(0, 0, 84));

    // TRAP : Fire Pit sur la scène
    this.interactables.fireTrap = this._makeFireTrap(new THREE.Vector3(0, 0, 55));
  }

  _makePowerSwitch(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.userData.isPowerSwitch = true;
    group.userData.on = false;

    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 })
    );
    panel.position.y = 1; panel.castShadow = true;
    group.add(panel);

    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.6, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x660000, emissiveIntensity: 0.5 })
    );
    lever.position.set(0, 1.1, 0.25); lever.userData.isLever = true;
    group.add(lever);
    group.userData.lever = lever;

    this.game.scene.add(group);
    this.game.physics.addCollider(panel);
    return group;
  }

  _makeMysteryBox(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.userData.isMysteryBox = true;
    group.userData.cost = 950;
    group.userData.opened = false;
    group.userData.busy = false;
    group.userData.currentWeapon = null;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.0, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x4a2a15, roughness: 0.7 })
    );
    body.position.y = 0.5; body.castShadow = true; body.userData.isWall = true;
    group.add(body);

    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.15, 1.25),
      new THREE.MeshStandardMaterial({ color: 0x3a1a0a, roughness: 0.6 })
    );
    lid.position.y = 1.05;
    group.add(lid);
    group.userData.lid = lid;

    // Faisceau lumineux
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.25 })
    );
    beam.position.y = 6;
    group.add(beam);
    group.userData.beam = beam;

    // Prix
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center'; ctx.fillText('???', 128, 45);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(1.6, 0.4, 1); sprite.position.y = 1.7;
    group.add(sprite);
    group.userData.priceSprite = sprite;

    this.game.scene.add(group);
    this.game.physics.addCollider(body);
    return group;
  }

  _makeTeleporter(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.userData.isTeleporter = true;
    group.userData.linked = false;
    group.userData.cooldown = 0;
    group.userData.active = false;

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.25, 20),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.25 })
    );
    base.position.y = 0.12;
    group.add(base);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.08, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0066cc, emissiveIntensity: 0.4 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.45;
    group.add(ring);
    group.userData.ring = ring;

    this.game.scene.add(group);
    return group;
  }

  _makeMainframe(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.userData.isMainframe = true;
    group.userData.linked = false;

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.25, 16),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
    );
    base.position.y = 0.12;
    group.add(base);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 1.0 })
    );
    core.position.y = 0.6;
    group.add(core);
    group.userData.core = core;

    this.game.scene.add(group);
    return group;
  }

  _makePackAPunch(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.userData.isPackAPunch = true;
    group.userData.cost = 5000;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })
    );
    body.position.y = 1.5; body.castShadow = true; body.userData.isWall = true;
    group.add(body);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1),
      new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xaa00aa, emissiveIntensity: 0.8 })
    );
    screen.position.set(0, 2, 0.76);
    group.add(screen);

    // Prix
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center'; ctx.fillText('5000', 128, 45);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(2, 0.5, 1); sprite.position.y = 3.4;
    group.add(sprite);

    this.game.scene.add(group);
    this.game.physics.addCollider(body);
    return group;
  }

  _makeFireTrap(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.userData.isTrap = true;
    group.userData.cost = 1000;
    group.userData.active = false;
    group.userData.timer = 0;
    group.userData.cooldown = 0;

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.1, 3),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5 })
    );
    base.position.y = 0.05;
    group.add(base);

    // Faux sprites de flamme (seront activés à l'achat)
    const flames = [];
    for (let i = 0; i < 8; i++) {
      const f = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.5, 6),
        new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.0 })
      );
      f.position.set((Math.random() - 0.5) * 2.5, 0.25, (Math.random() - 0.5) * 2.5);
      group.add(f);
      flames.push(f);
    }
    group.userData.flames = flames;

    const light = new THREE.PointLight(0xff4400, 0, 8);
    light.position.y = 0.5;
    group.add(light);
    group.userData.light = light;

    this.game.scene.add(group);
    return group;
  }

  getRoomAt(pos) {
    for (const [name, r] of Object.entries(this.rooms)) {
      if (r.bounds.containsPoint(pos)) return r;
    }
    return null;
  }
}