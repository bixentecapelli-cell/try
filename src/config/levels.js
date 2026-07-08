// Définition des niveaux (data-driven).
//
// Un niveau = { name, length, ground, sky, startSquad, boss, events[] }
//   length     : longueur de la piste (unités z) avant l'arène de boss
//   ground/sky : couleurs d'ambiance (hex)
//   startSquad : taille d'escouade conseillée au départ
//   boss       : { name, hp, color, size, spawns? } spawns = ['grunt', ...] invoqués périodiquement
//   events     : liste triée par `z` (distance depuis le départ). Types :
//     - gate     : { z, left:{op,val}, right:{op,val} }
//                  op ∈ 'add' | 'mul' | 'sub' | 'div' | 'weapon'
//     - enemies  : { z, type, count, spread }  (vague d'ennemis)
//     - obstacle : { z, hp, lane }             lane ∈ -1 | 0 | 1 (position latérale)
//
// >>> Pour créer un niveau : copie un bloc, change les valeurs, augmente la difficulté.

// Petits helpers pour écrire les niveaux plus vite
const gate = (z, left, right) => ({ kind: 'gate', z, left, right });
const wave = (z, type, count, spread = 6) => ({ kind: 'enemies', z, type, count, spread });
const wall = (z, hp, lane = 0) => ({ kind: 'obstacle', z, hp, lane });
const G = (op, val) => ({ op, val });

export const LEVELS = [
  {
    name: 'Plaine verte', length: 230, ground: 0x3fa34d, sky: 0x87ceeb, startSquad: 5,
    boss: { name: 'Golem', hp: 650, color: 0x8e44ad, size: 3.2, spawns: ['grunt'] },
    events: [
      gate(35, G('add', 8), G('mul', 2)),
      wave(58, 'grunt', 8),
      gate(85, G('sub', 20), G('add', 25)),
      wall(108, 90),
      wave(130, 'grunt', 12),
      gate(150, G('mul', 2), G('weapon', 1)),
      wave(175, 'runner', 6),
      gate(200, G('add', 40), G('div', 2)),
    ],
  },
  {
    name: 'Désert', length: 280, ground: 0xd9a441, sky: 0xf4c95d, startSquad: 7,
    boss: { name: 'Scorpion Roi', hp: 1100, color: 0xd35400, size: 3.6, spawns: ['grunt', 'runner'] },
    events: [
      gate(35, G('mul', 2), G('add', 18)),
      wave(58, 'runner', 8),
      gate(88, G('sub', 30), G('mul', 3)),
      wall(112, 140),
      wave(135, 'armored', 6),
      wave(155, 'grunt', 14),
      gate(178, G('weapon', 1), G('add', 35)),
      gate(210, G('div', 2), G('mul', 2)),
      wave(240, 'runner', 12),
    ],
  },
  {
    name: 'Toundra', length: 320, ground: 0x9fd8e8, sky: 0xcdeeff, startSquad: 9,
    boss: { name: 'Yéti', hp: 1700, color: 0xecf0f1, size: 4.0, spawns: ['runner', 'armored'] },
    events: [
      gate(35, G('add', 25), G('mul', 2)),
      wave(58, 'runner', 10),
      wall(82, 180),
      gate(108, G('mul', 3), G('sub', 45)),
      wave(132, 'armored', 8),
      wave(152, 'grunt', 16),
      gate(178, G('weapon', 1), G('div', 2)),
      wall(205, 200, -1),
      wave(228, 'tank', 2),
      gate(258, G('mul', 2), G('add', 50)),
      wave(285, 'runner', 16),
    ],
  },
  {
    name: 'Volcan', length: 360, ground: 0x6e2c00, sky: 0xe74c3c, startSquad: 11,
    boss: { name: 'Dragon', hp: 2600, color: 0xc0392b, size: 4.4, spawns: ['runner', 'grunt', 'armored'] },
    events: [
      gate(35, G('mul', 3), G('add', 35)),
      wave(58, 'runner', 12),
      wall(82, 260),
      gate(108, G('sub', 55), G('mul', 3)),
      wave(135, 'armored', 10),
      wave(158, 'runner', 14),
      gate(182, G('weapon', 1), G('div', 2)),
      wave(210, 'tank', 3),
      wall(240, 300, 1),
      wave(265, 'grunt', 20),
      gate(295, G('mul', 2), G('add', 70)),
      wave(325, 'runner', 18),
    ],
  },
  {
    name: 'Cité néon', length: 420, ground: 0x2c2c54, sky: 0x40407a, startSquad: 13,
    boss: { name: 'Méga-Bot', hp: 4200, color: 0x00cec9, size: 5.0, spawns: ['armored', 'runner', 'tank'] },
    events: [
      gate(35, G('mul', 3), G('weapon', 1)),
      wave(58, 'runner', 14),
      wall(88, 340),
      gate(118, G('mul', 3), G('sub', 65)),
      wave(145, 'armored', 12),
      wave(168, 'runner', 16),
      gate(192, G('weapon', 1), G('div', 2)),
      wave(220, 'tank', 4),
      wall(255, 400),
      wave(285, 'grunt', 26),
      gate(315, G('mul', 2), G('add', 90)),
      wave(345, 'runner', 22),
      gate(378, G('mul', 5), G('div', 2)),
    ],
  },
];

export function getLevel(index) {
  return LEVELS[Math.min(index, LEVELS.length - 1)];
}
