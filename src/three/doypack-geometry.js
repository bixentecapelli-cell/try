import * as THREE from 'three';

/**
 * Builds the closed outline of a unit rounded-rect ring (half-extents = 1),
 * starting and ending at the back-center point, walking counter-clockwise
 * via the left side. Front-center lands exactly at the midpoint of the array,
 * which keeps label UVs centered on the front face regardless of segment count.
 */
function unitRingPoints(cornerFrac, segPerCorner) {
  const c = cornerFrac;
  const half = [];

  half.push([0, -1]);
  half.push([-(1 - c), -1]);

  const arc = (cx, cz, a0, a1, seg) => {
    for (let i = 1; i <= seg; i++) {
      const a = a0 + (a1 - a0) * (i / seg);
      half.push([cx + Math.cos(a) * c, cz + Math.sin(a) * c]);
    }
  };

  arc(-(1 - c), -(1 - c), -Math.PI / 2, -Math.PI, segPerCorner);
  half.push([-1, 1 - c]);
  arc(-(1 - c), 1 - c, Math.PI, Math.PI / 2, segPerCorner);
  half.push([0, 1]);

  const mirrored = half
    .slice(0, -1)
    .reverse()
    .map(([x, z]) => [-x, z]);

  return half.concat(mirrored);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function sampleProfile(keyframes, t) {
  let i = 0;
  while (i < keyframes.length - 2 && keyframes[i + 1].t < t) i++;
  const k0 = keyframes[i];
  const k1 = keyframes[i + 1];
  const span = k1.t - k0.t || 1;
  const local = smoothstep(Math.min(1, Math.max(0, (t - k0.t) / span)));
  return {
    rx: lerp(k0.rx, k1.rx, local),
    rz: lerp(k0.rz, k1.rz, local),
    corner: lerp(k0.corner, k1.corner, local),
  };
}

const DEFAULT_PROFILE = [
  { t: 0.0, rx: 0.6, rz: 0.06, corner: 0.55 },
  { t: 0.05, rx: 0.68, rz: 0.42, corner: 0.35 },
  { t: 0.16, rx: 0.78, rz: 0.46, corner: 0.3 },
  { t: 0.5, rx: 0.86, rz: 0.5, corner: 0.28 },
  { t: 0.78, rx: 0.7, rz: 0.4, corner: 0.3 },
  { t: 0.9, rx: 0.42, rz: 0.22, corner: 0.4 },
  { t: 0.97, rx: 0.3, rz: 0.08, corner: 0.45 },
  { t: 1.0, rx: 0.26, rz: 0.045, corner: 0.5 },
];

/**
 * Procedural "doypack" stand-up pouch geometry: gusseted flat bottom,
 * bulging belly, tapered neck sealed by a flat crimped crest at the top.
 * Returns { body, seal } — two BufferGeometries sharing the same UV space
 * on the body (u = around, v = height, front-center at u = 0.5).
 */
export function createDoypackGeometry({
  width = 1,
  depth = 0.6,
  height = 1.5,
  rows = 34,
  segPerCorner = 7,
  profile = DEFAULT_PROFILE,
} = {}) {
  const ringSegs = unitRingPoints(0.3, segPerCorner).length; // just to size arrays consistently
  const positions = [];
  const uvs = [];
  const ringsXZ = [];
  const ringsY = [];

  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const { rx, rz, corner } = sampleProfile(profile, t);
    const ring = unitRingPoints(corner, segPerCorner);
    const y = (t - 0.5) * height;
    const pts = ring.map(([x, z]) => [x * rx * width, z * rz * depth]);
    ringsXZ.push(pts);
    ringsY.push(y);
  }

  const N = ringsXZ[0].length;

  // cumulative arc-length (from the reference belly ring) for stable u coords
  const belly = ringsXZ[Math.floor(rows / 2)];
  const arcLen = [0];
  for (let i = 1; i < N; i++) {
    const [x0, z0] = belly[i - 1];
    const [x1, z1] = belly[i];
    arcLen.push(arcLen[i - 1] + Math.hypot(x1 - x0, z1 - z0));
  }
  const total = arcLen[N - 1] || 1;
  const us = arcLen.map((l) => l / total);

  const vertexIndex = (r, i) => r * N + i;
  const allPositions = [];
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < N; i++) {
      const [x, z] = ringsXZ[r][i];
      allPositions.push(x, ringsY[r], z);
    }
  }

  const index = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let i = 0; i < N - 1; i++) {
      const a = vertexIndex(r, i);
      const b = vertexIndex(r, i + 1);
      const c = vertexIndex(r + 1, i);
      const d = vertexIndex(r + 1, i + 1);
      index.push(a, c, b, b, c, d);
    }
  }

  const uvArray = [];
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    for (let i = 0; i < N; i++) {
      uvArray.push(1 - us[i], t);
    }
  }

  // flat fan caps top & bottom to close the mesh
  const bottomCenterIdx = allPositions.length / 3;
  {
    const ring0 = ringsXZ[0];
    let cx = 0;
    let cz = 0;
    ring0.forEach(([x, z]) => {
      cx += x;
      cz += z;
    });
    cx /= N;
    cz /= N;
    allPositions.push(cx, ringsY[0], cz);
    uvArray.push(0.5, 0);
    for (let i = 0; i < N - 1; i++) {
      index.push(bottomCenterIdx, vertexIndex(0, i + 1), vertexIndex(0, i));
    }
  }

  const topCenterIdx = allPositions.length / 3;
  {
    const ringN = ringsXZ[rows - 1];
    let cx = 0;
    let cz = 0;
    ringN.forEach(([x, z]) => {
      cx += x;
      cz += z;
    });
    cx /= N;
    cz /= N;
    allPositions.push(cx, ringsY[rows - 1], cz);
    uvArray.push(0.5, 1);
    for (let i = 0; i < N - 1; i++) {
      index.push(topCenterIdx, vertexIndex(rows - 1, i), vertexIndex(rows - 1, i + 1));
    }
  }

  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
  body.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
  body.setIndex(index);
  body.computeVertexNormals();

  // crimped seal crest: a thin flattened ridge sitting right above the top ring
  const sealWidth = width * 0.62;
  const sealHeight = height * 0.05;
  const sealDepth = depth * 0.14;
  const seal = new THREE.BoxGeometry(sealWidth, sealHeight, sealDepth, 6, 1, 1);
  const sealPos = seal.attributes.position;
  for (let i = 0; i < sealPos.count; i++) {
    // crimp wave along X
    const x = sealPos.getX(i);
    const wave = Math.sin((x / sealWidth) * Math.PI * 8) * sealHeight * 0.18;
    sealPos.setY(i, sealPos.getY(i) + wave);
  }
  sealPos.needsUpdate = true;
  seal.computeVertexNormals();
  seal.translate(0, height / 2 + sealHeight * 0.4, 0);

  return { body, seal, height, width, depth };
}
