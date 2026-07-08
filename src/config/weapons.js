// Arbre d'évolution des armes (data-driven).
// Pour ajouter une arme : ajoute une entrée et branche `next` sur l'id suivant.
// damage = dégâts par balle | fireRate = tirs/seconde | range = portée (z)
// pellets = nombre de projectiles par tir (shotgun) | spread = dispersion latérale
// aoe = rayon de dégâts de zone (roquette) | bulletColor / bulletSize = visuel

export const WEAPONS = {
  pistol: {
    id: 'pistol', tier: 0, name: 'Pistolet',
    damage: 6, fireRate: 2.5, range: 34, pellets: 1, spread: 0,
    aoe: 0, bulletColor: 0xfff27a, bulletSize: 0.16, muzzle: 0.4,
    next: 'smg',
  },
  smg: {
    id: 'smg', tier: 1, name: 'Mitraillette',
    damage: 7, fireRate: 7, range: 36, pellets: 1, spread: 0.35,
    aoe: 0, bulletColor: 0xffd24a, bulletSize: 0.15, muzzle: 0.5,
    next: 'rifle',
  },
  rifle: {
    id: 'rifle', tier: 2, name: 'Fusil d\'assaut',
    damage: 12, fireRate: 6, range: 40, pellets: 1, spread: 0.1,
    aoe: 0, bulletColor: 0xffb347, bulletSize: 0.17, muzzle: 0.6,
    next: 'shotgun',
  },
  shotgun: {
    id: 'shotgun', tier: 3, name: 'Fusil à pompe',
    damage: 9, fireRate: 2.2, range: 26, pellets: 5, spread: 1.4,
    aoe: 0, bulletColor: 0xff8c42, bulletSize: 0.18, muzzle: 0.7,
    next: 'minigun',
  },
  minigun: {
    id: 'minigun', tier: 4, name: 'Minigun',
    damage: 9, fireRate: 16, range: 42, pellets: 1, spread: 0.5,
    aoe: 0, bulletColor: 0xff5e5e, bulletSize: 0.16, muzzle: 0.8,
    next: 'rocket',
  },
  rocket: {
    id: 'rocket', tier: 5, name: 'Lance-roquettes',
    damage: 40, fireRate: 1.6, range: 44, pellets: 1, spread: 0,
    aoe: 3.2, bulletColor: 0xff3b3b, bulletSize: 0.36, muzzle: 0.9,
    next: 'laser',
  },
  laser: {
    id: 'laser', tier: 6, name: 'Laser',
    damage: 26, fireRate: 20, range: 50, pellets: 1, spread: 0.05,
    aoe: 0, bulletColor: 0x59f7ff, bulletSize: 0.22, muzzle: 1.0,
    next: null,
  },
};

export const WEAPON_ORDER = ['pistol', 'smg', 'rifle', 'shotgun', 'minigun', 'rocket', 'laser'];

export function getWeapon(id) {
  return WEAPONS[id] || WEAPONS.pistol;
}

export function nextWeapon(id) {
  const w = getWeapon(id);
  return w.next ? WEAPONS[w.next] : w;
}
