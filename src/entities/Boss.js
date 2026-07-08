import * as THREE from 'three';

// Boss de fin de niveau : grosse barre de vie, léger pattern (invocation).

export class Boss {
  constructor(scene, def, z) {
    this.scene = scene;
    this.def = def;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.alive = true;
    this.pos = new THREE.Vector3(0, 0, z);
    this.spawnTimer = 3;

    const geo = new THREE.BoxGeometry(def.size, def.size * 1.3, def.size);
    const mat = new THREE.MeshLambertMaterial({ color: def.color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(0, def.size * 0.65, z);

    // couronne / cornes pour le style boss
    const hornGeo = new THREE.ConeGeometry(def.size * 0.18, def.size * 0.6, 6);
    const hornMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const h1 = new THREE.Mesh(hornGeo, hornMat); h1.position.set(-def.size * 0.3, def.size * 0.9, 0);
    const h2 = new THREE.Mesh(hornGeo, hornMat); h2.position.set(def.size * 0.3, def.size * 0.9, 0);
    this.mesh.add(h1); this.mesh.add(h2);

    const eyeGeo = new THREE.SphereGeometry(def.size * 0.14, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const e1 = new THREE.Mesh(eyeGeo, eyeMat); e1.position.set(-def.size * 0.25, def.size * 0.3, def.size * 0.5);
    const e2 = new THREE.Mesh(eyeGeo, eyeMat); e2.position.set(def.size * 0.25, def.size * 0.3, def.size * 0.5);
    this.mesh.add(e1); this.mesh.add(e2);

    scene.add(this.mesh);
    this._t = 0;
  }

  // Retourne un type d'ennemi à invoquer, ou null.
  update(dt) {
    this._t += dt;
    this.mesh.position.x = Math.sin(this._t * 1.2) * 3;
    this.mesh.rotation.y = Math.sin(this._t * 0.8) * 0.2;
    this.pos.x = this.mesh.position.x;

    if (this.def.spawns && this.def.spawns.length) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 3.5;
        return this.def.spawns[Math.floor(Math.random() * this.def.spawns.length)];
      }
    }
    return null;
  }

  hit(dmg) {
    this.hp -= dmg;
    this.mesh.material.emissiveIntensity = 0.5;
    this.mesh.material.emissive = new THREE.Color(0xffffff);
    setTimeout(() => { if (this.mesh.material) this.mesh.material.emissiveIntensity = 0; }, 50);
    return this.hp <= 0;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.alive = false;
  }
}
