import { getWeapon } from '../config/weapons.js';

// HUD en jeu : progression, compteur d'escouade, arme, barre de boss.

export class HUD {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.id = 'hud';
    this.el.innerHTML = `
      <div class="progress-wrap">
        <span class="level-tag" id="hud-level">NIV 1</span>
        <div class="progress-bar"><div class="progress-fill" id="hud-progress"></div></div>
        <span class="flag-icon">🏁</span>
      </div>
      <div class="weapon-tag" id="hud-weapon">Pistolet</div>
      <div class="boss-bar-wrap" id="hud-boss">
        <div class="boss-name" id="hud-boss-name">BOSS</div>
        <div class="boss-bar"><div class="boss-fill" id="hud-boss-fill"></div></div>
      </div>
      <div class="squad-count" id="hud-count">1</div>
      <div class="hint" id="hud-hint">Glisse pour déplacer ton escouade</div>
    `;
    root.appendChild(this.el);
    this.progress = this.el.querySelector('#hud-progress');
    this.count = this.el.querySelector('#hud-count');
    this.levelTag = this.el.querySelector('#hud-level');
    this.weapon = this.el.querySelector('#hud-weapon');
    this.hint = this.el.querySelector('#hud-hint');
    this.bossWrap = this.el.querySelector('#hud-boss');
    this.bossName = this.el.querySelector('#hud-boss-name');
    this.bossFill = this.el.querySelector('#hud-boss-fill');
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; }

  update(game, started) {
    this.progress.style.width = `${game.progress() * 100}%`;
    this.count.textContent = game.squad.count;
    this.levelTag.textContent = `NIV ${game.levelIndex + 1}`;
    this.weapon.textContent = getWeapon(game.squad.weaponId).name;
    this.hint.style.display = started ? 'none' : 'block';

    if (game.boss && game.boss.alive) {
      this.bossWrap.classList.add('show');
      this.bossName.textContent = game.boss.def.name;
      this.bossFill.style.width = `${Math.max(0, game.boss.hp / game.boss.maxHp) * 100}%`;
    } else {
      this.bossWrap.classList.remove('show');
    }
  }
}
