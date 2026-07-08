// Entrées normalisées : souris (drag), tactile (swipe), clavier.
// Fournit une valeur latérale cible normalisée [-1, 1] (targetX)
// et un delta de drag pour un contrôle relatif fluide.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.targetX = 0;          // position latérale absolue voulue [-1,1]
    this.keyDir = 0;           // -1 / 0 / 1 selon flèches
    this.dragging = false;
    this.started = false;      // au moins une interaction (pour cacher le hint)
    this._lastPointerX = 0;

    this._bind();
  }

  _bind() {
    const c = this.canvas;

    const down = (x) => {
      this.dragging = true;
      this.started = true;
      this._lastPointerX = x;
    };
    const move = (x) => {
      if (!this.dragging) return;
      const dx = (x - this._lastPointerX) / (window.innerWidth * 0.4);
      this.targetX = clamp(this.targetX + dx, -1, 1);
      this._lastPointerX = x;
    };
    const up = () => { this.dragging = false; };

    // Souris
    c.addEventListener('mousedown', (e) => down(e.clientX));
    window.addEventListener('mousemove', (e) => move(e.clientX));
    window.addEventListener('mouseup', up);

    // Tactile
    c.addEventListener('touchstart', (e) => { down(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (e.touches[0]) move(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend', up);

    // Clavier
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { this.keyDir = -1; this.started = true; }
      if (e.key === 'ArrowRight' || e.key === 'd') { this.keyDir = 1; this.started = true; }
    });
    window.addEventListener('keyup', (e) => {
      if ((e.key === 'ArrowLeft' || e.key === 'a') && this.keyDir === -1) this.keyDir = 0;
      if ((e.key === 'ArrowRight' || e.key === 'd') && this.keyDir === 1) this.keyDir = 0;
    });
  }

  // Applique l'input clavier (relatif) sur targetX
  update(dt) {
    if (this.keyDir !== 0) {
      this.targetX = clamp(this.targetX + this.keyDir * dt * 2.2, -1, 1);
    }
    return this.targetX;
  }

  reset() { this.targetX = 0; this.keyDir = 0; this.dragging = false; }
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
