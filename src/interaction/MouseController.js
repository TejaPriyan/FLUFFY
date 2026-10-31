import { STATES } from '../character/CharacterStateMachine.js';

export class MouseController {
  constructor(canvas, app) {
    this.canvas = canvas;
    this.app = app;
    this.isDragging = false;
    this.dragMode = null; // 'orbit' | 'interact'
    this.lastX = 0;
    this.lastY = 0;
    this.downX = 0;
    this.downY = 0;
    this.bindEvents();
  }

  getNDC(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const y = -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    return [x, y];
  }

  bindEvents() {
    this.canvas.addEventListener('pointerdown', (e) => {
      this.app.sound.ensureContext();
      const ndc = this.getNDC(e.clientX, e.clientY);
      this.app.character.pointerNDC = ndc;

      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.downX = e.clientX;
      this.downY = e.clientY;

      const hit = this.app.furInteraction.raycastCharacter(ndc[0], ndc[1], this.app.camera, this.app.character);

      if (e.button === 2 || !hit || hit.region === 'ground') {
        this.dragMode = 'orbit';
      } else {
        this.dragMode = 'interact';
        this.app.furInteraction.handlePointerStroke(
          hit,
          this.app.character.getPartMatrices(),
          this.app.isBrushMode
        );
        if (this.app.isBrushMode) {
          this.app.character.triggerBrush((type, n) => this.app.spawnParticles(type, n));
        }
      }
    });

    window.addEventListener('pointermove', (e) => {
      const ndc = this.getNDC(e.clientX, e.clientY);
      this.app.character.pointerNDC = ndc;

      const hit = this.app.furInteraction.raycastCharacter(ndc[0], ndc[1], this.app.camera, this.app.character);

      if (!this.isDragging) {
        if (hit && (hit.region === 'head' || hit.region === 'body')) {
          const st = this.app.character.stateMachine.currentState;
          if (st === STATES.IDLE || st === STATES.BREATHING || st === STATES.LOOKING_AROUND) {
            this.app.character.stateMachine.setState(STATES.CURIOUS, 0.8, 1);
          }
        }
        return;
      }

      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      if (this.dragMode === 'orbit') {
        this.app.camera.orbit(-dx * 0.0065, dy * 0.0055);
      } else if (this.dragMode === 'interact' && hit) {
        this.app.furInteraction.handlePointerStroke(
          hit,
          this.app.character.getPartMatrices(),
          true
        );
        this.app.character.triggerBrush((type, n) => this.app.spawnParticles(type, n));
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.isDragging) return;
      const moveDist = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);
      this.isDragging = false;
      this.app.furInteraction.lastHitPoint = null;

      if (moveDist < 7) {
        const ndc = this.getNDC(e.clientX, e.clientY);
        const hit = this.app.furInteraction.raycastCharacter(ndc[0], ndc[1], this.app.camera, this.app.character);
        if (hit) {
          if (this.app.isBrushMode && (hit.region === 'head' || hit.region === 'body')) {
            this.app.character.triggerBrush((type, n) => this.app.spawnParticles(type, n));
            this.app.ui.showToast('Brushed soft fur strands!');
          } else if (hit.region === 'head') {
            const msg = this.app.character.triggerPet((type, n) => this.app.spawnParticles(type, n));
            this.app.ui.showToast(msg);
          } else if (hit.region === 'body') {
            const msg = this.app.character.triggerBodyPoke((type, n) => this.app.spawnParticles(type, n));
            this.app.ui.showToast(msg);
          } else if (hit.region === 'feet' || hit.region === 'ground') {
            this.app.character.walkToPoint(hit.point[0], hit.point[2]);
            this.app.ui.showToast('Waddling over to spot!');
          }
        }
      }
    });

    this.canvas.addEventListener('dblclick', (e) => {
      const ndc = this.getNDC(e.clientX, e.clientY);
      const hit = this.app.furInteraction.raycastCharacter(ndc[0], ndc[1], this.app.camera, this.app.character);
      if (hit && (hit.region === 'head' || hit.region === 'body')) {
        const msg = this.app.character.triggerDoubleClick((type, n) => this.app.spawnParticles(type, n));
        this.app.ui.showToast(msg);
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.app.camera.zoom(e.deltaY * 0.0025);
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
