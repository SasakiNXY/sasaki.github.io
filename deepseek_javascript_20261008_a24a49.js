import { Game } from './core/Game.js';

const root = document.getElementById('game-root');
const game = new Game(root);
game.start();

window.__game = game; // debug