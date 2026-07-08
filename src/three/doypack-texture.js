const CANVAS_W = 1024;
const CANVAS_H = 1680;

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFrenchFlag(ctx, x, y, w, h) {
  const stripe = w / 3;
  ctx.fillStyle = '#0055A4';
  ctx.fillRect(x, y, stripe, h);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + stripe, y, stripe, h);
  ctx.fillStyle = '#EF4135';
  ctx.fillRect(x + stripe * 2, y, stripe, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function drawRecycleGlyph(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#0d3d16';
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.5, -r * 0.15);
    ctx.lineTo(r * 0.18, -r * 0.15);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function fitFont(ctx, text, family, weight, startPx, maxWidth, minPx = 40) {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minPx) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/**
 * Draws the front label + green bleed for a doypack, returns a canvas.
 * Layout is built with a sequential vertical cursor so blocks never
 * overlap regardless of product name/tagline length. The design is
 * centered on u≈0.5 (front-center of the wrapped geometry); outside
 * that the canvas stays flat brand-green bleed for the sides/back.
 */
export function createDoypackTexture(product) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';

  // background bleed
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, product.colorDark);
  grad.addColorStop(0.12, product.color);
  grad.addColorStop(0.5, product.color);
  grad.addColorStop(0.88, product.color);
  grad.addColorStop(1, product.colorDark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // subtle vertical foil sheen stripes
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#ffffff';
  for (let x = 0; x < CANVAS_W; x += 46) {
    ctx.fillRect(x, 0, 14, CANVAS_H);
  }
  ctx.globalAlpha = 1;

  const marginX = 155;
  const contentW = CANVAS_W - marginX * 2;
  let cursorY = 70;

  // top kicker bar
  const kickerH = 68;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(marginX, cursorY, contentW, kickerH);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 32px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(product.flavor, CANVAS_W / 2, cursorY + kickerH / 2 + 2);
  ctx.textBaseline = 'alphabetic';
  cursorY += kickerH + 56;

  // main title — two lines, auto-fit width, generous line gap (no overlap)
  ctx.textAlign = 'center';
  const titleMaxW = contentW - 60;
  const size1 = fitFont(ctx, product.name, '"Anton", "Archivo Black", sans-serif', 900, 148, titleMaxW, 70);
  ctx.fillStyle = '#ffffff';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 5;
  cursorY += size1 * 0.82;
  ctx.fillText(product.name, CANVAS_W / 2, cursorY);
  ctx.restore();
  cursorY += size1 * 0.32;

  const size2 = fitFont(ctx, product.nameLine2, '"Anton", "Archivo Black", sans-serif', 900, 148, titleMaxW, 70);
  ctx.fillStyle = '#0d0d0d';
  ctx.font = `900 ${size2}px "Anton", "Archivo Black", sans-serif`;
  cursorY += size2 * 0.82;
  ctx.fillText(product.nameLine2, CANVAS_W / 2, cursorY);
  cursorY += size2 * 0.45;

  // tagline (kept narrow so it never runs under the badge)
  ctx.font = '700 32px "Space Mono", monospace';
  ctx.fillStyle = '#0d0d0d';
  cursorY += 44;
  wrapText(ctx, product.tagline, CANVAS_W / 2, cursorY, contentW - 340, 40);
  cursorY += 30;

  // black circular badge, floated to the right of the flow
  const badgeR = 128;
  const badgeCX = CANVAS_W - marginX - badgeR + 20;
  const badgeCY = cursorY - 30;
  ctx.save();
  ctx.translate(badgeCX, badgeCY);
  ctx.rotate(-0.2);
  ctx.beginPath();
  ctx.arc(0, 0, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = '#0d0d0d';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '900 50px "Anton", sans-serif';
  ctx.fillText(product.badge.split(' ')[0], 0, -18);
  ctx.font = '700 22px "Space Mono", monospace';
  const rest = product.badge.split(' ').slice(1).join(' ');
  wrapText(ctx, rest, 0, 24, badgeR * 1.5, 26);
  ctx.restore();

  // NEW pastille, floated to the left
  if (product.isNew) {
    ctx.save();
    ctx.translate(marginX + 90, cursorY - 30);
    ctx.rotate(0.18);
    ctx.beginPath();
    ctx.arc(0, 0, 84, 0, Math.PI * 2);
    ctx.fillStyle = '#F4C430';
    ctx.fill();
    ctx.strokeStyle = '#0d0d0d';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#0d0d0d';
    ctx.font = '900 36px "Anton", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOUVEAU', 0, 12);
    ctx.restore();
  }

  cursorY += badgeR + 70;

  // nutrition table style banner "PROTEINES NATIVES"
  const bannerH = 84;
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(marginX, cursorY, contentW, bannerH);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px "Anton", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PROTÉINES NATIVES', CANVAS_W / 2, cursorY + bannerH / 2 + 2);
  ctx.textBaseline = 'alphabetic';
  cursorY += bannerH + 24;

  // mini nutrition table
  const tableH = 230;
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.fillRect(marginX, cursorY, contentW, tableH);
  ctx.strokeStyle = '#0d0d0d';
  ctx.lineWidth = 3;
  ctx.strokeRect(marginX, cursorY, contentW, tableH);
  const tableTop = cursorY;
  const rowH = tableH / (product.nutrition.length + 1);
  ctx.font = '900 26px "Space Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0d0d0d';
  ctx.fillText('VALEURS CRÉATIVES / 100g', marginX + 24, tableTop + rowH * 0.66);
  ctx.font = '700 25px "Space Mono", monospace';
  product.nutrition.forEach((row, i) => {
    const y = tableTop + rowH * (i + 1.7);
    ctx.beginPath();
    ctx.moveTo(marginX + 12, y - rowH * 0.6);
    ctx.lineTo(CANVAS_W - marginX - 12, y - rowH * 0.6);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0d0d0d';
    ctx.fillText(row.label, marginX + 24, y);
    ctx.textAlign = 'right';
    ctx.fillText(row.value, CANVAS_W - marginX - 24, y);
  });
  cursorY += tableH + 50;

  // barcode-ish price tag (yellow PROMO sticker)
  const tagW = 300;
  const tagH = 168;
  const tagX = marginX;
  const tagY = cursorY;
  ctx.save();
  ctx.translate(tagX + tagW / 2, tagY + tagH / 2);
  ctx.rotate(-0.06);
  roundRectPath(ctx, -tagW / 2, -tagH / 2, tagW, tagH, 16);
  ctx.fillStyle = '#F4C430';
  ctx.fill();
  ctx.strokeStyle = '#0d0d0d';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#0d0d0d';
  ctx.textAlign = 'center';
  ctx.font = '900 28px "Anton", sans-serif';
  ctx.fillText('PROMO', 0, -44);
  const priceLabel = `${product.price.toLocaleString('fr-FR')}€${product.priceSuffix}`;
  const priceSize = fitFont(ctx, priceLabel, '"Anton", sans-serif', 900, 54, tagW - 40, 30);
  ctx.fillText(priceLabel, 0, 14);
  ctx.font = '700 18px "Space Mono", monospace';
  ctx.fillText('PRIX NET AGENCE', 0, 52);
  ctx.restore();

  // flag + servings + recyclable
  drawFrenchFlag(ctx, tagX + tagW + 40, tagY + 12, 90, 60);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0d0d0d';
  ctx.font = '700 22px "Space Mono", monospace';
  ctx.fillText('FABRIQUÉ EN', tagX + tagW + 40, tagY + 96);
  ctx.fillText('FRANCE', tagX + tagW + 40, tagY + 122);

  drawRecycleGlyph(ctx, CANVAS_W - marginX - 60, tagY + 60, 32);
  ctx.font = '700 17px "Space Mono", monospace';
  ctx.textAlign = 'center';
  wrapText(ctx, '100% RECYCLABLE EN IDÉES NEUVES', CANVAS_W - marginX - 60, tagY + 116, 200, 21);

  cursorY += tagH + 70;

  // servings footer
  ctx.textAlign = 'center';
  ctx.font = '900 30px "Anton", sans-serif';
  ctx.fillStyle = '#0d0d0d';
  ctx.fillText(product.servings, CANVAS_W / 2, cursorY);

  // seeded barcode strip near the very bottom (neck area, mostly hidden by the seal)
  drawBarcode(ctx, marginX, CANVAS_H - 130, contentW, 80, product.id);

  return canvas;
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
}

export function drawBarcode(ctx, x, y, w, h, seedStr) {
  const rand = seededRandom(hashSeed(seedStr));
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  let cx = x;
  ctx.fillStyle = '#0d0d0d';
  while (cx < x + w) {
    const bw = 2 + Math.floor(rand() * 5);
    if (rand() > 0.4) {
      ctx.fillRect(cx, y, bw, h);
    }
    cx += bw + 1;
  }
  ctx.restore();
}
