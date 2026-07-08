// Sauvegarde localStorage : pièces, upgrades, meilleur niveau atteint.

const KEY = 'gate-runner-save-v1';

const DEFAULT = {
  coins: 0,
  maxLevelUnlocked: 0,
  upgrades: {}, // { upgradeId: level }
};

export const SaveManager = {
  data: { ...DEFAULT },

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...DEFAULT, ...JSON.parse(raw) };
    } catch (e) {
      this.data = { ...DEFAULT };
    }
    if (!this.data.upgrades) this.data.upgrades = {};
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) { /* stockage indisponible */ }
  },

  addCoins(n) { this.data.coins += Math.max(0, Math.round(n)); this.save(); },
  spendCoins(n) {
    if (this.data.coins >= n) { this.data.coins -= n; this.save(); return true; }
    return false;
  },

  upgradeLevel(id) { return this.data.upgrades[id] || 0; },
  setUpgradeLevel(id, lvl) { this.data.upgrades[id] = lvl; this.save(); },

  reset() { this.data = { ...DEFAULT, upgrades: {} }; this.save(); },
};
