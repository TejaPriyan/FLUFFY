import { Vec3 } from '../core/SceneManager.js';

export class FurPhysics {
  constructor(guides) {
    this.guides = guides.map((g) => ({
      ...g,
      prevWorldRoot: null,
      tipOffset: [0, 0, 0],
      tipVel: [0, 0, 0],
      groomOffset: [0, 0, 0]
    }));
    this.displacementsFlat = new Float32Array(64 * 3);
    this.time = 0;
  }

  applyLocalForce(worldPoint, forceVec, radius = 0.72, isBrush = false, partMatrices = []) {
    for (let i = 0; i < this.guides.length; i++) {
      const g = this.guides[i];
      const mat = partMatrices[g.partIdx];
      if (!mat) continue;
      const worldRoot = Vec3.transformMat4(g.localPos, mat);
      const dist = Vec3.len(Vec3.sub(worldRoot, worldPoint));
      if (dist < radius) {
        const falloff = Math.pow(1.0 - dist / radius, 1.5);
        g.tipVel[0] += forceVec[0] * falloff;
        g.tipVel[1] += forceVec[1] * falloff;
        g.tipVel[2] += forceVec[2] * falloff;

        if (isBrush) {
          // Brushing combs and parts the fur along the stroke direction, recovering gradually
          g.groomOffset[0] = Math.max(-0.22, Math.min(0.22, g.groomOffset[0] + forceVec[0] * falloff * 0.035));
          g.groomOffset[1] = Math.max(-0.22, Math.min(0.22, g.groomOffset[1] + forceVec[1] * falloff * 0.035));
          g.groomOffset[2] = Math.max(-0.22, Math.min(0.22, g.groomOffset[2] + forceVec[2] * falloff * 0.035));
        }
      }
    }
  }

  applyGlobalShakeImpulse(intensity = 1.0) {
    for (let i = 0; i < this.guides.length; i++) {
      const g = this.guides[i];
      const angle = i * 1.7 + this.time * 25.0;
      g.tipVel[0] += Math.cos(angle) * 2.4 * intensity;
      g.tipVel[1] += Math.sin(angle * 1.3) * 1.6 * intensity;
      g.tipVel[2] += Math.sin(angle) * 2.4 * intensity;
    }
  }

  update(dt, partMatrices, settings) {
    const safeDt = Math.min(dt, 0.04);
    this.time += safeDt;

    const stiffness = (settings.furStiffness || 1.0) * 95.0;
    const damping = 9.5;
    const windEnabled = settings.windEnabled ? 1.0 : 0.0;
    const windStrength = (settings.windStrength || 0.45) * windEnabled;

    for (let i = 0; i < this.guides.length; i++) {
      const g = this.guides[i];
      const mat = partMatrices[g.partIdx];
      if (!mat) continue;

      const worldRoot = Vec3.transformMat4(g.localPos, mat);
      const worldNormal = Vec3.transformNormalMat4(g.localNormal, mat);

      // Compute root movement velocity for inertia lag when turning, jumping, or shaking
      let rootVel = [0, 0, 0];
      if (g.prevWorldRoot) {
        rootVel = Vec3.scale(Vec3.sub(worldRoot, g.prevWorldRoot), 1.0 / Math.max(safeDt, 0.002));
      }
      g.prevWorldRoot = worldRoot;

      // Inertia pushes fur tips opposite to body acceleration/velocity
      const inertiaForce = [
        -rootVel[0] * 1.85,
        -rootVel[1] * 2.15,
        -rootVel[2] * 1.85
      ];

      // Coherent 3D wind gust waves
      const wPhase = this.time * 2.4 + worldRoot[0] * 2.2 + worldRoot[1] * 1.7;
      const windForce = [
        (Math.sin(wPhase) * 0.9 + 0.45) * windStrength * 1.6,
        Math.cos(wPhase * 1.3) * windStrength * 0.5,
        Math.sin(wPhase * 0.7) * windStrength * 1.1
      ];

      // Gradual recovery of brushed grooming offset
      const groomDecay = Math.exp(-safeDt * 0.65);
      g.groomOffset[0] *= groomDecay;
      g.groomOffset[1] *= groomDecay;
      g.groomOffset[2] *= groomDecay;

      // Spring force toward groomed rest offset
      const dispX = g.tipOffset[0] - g.groomOffset[0];
      const dispY = g.tipOffset[1] - g.groomOffset[1];
      const dispZ = g.tipOffset[2] - g.groomOffset[2];

      const ax = -stiffness * dispX - damping * g.tipVel[0] + inertiaForce[0] + windForce[0];
      const ay = -stiffness * dispY - damping * g.tipVel[1] + inertiaForce[1] + windForce[1];
      const az = -stiffness * dispZ - damping * g.tipVel[2] + inertiaForce[2] + windForce[2];

      g.tipVel[0] += ax * safeDt;
      g.tipVel[1] += ay * safeDt;
      g.tipVel[2] += az * safeDt;

      g.tipOffset[0] += g.tipVel[0] * safeDt;
      g.tipOffset[1] += g.tipVel[1] * safeDt;
      g.tipOffset[2] += g.tipVel[2] * safeDt;

      // Surface collision constraint: prevent fur tips from penetrating deep inside the body normal
      const dotNorm = Vec3.dot(g.tipOffset, worldNormal);
      if (dotNorm < -0.06) {
        const pushOut = -0.06 - dotNorm;
        g.tipOffset[0] += worldNormal[0] * pushOut;
        g.tipOffset[1] += worldNormal[1] * pushOut;
        g.tipOffset[2] += worldNormal[2] * pushOut;
      }

      // Clamp maximum displacement magnitude to prevent wild oscillation
      const maxDisp = 0.28;
      const mag = Math.hypot(g.tipOffset[0], g.tipOffset[1], g.tipOffset[2]);
      if (mag > maxDisp) {
        const s = maxDisp / mag;
        g.tipOffset[0] *= s;
        g.tipOffset[1] *= s;
        g.tipOffset[2] *= s;
      }

      this.displacementsFlat[i * 3 + 0] = g.tipOffset[0];
      this.displacementsFlat[i * 3 + 1] = g.tipOffset[1];
      this.displacementsFlat[i * 3 + 2] = g.tipOffset[2];
    }
  }
}
