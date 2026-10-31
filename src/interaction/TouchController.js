export class TouchController {
  constructor(canvas, app) {
    this.canvas = canvas;
    this.app = app;
    this.holdTimer = null;
    this.bindTouch();
  }

  bindTouch() {
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.holdTimer = setInterval(() => {
          this.app.character.personality.onPet();
        }, 450);
      }
    }, { passive: true });

    const clearHold = () => {
      if (this.holdTimer) {
        clearInterval(this.holdTimer);
        this.holdTimer = null;
      }
    };

    window.addEventListener('touchend', clearHold, { passive: true });
    window.addEventListener('touchcancel', clearHold, { passive: true });
  }
}
