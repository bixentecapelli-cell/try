import { Game } from './core/Game.js';
import { Input } from './core/Input.js';
import { AudioManager } from './core/AudioManager.js';
import { SaveManager } from './core/SaveManager.js';
import { HUD } from './ui/HUD.js';
import { Menus } from './ui/Menus.js';
import { UPGRADES } from './config/upgrades.js';
import { LEVELS } from './config/levels.js';

// Point d'entrée : gestion des états (menu / jeu / fin), boucle de jeu.

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-root');

SaveManager.load();

const audio = new AudioManager();
const game = new Game(canvas, audio);
const input = new Input(canvas);
const hud = new HUD(uiRoot);

let currentLevel = Math.min(SaveManager.data.maxLevelUnlocked, LEVELS.length - 1);

// bouton de tir spécial (UI)
hud.onFire(() => game.tryFireSpecial());

// Calcule les bonus méta à partir des upgrades sauvegardés.
function computeBonus() {
  const b = { squadSize: 0, startWeapon: 0, income: 1, damage: 1, fireRate: 1 };
  for (const upg of UPGRADES) {
    const lvl = SaveManager.upgradeLevel(upg.id);
    if (lvl <= 0) continue;
    b[upg.id] = upg.value(lvl);
  }
  return b;
}

function startLevel(index) {
  currentLevel = Math.min(index, LEVELS.length - 1);
  const bonus = computeBonus();
  game.setIncome(bonus.income);
  input.reset();
  game.start(currentLevel, bonus);
  menus.hideAll();
  hud.show();
}

const menus = new Menus(uiRoot, audio, {
  onPlay: () => startLevel(currentLevel),
  onNext: () => {
    const next = currentLevel + 1;
    startLevel(next >= LEVELS.length ? 0 : next);
  },
  onReplay: () => startLevel(currentLevel),
  onMenu: () => {
    hud.hide();
    game.state = 'idle';
  },
});

// Écran de départ : petit décor animé derrière le menu.
game.start(currentLevel, computeBonus());
game.setIncome(computeBonus().income);
game.state = 'idle';
hud.hide();
menus.showMenu();

// ---- callbacks de jeu ----
game.onLevelComplete = (coins) => {
  SaveManager.addCoins(coins);
  SaveManager.data.maxLevelUnlocked = Math.max(
    SaveManager.data.maxLevelUnlocked, Math.min(currentLevel + 1, LEVELS.length - 1));
  SaveManager.save();
  hud.hide();
  menus.rememberWin(currentLevel, coins);
  menus.showWin(currentLevel, coins);
};

game.onGameOver = () => {
  hud.hide();
  menus.showOver();
};

// ---- boucle principale ----
let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05; // clamp (onglet inactif)

  const targetX = input.update(dt);
  if (input.consumeFire()) game.tryFireSpecial(); // barre espace
  game.update(dt, targetX);
  if (game.state === 'running' || game.state === 'boss') {
    hud.update(game, input.started);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
