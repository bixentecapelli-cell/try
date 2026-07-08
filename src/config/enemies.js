// Tiers de monstres (data-driven).
// hp | speed = vitesse d'approche | damage = soldiers retirés au contact
// hpDamage = dégâts infligés à la VIE du héros au contact
// size = échelle du mesh | color | reward = pièces à la mort

export const ENEMIES = {
  grunt: {
    id: 'grunt', name: 'Grognard',
    hp: 16, speed: 12, damage: 2, hpDamage: 9, size: 0.9, color: 0xff5555, reward: 1,
  },
  armored: {
    id: 'armored', name: 'Soldat blindé',
    hp: 55, speed: 7, damage: 3, hpDamage: 16, size: 1.1, color: 0xc0392b, reward: 3,
  },
  runner: {
    id: 'runner', name: 'Coureur',
    hp: 24, speed: 20, damage: 3, hpDamage: 14, size: 0.8, color: 0xff8c00, reward: 2,
  },
  tank: {
    id: 'tank', name: 'Tank',
    hp: 190, speed: 5, damage: 5, hpDamage: 30, size: 1.7, color: 0x8e44ad, reward: 8,
  },
};

export function getEnemy(id) {
  return ENEMIES[id] || ENEMIES.grunt;
}
