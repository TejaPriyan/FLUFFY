import { CharacterBuilder } from './CharacterBuilder.js';
import { CharacterStateMachine, STATES } from './CharacterStateMachine.js';
import { CharacterPersonality } from './CharacterPersonality.js';
import { CharacterAnimator } from './CharacterAnimator.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { FUR_PALETTES, EYE_PALETTES } from '../storage/SaveManager.js';

export class Character {
  constructor(renderer, scene, furPhysics, soundManager, initialSettings) {
    this.renderer = renderer;
    this.scene = scene;
    this.furPhysics = furPhysics;
    this.sound = soundManager;

    this.parts = CharacterBuilder.build(renderer);
    this.rootNode = this.parts.rootNode;
    this.bodyNode = this.parts.bodyNode;
    this.headNode = this.parts.headNode;
    this.scene.root.add(this.rootNode);

    this.physics = new PhysicsWorld();
    this.stateMachine = new CharacterStateMachine();
    this.personality = new CharacterPersonality(initialSettings.stats);
    this.animator = new CharacterAnimator(this.parts, this.physics);

    this.pointerNDC = [0, 0];
    this.walkTarget = null;
    this.isWalking = false;

    this.applyCustomization(initialSettings);
  }

  getPartMatrices() {
    return [
      this.parts.bodyNode.worldMatrix,
      this.parts.headNode.worldMatrix,
      this.parts.leftEarNode.worldMatrix,
      this.parts.rightEarNode.worldMatrix,
      this.parts.tailNode.worldMatrix
    ];
  }

  applyCustomization(settings) {
    const furPal = FUR_PALETTES[settings.furColor] || FUR_PALETTES.white;
    const eyePal = EYE_PALETTES[settings.eyeColor] || EYE_PALETTES.amber;

    this.parts.bodyNode.color = [...furPal.skin];
    this.parts.headNode.color = [...furPal.skin];
    this.parts.leftEarNode.color = [...furPal.skin];
    this.parts.rightEarNode.color = [...furPal.skin];
    this.parts.tailNode.color = [...furPal.skin];
    this.parts.leftArm.color = [...furPal.tip];
    this.parts.rightArm.color = [...furPal.tip];
    this.parts.leftFoot.color = [...furPal.tip];
    this.parts.rightFoot.color = [...furPal.tip];

    this.parts.leftEye.iris.color = [...eyePal.color];
    this.parts.rightEye.iris.color = [...eyePal.color];

    const acc = settings.accessory || 'none';
    for (const [key, node] of Object.entries(this.parts.accessories)) {
      node.visible = (key === acc);
    }
  }

  triggerPet(spawnParticleCb) {
    if (this.stateMachine.currentState === STATES.SLEEPING) {
      this.wakeUp();
      return 'Woke up with a happy stretch!';
    }
    this.personality.onPet();
    this.physics.bodySquash.impulse(-1.4);
    this.physics.earLeftSpring.impulse(1.8, 0, 1.2);
    this.physics.earRightSpring.impulse(-1.8, 0, -1.2);

    if (this.personality.petComboCount >= 4) {
      this.stateMachine.setState(STATES.EXCITED, 1.8, 3, true);
      this.sound.playExcited();
      if (spawnParticleCb) spawnParticleCb('heart', 6);
      return 'So much love! Excited happy bounce!';
    } else {
      this.stateMachine.setState(STATES.PETTED, 1.35, 2, true);
      this.sound.playPet();
      if (spawnParticleCb) spawnParticleCb('heart', 3);
      return 'Purring happily from head pats!';
    }
  }

  triggerBodyPoke(spawnParticleCb) {
    if (this.stateMachine.currentState === STATES.SLEEPING) {
      this.wakeUp();
      return 'Yawns and wakes up!';
    }
    this.personality.onPet();
    this.physics.bodySquash.impulse(-2.2);
    this.stateMachine.setState(STATES.HAPPY, 1.4, 2, true);
    this.sound.playHappy();
    if (spawnParticleCb) spawnParticleCb('sparkle', 4);
    return 'Giggles and bounces!';
  }

  triggerBrush(spawnParticleCb) {
    if (this.stateMachine.currentState === STATES.SLEEPING) {
      this.wakeUp();
    }
    this.personality.onBrush();
    this.stateMachine.setState(STATES.BRUSHED, 0.65, 2, true);
    this.sound.playBrush();
    if (spawnParticleCb && Math.random() < 0.35) spawnParticleCb('sparkle', 2);
  }

