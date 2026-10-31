export const STATES = {
  IDLE: 'IDLE',
  BREATHING: 'BREATHING',
  BLINKING: 'BLINKING',
  LOOKING_AROUND: 'LOOKING_AROUND',
  HAPPY: 'HAPPY',
  CURIOUS: 'CURIOUS',
  SLEEPING: 'SLEEPING',
  PETTED: 'PETTED',
  EXCITED: 'EXCITED',
  JUMPING: 'JUMPING',
  LANDING: 'LANDING',
  SHAKING: 'SHAKING',
  WALKING: 'WALKING',
  BRUSHED: 'BRUSHED',
  STARTLED: 'STARTLED'
};

export class CharacterStateMachine {
  constructor() {
    this.currentState = STATES.IDLE;
    this.previousState = STATES.IDLE;
    this.stateTime = 0;
    this.stateDuration = 0; // 0 means indefinite until next event
    this.lockPriority = 0;
  }

  setState(newState, duration = 0, priority = 1, force = false) {
    if (!STATES[newState]) return false;
    if (!force && this.stateDuration > 0 && priority < this.lockPriority) {
      return false;
    }
    if (this.currentState !== newState) {
      this.previousState = this.currentState;
      this.currentState = newState;
      this.stateTime = 0;
    } else if (force) {
      this.stateTime = 0;
    }
    this.stateDuration = duration;
    this.lockPriority = duration > 0 ? priority : 0;
    return true;
  }

  update(dt) {
    this.stateTime += dt;
    if (this.stateDuration > 0 && this.stateTime >= this.stateDuration) {
      this.stateDuration = 0;
      this.lockPriority = 0;
      if (this.currentState !== STATES.SLEEPING) {
        this.currentState = STATES.IDLE;
        this.stateTime = 0;
      }
    }
    return this.currentState;
  }
}
