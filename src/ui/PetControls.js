import { FUR_PALETTES, EYE_PALETTES } from '../storage/SaveManager.js';

export class PetControls {
  static renderSwatches(containerEl, activeColorKey, onSelect) {
    containerEl.innerHTML = '';
    for (const [key, pal] of Object.entries(FUR_PALETTES)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn' + (key === activeColorKey ? ' active' : '');
      btn.dataset.furColor = key;
      btn.innerHTML = `<span class="swatch-dot" style="background:${pal.hex}"></span><span>${pal.label}</span>`;
      btn.addEventListener('click', () => onSelect(key));
      containerEl.appendChild(btn);
    }
  }

  static renderEyeSwatches(containerEl, activeEyeKey, onSelect) {
    containerEl.innerHTML = '';
    for (const [key, pal] of Object.entries(EYE_PALETTES)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn' + (key === activeEyeKey ? ' active' : '');
      btn.dataset.eyeColor = key;
      btn.innerHTML = `<span class="swatch-dot" style="background:${pal.hex}"></span><span>${pal.label}</span>`;
      btn.addEventListener('click', () => onSelect(key));
      containerEl.appendChild(btn);
    }
  }
}
