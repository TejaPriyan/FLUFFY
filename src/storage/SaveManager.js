export const DEFAULT_SETTINGS = {
  petName: 'Fluffy',
  furColor: 'white',
  eyeColor: 'amber',
  accessory: 'bow',
  environment: 'DREAM_ROOM',
  furDensity: 1.0,
  furLength: 1.0,
  furStiffness: 1.0,
  windStrength: 0.45,
   windEnabled: true,
  animationIntensity: 1.0,
  graphicsQuality: 'HIGH',
  shadowQuality: 'HIGH',
  soundEnabled: true,
  reducedMotion: false,
  showFps: false,
  stats: {
    happiness: 84,
    energy: 88,
    affection: 76,
    curiosity: 65,
    sleepiness: 12
  }
};

export const FUR_PALETTES = {
  white:  { label: 'White',  root: [0.85, 0.79, 0.74], tip: [1.00, 0.98, 0.95], skin: [0.95, 0.90, 0.86], hex: '#fffaf0' },
  cream:  { label: 'Cream',  root: [0.90, 0.80, 0.68], tip: [1.00, 0.95, 0.86], skin: [0.96, 0.89, 0.79], hex: '#fcebd1' },
  brown:  { label: 'Brown',  root: [0.45, 0.30, 0.20], tip: [0.68, 0.48, 0.34], skin: [0.54, 0.37, 0.26], hex: '#9e6b49' },
  gray:   { label: 'Gray',   root: [0.56, 0.58, 0.64], tip: [0.82, 0.84, 0.90], skin: [0.68, 0.70, 0.76], hex: '#c2c7d6' },
  black:  { label: 'Black',  root: [0.14, 0.14, 0.19], tip: [0.32, 0.34, 0.42], skin: [0.20, 0.20, 0.26], hex: '#3a3c47' },
  pink:   { label: 'Pink',   root: [0.90, 0.60, 0.74], tip: [1.00, 0.84, 0.92], skin: [0.96, 0.74, 0.84], hex: '#ffc9e0' },
  blue:   { label: 'Blue',   root: [0.54, 0.72, 0.92], tip: [0.82, 0.93, 1.00], skin: [0.68, 0.83, 0.97], hex: '#bce3ff' },
  purple: { label: 'Purple', root: [0.64, 0.54, 0.88], tip: [0.90, 0.83, 1.00], skin: [0.78, 0.70, 0.95], hex: '#dbc7fc' }
};

export const EYE_PALETTES = {
  amber:    { label: 'Amber',    color: [0.58, 0.34, 0.12], rim: [0.88, 0.60, 0.22], hex: '#d98a36' },
  sapphire: { label: 'Sapphire', color: [0.16, 0.38, 0.78], rim: [0.38, 0.68, 0.98], hex: '#4a98f7' },
  emerald:  { label: 'Emerald',  color: [0.14, 0.52, 0.38], rim: [0.32, 0.82, 0.60], hex: '#3cc98e' },
  violet:   { label: 'Violet',   color: [0.44, 0.24, 0.68], rim: [0.72, 0.48, 0.96], hex: '#a46ef0' },
  espresso: { label: 'Espresso', color: [0.18, 0.12, 0.10], rim: [0.42, 0.28, 0.22], hex: '#4f3529' },
  ruby:     { label: 'Ruby',     color: [0.68, 0.18, 0.36], rim: [0.96, 0.42, 0.60], hex: '#eb5e8d' }
};

export class SaveManager {
  constructor(storageKey = 'fluffy_companion_save_v1') {
    this.storageKey = storageKey;
    this.state = this.load();
  }

  load() {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      const parsed = JSON.parse(raw);
      return {
        ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
        ...parsed,
        stats: {
          ...DEFAULT_SETTINGS.stats,
          ...(parsed.stats || {})
        }
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  save(partial = {}) {
    this.state = {
      ...this.state,
      ...partial,
      stats: {
        ...this.state.stats,
        ...(partial.stats || {})
      }
    };
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      // Safe fallback when storage is restricted in sandboxed iframe
    }
    return this.state;
  }

  reset() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    try {
      window.localStorage.removeItem(this.storageKey);
    } catch (e) {}
    return this.state;
  }
}
