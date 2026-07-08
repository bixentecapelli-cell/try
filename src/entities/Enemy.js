import * as THREE from 'three';
import { getEnemy } from '../config/enemies.js';

// Ennemi mobile — monstres détaillés et texturés, un look différent par tier.
// grunt = petit démon cornu · armored = brute blindée · runner = cyclope rapide
// tank = grosse bête à pics.

export class Enemy {
  constructor(scene, typeId, x, z) {
    this.scene = scene;
    const def = getEnemy(typeId);
    this.def = def;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.alive = true;
    this.pos = new THREE.Vector3(x, 0, z);

    this.group = new THREE.Group();
    this.mesh = this.group; // combat/FX utilisent .mesh.position
    this._build(typeId, def);
    this.group.position.set(x, def.size * 0.7, z);
    scene.add(this.group);
    this._t = Math.random() * 10;
  }

  _build(typeId, def) {
    const s = def.size;
    const base = new THREE.Color(def.color);
    const skin = new THREE.MeshLambertMaterial({
      color: 0xffffff, map: skinTexture(def.color, typeId),
    });
    this.bodyMat = skin;

    // ---- corps selon le tier ----
    let bodyGeo;
    if (typeId === 'runner') bodyGeo = new THREE.CapsuleGeometry(s * 0.4, s * 0.9, 4, 8);
    else if (typeId === 'armored') bodyGeo = new THREE.BoxGeometry(s * 1.1, s * 1.2, s);
    else if (typeId === 'tank') bodyGeo = new THREE.DodecahedronGeometry(s * 0.95, 0);
    else bodyGeo = new THREE.IcosahedronGeometry(s * 0.85, 0); // grunt : petit démon facetté
    const body = new THREE.Mesh(bodyGeo, skin);
    this.group.add(body);
    this._body = body;

    const dark = new THREE.MeshLambertMaterial({ color: base.clone().multiplyScalar(0.5).getHex() });
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const black = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const glow = new THREE.MeshBasicMaterial({ color: 0xffee55 });

    // ---- yeux ----
    const eyeR = s * 0.16;
    const mkEye = (ex) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 8, 8), white);
      e.position.set(ex, s * 0.25, s * 0.55);
      const p = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.5, 6, 6), black);
      p.position.set(ex, s * 0.25, s * 0.55 + eyeR * 0.7);
      this.group.add(e); this.group.add(p);
    };
    if (typeId === 'runner') {
      // cyclope : un seul gros œil rouge
      const e = new THREE.Mesh(new THREE.SphereGeometry(s * 0.28, 10, 10), white);
      e.position.set(0, s * 0.3, s * 0.5);
      const p = new THREE.Mesh(new THREE.SphereGeometry(s * 0.13, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff2222 }));
      p.position.set(0, s * 0.3, s * 0.5 + s * 0.2);
      this.group.add(e); this.group.add(p);
    } else if (typeId === 'tank') {
      mkEye(-s * 0.3); mkEye(s * 0.3);
      const e3 = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.8, 8, 8), white);
      e3.position.set(0, s * 0.55, s * 0.5); this.group.add(e3);
    } else {
      mkEye(-s * 0.28); mkEye(s * 0.28);
    }

    // ---- cornes / pics ----
    const horn = (hx, hy, hs, mat) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(hs * 0.5, hs * 1.6, 6), mat);
      c.position.set(hx, hy, 0);
      this.group.add(c);
      return c;
    };
    if (typeId === 'grunt') {
      horn(-s * 0.35, s * 0.7, s * 0.3, white);
      horn(s * 0.35, s * 0.7, s * 0.3, white);
    } else if (typeId === 'tank') {
      // rangée de pics sur le dos
      for (let i = -2; i <= 2; i++) {
        const p = horn(i * s * 0.3, s * 0.55, s * 0.32, dark);
        p.position.z = -s * 0.3;
      }
    } else if (typeId === 'runner') {
      // ailerons/pics arrière (allure rapide)
      for (let i = -1; i <= 1; i++) {
        const p = horn(i * s * 0.22, s * 0.5, s * 0.22, dark);
        p.rotation.x = 0.8; p.position.z = -s * 0.4;
      }
    }

    // ---- blindage (armored) ----
    if (typeId === 'armored') {
      const metal = new THREE.MeshLambertMaterial({ color: 0x9aa4b0 });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(s * 1.2, s * 0.6, s * 0.2), metal);
      plate.position.set(0, s * 0.1, s * 0.52); this.group.add(plate);
      // visière lumineuse
      const visor = new THREE.Mesh(new THREE.BoxGeometry(s * 0.9, s * 0.14, s * 0.1),
        new THREE.MeshBasicMaterial({ color: 0xff3b3b }));
      visor.position.set(0, s * 0.32, s * 0.6); this.group.add(visor);
      // boulons
      for (const bx of [-0.45, 0.45]) {
        const bolt = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 6, 6), metal);
        bolt.position.set(bx * s, s * 0.1, s * 0.63); this.group.add(bolt);
      }
      // épaulières
      for (const sx of [-1, 1]) {
        const sh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), metal);
        sh.position.set(sx * s * 0.65, s * 0.45, 0); this.group.add(sh);
      }
    }

    // ---- bouche + dents (grunt & tank) ----
    if (typeId === 'grunt' || typeId === 'tank') {
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.14, s * 0.1), black);
      mouth.position.set(0, -s * 0.05, s * 0.6); this.group.add(mouth);
      const teeth = typeId === 'tank' ? 4 : 3;
      for (let i = 0; i < teeth; i++) {
        const t = new THREE.Mesh(new THREE.ConeGeometry(s * 0.05, s * 0.16, 4), white);
        t.position.set((i - (teeth - 1) / 2) * s * 0.16, -s * 0.02, s * 0.63);
        t.rotation.x = Math.PI; this.group.add(t);
      }
    }
  }

  update(dt, squadPos) {
    this._t += dt;
    const dx = squadPos.x - this.pos.x;
    const dz = squadPos.z - this.pos.z;
    const dist = Math.hypot(dx, dz) || 1;
    const sp = this.def.speed;
    this.pos.x += (dx / dist) * sp * dt;
    this.pos.z += (dz / dist) * sp * dt;
    const hop = Math.abs(Math.sin(this._t * (this.def.speed * 0.9))) * this.def.size * 0.25;
    this.group.position.set(this.pos.x, this.def.size * 0.7 + hop, this.pos.z);
    this.group.rotation.y = Math.atan2(dx, dz);
    // dandinement menaçant
    this.group.rotation.z = Math.sin(this._t * 8) * 0.08;
  }

  hit(dmg) {
    this.hp -= dmg;
    this.bodyMat.emissive = new THREE.Color(0xffffff);
    this.bodyMat.emissiveIntensity = 0.7;
    setTimeout(() => { if (this.bodyMat) this.bodyMat.emissiveIntensity = 0; }, 55);
    return this.hp <= 0;
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    this.alive = false;
  }
}

