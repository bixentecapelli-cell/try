// Entrées normalisées.
// - Déplacement latéral ABSOLU : la position du curseur / du doigt = position de
//   l'escouade (naturel, non inversé).
// - Tir MAINTENU : clic droit (desktop), barre espace, ou bouton TIR (tactile).

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.targetX = 0;    // position latérale absolue voulue [-1,1]
    this.keyDir = 0;     // flèches (relatif)
    this.firing = false; // tir maintenu
    this.started = false;
    this._bind();
  }

  // Le bouton TIR (UI) et la barre espace passent par ici.
  setFiring(v) { this.firing = v; if (v) this.started = true; }

  _setAbsFromClientX(x) {
    const nx = (x / window.innerWidth) * 2 - 1;
    this.targetX = clamp(nx, -1, 1);
    this.started = true;
  }

  _bind() {
    const c = this.canvas;

    // ---- souris (desktop) : position = déplacement, clic DROIT = tir ----
    window.addEventListener('mousemove', (e) => this._setAbsFromClientX(e.clientX));
    window.addEventListener('mousedown', (e) => { if (e.button === 2) this.setFiring(true); });
    window.addEventListener('mouseup', (e) => { if (e.button === 2) this.setFiring(false); });
    window.addEventListener('contextmenu', (e) => e.preventDefault()); // pas de menu au clic droit

    // ---- tactile : glisse pour déplacer (tir via le bouton) ----
    const touchMove = (e) => { if (e.touches[0]) this._setAbsFromClientX(e.touches[0].clientX); };
    c.addEventListener('touchstart', touchMove, { passive: true });
    window.addEventListener('touchmove', touchMove, { passive: true });

    // ---- clavier ----
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { this.keyDir = -1; this.started = true; }
      if (e.key === 'ArrowRight' || e.key === 'd') { this.keyDir = 1; this.started = true; }
      if (e.key === ' ' || e.key === 'Spacebar') { this.setFiring(true); e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => {
      if ((e.key === 'ArrowLeft' || e.key === 'a') && this.keyDir === -1) this.keyDir = 0;
      if ((e.key === 'ArrowRight' || e.key === 'd') && this.keyDir === 1) this.keyDir = 0;
      if (e.key === ' ' || e.key === 'Spacebar') this.setFiring(false);
    });
  }

  update(dt) {
    if (this.keyDir !== 0) this.targetX = clamp(this.targetX + this.keyDir * dt * 1.6, -1, 1);
    return this.targetX;
  }

  reset() { this.targetX = 0; this.keyDir = 0; this.firing = false; }
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
