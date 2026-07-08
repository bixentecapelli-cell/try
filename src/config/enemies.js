// Tiers de monstres (data-driven).
// hp | speed = vitesse d'approche | damage = soldiers retirés au contact
// hpDamage = dégâts infligés à la VIE du héros au contact
// size = échelle du mesh | color | reward = pièces à la mort

export const ENEMIES = {
  grunt: {
    id: 'grunt', name: 'Grognard',
    hp: 13, speed: 9.5, damage: 1, hpDamage: 5, size: 0.9, color: 0xff5555, reward: 1,
  },
  armored: {
    id: 'armored', name: 'Soldat blindé',
    hp: 45, speed: 6, damage: 2, hpDamage: 9, size: 1.1, color: 0xc0392b, reward: 3,
  },
  runner: {
    id: 'runner', name: 'Coureur',
    hp: 20, speed: 15, damage: 2, hpDamage: 8, size: 0.8, color: 0xff8c00, reward: 2,
  },
  tank: {
    id: 'tank', name: 'Tank',
    hp: 150, speed: 4.5, damage: 4, hpDamage: 16, size: 1.7, color: 0x8e44ad, reward: 8,
  },
};

export function getEnemy(id) {
  return ENEMIES[id] || ENEMIES.grunt;
}
