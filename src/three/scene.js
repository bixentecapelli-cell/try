import * as THREE from 'three';
import gsap from 'gsap';
import { createDoypackGeometry } from './doypack-geometry.js';
import { createDoypackTexture } from './doypack-texture.js';
import { PRODUCTS } from '../data/products.js';

const PACK_HEIGHT = 1.7;

function buildShelf(scene) {
  const shelfGroup = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.4 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.15), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.9 }));
  back.position.set(0, 0.4, -1.4);
  shelfGroup.add(back);

  for (let i = 0; i < 2; i++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(12, 0.08, 1.6), metal);
    board.position.set(0, -1.05 + i * 3.2, -0.7);
    shelfGroup.add(board);
  }

  for (const x of [-5.6, 5.6]) {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5, 0.12), metal);
    upright.position.set(x, 0.4, -0.6);
    shelfGroup.add(upright);
  }

  scene.add(shelfGroup);
  return shelfGroup;
}

function buildLighting(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 4, 4);
  scene.add(key);

  const neonColors = [0x9fffce, 0xffffff, 0x8affc1];
  const spotPositions = [
    [-3.2, 3.2, 2.5],
    [0, 3.6, 2.8],
    [3.2, 3.2, 2.5],
  ];
  spotPositions.forEach((pos, i) => {
    const spot = new THREE.SpotLight(neonColors[i % neonColors.length], 2.2, 12, Math.PI / 6, 0.5, 1.2);
    spot.position.set(...pos);
    spot.target.position.set(0, 0, 0);
    scene.add(spot);
    scene.add(spot.target);
  });

  const rim = new THREE.PointLight(0x3cb043, 0.6, 10);
  rim.position.set(0, -1, 3);
  scene.add(rim);
}

export function createSupermarketScene(canvas, { pixelRatio = Math.min(window.devicePixelRatio, 2), shadows = true } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.set(0, 0.6, 7.2);
  camera.lookAt(0, 0.2, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = shadows;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  buildShelf(scene);
  buildLighting(scene);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const packGroups = [];
  const spacing = 2.4;
  const startX = -((PRODUCTS.length - 1) * spacing) / 2;

  PRODUCTS.forEach((product, i) => {
    const { body, seal } = createDoypackGeometry({
      width: 1,
      depth: 0.62,
      height: PACK_HEIGHT,
    });

    const texCanvas = createDoypackTexture(product);
    const texture = new THREE.CanvasTexture(texCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;

    const bodyMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.42, metalness: 0.08 });
    const sealMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.3, metalness: 0.6 });

    const bodyMesh = new THREE.Mesh(body, bodyMat);
    const sealMesh = new THREE.Mesh(seal, sealMat);
    bodyMesh.castShadow = shadows;
    bodyMesh.receiveShadow = shadows;

    const pivot = new THREE.Group();
    pivot.add(bodyMesh);
    pivot.add(sealMesh);
    pivot.position.set(startX + i * spacing, PACK_HEIGHT / 2 - 1.0, 0);
    pivot.userData.product = product;
    pivot.userData.baseY = pivot.position.y;
    pivot.userData.baseX = pivot.position.x;

    scene.add(pivot);
    packGroups.push(pivot);
  });

  function resize(width, height) {
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  let hovered = null;
  let interactionsEnabled = true;

  function setHover(group) {
    if (hovered === group) return;
    if (hovered) {
      gsap.to(hovered.rotation, { y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      gsap.to(hovered.position, { y: hovered.userData.baseY, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      gsap.to(hovered.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    }
    hovered = group;
    if (hovered) {
      gsap.to(hovered.rotation, { y: THREE.MathUtils.degToRad(15), duration: 0.5, ease: 'power2.out' });
      gsap.to(hovered.position, { y: hovered.userData.baseY + 0.18, duration: 0.5, ease: 'power2.out' });
      gsap.to(hovered.scale, { x: 1.04, y: 1.04, z: 1.04, duration: 0.5, ease: 'power2.out' });
    }
  }

  function pickAt(clientX, clientY, rectEl) {
    const rect = rectEl.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const meshes = packGroups.map((g) => g.children[0]);
    const hits = raycaster.intersectObjects(meshes, false);
    if (!hits.length) return null;
    return hits[0].object.parent;
  }

  function onPointerMove(e) {
    if (!interactionsEnabled) return;
    const group = pickAt(e.clientX, e.clientY, canvas);
    canvas.style.cursor = group ? 'none' : '';
    setHover(group);
  }

  function onPointerLeave() {
    setHover(null);
  }

  let onSelectCallback = null;
  function onClick(e) {
    if (!interactionsEnabled) return;
    const group = pickAt(e.clientX, e.clientY, canvas);
    if (group && onSelectCallback) onSelectCallback(group.userData.product, group);
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('click', onClick);

  let rafId = null;
  const clock = new THREE.Clock();
  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    packGroups.forEach((g, i) => {
      if (g !== hovered) {
        g.position.y = g.userData.baseY + Math.sin(t * 0.9 + i) * 0.015;
      }
    });
    renderer.render(scene, camera);
  }

  function start() {
    if (!rafId) animate();
  }
  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function focusProduct(product) {
    interactionsEnabled = false;
    const group = packGroups.find((g) => g.userData.product.id === product.id);
    if (!group) return;
    gsap.to(camera.position, {
      x: group.position.x * 0.4,
      y: 0.4,
      z: 4.4,
      duration: 0.9,
      ease: 'power3.inOut',
    });
  }

  function resetFocus() {
    interactionsEnabled = true;
    gsap.to(camera.position, { x: 0, y: 0.6, z: 7.2, duration: 0.9, ease: 'power3.inOut' });
  }

  function flyMiniPouchTo(productId, targetScreenEl, onDone) {
    const group = packGroups.find((g) => g.userData.product.id === productId);
    if (!group) return onDone && onDone();
    const clone = group.children[0].clone();
    clone.material = group.children[0].material.clone();
    const flyGroup = new THREE.Group();
    flyGroup.add(clone);
    flyGroup.position.copy(group.position);
    flyGroup.scale.setScalar(1);
    scene.add(flyGroup);

    const targetVec = new THREE.Vector3(camera.position.x + 2.6, camera.position.y + 1.2, camera.position.z - 3);

    gsap.to(flyGroup.position, {
      x: targetVec.x,
      y: targetVec.y,
      z: targetVec.z,
      duration: 0.9,
      ease: 'power1.in',
    });
    gsap.to(flyGroup.scale, {
      x: 0.05,
      y: 0.05,
      z: 0.05,
      duration: 0.9,
      ease: 'power1.in',
      onComplete: () => {
        scene.remove(flyGroup);
        clone.geometry.dispose();
        if (onDone) onDone();
      },
    });
    gsap.to(flyGroup.rotation, { y: Math.PI * 3, duration: 0.9, ease: 'power1.in' });
  }

  return {
    renderer,
    scene,
    camera,
    resize,
    start,
    stop,
    focusProduct,
    resetFocus,
    flyMiniPouchTo,
    setOnSelect: (cb) => {
      onSelectCallback = cb;
    },
  };
}
