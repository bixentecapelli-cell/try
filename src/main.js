import gsap from 'gsap';
import './styles/main.css';
import { PRODUCTS } from './data/products.js';
import { ensureFontsReady } from './three/fonts.js';
import { createSupermarketScene } from './three/scene.js';
import { createDoypackTexture } from './three/doypack-texture.js';
import { openDetail, closeDetail, setOnAddToCart } from './detail-panel.js';
import { addToCart, getCount, onCartChange } from './cart.js';
import { initTicket } from './ticket.js';

const cursorEl = document.getElementById('cursor-cart');
const cartCountEl = document.getElementById('cart-count');
const cartChip = document.getElementById('cart-chip');

function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;
  window.addEventListener('pointermove', (e) => {
    gsap.to(cursorEl, { x: e.clientX, y: e.clientY, duration: 0.15, overwrite: true });
  });
}

function initCartUI() {
  onCartChange(() => {
    cartCountEl.textContent = String(getCount());
    gsap.fromTo(cartChip, { scale: 1 }, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1 });
  });
  cartChip.addEventListener('click', () => {
    document.getElementById('ticket').scrollIntoView({ behavior: 'smooth' });
  });
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

function renderFallback() {
  const wrap = document.getElementById('shelf-canvas-wrap');
  const fallback = document.getElementById('shelf-fallback');
  document.getElementById('shelf-canvas').hidden = true;
  fallback.hidden = false;
  PRODUCTS.forEach((product) => {
    const img = document.createElement('img');
    img.src = createDoypackTexture(product).toDataURL('image/png');
    img.alt = `${product.name} ${product.nameLine2}`;
    img.addEventListener('click', () => openDetail(product));
    fallback.appendChild(img);
  });
  wrap.style.height = 'auto';
}

async function initHero() {
  if (!supportsWebGL()) {
    renderFallback();
    return;
  }

  await ensureFontsReady();

  const canvas = document.getElementById('shelf-canvas');
  const wrap = document.getElementById('shelf-canvas-wrap');
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  const scene = createSupermarketScene(canvas, {
    pixelRatio: Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2),
    shadows: !isMobile,
  });

  function handleResize() {
    scene.resize(wrap.clientWidth, wrap.clientHeight);
  }
  handleResize();
  window.addEventListener('resize', handleResize);

  scene.setOnSelect((product) => {
    scene.focusProduct(product);
    openDetail(product);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          handleResize();
          scene.start();
        } else {
          scene.stop();
        }
      });
    },
    { threshold: 0.05 }
  );
  io.observe(wrap);

  document.getElementById('detail-close').addEventListener('click', scene.resetFocus);
  document.getElementById('detail-overlay').addEventListener('click', scene.resetFocus);

  setOnAddToCart((product, buttonEl) => {
    addToCart(product);
    scene.flyMiniPouchTo(product.id, cartChip);
    gsap.fromTo(buttonEl, { scale: 1 }, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });
  });
}

initCursor();
initCartUI();
initTicket();
initHero();
