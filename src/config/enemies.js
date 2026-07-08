// Tiers de monstres (data-driven).
// hp | speed = vitesse d'approche | damage = soldiers retirés au contact
// size = échelle du mesh | color | reward = pièces à la mort

export const ENEMIES = {
  grunt: {
    id: 'grunt', name: 'Grognard',
    hp: 8, speed: 9, damage: 1, size: 0.9, color: 0xff5555, reward: 1,
  },
  armored: {
    id: 'armored', name: 'Soldat blindé',
    hp: 26, speed: 5.5, damage: 2, size: 1.1, color: 0xc0392b, reward: 3,
  },
  runner: {
    id: 'runner', name: 'Coureur',
    hp: 12, speed: 15, damage: 2, size: 0.8, color: 0xff8c00, reward: 2,
  },
  tank: {
    id: 'tank', name: 'Tank',
    hp: 90, speed: 3.5, damage: 4, size: 1.7, color: 0x8e44ad, reward: 8,
  },
};

export function getEnemy(id) {
  return ENEMIES[id] || ENEMIES.grunt;
}
