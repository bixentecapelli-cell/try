import * as THREE from 'three';

// Effets "juicy" : particules, pop de chiffres (sprites texte), screen shake.

export class FX {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.particles = [];
    this.popups = [];
    this.shake = 0;

    // Pool de particules (petits cubes)
    this.pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  }

  burst(pos, color, count = 14, power = 6) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color });
      const m = new THREE.Mesh(this.pGeo, mat);
      m.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * power,
        Math.random() * power * 0.9 + 1,
        (Math.random() - 0.5) * power
      );
      this.particles.push({ mesh: m, vel, life: 0.6 + Math.random() * 0.3, age: 0 });
      this.scene.add(m);
    }
  }

  popNumber(pos, text, color = '#ffffff') {
    const sprite = makeTextSprite(text, color);
    sprite.position.copy(pos);
    sprite.position.y += 2;
    this.popups.push({ sprite, life: 1.0, age: 0, baseY: sprite.position.y });
    this.scene.add(sprite);
  }

  addShake(amount) { this.shake = Math.min(1.2, this.shake + amount); }

  update(dt) {
    // Particules
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      p.vel.y -= 18 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.y += dt * 6;
      const t = 1 - p.age / p.life;
      p.mesh.scale.setScalar(Math.max(0.01, t));
      if (p.age >= p.life) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Pop-ups de chiffres
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pu = this.popups[i];
      pu.age += dt;
      pu.sprite.position.y = pu.baseY + pu.age * 2.5;
      const t = 1 - pu.age / pu.life;
      pu.sprite.material.opacity = Math.max(0, t);
      const s = 1 + (1 - t) * 0.5;
      pu.sprite.scale.set(s * 4, s * 2, 1);
      if (pu.age >= pu.life) {
        this.scene.remove(pu.sprite);
        pu.sprite.material.map.dispose();
        pu.sprite.material.dispose();
        this.popups.splice(i, 1);
      }
    }

    // Screen shake (retour au calme)
    this.shake = Math.max(0, this.shake - dt * 2.5);
  }

  applyShake(basePos) {
    if (this.shake <= 0) return;
    const s = this.shake;
    this.camera.position.x += (Math.random() - 0.5) * s;
    this.camera.position.y += (Math.random() - 0.5) * s * 0.6;
  }

  clear() {
    this.particles.forEach((p) => { this.scene.remove(p.mesh); p.mesh.material.dispose(); });
    this.popups.forEach((pu) => { this.scene.remove(pu.sprite); pu.sprite.material.dispose(); });
    this.particles = [];
    this.popups = [];
    this.shake = 0;
  }
}

function makeTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 80px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(text, 128, 64);
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4, 2, 1);
  return sprite;
}
