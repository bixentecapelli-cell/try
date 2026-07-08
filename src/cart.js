const listeners = new Set();
const items = [];

export function addToCart(product) {
  const existing = items.find((i) => i.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    items.push({ id: product.id, name: `${product.name} ${product.nameLine2}`, price: product.price, priceSuffix: product.priceSuffix, qty: 1 });
  }
  emit();
}

export function getCart() {
  return items;
}

export function getCount() {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function getTotals() {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tva = subtotal * 0.2;
  return { subtotal, tva, total: subtotal + tva };
}

export function onCartChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((cb) => cb(items));
}
