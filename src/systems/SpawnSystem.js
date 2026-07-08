import { Gate } from '../entities/Gate.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Enemy } from '../entities/Enemy.js';

// Lit la config du niveau et fait apparaître portes/ennemis/obstacles
// au fur et à mesure que l'escouade approche.

const SPAWN_AHEAD = 60; // distance à laquelle un élément apparaît devant l'escouade

export class SpawnSystem {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.events = [];
    this.idx = 0;
  }

  load(level) {
    this.events = [...level.events].sort((a, b) => a.z - b.z);
    this.idx = 0;
  }

  update() {
    const sz = this.game.squad.pos.z;
    while (this.idx < this.events.length && this.events[this.idx].z <= sz + SPAWN_AHEAD) {
      this._spawn(this.events[this.idx]);
      this.idx++;
    }
  }

  _spawn(ev) {
    const scene = this.scene;
    const game = this.game;
    if (ev.kind === 'gate') {
      const left = new Gate(scene, ev.left, -2.6, ev.z, 'left');
      const right = new Gate(scene, ev.right, 2.6, ev.z, 'right');
      game.gates.push({ z: ev.z, left, right, used: false });
    } else if (ev.kind === 'obstacle') {
      const x = (ev.lane || 0) * 2.6;
      game.obstacles.push(new Obstacle(scene, ev.hp, x, ev.z));
    } else if (ev.kind === 'enemies') {
      for (let i = 0; i < ev.count; i++) {
        const x = (Math.random() - 0.5) * (ev.spread || 6);
        const z = ev.z + Math.random() * 8;
        game.enemies.push(new Enemy(scene, ev.type, x, z));
      }
    }
  }
}
