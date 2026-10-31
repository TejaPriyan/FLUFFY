export const QUALITY_PRESETS = {
  LOW:    { label: 'Low',    strandRatio: 0.35, shadowSoftness: 0.5, dprCap: 1.25 },
  MEDIUM: { label: 'Medium', strandRatio: 0.62, shadowSoftness: 0.8, dprCap: 1.50 },
  HIGH:   { label: 'High',   strandRatio: 0.85, shadowSoftness: 1.0, dprCap: 1.75 },
  ULTRA:  { label: 'Ultra',  strandRatio: 1.00, shadowSoftness: 1.2, dprCap: 2.00 }
};

export class PerformanceManager {
  constructor(initialQuality = 'HIGH') {
    this.quality = initialQuality in QUALITY_PRESETS ? initialQuality : 'HIGH';
    this.fps = 60;
    this.frameCount = 0;
    this.accumTime = 0;
    this.adaptiveScale = 1.0;
    this.isTabHidden = false;
  }

  setQuality(level) {
    if (QUALITY_PRESETS[level]) {
      this.quality = level;
      this.adaptiveScale = 1.0;
    }
  }

  getPreset() {
    return QUALITY_PRESETS[this.quality] || QUALITY_PRESETS.HIGH;
  }

  getActiveRatio(userDensityMultiplier = 1.0) {
    const base = this.getPreset().strandRatio;
    return Math.min(1.0, Math.max(0.15, base * (userDensityMultiplier / 1.4) * this.adaptiveScale));
  }

  update(dt, onFpsUpdate) {
    this.frameCount++;
    this.accumTime += dt;
    if (this.accumTime >= 0.5) {
      this.fps = Math.round(this.frameCount / this.accumTime);
      this.frameCount = 0;
      this.accumTime = 0;

      // Adaptive performance scaling if frame rate dips below 32 FPS
      if (this.fps < 30 && this.adaptiveScale > 0.55) {
        this.adaptiveScale = Math.max(0.55, this.adaptiveScale - 0.08);
      } else if (this.fps > 55 && this.adaptiveScale < 1.0) {
        this.adaptiveScale = Math.min(1.0, this.adaptiveScale + 0.04);
      }

      if (onFpsUpdate) onFpsUpdate(this.fps);
    }
  }
}
