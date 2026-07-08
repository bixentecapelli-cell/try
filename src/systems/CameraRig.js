import * as THREE from 'three';

// Caméra en plongée derrière l'escouade, suivi fluide (lerp).

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(0, 11, -13); // derrière (-z) et au-dessus
    this.lookAhead = 8;
    this._target = new THREE.Vector3();
    this._look = new THREE.Vector3();
  }

  update(squadPos, dt) {
    this._target.set(
      squadPos.x * 0.4 + this.offset.x,
      this.offset.y,
      squadPos.z + this.offset.z
    );
    const k = 1 - Math.pow(0.001, dt); // lerp indépendant du framerate
    this.camera.position.lerp(this._target, k);

    this._look.set(squadPos.x * 0.4, 1.5, squadPos.z + this.lookAhead);
    this.camera.lookAt(this._look);
  }

  snap(squadPos) {
    this.camera.position.set(
      squadPos.x * 0.4 + this.offset.x, this.offset.y, squadPos.z + this.offset.z);
    this.camera.lookAt(squadPos.x * 0.4, 1.5, squadPos.z + this.lookAhead);
  }
}
