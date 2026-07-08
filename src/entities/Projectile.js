import * as THREE from 'three';

// Traceur : une "ligne" lumineuse qui sort du personnage vers l'avant.
// Poolé par le CombatSystem.

export class Projectile {
  constructor(scene) {
    this.scene = scene;
    // géométrie allongée en Z -> ressemble à un trait/tir
    const geo = new THREE.BoxGeometry(1, 1, 1);
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
    // trait fin et TRÈS allongé -> ressemble à une ligne continue
    this.mesh.scale.set(size * 1.3, size * 1.3, size * 16);
    this.mesh.rotation.y = Math.atan2(vel.x, vel.z);
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
