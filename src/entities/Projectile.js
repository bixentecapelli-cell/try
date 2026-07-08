import * as THREE from 'three';

// Balle simple. Instanciée/poolée par le CombatSystem.

export class Projectile {
  constructor(scene) {
    this.scene = scene;
    const geo = new THREE.SphereGeometry(1, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.active = false;
    this.vel = new THREE.Vector3();
    this.life = 0;
    this.damage = 0;
    this.aoe = 0;
  }

  spawn(pos, vel, size, color, damage, aoe, life) {
    this.mesh.position.copy(pos);
    this.mesh.scale.setScalar(size);
    this.mesh.material.color.setHex(color);
    this.mesh.visible = true;
    this.vel.copy(vel);
    this.damage = damage;
    this.aoe = aoe;
    this.life = life;
    this.active = true;
  }

  deactivate() {
    this.active = false;
    this.mesh.visible = false;
  }
}
