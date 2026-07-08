import * as THREE from 'three';

// Le héros qui te représente : personnage distinct à l'avant de l'escouade,
// avec des points de vie. S'il tombe à 0, c'est game over.

export class Hero {
  constructor(scene) {
    this.scene = scene;
    this.maxHp = 100;
    this.hp = 100;
    this.pos = new THREE.Vector3(0, 0, 0);
    this._hurtT = 0;

    this.group = new THREE.Group();

    // corps (capsule bleu roi)
    this.bodyMat = new THREE.MeshLambertMaterial({ color: 0x2f80ed });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.7, 4, 8), this.bodyMat);
    body.position.y = 0.75;
    this.group.add(body);

    // tête
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 12),
      new THREE.MeshLambertMaterial({ color: 0xffdbac }));
    head.position.y = 1.5;
    this.group.add(head);

    // casque doré
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0xffd24a }));
    helmet.position.y = 1.6;
    this.group.add(helmet);

    // écharpe / cape rouge pour le style
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.12),
      new THREE.MeshLambertMaterial({ color: 0xe74c3c }));
    cape.position.set(0, 0.9, -0.4);
    this.group.add(cape);

    scene.add(this.group);
    this._t = 0;
  }

  reset() {
    this.hp = this.maxHp;
    this.pos.set(0, 0, 0);
    this._hurtT = 0;
    this.bodyMat.emissive = new THREE.Color(0x000000);
  }

  setMaxHp(v) { this.maxHp = v; this.hp = v; }

  damage(n) {
    this.hp = Math.max(0, this.hp - n);
    this._hurtT = 0.18;
    this.bodyMat.emissive = new THREE.Color(0xff3333);
    this.bodyMat.emissiveIntensity = 0.8;
    return this.hp <= 0;
  }

  update(dt, x, z) {
    this._t += dt;
    this.pos.set(x, 0, z);
    const bob = Math.abs(Math.sin(this._t * 12)) * 0.12;
    this.group.position.set(x, bob, z);
    if (this._hurtT > 0) {
      this._hurtT -= dt;
      if (this._hurtT <= 0) this.bodyMat.emissiveIntensity = 0;
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }
}
