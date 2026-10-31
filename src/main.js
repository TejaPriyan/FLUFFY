import { App } from './core/App.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('webgl-canvas');
  const fallbackBanner = document.getElementById('webgl-fallback-banner');

  try {
    const app = new App(canvas);
    window.__FLUFFY_APP__ = app;
    app.start();
  } catch (err) {
    console.error('FLUFFY initialization error:', err);
    if (fallbackBanner) {
      fallbackBanner.style.display = 'block';
      fallbackBanner.textContent = 'WebGL2 could not be initialized on this browser: ' + err.message;
    }
  }
});
