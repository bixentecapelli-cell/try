import { getWeapon } from '../config/weapons.js';

// HUD en jeu : progression, vie du héros, compteur d'escouade, arme,
// barre de boss, et bouton de tir spécial.

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

      <div class="bottom-hud">
        <div class="health-wrap">
          <span class="health-heart">❤️</span>
          <div class="health-bar"><div class="health-fill" id="hud-health"></div>
            <span class="health-text" id="hud-health-text">100</span></div>
        </div>
        <div class="squad-count" id="hud-count">1</div>
      </div>

      <button class="fire-btn" id="hud-fire">
        <span class="fire-ico">🔥</span>
        <span class="fire-label">TIR</span>
        <div class="fire-cd" id="hud-fire-cd"></div>
      </button>

      <div class="hint" id="hud-hint">Glisse pour déplacer · 🔥 pour l'attaque spéciale</div>
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
    this.health = this.el.querySelector('#hud-health');
    this.healthText = this.el.querySelector('#hud-health-text');
    this.fireBtn = this.el.querySelector('#hud-fire');
    this.fireCd = this.el.querySelector('#hud-fire-cd');
  }

  // main branche le tir ici (clic + tactile)
  onFire(cb) {
    const fire = (e) => { e.preventDefault(); e.stopPropagation(); cb(); };
    this.fireBtn.addEventListener('mousedown', fire);
    this.fireBtn.addEventListener('touchstart', fire, { passive: false });
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; }

  update(game, started) {
    this.progress.style.width = `${game.progress() * 100}%`;
    this.count.textContent = game.squad.count;
    this.levelTag.textContent = `NIV ${game.levelIndex + 1}`;
    this.weapon.textContent = getWeapon(game.squad.weaponId).name;
    this.hint.style.display = started ? 'none' : 'block';

    // vie du héros
    const hp = game.hero.hp, max = game.hero.maxHp;
    const t = Math.max(0, hp / max);
    this.health.style.width = `${t * 100}%`;
    this.health.style.background = t > 0.5
      ? 'linear-gradient(90deg,#6bff9e,#23c268)'
      : t > 0.25 ? 'linear-gradient(90deg,#ffe259,#ffa751)'
        : 'linear-gradient(90deg,#ff6b6b,#c0392b)';
    this.healthText.textContent = Math.ceil(hp);

    // cooldown du tir
    const cd = game.specialCd / game.specialMax;
    this.fireCd.style.height = `${cd * 100}%`;
    this.fireBtn.classList.toggle('ready', cd <= 0);

    // barre de boss
    if (game.boss && game.boss.alive) {
      this.bossWrap.classList.add('show');
      this.bossName.textContent = game.boss.def.name;
      this.bossFill.style.width = `${Math.max(0, game.boss.hp / game.boss.maxHp) * 100}%`;
    } else {
      this.bossWrap.classList.remove('show');
    }
  }
}
