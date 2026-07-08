import * as THREE from 'three';

// Porte simple (une moitié d'une paire). op ∈ add|mul|sub|div|weapon.
// Le label est affiché via une texture canvas sur un plan.

const OP_LABEL = {
  add: (v) => `+${v}`,
  mul: (v) => `x${v}`,
  sub: (v) => `-${v}`,
  div: (v) => `÷${v}`,
  weapon: () => `ARME ▲`,
};

function isGood(op) { return op === 'add' || op === 'mul' || op === 'weapon'; }

export class Gate {
  constructor(scene, effect, x, z, side) {
    this.scene = scene;
    this.effect = effect; // {op, val}
    this.x = x;
    this.z = z;
    this.side = side;
    this.used = false;
    this.good = isGood(effect.op);
    const color = effect.op === 'weapon' ? 0x2ecc71 : (this.good ? 0x27ae60 : 0xc0392b);

    this.group = new THREE.Group();
    // panneau translucide
    const panelGeo = new THREE.PlaneGeometry(5, 4);
    const panelMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
    });
    this.panel = new THREE.Mesh(panelGeo, panelMat);
    this.panel.position.set(0, 2, 0);
    this.group.add(this.panel);

    // montants
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.2, 8);
    const postMat = new THREE.MeshLambertMaterial({ color });
    const p1 = new THREE.Mesh(postGeo, postMat); p1.position.set(-2.5, 2.1, 0);
    const p2 = new THREE.Mesh(postGeo, postMat); p2.position.set(2.5, 2.1, 0);
    this.group.add(p1); this.group.add(p2);

    // label texte
    const label = OP_LABEL[effect.op] ? OP_LABEL[effect.op](effect.val) : '?';
    this.labelSprite = makeLabel(label);
    this.labelSprite.position.set(0, 2.4, 0.05);
    this.group.add(this.labelSprite);

    this.group.position.set(x, 0, z);
    scene.add(this.group);
  }

  apply(count) {
    switch (this.effect.op) {
      case 'add': return count + this.effect.val;
      case 'sub': return Math.max(0, count - this.effect.val);
      case 'mul': return count * this.effect.val;
      case 'div': return Math.floor(count / this.effect.val);
      default: return count; // weapon : géré à part
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
  }
}

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 90px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.strokeText(text, 128, 80);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 128, 80);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(4, 2.5, 1);
  return s;
}
