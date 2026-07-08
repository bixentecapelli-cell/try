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
    name: 'Plaine verte', length: 220, ground: 0x3fa34d, sky: 0x87ceeb, startSquad: 6,
    boss: { name: 'Golem', hp: 500, color: 0x8e44ad, size: 3.2 },
    events: [
      gate(35, G('add', 10), G('mul', 2)),
      wave(60, 'grunt', 6),
      gate(85, G('sub', 20), G('add', 30)),
      wall(110, 60),
      gate(130, G('mul', 2), G('weapon', 1)),
      wave(155, 'grunt', 10),
      gate(180, G('add', 50), G('div', 2)),
    ],
  },
  {
    name: 'Désert', length: 260, ground: 0xd9a441, sky: 0xf4c95d, startSquad: 8,
    boss: { name: 'Scorpion Roi', hp: 850, color: 0xd35400, size: 3.6, spawns: ['grunt'] },
    events: [
      gate(35, G('mul', 2), G('add', 20)),
      wave(60, 'runner', 5),
      gate(90, G('sub', 30), G('mul', 3)),
      wall(115, 100),
      wave(135, 'armored', 4),
      gate(160, G('weapon', 1), G('add', 40)),
      gate(195, G('div', 2), G('mul', 2)),
      wave(225, 'grunt', 14),
    ],
  },
  {
    name: 'Toundra', length: 300, ground: 0x9fd8e8, sky: 0xcdeeff, startSquad: 10,
    boss: { name: 'Yéti', hp: 1300, color: 0xecf0f1, size: 4.0, spawns: ['runner'] },
    events: [
      gate(35, G('add', 30), G('mul', 2)),
      wave(60, 'runner', 8),
      wall(85, 140),
      gate(110, G('mul', 3), G('sub', 40)),
      wave(135, 'armored', 6),
      gate(165, G('weapon', 1), G('div', 2)),
      wall(190, 160, -1),
      wave(215, 'tank', 2),
      gate(245, G('mul', 2), G('add', 60)),
      wave(270, 'grunt', 18),
    ],
  },
  {
    name: 'Volcan', length: 340, ground: 0x6e2c00, sky: 0xe74c3c, startSquad: 12,
    boss: { name: 'Dragon', hp: 2000, color: 0xc0392b, size: 4.4, spawns: ['runner', 'grunt'] },
    events: [
      gate(35, G('mul', 3), G('add', 40)),
      wave(60, 'runner', 10),
      wall(85, 200),
      gate(110, G('sub', 50), G('mul', 3)),
      wave(140, 'armored', 8),
      gate(170, G('weapon', 1), G('div', 2)),
      wave(200, 'tank', 3),
      wall(230, 240, 1),
      gate(260, G('mul', 2), G('add', 80)),
      wave(295, 'runner', 16),
    ],
  },
  {
    name: 'Cité néon', length: 400, ground: 0x2c2c54, sky: 0x40407a, startSquad: 15,
    boss: { name: 'Méga-Bot', hp: 3200, color: 0x00cec9, size: 5.0, spawns: ['armored', 'runner'] },
    events: [
      gate(35, G('mul', 3), G('weapon', 1)),
      wave(60, 'runner', 12),
      wall(90, 260),
      gate(120, G('mul', 3), G('sub', 60)),
      wave(150, 'armored', 10),
      gate(180, G('weapon', 1), G('div', 2)),
      wave(210, 'tank', 4),
      wall(245, 320),
      gate(280, G('mul', 2), G('add', 100)),
      wave(315, 'runner', 20),
      gate(350, G('mul', 5), G('div', 2)),
    ],
  },
];

export function getLevel(index) {
  return LEVELS[Math.min(index, LEVELS.length - 1)];
}
