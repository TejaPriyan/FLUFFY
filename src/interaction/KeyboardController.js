export class KeyboardController {
  constructor(app) {
    this.app = app;
    this.bindKeys();
  }

  bindKeys() {
    window.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
        return;
      }

      const key = e.key.toUpperCase();
      if (e.code === 'Space') {
        e.preventDefault();
        this.app.triggerAction('jump');
      } else if (key === 'P') {
        this.app.triggerAction('pet');
      } else if (key === 'B') {
        this.app.triggerAction('brush');
      } else if (key === 'W') {
        this.app.triggerAction('wind');
      } else if (key === 'S') {
        this.app.triggerAction('sleep');
      } else if (key === 'R') {
        this.app.triggerAction('shake');
      } else if (key === 'H') {
        this.app.ui.toggleHelpModal();
      } else if (e.key === 'Escape') {
        this.app.ui.closeAllPanels();
        if (this.app.isBrushMode) {
          this.app.setBrushMode(false);
        }
      }
    });
  }
}
