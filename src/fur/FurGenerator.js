import { Vec3 } from '../core/SceneManager.js';

export class FurGenerator {
  static buildTemplateGeometry() {
    const segs = 7;
    const positions = [];
    const indices = [];

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const waveZ = Math.sin(t * Math.PI * 1.5) * 0.12;
      positions.push(-1.0, t, waveZ);
      positions.push( 1.0, t, waveZ);
    }

    for (let i = 0; i < segs; i++) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2);
      indices.push(b + 1, b + 3, b + 2);
    }

    return {
      positions: new Float32Array(positions),
      indices: new Uint16Array(indices)
    };
  }

  static generateGuidesAndStrands(maxStrands = 15000) {
    const guides = [];
    const fibSphere = (count) => {
      const pts = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / Math.max(1, count - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;
        pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
      }
      return pts;
    };

    const partGuideCounts = [32, 18, 5, 5, 4];
    for (let partIdx = 0; partIdx < 5; partIdx++) {
      const pts = fibSphere(partGuideCounts[partIdx]);
      for (let p of pts) {
        const mapped = FurGenerator.mapUnitSphereToPart(p[0], p[1], p[2], partIdx);
        guides.push({
          partIdx,
          localPos: mapped.pos,
          localNormal: mapped.normal,
          lengthBase: mapped.lengthMul
        });
      }
    }

    const rootPositions = new Float32Array(maxStrands * 3);
    const normals = new Float32Array(maxStrands * 3);
    const strandMeta = new Float32Array(maxStrands * 4);
    const guideInfo = new Float32Array(maxStrands * 2);

    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    let idx = 0;
    let attempt = 0;
    while (idx < maxStrands && attempt < maxStrands * 4) {
      attempt++;
      const rPart = (idx % 100) / 100;
      let partIdx = 0;
      if (rPart < 0.54) partIdx = 0;      // Body (54%)
      else if (rPart < 0.82) partIdx = 1; // Head (28%)
      else if (rPart < 0.88) partIdx = 2; // Left Ear (6%)
      else if (rPart < 0.94) partIdx = 3; // Right Ear (6%)
      else partIdx = 4;                   // Tail (6%)

      const u = rand();
      const v = rand();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const sx = Math.sin(phi) * Math.cos(theta);
      const sy = Math.cos(phi);
      const sz = Math.sin(phi) * Math.sin(theta);

      // Oval facial clarity mask around eyes, brows, nose, blush & mouth
      let faceFeather = 1.0;
      if (partIdx === 1 && sz > 0.30) {
        const ovalDist = Math.hypot(sx / 0.66, (sy - 0.01) / 0.50);
        if (ovalDist < 0.96) {
          continue;
        } else if (ovalDist < 1.35) {
          faceFeather = 0.35 + 0.65 * ((ovalDist - 0.96) / 0.39);
        }
      }

      // Skip inner ear recessed pad on ears (Parts 2 & 3)
      if ((partIdx === 2 || partIdx === 3) && sz > 0.32 && sy < 0.48 && sy > -0.48 && Math.abs(sx) < 0.56) {
        continue;
      }

      const mapped = FurGenerator.mapUnitSphereToPart(sx, sy, sz, partIdx);
      const N = mapped.normal;

      // Compute natural combed flow direction tangent to the body/head surface!
      // By blending ~42% outward normal with ~82% surface tangent flow, hairs sweep gracefully
      // along the body contours like real combed fur instead of sticking straight out at the camera!
      let flowGoal = [sx * 0.45, -0.85, -0.15];
      if (partIdx === 1) {
        if (sy > 0.38) {
          // Forehead & crown sweep upward and outward away from eyes/brows
          flowGoal = [sx * 0.85, 0.72, -0.38];
        } else {
          // Cheeks & lower head sweep radially outward away from blush/mouth and softly downward
          flowGoal = [Math.sign(sx || 1) * 0.95, -0.58, -0.32];
        }
      } else if (partIdx === 0) {
        // Chest & body sweep outward from the center chest seam and downward
        flowGoal = [sx * 0.65, -0.88, -0.20];
      } else if (partIdx === 2 || partIdx === 3) {
        // Ears sweep upward and outward toward the ear tips
        flowGoal = [sx * 0.45, 0.88, -0.15];
      } else {
        // Tail plumes upward and outward
        flowGoal = [sx * 0.55, 0.65, -0.65];
      }

      // Project flowGoal onto the tangent plane of surface normal N
      const dotFN = Vec3.dot(flowGoal, N);
      let tangFlow = Vec3.sub(flowGoal, Vec3.scale(N, dotFN));
      if (Vec3.len(tangFlow) < 0.01) {
        tangFlow = [0, -1, 0];
      } else {
        tangFlow = Vec3.norm(tangFlow);
      }

      // Blend outward normal (0.48) + tangent combed flow (0.85) + organic lock clumping
      const clumpWave = Math.sin(sx * 12.0 + sy * 9.0) * 0.14;
      const combedDir = [
        N[0] * 0.48 + tangFlow[0] * 0.85 + clumpWave + (rand() - 0.5) * 0.16,
        N[1] * 0.48 + tangFlow[1] * 0.85 + (rand() - 0.5) * 0.16,
        N[2] * 0.48 + tangFlow[2] * 0.85 + (rand() - 0.5) * 0.16
      ];
      const norm = Vec3.norm(combedDir);

      let bestG0 = 0, bestG1 = 0;
      let bestD0 = 1e9, bestD1 = 1e9;
      for (let g = 0; g < guides.length; g++) {
        if (guides[g].partIdx !== partIdx) continue;
        const d = Vec3.len(Vec3.sub(mapped.pos, guides[g].localPos));
        if (d < bestD0) {
          bestD1 = bestD0; bestG1 = bestG0;
          bestD0 = d; bestG0 = g;
        } else if (d < bestD1) {
          bestD1 = d; bestG1 = g;
        }
      }

      rootPositions[idx * 3 + 0] = mapped.pos[0];
      rootPositions[idx * 3 + 1] = mapped.pos[1];
      rootPositions[idx * 3 + 2] = mapped.pos[2];

      normals[idx * 3 + 0] = norm[0];
      normals[idx * 3 + 1] = norm[1];
      normals[idx * 3 + 2] = norm[2];

      const lengthVar = mapped.lengthMul * faceFeather * (0.78 + rand() * 0.52);
      const widthVar = 0.80 + rand() * 0.45;
      const colorVar = (rand() - 0.5) * 2.0;

      strandMeta[idx * 4 + 0] = lengthVar;
      strandMeta[idx * 4 + 1] = widthVar;
      strandMeta[idx * 4 + 2] = colorVar;
      strandMeta[idx * 4 + 3] = partIdx;

      guideInfo[idx * 2 + 0] = bestG0;
      guideInfo[idx * 2 + 1] = bestG1;

      idx++;
    }

    return {
      guides,
      totalStrands: idx,
      rootPositions,
      normals,
      strandMeta,
      guideInfo
    };
  }

  static mapUnitSphereToPart(x, y, z, partIdx) {
    if (partIdx === 0) {
      const bellyBulge = 1.0 + Math.max(0, -y + 0.2) * 0.22;
      const px = x * 0.77 * bellyBulge;
      const py = y * 0.67;
      const pz = z * 0.73 * bellyBulge;
      const chestFluff = (y > 0.10 && z > 0.15) ? 1.28 : 1.0;
      return {
        pos: [px, py, pz],
        normal: Vec3.norm([x, y * 0.78, z]),
        lengthMul: 0.25 * chestFluff
      };
    } else if (partIdx === 1) {
      const cheekExpand = 1.0 + Math.max(0, -y * 0.5 + 0.15) * 0.26 * Math.abs(x);
      const px = x * 0.71 * cheekExpand;
      const py = y * 0.57;
      const pz = z * 0.64;
      let len = 0.23;
      if (Math.abs(x) > 0.55 && y < 0.22) len = 0.29;
      if (y > 0.68) len = 0.30;
      return {
        pos: [px, py, pz],
        normal: Vec3.norm([x * 1.15, y + (y > 0.65 ? 0.30 : 0), z * 0.85]),
        lengthMul: len
      };
    } else if (partIdx === 2 || partIdx === 3) {
      const taper = 1.0 - Math.max(0, y) * 0.28;
      const px = x * 0.20 * taper;
      const py = (y + 0.7) * 0.26;
      const pz = z * 0.11;
      const earTip = y > 0.55 ? 1.48 : 0.95;
      return {
        pos: [px, py, pz],
        normal: Vec3.norm([x, y + 0.35, z]),
        lengthMul: 0.16 * earTip
      };
    } else {
      const px = x * 0.26;
      const py = y * 0.26;
      const pz = z * 0.28;
      return {
        pos: [px, py, pz],
        normal: Vec3.norm([x, y + 0.25, z - 0.25]),
        lengthMul: 0.27
      };
    }
  }
}
