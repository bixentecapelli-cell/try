import * as THREE from 'three';
import { getEnemy } from '../config/enemies.js';

// Ennemi mobile : fonce vers l'escouade. Meurt quand hp <= 0.

export class Enemy {
  constructor(scene, typeId, x, z) {
    this.scene = scene;
    const def = getEnemy(typeId);
    this.def = def;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.alive = true;
    this.pos = new THREE.Vector3(x, 0, z);

    const geo = new THREE.BoxGeometry(def.size, def.size * 1.2, def.size);
    const mat = new THREE.MeshLambertMaterial({ color: def.color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, def.size * 0.6, z);
    // "yeux" pour le style
    const eyeGeo = new THREE.SphereGeometry(def.size * 0.12, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const e1 = new THREE.Mesh(eyeGeo, eyeMat); e1.position.set(-def.size * 0.22, def.size * 0.2, def.size * 0.5);
    const e2 = new THREE.Mesh(eyeGeo, eyeMat); e2.position.set(def.size * 0.22, def.size * 0.2, def.size * 0.5);
    this.mesh.add(e1); this.mesh.add(e2);
    scene.add(this.mesh);
    this._t = Math.random() * 10;
  }

  update(dt, squadPos) {
    this._t += dt;
    // se dirige vers l'escouade
    const dx = squadPos.x - this.pos.x;
    const dz = squadPos.z - this.pos.z;
    const dist = Math.hypot(dx, dz) || 1;
    const sp = this.def.speed;
    this.pos.x += (dx / dist) * sp * dt;
    this.pos.z += (dz / dist) * sp * dt;
    this.mesh.position.set(this.pos.x, this.def.size * 0.6 + Math.abs(Math.sin(this._t * 10)) * 0.2, this.pos.z);
    this.mesh.rotation.y = Math.atan2(dx, dz);
  }

  hit(dmg) {
    this.hp -= dmg;
    // flash
    if (this.mesh.material.emissive) {
      this.mesh.material.emissive = new THREE.Color(0xffffff);
      this.mesh.material.emissiveIntensity = 0.6;
      setTimeout(() => { if (this.mesh.material) this.mesh.material.emissiveIntensity = 0; }, 60);
    }
    return this.hp <= 0;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.alive = false;
  }
}
