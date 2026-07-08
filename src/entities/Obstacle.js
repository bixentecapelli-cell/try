import * as THREE from 'three';

// Barrière avec HP : l'escouade tire dessus. Si elle atteint le mur avant
// destruction, elle coûte des soldiers.

export class Obstacle {
  constructor(scene, hp, x, z) {
    this.scene = scene;
    this.hp = hp;
    this.maxHp = hp;
    this.x = x;
    this.z = z;
    this.alive = true;

    const w = 4.5, h = 3;
    const geo = new THREE.BoxGeometry(w, h, 0.8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, h / 2, z);
    scene.add(this.mesh);

    // barre de HP au-dessus
    this.barSprite = makeBar(hp, hp);
    this.barSprite.position.set(x, h + 0.8, z);
    scene.add(this.barSprite);
    this._w = w; this._h = h;
  }

  hit(dmg) {
    this.hp -= dmg;
    const t = Math.max(0, this.hp / this.maxHp);
    this.mesh.scale.x = 0.3 + 0.7 * t;
    updateBar(this.barSprite, this.hp, this.maxHp);
    return this.hp <= 0;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.barSprite);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    if (this.barSprite.material.map) this.barSprite.material.map.dispose();
    this.barSprite.material.dispose();
    this.alive = false;
  }
}

function makeBar(hp, max) {
  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 40;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false,
  }));
  s.scale.set(4, 0.8, 1);
  s.userData.canvas = canvas;
  updateBar(s, hp, max);
  return s;
}

function updateBar(sprite, hp, max) {
  const canvas = sprite.userData.canvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 200, 40);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 200, 40);
  const t = Math.max(0, hp / max);
  ctx.fillStyle = '#ff5252';
  ctx.fillRect(4, 4, (200 - 8) * t, 32);
  sprite.material.map.needsUpdate = true;
}