  triggerDoubleClick(spawnParticleCb) {
    if (this.stateMachine.currentState === STATES.SLEEPING) {
      this.wakeUp();
    }
    this.physics.bodySquash.impulse(2.8);
    this.furPhysics.applyGlobalShakeImpulse(0.8);
    this.stateMachine.setState(STATES.STARTLED, 1.1, 4, true);
    this.sound.playStartled();
    if (spawnParticleCb) spawnParticleCb('sparkle', 6);
    return 'Playful surprise hop!';
  }

  triggerJump(spawnParticleCb) {
    if (this.stateMachine.currentState === STATES.SLEEPING) {
      this.wakeUp();
    }
    if (this.physics.triggerJump(7.4)) {
      this.personality.onJump();
      this.stateMachine.setState(STATES.JUMPING, 1.2, 4, true);
      this.sound.playJump();
      if (spawnParticleCb) spawnParticleCb('sparkle', 4);
      return 'Wheee! Big fluffy jump!';
    }
    return 'Catching breath before next jump!';
  }

  triggerShake(spawnParticleCb) {
    if (this.stateMachine.currentState === STATES.SLEEPING) {
      this.wakeUp();
    }
    this.stateMachine.setState(STATES.SHAKING, 1.15, 3, true);
    this.furPhysics.applyGlobalShakeImpulse(1.35);
    this.sound.playShake();
    if (spawnParticleCb) spawnParticleCb('sparkle', 5);
    return 'Fluffing out all fur strands!';
  }

  toggleSleep() {
    if (this.stateMachine.currentState === STATES.SLEEPING) {
      this.wakeUp();
      return 'Awake and ready to play!';
    } else {
      this.walkTarget = null;
      this.isWalking = false;
      this.stateMachine.setState(STATES.SLEEPING, 0, 3, true);
      this.sound.playSleep();
      return 'Curled up for a cozy nap... Zzz';
    }
  }

  wakeUp() {
    this.personality.onWake();
    this.physics.bodySquash.impulse(2.0);
    this.stateMachine.setState(STATES.HAPPY, 1.2, 2, true);
    this.sound.playWake();
  }

  walkToPoint(targetX, targetZ) {
    if (this.stateMachine.currentState === STATES.SLEEPING) {
      this.wakeUp();
    }
    const clampedR = Math.hypot(targetX, targetZ);
    const maxR = 1.45;
    if (clampedR > maxR) {
      targetX = (targetX / clampedR) * maxR;
      targetZ = (targetZ / clampedR) * maxR;
    }
    this.walkTarget = [targetX, targetZ];
    this.isWalking = true;
    this.stateMachine.setState(STATES.WALKING, 3.0, 2, true);
  }

  resetPosition() {
    this.walkTarget = null;
    this.isWalking = false;
    this.physics.posX = 0;
    this.physics.posY = 0;
    this.physics.posZ = 0;
    this.physics.facingYaw = 0;
    this.stateMachine.setState(STATES.IDLE, 0, 1, true);
  }

  update(dt, settings) {
    // Handle walking toward target point on the platform
    if (this.walkTarget) {
      const dx = this.walkTarget[0] - this.physics.posX;
      const dz = this.walkTarget[1] - this.physics.posZ;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.06) {
        this.walkTarget = null;
        this.isWalking = false;
        this.physics.facingYaw *= 0.5;
        if (this.stateMachine.currentState === STATES.WALKING) {
          this.stateMachine.setState(STATES.HAPPY, 0.9, 2, true);
        }
      } else {
        const speed = 1.35;
        const step = Math.min(dist, speed * dt);
        this.physics.posX += (dx / dist) * step;
        this.physics.posZ += (dz / dist) * step;
        const desiredYaw = Math.atan2(dx, dz) * 0.45;
        this.physics.facingYaw += (desiredYaw - this.physics.facingYaw) * Math.min(1, dt * 8);
        this.sound.playFootstep();
      }
    }

    // Update physics world and landing callback
    this.physics.update(dt, () => {
      this.stateMachine.setState(STATES.LANDING, 0.42, 4, true);
      this.furPhysics.applyGlobalShakeImpulse(0.65);
      this.sound.playLand();
    });

    // Continuous shake fur impulse while in SHAKING state
    if (this.stateMachine.currentState === STATES.SHAKING) {
      this.furPhysics.applyGlobalShakeImpulse(0.42);
    }

    this.stateMachine.update(dt);
    this.personality.update(dt, this.stateMachine);
    this.animator.update(dt, this.stateMachine, this.personality, this.pointerNDC, { isWalking: this.isWalking }, settings);
  }
}
