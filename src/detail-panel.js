import { PRODUCTS } from './data/products.js';

const overlay = document.getElementById('detail-overlay');
const panel = document.getElementById('detail-panel');
const content = document.getElementById('detail-content');
const closeBtn = document.getElementById('detail-close');

let onAddToCart = null;
let currentProduct = null;

export function setOnAddToCart(cb) {
  onAddToCart = cb;
}

function render(product) {
  const priceLabel = `${product.price.toLocaleString('fr-FR')} €${product.priceSuffix}`;
  content.innerHTML = `
    <p class="hero-kicker" style="color:${product.colorDark}">${product.flavor}</p>
    <h2>${product.name} ${product.nameLine2}</h2>
    <p class="detail-tagline">${product.tagline}</p>
    <p class="detail-price">${priceLabel}</p>
    <p>${product.description}</p>
    <div class="nutrition-table">
      <div class="nt-title">VALEURS CRÉATIVES POUR 100g DE PROJET</div>
      ${product.nutrition
        .map((row) => `<div class="nutrition-row"><span>${row.label}</span><span>${row.value}</span></div>`)
        .join('')}
    </div>
    <ul class="detail-includes">
      ${product.includes.map((line) => `<li>${line}</li>`).join('')}
    </ul>
    <button class="add-to-cart-btn" id="add-to-cart-btn" type="button">AJOUTER AU PANIER — ${priceLabel}</button>
  `;
  document.getElementById('add-to-cart-btn').addEventListener('click', (e) => {
    if (onAddToCart) onAddToCart(product, e.currentTarget);
  });
}

export function openDetail(product) {
  currentProduct = product;
  render(product);
  overlay.classList.add('open');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
}

export function closeDetail() {
  overlay.classList.remove('open');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

closeBtn.addEventListener('click', closeDetail);
overlay.addEventListener('click', closeDetail);

export function getCurrentProduct() {
  return currentProduct;
}

export function openDetailById(id) {
  const product = PRODUCTS.find((p) => p.id === id);
  if (product) openDetail(product);
}
