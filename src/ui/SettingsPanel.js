export class SettingsPanel {
  static syncSliders(settings) {
    const bindVal = (id, val, suffix = '') => {
      const el = document.getElementById(id);
      if (el) el.value = val;
      const lbl = document.getElementById(id + '-val');
      if (lbl) lbl.textContent = Math.round(val * 100) + suffix;
    };

    bindVal('slider-fur-density', settings.furDensity, '%');
    bindVal('slider-fur-length', settings.furLength, '%');
    bindVal('slider-fur-stiffness', settings.furStiffness, '%');
    bindVal('slider-wind-strength', settings.windStrength, '%');
    bindVal('slider-anim-intensity', settings.animationIntensity, '%');
    bindVal('slider-custom-density', settings.furDensity, '%');
    bindVal('slider-custom-length', settings.furLength, '%');
  }
}
