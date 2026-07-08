// Tiers de monstres (data-driven).
// hp | speed = vitesse d'approche | damage = soldiers retirés au contact
// hpDamage = dégâts infligés à la VIE du héros au contact
// size = échelle du mesh | color | reward = pièces à la mort

export const ENEMIES = {
  grunt: {
    id: 'grunt', name: 'Grognard',
    hp: 12, speed: 10, damage: 1, hpDamage: 6, size: 0.9, color: 0xff5555, reward: 1,
  },
  armored: {
    id: 'armored', name: 'Soldat blindé',
    hp: 40, speed: 6, damage: 2, hpDamage: 12, size: 1.1, color: 0xc0392b, reward: 3,
  },
  runner: {
    id: 'runner', name: 'Coureur',
    hp: 18, speed: 17, damage: 2, hpDamage: 10, size: 0.8, color: 0xff8c00, reward: 2,
  },
  tank: {
    id: 'tank', name: 'Tank',
    hp: 140, speed: 4, damage: 4, hpDamage: 22, size: 1.7, color: 0x8e44ad, reward: 8,
  },
};

export function getEnemy(id) {
  return ENEMIES[id] || ENEMIES.grunt;
}
