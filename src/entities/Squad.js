import * as THREE from 'three';
import { getWeapon } from '../config/weapons.js';
import { toonMat } from '../core/toon.js';

// L'escouade du joueur. Rendu via InstancedMesh (perf avec grosses foules).
// - bodies : capsules colorées (soldiers)
// - guns   : petits mesh d'arme, couleur/taille selon le tier (arme visible)

const MAX = 1000;
const LANE_HALF = 5.2;   // demi-largeur de la piste
const SPACING = 1.15;

export class Squad {
  constructor(scene) {
    this.scene = scene;
    this.count = 1;
    this.pos = new THREE.Vector3(0, 0, 0); // leader (x lateral, z forward)
    this.targetX = 0;
    this.weaponId = 'pistol';
    this.speed = 8;

    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.5, 3, 6);
    const bodyMat = toonMat({ color: 0xffd24a });
    this.bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, MAX);
    this.bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bodies.castShadow = true;
    scene.add(this.bodies);

    const gunGeo = new THREE.BoxGeometry(0.14, 0.14, 0.7);
    const gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.guns = new THREE.InstancedMesh(gunGeo, gunMat, MAX);
    this.guns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.guns);

    this._dummy = new THREE.Object3D();
    this._offsets = [];
    this._phases = [];
    for (let i = 0; i < MAX; i++) this._phases.push(Math.random() * Math.PI * 2);
    this._rebuildOffsets();
    this._t = 0;
  }

  reset(count, weaponId) {
    this.count = Math.max(1, count);
    this.weaponId = weaponId || 'pistol';
    this.pos.set(0, 0, 0);
    this.targetX = 0;
    this._rebuildOffsets();
    this._applyGunStyle();
  }

  get weapon() { return getWeapon(this.weaponId); }

  setCount(n) {
    this.count = Math.max(0, Math.min(MAX, Math.round(n)));
    this._rebuildOffsets();
  }
  add(n) { this.setCount(this.count + n); }

  setWeapon(id) { this.weaponId = id; this._applyGunStyle(); }

  _applyGunStyle() {
    const w = this.weapon;
    this.guns.material.color.setHex(w.bulletColor);
    const s = 0.8 + w.tier * 0.18;
    this.guns.geometry.dispose();
    this.guns.geometry = new THREE.BoxGeometry(0.16 * s, 0.16 * s, 0.6 + w.tier * 0.12);
  }

  // Positions relatives (grille centrée) pour `count` soldiers.
  _rebuildOffsets() {
    const n = this.count;
    this._offsets.length = 0;
    if (n <= 0) return;
    const cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.4)));
    for (let i = 0; i < n; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const rowCount = Math.min(cols, n - r * cols);
      const x = (c - (rowCount - 1) / 2) * SPACING;
      const z = -r * SPACING; // derrière le leader
      this._offsets.push({ x, z });
    }
  }

  // Position monde d'un soldier (utilisé pour tir/particules)
  soldierWorld(i, out) {
    const o = this._offsets[i] || this._offsets[0] || { x: 0, z: 0 };
    out.set(this.pos.x + o.x, 0.6, this.pos.z + o.z);
    return out;
  }

  // Largeur latérale actuelle de la formation (pour collisions de portes)
  get halfWidth() {
    const cols = Math.max(1, Math.ceil(Math.sqrt(this.count * 1.4)));
    return (cols * SPACING) / 2 + 0.4;
  }

  update(dt, targetXNorm, advance = true) {
    this._t += dt;
    // déplacement latéral fluide (négatif : la caméra regarde vers +z, donc
    // l'écran est miroir du monde -> on aligne le contrôle sur ce que le joueur voit)
    this.targetX = -targetXNorm * LANE_HALF;
    this.pos.x += (this.targetX - this.pos.x) * Math.min(1, dt * 10);
    if (advance) {
      this.pos.z += this.speed * dt;
    }

    // MAJ des instances
    const d = this._dummy;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      const o = this._offsets[i];
      const bob = Math.sin(this._t * 12 + this._phases[i]) * 0.12;
      const px = this.pos.x + o.x;
      const pz = this.pos.z + o.z;
      d.position.set(px, 0.55 + Math.abs(bob), pz);
      d.rotation.set(0, 0, 0);
      d.scale.setScalar(1);
      d.updateMatrix();
      this.bodies.setMatrixAt(i, d.matrix);

      // arme devant le soldier
      d.position.set(px + 0.28, 0.75, pz + 0.35);
      d.updateMatrix();
      this.guns.setMatrixAt(i, d.matrix);
    }
    this.bodies.count = n;
    this.guns.count = n;
    this.bodies.instanceMatrix.needsUpdate = true;
    this.guns.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.bodies);
    this.scene.remove(this.guns);
    this.bodies.geometry.dispose();
    this.bodies.material.dispose();
    this.guns.geometry.dispose();
    this.guns.material.dispose();
  }
}

export { LANE_HALF };
