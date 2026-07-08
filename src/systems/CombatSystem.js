import * as THREE from 'three';
import { Projectile } from '../entities/Projectile.js';

// Gère le tir de l'escouade, le déplacement des balles, collisions & dégâts.
// Renvoie via game les pièces gagnées et les soldiers perdus.

const MAX_BULLETS = 320;
const MAX_RATE = 110; // traceurs/seconde max (perf)

export class CombatSystem {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.pool = [];
    for (let i = 0; i < MAX_BULLETS; i++) this.pool.push(new Projectile(scene));
    this._fireAcc = 0;
    this._shooterIdx = 0;
    this._tmp = new THREE.Vector3();
    this._dir = new THREE.Vector3();
  }

  _getBullet() {
    for (let i = 0; i < this.pool.length; i++) if (!this.pool[i].active) return this.pool[i];
    return null;
  }

  // Cible la plus proche devant l'escouade
  _nearestTarget(squad) {
    let best = null; let bestD = Infinity;
    const check = (obj, x, z) => {
      if (z < squad.pos.z - 2) return; // derrière
      const d = Math.hypot(x - squad.pos.x, z - squad.pos.z);
      if (d < bestD) { bestD = d; best = obj; }
    };
    for (const e of this.game.enemies) check(e, e.pos.x, e.pos.z);
    for (const o of this.game.obstacles) if (o.alive) check(o, o.x, o.z);
    if (this.game.boss && this.game.boss.alive) check(this.game.boss, this.game.boss.pos.x, this.game.boss.pos.z);
    return { target: best, dist: bestD };
  }

  // firing = le joueur maintient le tir (clic droit / espace / bouton TIR)
  update(dt, firing) {
    const squad = this.game.squad;
    const bonus = this.game.bonus;
    // les héros ne tirent QUE si on maintient le tir
    if (firing && squad.count > 0) this._fire(dt, squad, bonus);
    else this._fireAcc = 0;

    // déplacement des traceurs + collisions
    for (const b of this.pool) {
      if (!b.active) continue;
      b.mesh.position.addScaledVector(b.vel, dt);
      b.life -= dt;
      if (b.life <= 0) { b.deactivate(); continue; }
      this._collide(b);
    }
  }

  _fire(dt, squad, bonus) {
    const w = squad.weapon;
    // chaque héros tire SA propre ligne droite -> plus de héros = plus de lignes
    const shooters = Math.min(squad.count, 60);
    const fireRate = w.fireRate * (bonus.fireRate || 1);
    let bulletsPerSec = shooters * fireRate;
    let dmgScale = squad.count / shooters; // reporte la puissance des héros en trop
    if (bulletsPerSec > MAX_RATE) {
      dmgScale *= bulletsPerSec / MAX_RATE;
      bulletsPerSec = MAX_RATE;
    }
    const dmgPerBullet = w.damage * (bonus.damage || 1) * dmgScale;

    this._fireAcc += bulletsPerSec * dt;
    let shots = Math.floor(this._fireAcc);
    if (shots <= 0) return;
    this._fireAcc -= shots;
    shots = Math.min(shots, 16); // limite par frame

    const speed = 46;
    const life = w.range / speed + 0.15;
    for (let s = 0; s < shots; s++) {
      // on parcourt les héros en rotation pour répartir les lignes de tir
      this._shooterIdx = (this._shooterIdx + 1) % shooters;
      squad.soldierWorld(this._shooterIdx, this._tmp);
      const from = this._tmp.clone();
      from.y = 0.85;
      const b = this._getBullet();
      if (!b) return;
      // TOUJOURS une ligne droite vers l'avant (+z), qui sort du héros
      b.spawn(from, new THREE.Vector3(0, 0, speed),
        w.bulletSize * 1.0 + 0.04, w.bulletColor,
        dmgPerBullet, w.aoe || 0, life);
    }
    this.game.audio.shot();
  }

  _collide(b) {
    const bx = b.mesh.position.x, bz = b.mesh.position.z;
    const game = this.game;

    // ennemis
    for (const e of game.enemies) {
      const r = e.def.size * 0.7 + 0.5;
      if (Math.abs(bx - e.pos.x) < r && Math.abs(bz - e.pos.z) < r) {
        this._applyDamage(e, b, false);
        return this._afterHit(b, bx, bz);
      }
    }
    // obstacles
    for (const o of game.obstacles) {
      if (!o.alive) continue;
      if (Math.abs(bx - o.x) < 2.5 && Math.abs(bz - o.z) < 1.0) {
        if (o.hit(b.damage)) game.destroyObstacle(o);
        return this._afterHit(b, bx, bz);
      }
    }
    // boss
    const boss = game.boss;
    if (boss && boss.alive) {
      const r = boss.def.size * 0.7;
      if (Math.abs(bx - boss.pos.x) < r && Math.abs(bz - boss.pos.z) < r) {
        if (boss.hit(b.damage)) game.onBossDead();
        game.fx.burst(b.mesh.position, boss.def.color, 3, 4);
        return this._afterHit(b, bx, bz);
      }
    }
  }

  _applyDamage(enemy, b, isAoeSource) {
    if (enemy.hit(b.damage)) this.game.killEnemy(enemy);
    else this.game.fx.burst(enemy.mesh.position, enemy.def.color, 3, 3);

    // AoE (roquette) : dégâts autour du point d'impact
    if (b.aoe > 0 && !isAoeSource) {
      const px = b.mesh.position.x, pz = b.mesh.position.z;
      for (const e of [...this.game.enemies]) {
        if (e === enemy) continue;
        if (Math.hypot(e.pos.x - px, e.pos.z - pz) < b.aoe) {
          if (e.hit(b.damage * 0.6)) this.game.killEnemy(e);
        }
      }
      this.game.fx.burst(b.mesh.position, 0xffa500, 18, 8);
      this.game.fx.addShake(0.25);
      this.game.audio.explode();
    }
  }

  _afterHit(b, x, z) {
    b.deactivate();
  }

  clear() {
    for (const b of this.pool) b.deactivate();
    this._fireAcc = 0;
  }
}
