export class SoundManager {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.ctx = null;
    this.lastBrushTime = 0;
    this.lastStepTime = 0;
  }

   ensureContext() {
    if (!this.enabled) return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch (e) {
          return false;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return !!this.ctx;
  }

  setEnabled(flag) {
    this.enabled = !!flag;
    if (this.enabled) this.ensureContext();
  }

  playTone(freqStart, freqEnd, duration = 0.16, type = 'sine', gainPeak = 0.08, delay = 0) {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + duration * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playPet() {
    // Warm harmonic purr-chirp
    this.playTone(340, 490, 0.22, 'sine', 0.07, 0);
    this.playTone(510, 680, 0.20, 'triangle', 0.045, 0.06);
  }

  playHappy() {
    this.playTone(440, 587, 0.14, 'sine', 0.07, 0);
    this.playTone(587, 784, 0.18, 'sine', 0.07, 0.10);
  }

  playExcited() {
    this.playTone(523, 659, 0.11, 'triangle', 0.07, 0);
    this.playTone(659, 784, 0.11, 'triangle', 0.07, 0.09);
    this.playTone(784, 1046, 0.16, 'sine', 0.08, 0.18);
  }

  playJump() {
    this.playTone(220, 560, 0.22, 'sine', 0.09, 0);
  }

  playLand() {
    this.playTone(150, 68, 0.14, 'sine', 0.09, 0);
  }

  playFootstep() {
    if (!this.ensureContext()) return;
    const nowMs = performance.now();
    if (nowMs - this.lastStepTime < 190) return;
    this.lastStepTime = nowMs;
    this.playTone(180, 95, 0.07, 'sine', 0.045, 0);
  }

  playStartled() {
    this.playTone(620, 920, 0.10, 'triangle', 0.08, 0);
    this.playTone(880, 480, 0.14, 'sine', 0.06, 0.08);
  }

  playSleep() {
    this.playTone(440, 330, 0.28, 'sine', 0.05, 0);
    this.playTone(330, 247, 0.35, 'sine', 0.04, 0.18);
  }

  playWake() {
    this.playTone(330, 440, 0.16, 'sine', 0.06, 0);
    this.playTone(440, 659, 0.24, 'sine', 0.07, 0.12);
  }

  playShake() {
    for (let i = 0; i < 4; i++) {
      this.playTone(240 + i * 35, 180 + i * 25, 0.08, 'triangle', 0.04, i * 0.065);
    }
  }

  playBrush() {
    if (!this.ensureContext()) return;
    const nowMs = performance.now();
    if (nowMs - this.lastBrushTime < 110) return;
    this.lastBrushTime = nowMs;

    const dur = 0.09;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.35;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playClick() {
    this.playTone(520, 640, 0.05, 'sine', 0.035, 0);
  }
}
