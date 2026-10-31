import { STATES } from './CharacterStateMachine.js';

export class CharacterAnimator {
  constructor(parts, physics) {
    this.parts = parts;
    this.physics = physics;
    this.time = 0;

    // Smoothed pose variables
    this.headYaw = 0;
    this.headPitch = 0;
    this.headRoll = 0;
    this.eyeScaleY = 1.0;
    this.mouthOpenAmount = 0.01;
    this.blushIntensity = 0.18;
    this.sleepSquat = 0.0;
  }

  update(dt, stateMachine, personality, pointerNDC, walkState, settings) {
    const intensity = settings.reducedMotion ? 0.35 : (settings.animationIntensity ?? 1.0);
    this.time += dt;

    const st = stateMachine.currentState;
    const t = this.time;

    // 1. Target Head Orientation & Facial Expression per State
    let targetYaw = 0;
    let targetPitch = 0;
    let targetRoll = 0;
    let targetEyeScaleY = 1.0;
    let targetMouthOpen = 0.01;
    let targetBlush = 0.18;
    let targetSleepSquat = 0.0;
    let bodyShakeYaw = 0;
    let bodyBounceY = 0;
    let armWaveL = 0;
    let armWaveR = 0;

    // Blink envelope
    let blinkMult = 1.0;
    if (personality.isBlinking) {
      blinkMult = Math.max(0.08, Math.abs(Math.cos(personality.blinkProgress * Math.PI)));
    }

    if (st === STATES.SLEEPING) {
      targetPitch = 0.26;
      targetRoll = 0.08;
      targetEyeScaleY = 0.08;
      targetMouthOpen = 0.18 * (0.5 + 0.5 * Math.sin(t * 1.8));
      targetSleepSquat = -0.18;
    } else if (st === STATES.CURIOUS) {
      targetYaw = pointerNDC[0] * 0.45 * intensity;
      targetPitch = -pointerNDC[1] * 0.28 * intensity;
      targetRoll = 0.22 * Math.sign(pointerNDC[0] || 1) * intensity;
      targetEyeScaleY = 1.08 * blinkMult;
      targetMouthOpen = 0.12;
    } else if (st === STATES.LOOKING_AROUND) {
      targetYaw = personality.lookTargetAngles[0] * intensity;
      targetPitch = personality.lookTargetAngles[1] * intensity;
      targetRoll = targetYaw * 0.3;
      targetEyeScaleY = blinkMult;
    } else if (st === STATES.PETTED) {
      targetPitch = -0.12 + Math.sin(t * 7.0) * 0.05 * intensity;
      targetRoll = Math.sin(t * 5.5) * 0.16 * intensity;
      targetEyeScaleY = 0.14; // Happy closed eyes
      targetMouthOpen = 0.38;
      targetBlush = 0.52;
      bodyBounceY = Math.abs(Math.sin(t * 6.5)) * 0.04 * intensity;
    } else if (st === STATES.BRUSHED) {
      targetYaw = pointerNDC[0] * 0.25 * intensity;
      targetRoll = -pointerNDC[0] * 0.18 * intensity;
      targetEyeScaleY = 0.20;
      targetMouthOpen = 0.28;
      targetBlush = 0.45;
    } else if (st === STATES.HAPPY) {
      bodyBounceY = Math.abs(Math.sin(t * 9.5)) * 0.09 * intensity;
      targetRoll = Math.sin(t * 9.5) * 0.14 * intensity;
      targetEyeScaleY = 0.22;
      targetMouthOpen = 0.52;
      targetBlush = 0.48;
      armWaveL = Math.sin(t * 12.0) * 0.45 * intensity;
      armWaveR = -Math.sin(t * 12.0) * 0.45 * intensity;
    } else if (st === STATES.EXCITED) {
      bodyBounceY = Math.abs(Math.sin(t * 13.0)) * 0.14 * intensity;
      bodyShakeYaw = Math.sin(t * 13.0) * 0.18 * intensity;
      targetEyeScaleY = 1.12 * blinkMult;
      targetMouthOpen = 0.65;
      targetBlush = 0.55;
      armWaveL = 0.55 + Math.sin(t * 15.0) * 0.35;
      armWaveR = -0.55 - Math.sin(t * 15.0) * 0.35;
      this.physics.tailSpring.impulse(Math.cos(t * 22.0) * 1.4, 0, 0);
    } else if (st === STATES.SHAKING) {
      const shakeOsc = Math.sin(t * 36.0) * intensity;
      bodyShakeYaw = shakeOsc * 0.32;
      targetRoll = -shakeOsc * 0.26;
      targetEyeScaleY = 0.15;
      armWaveL = shakeOsc * 0.4;
      armWaveR = shakeOsc * 0.4;
    } else if (st === STATES.STARTLED) {
      targetPitch = -0.18;
      targetEyeScaleY = 1.28;
      targetMouthOpen = 0.60;
      armWaveL = 0.7;
      armWaveR = -0.7;
    } else if (st === STATES.JUMPING) {
      targetPitch = -0.18;
      targetEyeScaleY = 1.12;
      targetMouthOpen = 0.48;
      armWaveL = 0.65;
      armWaveR = -0.65;
    } else if (st === STATES.LANDING) {
      targetPitch = 0.14;
      targetEyeScaleY = 0.35;
      targetMouthOpen = 0.25;
    } else if (st === STATES.WALKING) {
      bodyBounceY = Math.abs(Math.sin(t * 11.0)) * 0.06 * intensity;
      targetRoll = Math.sin(t * 5.5) * 0.10 * intensity;
      targetEyeScaleY = blinkMult;
      armWaveL = Math.sin(t * 11.0) * 0.35;
      armWaveR = Math.sin(t * 11.0) * 0.35;
    } else {
      // IDLE / BREATHING / BLINKING
      targetYaw = pointerNDC[0] * 0.18 * intensity;
      targetPitch = -pointerNDC[1] * 0.12 * intensity;
      targetEyeScaleY = blinkMult;
    }

    // Smoothly damp facial and head parameters
    const damp = Math.min(1.0, dt * 10.0);
    this.headYaw += (targetYaw - this.headYaw) * damp;
    this.headPitch += (targetPitch - this.headPitch) * damp;
    this.headRoll += (targetRoll - this.headRoll) * damp;
    this.eyeScaleY += (targetEyeScaleY - this.eyeScaleY) * Math.min(1.0, dt * 18.0);
    this.mouthOpenAmount += (targetMouthOpen - this.mouthOpenAmount) * damp;
    this.blushIntensity += (targetBlush - this.blushIntensity) * damp;
    this.sleepSquat += (targetSleepSquat - this.sleepSquat) * Math.min(1.0, dt * 5.0);

    // 2. Apply breathing + squash-and-stretch to bodyPivot
    const breathFreq = st === STATES.SLEEPING ? 1.4 : 2.6;
    const breathAmp = (st === STATES.SLEEPING ? 0.032 : 0.022) * intensity;
    const breathWave = Math.sin(t * breathFreq) * breathAmp;

    const squash = this.physics.bodySquash.value * 0.065;
    const scaleY = Math.max(0.72, Math.min(1.32, 1.0 + breathWave + squash + this.sleepSquat * 0.4));
    const scaleXZ = Math.max(0.78, Math.min(1.28, 1.0 - squash * 0.52 + breathWave * 0.35));

    this.parts.rootNode.position = [
      this.physics.posX,
      this.physics.posY,
      this.physics.posZ
    ];

    this.parts.bodyPivot.position = [
      0,
      0.68 + this.sleepSquat + bodyBounceY,
      0
    ];
    this.parts.bodyPivot.rotation = [
      this.physics.bodyTilt.x.value,
      this.physics.facingYaw + bodyShakeYaw,
      this.physics.bodyTilt.z.value
    ];
    this.parts.bodyPivot.scale = [scaleXZ, scaleY, scaleXZ];

    // 3. Apply Head rotation
    this.parts.headPivot.rotation = [
      this.headPitch + breathWave * 0.6,
      this.headYaw,
      this.headRoll
    ];

    // 4. Apply Ear & Tail spring rotations
    const earFlopL = this.physics.earLeftSpring.x.value * 0.08 + Math.sin(t * 2.8) * 0.04 * intensity;
    const earFlopR = this.physics.earRightSpring.x.value * 0.08 - Math.sin(t * 2.8 + 0.5) * 0.04 * intensity;

    this.parts.leftEarNode.rotation = [
      0.08 + this.physics.earLeftSpring.y.value * 0.06,
      0,
      0.36 + earFlopL + (st === STATES.SLEEPING ? 0.25 : 0)
    ];
    this.parts.rightEarNode.rotation = [
      0.08 + this.physics.earRightSpring.y.value * 0.06,
      0,
      -0.36 + earFlopR - (st === STATES.SLEEPING ? 0.25 : 0)
    ];

    const tailWag = (st === STATES.HAPPY || st === STATES.EXCITED || st === STATES.PETTED)
      ? Math.sin(t * 16.0) * 0.35 * intensity
      : Math.sin(t * 2.2) * 0.08 * intensity;
    this.parts.tailNode.position = [
      tailWag * 0.35 + this.physics.tailSpring.x.value * 0.04,
      -0.14 + this.physics.tailSpring.y.value * 0.04,
      -0.74
    ];

    // 5. Arms & Feet
    this.parts.leftArm.rotation = [0.2, 0, 0.45 + armWaveL];
    this.parts.rightArm.rotation = [0.2, 0, -0.45 + armWaveR];

    const walkCycle = walkState.isWalking ? Math.sin(t * 11.0) * 0.14 : 0;
    this.parts.leftFoot.position = [-0.34, -0.58 + Math.max(0, walkCycle), 0.24 + walkCycle * 0.6];
    this.parts.rightFoot.position = [0.34, -0.58 + Math.max(0, -walkCycle), 0.24 - walkCycle * 0.6];

    // 6. Eyes, Brows, Blush, Mouth
    this.parts.leftEye.eyeGroup.scale = [1.0, this.eyeScaleY, 1.0];
    this.parts.rightEye.eyeGroup.scale = [1.0, this.eyeScaleY, 1.0];

    const browLift = st === STATES.STARTLED || st === STATES.CURIOUS ? 0.035 :
                     st === STATES.SLEEPING ? -0.025 : 0;
    this.parts.leftBrow.position[1] = 0.24 + browLift;
    this.parts.rightBrow.position[1] = 0.24 + browLift;

    this.parts.leftBlush.emissive = this.blushIntensity;
    this.parts.rightBlush.emissive = this.blushIntensity;

    this.parts.mouthOpen.scale[1] = Math.max(0.002, this.mouthOpenAmount * 0.075);
  }
}
