import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { Physics } from './Physics.js';
import { Player } from '../player/Player.js';
import { PlayerView } from '../player/PlayerView.js';
import { WeaponManager } from '../weapons/WeaponManager.js';
import { ZombieManager } from '../zombies/ZombieManager.js';
import { KinoDerToten } from '../map/KinoDerToten.js';
import { RoundSystem } from '../systems/RoundSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { Barricades } from '../systems/Barricades.js';
import { PowerUps } from '../systems/PowerUps.js';
import { HUD } from '../ui/HUD.js';
import { Menu } from '../ui/Menu.js';
import { Effects } from '../effects/Effects.js';
import { AudioManager } from '../audio/AudioManager.js';
import { SaveManager } from '../save/SaveManager.js';

export const State = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

export class Game {
  constructor(container) {
    this.container = container;
    this.state = State.MENU;
    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.elapsed = 0;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.025);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    this.scene.add(this.camera);

    // Core
    this.input = new InputManager();
    this.physics = new Physics(this.scene);
    this.save = new SaveManager();
    this.audio = new AudioManager();
    this.effects = new Effects(this);

    // UI
    this.hud = new HUD(document.getElementById('hud-root'));
    this.menu = new Menu(document.getElementById('menu-root'), this);

    // World
    this.map = new KinoDerToten(this);
    this._buildLights();

    // Gameplay
    this.player = new Player(this);
    this.playerView = new PlayerView(this);
    this.weapons = new WeaponManager(this);
    this.zombies = new ZombieManager(this);
    this.rounds = new RoundSystem(this);
    this.barricades = new Barricades(this);
    this.powerups = new PowerUps(this);
    this.interaction = new InteractionSystem(this);

    // Stats
    this.stats = {
      zombiesKilled: 0,
      headshots: 0,
      pointsSpent: 0,
      perksBought: [],
      startTime: 0
    };

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._onResize();

    this.menu.showMain();
  }

  _buildLights() {
    const ambient = new THREE.AmbientLight(0x221111, 0.4);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x445566, 0x0a0a0a, 0.2);
    this.scene.add(hemi);

    // Lumières dans les pièces principales
    const positions = [
      [0, 5, 0, 0x884422, 1.0],
      [0, 5, -30, 0x884422, 0.8],
      [0, 6, 40, 0xcc8844, 1.2],
      [0, 6, 70, 0xcc6622, 1.0],
      [0, 4, 95, 0x4444ff, 0.6]
    ];
    for (const [x, y, z, color, intensity] of positions) {
      const light = new THREE.PointLight(color, intensity, 30, 2);
      light.position.set(x, y, z);
      this.scene.add(light);
    }
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    this.animate();
  }

  setState(s) {
    this.state = s;
    if (s === State.PLAYING) {
      this.renderer.domElement.requestPointerLock?.();
    } else if (s === State.PAUSED || s === State.GAME_OVER) {
      document.exitPointerLock?.();
    }
  }

  startGame() {
    this.resetGame();
    this.menu.hide();
    this.setState(State.PLAYING);
    this.stats.startTime = performance.now();
    this.rounds.start();
  }

  resetGame() {
    this.zombies.clearAll();
    this.player.reset();
    this.weapons.reset();
    this.rounds.reset();
    this.stats = { zombiesKilled: 0, headshots: 0, pointsSpent: 0, perksBought: [], startTime: 0 };
    this.hud.reset();
  }

  gameOver() {
    this.setState(State.GAME_OVER);
    const score = this.player.points;
    this.save.recordGame(this.rounds.currentRound, score, this.stats);
    this.menu.showGameOver({
      round: this.rounds.currentRound,
      score,
      ...this.stats,
      time: (performance.now() - this.stats.startTime) / 1000
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.deltaTime = dt;

    if (this.state === State.PLAYING) {
      this.elapsed += dt;
      this.update(dt);
    }

    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  }

  update(dt) {
    this.player.update(dt);
    this.playerView.update(dt);
    this.weapons.update(dt);
    this.zombies.update(dt);
    this.barricades.update(dt);
    this.rounds.update(dt);
    this.interaction.update(dt);
    this.powerups.update(dt);
    this.effects.update(dt);
    this.hud.update(dt);
  }

  // --- API pour autres systèmes ---

  addPoints(n) {
    this.player.addPoints(n);
  }

  spendPoints(n) {
    if (this.player.points < n) return false;
    this.player.points -= n;
    this.stats.pointsSpent += n;
    this.hud.setPoints(this.player.points);
    return true;
  }

  showNotification(text) { this.hud.showNotification(text); }
}