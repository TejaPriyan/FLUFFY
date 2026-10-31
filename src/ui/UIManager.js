import { PetControls } from './PetControls.js';
import { SettingsPanel } from './SettingsPanel.js';

export class UIManager {
  constructor(app) {
    this.app = app;
    this.toastTimeout = null;
    this.initDOM();
    this.syncAll();
  }

  initDOM() {
    // Pet Name Input
    const nameInput = document.getElementById('pet-name-input');
    if (nameInput) {
      nameInput.value = this.app.settings.petName || 'Fluffy';
      nameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim() || 'Fluffy';
        this.app.updateSetting('petName', val);
      });
    }

    // Environment Buttons
    document.querySelectorAll('[data-env-select]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.app.sound.playClick();
        this.app.setEnvironment(btn.dataset.envSelect);
      });
    });

    // Main Dock Action Buttons
    const actions = ['pet', 'brush', 'jump', 'sleep', 'shake', 'wind', 'reset-cam'];
    for (const act of actions) {
      const btn = document.getElementById(`btn-action-${act}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.app.sound.playClick();
          this.app.triggerAction(act);
        });
      }
    }

    // Top bar buttons
    const btnCustomize = document.getElementById('btn-open-customize');
    if (btnCustomize) {
      btnCustomize.addEventListener('click', () => {
        this.app.sound.playClick();
        this.toggleDrawer('drawer-customize');
      });
    }

    const btnSettings = document.getElementById('btn-open-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        this.app.sound.playClick();
        this.toggleDrawer('drawer-settings');
      });
    }

    const btnHelp = document.getElementById('btn-open-help');
    if (btnHelp) {
      btnHelp.addEventListener('click', () => {
        this.app.sound.playClick();
        this.toggleHelpModal();
      });
    }

    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const next = !this.app.settings.soundEnabled;
        this.app.updateSetting('soundEnabled', next);
        this.app.sound.setEnabled(next);
        if (next) this.app.sound.playClick();
        this.syncAll();
      });
    }

    // Close drawer buttons
    document.querySelectorAll('[data-close-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.closeTarget);
        if (target) target.classList.remove('open');
      });
    });

    // Sliders
    const bindSlider = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.app.updateSetting(key, val);
        SettingsPanel.syncSliders(this.app.settings);
      });
    };

    bindSlider('slider-fur-density', 'furDensity');
    bindSlider('slider-fur-length', 'furLength');
    bindSlider('slider-fur-stiffness', 'furStiffness');
    bindSlider('slider-wind-strength', 'windStrength');
    bindSlider('slider-anim-intensity', 'animationIntensity');
    bindSlider('slider-custom-density', 'furDensity');
    bindSlider('slider-custom-length', 'furLength');

    // Accessories
    document.querySelectorAll('[data-accessory-select]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.app.sound.playClick();
        this.app.updateSetting('accessory', btn.dataset.accessorySelect);
        this.syncAll();
      });
    });

    // Graphics Quality Pills
    document.querySelectorAll('[data-quality-select]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.app.sound.playClick();
        this.app.updateSetting('graphicsQuality', btn.dataset.qualitySelect);
        this.syncAll();
      });
    });

    // Shadow Quality Pills
    document.querySelectorAll('[data-shadow-select]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.app.sound.playClick();
        this.app.updateSetting('shadowQuality', btn.dataset.shadowSelect);
        this.syncAll();
      });
    });

    // Switch Toggles in Settings
    const bindToggle = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const next = !this.app.settings[key];
        this.app.updateSetting(key, next);
        if (key === 'soundEnabled') this.app.sound.setEnabled(next);
        this.syncAll();
      });
    };

    bindToggle('switch-sound', 'soundEnabled');
    bindToggle('switch-reduced-motion', 'reducedMotion');
    bindToggle('switch-show-fps', 'showFps');

    // Reset Character & Reset Saved Settings
    const btnResetChar = document.getElementById('btn-reset-character');
    if (btnResetChar) {
      btnResetChar.addEventListener('click', () => {
        this.app.sound.playClick();
        this.app.character.resetPosition();
        this.app.camera.reset();
        this.showToast('Character position & camera reset!');
      });
    }

    const btnResetSave = document.getElementById('btn-reset-settings');
    if (btnResetSave) {
      btnResetSave.addEventListener('click', () => {
        this.app.sound.playClick();
        this.app.resetAllSettings();
        this.syncAll();
        this.showToast('All settings restored to defaults!');
      });
    }
  }

  toggleDrawer(drawerId) {
    const otherId = drawerId === 'drawer-customize' ? 'drawer-settings' : 'drawer-customize';
    const other = document.getElementById(otherId);
    if (other) other.classList.remove('open');

    const target = document.getElementById(drawerId);
    if (target) target.classList.toggle('open');
  }

  toggleHelpModal() {
    const modal = document.getElementById('modal-help');
    if (modal) modal.classList.toggle('open');
  }

  closeAllPanels() {
    ['drawer-customize', 'drawer-settings', 'modal-help'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('open');
    });
  }

  showToast(message) {
    const toast = document.getElementById('interaction-toast');
    if (!toast || !message) return;
    toast.textContent = message;
    toast.classList.add('visible');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2100);
  }

  syncAll() {
    const s = this.app.settings;

    const nameInput = document.getElementById('pet-name-input');
    if (nameInput && document.activeElement !== nameInput) {
      nameInput.value = s.petName || 'Fluffy';
    }

    // Fur & Eye Swatches
    const furGrid = document.getElementById('fur-color-grid');
    if (furGrid) {
      PetControls.renderSwatches(furGrid, s.furColor, (colorKey) => {
        this.app.sound.playClick();
        this.app.updateSetting('furColor', colorKey);
        this.syncAll();
      });
    }

    const eyeGrid = document.getElementById('eye-color-grid');
    if (eyeGrid) {
      PetControls.renderEyeSwatches(eyeGrid, s.eyeColor, (eyeKey) => {
        this.app.sound.playClick();
        this.app.updateSetting('eyeColor', eyeKey);
        this.syncAll();
      });
    }

    // Environment buttons
    document.querySelectorAll('[data-env-select]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.envSelect === s.environment);
    });

    // Accessory buttons
    document.querySelectorAll('[data-accessory-select]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.accessorySelect === s.accessory);
    });

    // Quality & Shadow buttons
    document.querySelectorAll('[data-quality-select]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.qualitySelect === s.graphicsQuality);
    });
    document.querySelectorAll('[data-shadow-select]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.shadowSelect === s.shadowQuality);
    });

    // Dock active states
    const btnBrush = document.getElementById('btn-action-brush');
    if (btnBrush) btnBrush.classList.toggle('active', this.app.isBrushMode);

    const btnWind = document.getElementById('btn-action-wind');
    if (btnWind) btnWind.classList.toggle('active', !!s.windEnabled);

    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.textContent = s.soundEnabled ? 'Sound: ON' : 'Sound: OFF';
      btnSound.classList.toggle('active', !!s.soundEnabled);
    }

    // Switches
    const syncSwitch = (id, flag) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('on', !!flag);
    };
    syncSwitch('switch-sound', s.soundEnabled);
    syncSwitch('switch-reduced-motion', s.reducedMotion);
    syncSwitch('switch-show-fps', s.showFps);

    const fpsBadge = document.getElementById('perf-badge');
    if (fpsBadge) {
      fpsBadge.style.display = s.showFps ? 'inline-flex' : 'none';
    }

    SettingsPanel.syncSliders(s);
  }

  updateHUD(personality, stateMachine, fps, strandCount) {
    const setBar = (id, val) => {
      const fill = document.getElementById(`bar-${id}`);
      const num = document.getElementById(`val-${id}`);
      const rounded = Math.round(val);
      if (fill) fill.style.width = `${rounded}%`;
      if (num) num.textContent = `${rounded}%`;
    };

    setBar('happiness', personality.happiness);
    setBar('energy', personality.energy);
    setBar('affection', personality.affection);

    const stateText = document.getElementById('pet-state-text');
    if (stateText) {
      stateText.textContent = stateMachine.currentState;
    }

    const sleepBtn = document.getElementById('btn-action-sleep');
    if (sleepBtn) {
      const isSleeping = stateMachine.currentState === 'SLEEPING';
      sleepBtn.classList.toggle('active', isSleeping);
      sleepBtn.textContent = isSleeping ? 'Wake Up' : 'Sleep';
    }

    const fpsBadge = document.getElementById('perf-badge');
    if (fpsBadge && this.app.settings.showFps) {
      fpsBadge.textContent = `${fps} FPS · ${strandCount.toLocaleString()} strands`;
    }
  }
}
