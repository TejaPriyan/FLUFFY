import { Mat4 } from './SceneManager.js';

export class CameraController {
  constructor() {
    this.defaultYaw = 0.0;
    this.defaultPitch = 0.24;
    this.defaultDistance = 4.35;
    this.defaultTarget = [0, 1.08, 0];

    this.yaw = this.defaultYaw;
    this.pitch = this.defaultPitch;
    this.distance = this.defaultDistance;

    this.targetYaw = this.defaultYaw;
    this.targetPitch = this.defaultPitch;
    this.targetDistance = this.defaultDistance;

    this.lookTarget = [...this.defaultTarget];
    this.eyePosition = [0, 1.7, 4.35];

    this.fovRad = (42 * Math.PI) / 180;
    this.aspect = 16 / 9;
    this.near = 0.1;
    this.far = 60.0;

    this.projMatrix = Mat4.identity();
    this.viewMatrix = Mat4.identity();
    this.time = 0;
  }

  orbit(deltaYaw, deltaPitch) {
    this.targetYaw = Math.max(-1.35, Math.min(1.35, this.targetYaw + deltaYaw));
    this.targetPitch = Math.max(0.06, Math.min(0.88, this.targetPitch + deltaPitch));
  }

  zoom(deltaDistance) {
    this.targetDistance = Math.max(2.65, Math.min(7.2, this.targetDistance + deltaDistance));
  }

  reset() {
    this.targetYaw = this.defaultYaw;
    this.targetPitch = this.defaultPitch;
    this.targetDistance = this.defaultDistance;
  }

  resize(width, height) {
    this.aspect = Math.max(0.2, width / Math.max(1, height));
    this.projMatrix = Mat4.perspective(this.fovRad, this.aspect, this.near, this.far);
  }

  update(dt, characterPos = [0, 0, 0], reducedMotion = false) {
    this.time += dt;
    const damp = Math.min(1, dt * 8.5);
    this.yaw += (this.targetYaw - this.yaw) * damp;
    this.pitch += (this.targetPitch - this.pitch) * damp;
    this.distance += (this.targetDistance - this.distance) * damp;

    // Smoothly track the character softly without dizzying swings
    const desiredTargetX = characterPos[0] * 0.45;
    const desiredTargetY = 1.05 + characterPos[1] * 0.28;
    const desiredTargetZ = characterPos[2] * 0.45;

    this.lookTarget[0] += (desiredTargetX - this.lookTarget[0]) * damp;
    this.lookTarget[1] += (desiredTargetY - this.lookTarget[1]) * damp;
    this.lookTarget[2] += (desiredTargetZ - this.lookTarget[2]) * damp;

    const breathSway = reducedMotion ? 0 : Math.sin(this.time * 1.1) * 0.015;
    const effPitch = Math.max(0.05, this.pitch + breathSway);
    const cosP = Math.cos(effPitch);
    const sinP = Math.sin(effPitch);

    const ex = this.lookTarget[0] + Math.sin(this.yaw) * cosP * this.distance;
    const ey = Math.max(0.22, this.lookTarget[1] + sinP * this.distance);
    const ez = this.lookTarget[2] + Math.cos(this.yaw) * cosP * this.distance;

    this.eyePosition = [ex, ey, ez];
    this.viewMatrix = Mat4.lookAt(this.eyePosition, this.lookTarget, [0, 1, 0]);
    this.projMatrix = Mat4.perspective(this.fovRad, this.aspect, this.near, this.far);
  }
}
