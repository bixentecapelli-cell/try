// Méta-upgrades achetables (data-driven).
// baseCost * costMult^level = coût du prochain niveau.
// apply(state, level) modifie l'objet de bonus utilisé au lancement d'un niveau.

export const UPGRADES = [
  {
    id: 'squadSize', name: 'Escouade de départ',
    desc: '+2 soldiers au début de chaque niveau',
    baseCost: 40, costMult: 1.55, maxLevel: 20,
    value: (lvl) => lvl * 2,
  },
  {
    id: 'startWeapon', name: 'Arme de départ',
    desc: 'Commence avec une arme plus puissante',
    baseCost: 120, costMult: 2.2, maxLevel: 6,
    value: (lvl) => lvl, // index d'arme de départ
  },
  {
    id: 'maxHealth', name: 'Vie du héros',
    desc: '+25 points de vie max',
    baseCost: 70, costMult: 1.6, maxLevel: 20,
    value: (lvl) => lvl * 25,
  },
  {
    id: 'income', name: 'Revenu',
    desc: '+15% de pièces gagnées par niveau',
    baseCost: 60, costMult: 1.6, maxLevel: 15,
    value: (lvl) => 1 + lvl * 0.15,
  },
  {
    id: 'damage', name: 'Dégâts bonus',
    desc: '+10% de dégâts global',
    baseCost: 80, costMult: 1.7, maxLevel: 20,
    value: (lvl) => 1 + lvl * 0.1,
  },
  {
    id: 'fireRate', name: 'Cadence de tir',
    desc: '+8% de vitesse de tir',
    baseCost: 80, costMult: 1.7, maxLevel: 15,
    value: (lvl) => 1 + lvl * 0.08,
  },
];

export function upgradeCost(upg, level) {
  return Math.round(upg.baseCost * Math.pow(upg.costMult, level));
}
