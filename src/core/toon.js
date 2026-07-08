import * as THREE from 'three';

// Dégradé partagé pour le rendu "toon" (cel-shading) : quelques bandes de lumière
// -> look cartoon low-poly plus soigné.

let _grad = null;
export function toonGradient() {
  if (_grad) return _grad;
  const c = document.createElement('canvas');
  c.width = 5; c.height = 1;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(5, 1);
  const steps = [90, 140, 190, 230, 255]; // paliers d'éclairage
  for (let i = 0; i < 5; i++) img.data.set([steps[i], steps[i], steps[i], 255], i * 4);
  ctx.putImageData(img, 0, 0);
  _grad = new THREE.CanvasTexture(c);
  _grad.magFilter = THREE.NearestFilter;
  _grad.minFilter = THREE.NearestFilter;
  return _grad;
}

// Petit raccourci pour un matériau toon.
export function toonMat(opts) {
  return new THREE.MeshToonMaterial({ gradientMap: toonGradient(), ...opts });
}
