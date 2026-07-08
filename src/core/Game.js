import * as THREE from 'three';
import { Squad } from '../entities/Squad.js';
import { Hero } from '../entities/Hero.js';
import { Boss } from '../entities/Boss.js';
import { Enemy } from '../entities/Enemy.js';
import { CameraRig } from '../systems/CameraRig.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { FX } from '../systems/FX.js';
import { getLevel } from '../config/levels.js';
import { nextWeapon, WEAPON_ORDER, getWeapon } from '../config/weapons.js';

// Orchestrateur : scène, caméra, boucle, phases (course -> boss -> fin).

export class Game {
  constructor(canvas, audio) {
    this.audio = audio;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87ceeb, 55, 150);

    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 400);
    this.rig = new CameraRig(this.camera);

    // lumières
    const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x3a5540, 0.9);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.4);
    this.sun.position.set(14, 34, 8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.near = 1; sc.far = 90; sc.left = -22; sc.right = 22; sc.top = 30; sc.bottom = -30;
    this.sun.shadow.bias = -0.0006;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this._buildSky();
    this._buildGround();
    this._buildScenery();
    this._buildChevrons();

    this.squad = new Squad(this.scene);
    this.hero = new Hero(this.scene);
    this.fx = new FX(this.scene, this.camera);
    this.combat = new CombatSystem(this.scene, this);
    this.spawner = new SpawnSystem(this.scene, this);

    this.gates = [];
    this.enemies = [];
    this.obstacles = [];
    this.boss = null;

    this.state = 'idle'; // idle | running | boss | done | over
    this.levelIndex = 0;
    this.level = null;
    this.bonus = { damage: 1, fireRate: 1 };
    this.runCoins = 0;
    this.firing = false;       // le joueur maintient le tir

    this.onLevelComplete = () => {};
    this.onGameOver = () => {};
    this.onBossAppear = () => {};

    window.addEventListener('resize', () => this._onResize());
  }

  _drawGround(hex) {
    const c = this.groundTex.image;
    const ctx = c.getContext('2d');
    const g = new THREE.Color(hex);
    const a = `#${g.getHexString()}`;
    const b = `#${g.clone().multiplyScalar(0.92).getHexString()}`;
    // damier doux pour la profondeur
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      ctx.fillStyle = (x + y) % 2 ? a : b;
      ctx.fillRect(x * 32, y * 32, 32, 32);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, 0, 64, 3);
    this.groundTex.needsUpdate = true;
  }

  _buildGround() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    this.groundTex = new THREE.CanvasTexture(c);
    this.groundTex.wrapS = this.groundTex.wrapT = THREE.RepeatWrapping;
    this.groundTex.repeat.set(5, 50);
    this._drawGround(0x3fa34d);

    const geo = new THREE.PlaneGeometry(24, 600);
    this.groundMat = new THREE.MeshLambertMaterial({ map: this.groundTex, color: 0xffffff });
    this.ground = new THREE.Mesh(geo, this.groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // bords lumineux
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const edgeGeo = new THREE.BoxGeometry(0.3, 0.3, 600);
    this.edgeL = new THREE.Mesh(edgeGeo, edgeMat); this.edgeL.position.x = -6;
    this.edgeR = new THREE.Mesh(edgeGeo, edgeMat); this.edgeR.position.x = 6;
    this.scene.add(this.edgeL); this.scene.add(this.edgeR);
  }

  // Fond de ciel en dégradé (plus joli qu'une couleur plate).
  _buildSky() {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 128;
    this.skyTex = new THREE.CanvasTexture(c);
    this._drawSky(0x87ceeb);
    this.scene.background = this.skyTex;
  }

  _drawSky(hex) {
    const c = this.skyTex.image;
    const ctx = c.getContext('2d');
    const top = new THREE.Color(hex).multiplyScalar(0.75);
    const bot = new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.35);
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, `#${top.getHexString()}`);
    grad.addColorStop(1, `#${bot.getHexString()}`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 128);
    this.skyTex.needsUpdate = true;
  }

  // Chevrons lumineux au centre de la piste -> renforce la sensation de vitesse.
  _buildChevrons() {
    this.chevrons = [];
    const shape = new THREE.Shape();
    shape.moveTo(-1.2, 0); shape.lineTo(0, 0.9); shape.lineTo(1.2, 0);
    shape.lineTo(1.2, -0.5); shape.lineTo(0, 0.4); shape.lineTo(-1.2, -0.5);
    const geo = new THREE.ShapeGeometry(shape);
    for (let i = 0; i < 16; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.28, side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0.05, i * 9);
      this.scene.add(m);
      this.chevrons.push(m);
    }
  }

  // Décor latéral qui défile (profondeur + vitesse ressentie).
  _buildScenery() {
    this.scenery = [];
    const geo = new THREE.ConeGeometry(1.1, 3.6, 6);
    for (let i = 0; i < 26; i++) {
      const mat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
      const m = new THREE.Mesh(geo, mat);
      const side = i % 2 === 0 ? -1 : 1;
      m.position.set(side * (8 + Math.random() * 5), 1.8, i * 11);
      m.rotation.y = Math.random() * Math.PI;
      m.castShadow = true;
      this.scene.add(m);
      this.scenery.push(m);
    }
    this._sceneryGeo = geo;
  }

  _applySceneryTheme(color) {
    if (this.scenery) this.scenery.forEach((m) => m.material.color.setHex(color));
  }

  _applyTheme(level) {
    this._drawSky(level.sky);
    this.scene.fog.color = new THREE.Color(level.sky).lerp(new THREE.Color(0xffffff), 0.2);
    this._drawGround(level.ground);
    // teinte du décor dérivée du sol, un peu assombrie
    const dark = new THREE.Color(level.ground).multiplyScalar(0.7);
    this._applySceneryTheme(dark.getHex());
  }

  start(levelIndex, bonus) {
    this.clear();
    this.levelIndex = levelIndex;
    this.level = getLevel(levelIndex);
    this._applyTheme(this.level);

    // bonus méta (dégâts, cadence) fournis par le SaveManager via main
    this.bonus = { damage: bonus.damage || 1, fireRate: bonus.fireRate || 1 };
    const startWeapon = WEAPON_ORDER[Math.min(bonus.startWeapon || 0, WEAPON_ORDER.length - 1)];

    this.squad.reset(this.level.startSquad + (bonus.squadSize || 0), startWeapon);
    this.squad.speed = 8 + levelIndex * 0.6;
    this.hero.setMaxHp(100 + (bonus.maxHealth || 0));
    this.hero.reset();
    this.spawner.load(this.level);
    this.rig.snap(this.squad.pos);

    this.runCoins = 0;
    this.state = 'running';
  }

  clear() {
    this.gates.forEach((g) => { g.left.dispose(); g.right.dispose(); });
    this.enemies.forEach((e) => e.dispose());
    this.obstacles.forEach((o) => o.dispose());
    if (this.boss) { this.boss.dispose(); this.boss = null; }
    this.gates = []; this.enemies = []; this.obstacles = [];
    this.combat.clear();
    this.fx.clear();
  }

  // ---------- callbacks combat ----------
  killEnemy(e) {
    const i = this.enemies.indexOf(e);
    if (i === -1) return;
    this.enemies.splice(i, 1);
    this.fx.burst(e.mesh.position, e.def.color, 12, 6);
    this.runCoins += e.def.reward;
    this.audio.enemyDie();
    e.dispose();
  }

  destroyObstacle(o) {
    o.alive = false;
    const i = this.obstacles.indexOf(o);
    if (i !== -1) this.obstacles.splice(i, 1);
    this.fx.burst(o.mesh.position, 0x8d6e63, 20, 7);
    this.fx.addShake(0.3);
    this.audio.explode();
    o.dispose();
  }

  onBossDead() {
    if (!this.boss) return;
    this.fx.burst(this.boss.mesh.position, this.boss.def.color, 40, 12);
    this.fx.addShake(0.8);
    this.runCoins += 30 + this.levelIndex * 15;
    this.boss.dispose();
    this.boss = null;
    this.state = 'done';
    this.audio.win();
    this.onLevelComplete(this.finalCoins());
  }

  finalCoins() {
    return Math.round(this.runCoins * (this._income || 1));
  }
  setIncome(mult) { this._income = mult; }

  // ---------- boucle ----------
  update(dt, targetX, firing) {
    this.firing = !!firing;
    if (this.state === 'running' || this.state === 'boss') {
      const advancing = this.state === 'running';
      this.squad.update(dt, targetX, advancing);
      this.hero.update(dt, this.squad.pos.x, this.squad.pos.z + 0.6);
      this._scrollGround();
      this._scrollScenery();
      this.spawner.update();
      this._updateGates();
      this._updateEnemies(dt);
      this._updateObstacles();
      this.combat.update(dt, this.firing);
      this.fx.update(dt);

      if (this.state === 'running' && this.spawner.idx >= this.spawner.events.length
          && this.squad.pos.z >= this.level.length) {
        this._enterBoss();
      }
      if (this.state === 'boss' && this.boss) {
        const spawn = this.boss.update(dt);
        if (spawn) this.enemies.push(new Enemy(this.scene, spawn, (Math.random() - 0.5) * 6, this.boss.pos.z - 3));
        // attaque à distance du boss : te met la pression
        this._bossAtk = (this._bossAtk || 0) - dt;
        if (this._bossAtk <= 0) {
          this._bossAtk = 2.6;
          this.hero.damage(6 + this.levelIndex * 2);
          this.fx.burst(this.hero.pos.clone().setY(1), 0xff3b3b, 8, 5);
          this.fx.addShake(0.3);
        }
      }
      this.rig.update(this.squad.pos, dt);
      this.fx.applyShake();

      if (this.hero.hp <= 0 && this.state !== 'over') this._gameOver();
    } else {
      // idle/done/over : on continue d'animer les FX
      this.squad.update(dt, targetX, false);
      this.hero.update(dt, this.squad.pos.x, this.squad.pos.z + 0.6);
      this.fx.update(dt);
      this.rig.update(this.squad.pos, dt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  _scrollGround() {
    const z = this.squad.pos.z;
    this.ground.position.z = z;
    this.edgeL.position.z = z;
    this.edgeR.position.z = z;
    this.groundTex.offset.y = -z / 12;
    // l'ombre du soleil suit l'escouade
    this.sun.position.set(this.squad.pos.x + 14, 34, z + 8);
    this.sun.target.position.set(this.squad.pos.x, 0, z + 6);
    // chevrons qui défilent vers le joueur
    for (const ch of this.chevrons) {
      if (ch.position.z < z - 6) ch.position.z += this.chevrons.length * 9;
      ch.position.x = this.squad.pos.x * 0.2;
    }
  }

  _scrollScenery() {
    const z = this.squad.pos.z;
    for (const m of this.scenery) {
      // dès qu'un décor passe derrière, on le replace loin devant
      if (m.position.z < z - 20) {
        m.position.z = z + 250 + Math.random() * 30;
        m.position.x = (m.position.x < 0 ? -1 : 1) * (8 + Math.random() * 4);
      }
    }
  }

  _updateGates() {
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const pair = this.gates[i];
      if (!pair.used && this.squad.pos.z >= pair.z) {
        pair.used = true;
        const gate = this.squad.pos.x >= 0 ? pair.right : pair.left;
        this._applyGate(gate);
        pair.left.dispose();
        pair.right.dispose();
        this.gates.splice(i, 1);
      } else if (this.squad.pos.z > pair.z + 8) {
        pair.left.dispose(); pair.right.dispose();
        this.gates.splice(i, 1);
      }
    }
  }

  _applyGate(gate) {
    const pos = this.squad.pos.clone(); pos.y = 1;
    if (gate.effect.op === 'weapon') {
      let id = this.squad.weaponId;
      for (let k = 0; k < gate.effect.val; k++) id = nextWeapon(id).id;
      this.squad.setWeapon(id);
      this.fx.popNumber(pos, getWeapon(id).name, '#2ecc71');
      this.fx.burst(pos, 0x2ecc71, 16, 6);
      this.audio.gateGood();
      return;
    }
    const before = this.squad.count;
    const after = gate.apply(before);
    this.squad.setCount(after);
    const diff = after - before;
    const label = diff >= 0 ? `+${diff}` : `${diff}`;
    this.fx.popNumber(pos, label, gate.good ? '#7bff9e' : '#ff6b6b');
    this.fx.burst(pos, gate.good ? 0x27ae60 : 0xc0392b, 14, 6);
    if (gate.good) this.audio.gateGood(); else this.audio.gateBad();
  }

  _updateEnemies(dt) {
    const sq = this.squad;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, sq.pos);
      const dz = e.pos.z - sq.pos.z;
      // contact avec l'escouade / le héros
      if (dz < 0.8 && Math.abs(e.pos.x - sq.pos.x) < sq.halfWidth + 0.6) {
        sq.setCount(sq.count - e.def.damage);
        this.hero.damage(e.def.hpDamage || 6);   // les ennemis te tapent !
        this.fx.burst(sq.pos.clone().setY(1), 0xff3b3b, 10, 5);
        this.fx.addShake(0.28);
        this.enemies.splice(i, 1);
        e.dispose();
      } else if (dz < -6) {
        // dépassé l'escouade (raté) : nettoyage
        this.enemies.splice(i, 1);
        e.dispose();
      }
    }
  }

  _updateObstacles() {
    const sq = this.squad;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      if (!o.alive) continue;
      if (sq.pos.z >= o.z - 0.5) {
        // atteint le mur encore debout : coûte des soldiers
        const cost = Math.max(2, Math.ceil(o.hp / 12));
        sq.setCount(sq.count - cost);
        this.hero.damage(Math.min(30, 8 + o.hp / 20));
        this.fx.popNumber(sq.pos.clone().setY(1), `-${cost}`, '#ff6b6b');
        this.fx.addShake(0.35);
        this.audio.gateBad();
        this.destroyObstacle(o);
      }
    }
  }

  _enterBoss() {
    this.state = 'boss';
    this._bossAtk = 3;
    const bz = this.squad.pos.z + 20;
    this.boss = new Boss(this.scene, this.level.boss, bz);
    this.fx.addShake(0.5);
    this.onBossAppear();
  }

  _gameOver() {
    this.state = 'over';
    this.audio.lose();
    this.onGameOver();
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  progress() {
    if (!this.level) return 0;
    if (this.state === 'boss' || this.state === 'done') return 1;
    return Math.min(1, this.squad.pos.z / this.level.length);
  }
}