// Texture de peau procédurale (écailles / taches / stries) selon le tier.
const _texCache = {};
function skinTexture(colorHex, kind) {
  const key = kind + colorHex;
  if (_texCache[key]) return _texCache[key];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const col = new THREE.Color(colorHex);
  ctx.fillStyle = `#${col.getHexString()}`;
  ctx.fillRect(0, 0, 64, 64);
  const dark = `#${col.clone().multiplyScalar(0.6).getHexString()}`;
  const light = `#${col.clone().lerp(new THREE.Color(0xffffff), 0.35).getHexString()}`;

  if (kind === 'tank' || kind === 'grunt') {
    // écailles
    ctx.strokeStyle = dark; ctx.lineWidth = 2;
    for (let y = 0; y < 64; y += 10) {
      for (let x = 0; x < 64; x += 12) {
        ctx.beginPath();
        ctx.arc(x + (y % 20 ? 6 : 0), y, 7, Math.PI, 0);
        ctx.stroke();
      }
    }
  } else if (kind === 'runner') {
    // stries de vitesse
    ctx.strokeStyle = light; ctx.lineWidth = 3;
    for (let y = 4; y < 64; y += 9) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(64, y - 6); ctx.stroke();
    }
  } else {
    // taches (armored fallback)
    ctx.fillStyle = dark;
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 64, Math.random() * 64, 2 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  _texCache[key] = tex;
  return tex;
}
