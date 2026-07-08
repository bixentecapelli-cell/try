import { SaveManager } from '../core/SaveManager.js';
import { UPGRADES, upgradeCost } from '../config/upgrades.js';
import { LEVELS } from '../config/levels.js';

// Menus : accueil, fin de niveau, boutique d'upgrades, game over.
// Chaque écran est un <div class="screen">. Les callbacks sont fournis par main.

export class Menus {
  constructor(root, audio, callbacks) {
    this.root = root;
    this.audio = audio;
    this.cb = callbacks; // { onPlay, onNext, onReplay, onMenu }
    this._build();
  }

  _build() {
    // ----- Menu principal -----
    this.main = screen(`
      <div class="title">Gate Runner</div>
      <div class="subtitle">Traverse les portes, agrandis ton armée, écrase les boss.</div>
      <div class="coins-badge" id="menu-coins">0</div>
      <button class="btn" id="btn-play">Jouer</button>
      <button class="btn secondary" id="btn-upgrades">Améliorations</button>
      <div class="subtitle" style="font-size:13px;opacity:0.6">Souris / flèches sur PC · glisse le doigt sur mobile</div>
    `);
    // ----- Fin de niveau -----
    this.win = screen(`
      <div class="title" id="win-title">Niveau terminé !</div>
      <div class="reward-line">Récompense : <span class="big-num" id="win-coins">+0</span> 🪙</div>
      <div class="row">
        <button class="btn secondary" id="btn-win-shop">Améliorer</button>
        <button class="btn" id="btn-next">Niveau suivant</button>
      </div>
    `);
    // ----- Boutique -----
    this.shop = screen(`
      <div class="title" style="font-size:clamp(28px,7vw,52px)">Améliorations</div>
      <div class="coins-badge" id="shop-coins">0</div>
      <div class="shop" id="shop-list"></div>
      <button class="btn" id="btn-shop-back">Continuer</button>
    `);
    // ----- Game over -----
    this.over = screen(`
      <div class="title" style="color:#ff6b6b;-webkit-text-fill-color:#ff6b6b">Game Over</div>
      <div class="subtitle" id="over-msg">Ton escouade a été anéantie.</div>
      <div class="row">
        <button class="btn secondary" id="btn-over-menu">Menu</button>
        <button class="btn" id="btn-replay">Rejouer</button>
      </div>
    `);

    [this.main, this.win, this.shop, this.over].forEach((s) => { s.classList.add('hidden'); this.root.appendChild(s); });

    // handlers
    this._$('#btn-play').onclick = () => { this.audio.buy(); this.cb.onPlay(); };
    this._$('#btn-upgrades').onclick = () => { this.audio.buy(); this.openShop('menu'); };
    this._$('#btn-win-shop').onclick = () => { this.audio.buy(); this.openShop('win'); };
    this._$('#btn-next').onclick = () => { this.audio.buy(); this.cb.onNext(); };
    this._$('#btn-shop-back').onclick = () => { this.audio.buy(); this._shopReturn(); };
    this._$('#btn-replay').onclick = () => { this.audio.buy(); this.cb.onReplay(); };
    this._$('#btn-over-menu').onclick = () => { this.audio.buy(); this.showMenu(); };
  }

  _$(sel) { return this.root.querySelector(sel); }

  hideAll() { [this.main, this.win, this.shop, this.over].forEach((s) => s.classList.add('hidden')); }

  showMenu() {
    this.hideAll();
    this._$('#menu-coins').textContent = SaveManager.data.coins;
    this.main.classList.remove('hidden');
    this.cb.onMenu && this.cb.onMenu();
  }

  showWin(levelIndex, coins) {
    this.hideAll();
    const last = levelIndex >= LEVELS.length - 1;
    this._$('#win-title').textContent = last ? 'Jeu terminé ! 🎉' : `Niveau ${levelIndex + 1} terminé !`;
    this._$('#win-coins').textContent = `+${coins}`;
    this._$('#btn-next').textContent = last ? 'Rejouer' : 'Niveau suivant';
    this.win.classList.remove('hidden');
  }

  showOver() {
    this.hideAll();
    this.over.classList.remove('hidden');
  }

  openShop(from) {
    this._shopFrom = from;
    this.hideAll();
    this._renderShop();
    this.shop.classList.remove('hidden');
  }

  _shopReturn() {
    if (this._shopFrom === 'menu') this.showMenu();
    else this.showWin(this._lastLevel ?? 0, this._lastCoins ?? 0);
  }

  rememberWin(levelIndex, coins) { this._lastLevel = levelIndex; this._lastCoins = coins; }

  _renderShop() {
    const list = this._$('#shop-list');
    this._$('#shop-coins').textContent = SaveManager.data.coins;
    list.innerHTML = '';
    for (const upg of UPGRADES) {
      const lvl = SaveManager.upgradeLevel(upg.id);
      const maxed = lvl >= upg.maxLevel;
      const cost = maxed ? 0 : upgradeCost(upg, lvl);
      const row = document.createElement('div');
      row.className = 'upgrade-row';
      row.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-name">${upg.name}</div>
          <div class="upgrade-desc">${upg.desc}</div>
          <div class="upgrade-lvl">Niveau ${lvl}${maxed ? ' (MAX)' : ` / ${upg.maxLevel}`}</div>
        </div>
        <button class="btn small">${maxed ? 'MAX' : cost + ' 🪙'}</button>
      `;
      const btn = row.querySelector('button');
      if (maxed || SaveManager.data.coins < cost) btn.disabled = true;
      btn.onclick = () => {
        if (SaveManager.spendCoins(cost)) {
          SaveManager.setUpgradeLevel(upg.id, lvl + 1);
          this.audio.buy();
          this._renderShop();
        }
      };
      list.appendChild(row);
    }
  }
}

function screen(html) {
  const div = document.createElement('div');
  div.className = 'screen';
  div.innerHTML = html;
  return div;
}
