import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getCart, getTotals, onCartChange } from './cart.js';
import { drawBarcode } from './three/doypack-texture.js';

gsap.registerPlugin(ScrollTrigger);

const fmt = (n) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function buildBarcodeCanvas(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 40;
  canvas.className = 'ticket-barcode';
  const ctx = canvas.getContext('2d');
  drawBarcode(ctx, 0, 0, 280, 40, seed);
  return canvas;
}

export function initTicket() {
  const linesEl = document.getElementById('ticket-lines');
  const totalsEl = document.getElementById('ticket-totals');
  const subtotalEl = document.getElementById('ticket-subtotal');
  const tvaEl = document.getElementById('ticket-tva');
  const totalEl = document.getElementById('ticket-total');
  const dateEl = document.getElementById('ticket-date');
  const ctaBtn = document.getElementById('ticket-cta');
  const finalBarcodeCanvas = document.getElementById('ticket-barcode-final');

  dateEl.textContent = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  function render() {
    const items = getCart();
    linesEl.innerHTML = '';
    if (!items.length) {
      linesEl.innerHTML = '<p class="ticket-empty">— PANIER VIDE — AJOUTEZ UN PRODUIT DU RAYON —</p>';
      totalsEl.hidden = true;
      return;
    }
    totalsEl.hidden = false;
    items.forEach((item) => {
      const wrap = document.createElement('div');
      wrap.className = 'ticket-item';
      const line = document.createElement('div');
      line.className = 'ticket-line';
      line.innerHTML = `<span class="ticket-line-label">${item.qty} x ${item.name}${item.priceSuffix}</span><span>${fmt(item.price * item.qty)}</span>`;
      wrap.appendChild(line);
      wrap.appendChild(buildBarcodeCanvas(item.id));
      linesEl.appendChild(wrap);
    });

    const { subtotal, tva, total } = getTotals();
    subtotalEl.textContent = fmt(subtotal);
    tvaEl.textContent = fmt(tva);
    totalEl.textContent = fmt(total);
  }

  onCartChange(render);
  render();

  const barcodeCtx = finalBarcodeCanvas.getContext('2d');
  drawBarcode(barcodeCtx, 0, 0, 280, 70, 'proteine-creative-agency');

  ctaBtn.addEventListener('click', () => {
    const items = getCart();
    const body = items.length
      ? items.map((i) => `${i.qty} x ${i.name} — ${fmt(i.price * i.qty)}`).join('%0D%0A')
      : 'Je souhaite passer commande.';
    window.location.href = `mailto:contact@proteinecreative.fr?subject=${encodeURIComponent('Passage en caisse')}&body=${body}`;
  });

  const paper = document.getElementById('ticket-paper');
  gsap.set(paper, { transformOrigin: 'top center', scaleY: 0.02, opacity: 0.4 });
  ScrollTrigger.create({
    trigger: '.ticket-section',
    start: 'top 75%',
    once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      tl.to(paper, { scaleY: 1, opacity: 1, duration: 1.1, ease: 'power2.out' });
      tl.to(paper, { x: '+=2', duration: 0.05, repeat: 9, yoyo: true, ease: 'none' }, 0.2);
      tl.to(paper, { x: 0, duration: 0.05 });
    },
  });
}
