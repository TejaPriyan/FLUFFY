import { STATES } from './CharacterStateMachine.js';

export class CharacterPersonality {
  constructor(initialStats = {}) {
    this.happiness = initialStats.happiness ?? 84;
    this.energy = initialStats.energy ?? 88;
    this.affection = initialStats.affection ?? 76;
    this.curiosity = initialStats.curiosity ?? 65;
    this.sleepiness = initialStats.sleepiness ?? 12;

    this.inactivityTimer = 0;
    this.blinkTimer = 2.4;
    this.isBlinking = false;
    this.blinkProgress = 0;

    this.idleBehaviorTimer = 4.2;
    this.lookTargetAngles = [0, 0];
    this.petComboCount = 0;
    this.petComboResetTimer = 0;
  }

  clamp(v) {
    return Math.max(0, Math.min(100, v));
  }

  onPet() {
    this.inactivityTimer = 0;
    this.petComboCount++;
    this.petComboResetTimer = 3.0;
    this.happiness = this.clamp(this.happiness + 3.5);
    this.affection = this.clamp(this.affection + 4.5);
    this.sleepiness = this.clamp(this.sleepiness - 2.0);
  }

  onBrush() {
    this.inactivityTimer = 0;
    this.happiness = this.clamp(this.happiness + 1.2);
    this.affection = this.clamp(this.affection + 1.8);
  }

  onJump() {
    this.inactivityTimer = 0;
    this.energy = this.clamp(this.energy - 4.0);
    this.happiness = this.clamp(this.happiness + 2.5);
    this.sleepiness = this.clamp(this.sleepiness + 1.5);
  }

  onWake() {
    this.inactivityTimer = 0;
    this.sleepiness = this.clamp(this.sleepiness - 25);
  }

  update(dt, stateMachine) {
    this.inactivityTimer += dt;

    if (this.petComboResetTimer > 0) {
      this.petComboResetTimer -= dt;
      if (this.petComboResetTimer <= 0) {
        this.petComboCount = 0;
      }
    }

    // Gradual autonomous stat drift
    if (stateMachine.currentState === STATES.SLEEPING) {
      this.energy = this.clamp(this.energy + dt * 3.2);
      this.sleepiness = this.clamp(this.sleepiness - dt * 2.8);
    } else {
      this.happiness = this.clamp(this.happiness - dt * 0.15);
      this.energy = this.clamp(this.energy + dt * 0.25);
      this.sleepiness = this.clamp(this.sleepiness + dt * 0.35);
    }

    // Automatic blink scheduler
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.blinkTimer = 2.2 + Math.random() * 3.4;
      if (stateMachine.currentState === STATES.IDLE || stateMachine.currentState === STATES.BREATHING) {
        stateMachine.setState(STATES.BLINKING, 0.24, 1);
      }
    }

    if (this.isBlinking) {
      this.blinkProgress += dt / 0.22;
      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        this.blinkProgress = 0;
      }
    }

    // Autonomous idle transitions (BREATHING, LOOKING_AROUND, SLEEPING after inactivity)
    if (
      stateMachine.currentState === STATES.IDLE ||
      stateMachine.currentState === STATES.BREATHING ||
      stateMachine.currentState === STATES.LOOKING_AROUND
    ) {
      if (this.inactivityTimer > 42.0 && this.sleepiness > 45) {
        stateMachine.setState(STATES.SLEEPING, 0, 2, true);
        return;
      }

      this.idleBehaviorTimer -= dt;
      if (this.idleBehaviorTimer <= 0) {
        const r = Math.random();
        if (r < 0.45) {
          this.lookTargetAngles = [
            (Math.random() - 0.5) * 0.55,
            (Math.random() - 0.5) * 0.28
          ];
          stateMachine.setState(STATES.LOOKING_AROUND, 2.4, 1);
          this.idleBehaviorTimer = 3.6 + Math.random() * 2.5;
        } else if (r < 0.80) {
          this.lookTargetAngles = [0, 0];
          stateMachine.setState(STATES.BREATHING, 2.8, 1);
          this.idleBehaviorTimer = 3.2 + Math.random() * 2.5;
        } else {
          this.lookTargetAngles = [0, 0];
          stateMachine.setState(STATES.IDLE, 2.5, 1);
          this.idleBehaviorTimer = 3.0 + Math.random() * 2.5;
        }
      }
    }
  }
}
