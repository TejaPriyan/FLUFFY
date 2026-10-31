export class Vec3 {
  static create(x = 0, y = 0, z = 0) { return [x, y, z]; }
  static sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  static add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  static scale(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  static dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  static cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }
  static len(a) { return Math.hypot(a[0], a[1], a[2]); }
  static norm(a) {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }
  static transformMat4(v, m) {
    const x = v[0], y = v[1], z = v[2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1.0;
    return [
      (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
      (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
      (m[2] * x + m[6] * y + m[10] * z + m[14]) / w
    ];
  }
  static transformNormalMat4(n, m) {
    const x = n[0], y = n[1], z = n[2];
    return Vec3.norm([
      m[0] * x + m[4] * y + m[8] * z,
      m[1] * x + m[5] * y + m[9] * z,
      m[2] * x + m[6] * y + m[10] * z
    ]);
  }
}

export class Mat4 {
  static identity() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  static multiply(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4 + 0], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      out[c * 4 + 0] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
      out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
      out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
  }

  static compose(pos, rotEuler, scale) {
    const [px, py, pz] = pos;
    const [rx, ry, rz] = rotEuler;
    const [sx, sy, sz] = scale;

    const cx = Math.cos(rx), sxr = Math.sin(rx);
    const cy = Math.cos(ry), syr = Math.sin(ry);
    const cz = Math.cos(rz), szr = Math.sin(rz);

    // Y * X * Z rotation order
    const r00 = cy * cz + syr * sxr * szr;
    const r01 = cx * szr;
    const r02 = -syr * cz + cy * sxr * szr;

    const r10 = -cy * szr + syr * sxr * cz;
    const r11 = cx * cz;
    const r12 = syr * szr + cy * sxr * cz;

    const r20 = syr * cx;
    const r21 = -sxr;
    const r22 = cy * cx;

    return new Float32Array([
      r00 * sx, r01 * sx, r02 * sx, 0,
      r10 * sy, r11 * sy, r12 * sy, 0,
      r20 * sz, r21 * sz, r22 * sz, 0,
      px,       py,       pz,       1
    ]);
  }

  static perspective(fovyRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovyRad / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ]);
  }

  static lookAt(eye, center, up) {
    const z = Vec3.norm(Vec3.sub(eye, center));
    const x = Vec3.norm(Vec3.cross(up, z));
    const y = Vec3.cross(z, x);

    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -Vec3.dot(x, eye), -Vec3.dot(y, eye), -Vec3.dot(z, eye), 1
    ]);
  }

  static invert(m) {
    const inv = new Float32Array(16);
    inv[0] = m[5]  * m[10] * m[15] - m[5]  * m[11] * m[14] - m[9]  * m[6]  * m[15] + m[9]  * m[7]  * m[14] + m[13] * m[6]  * m[11] - m[13] * m[7]  * m[10];
    inv[4] = -m[4]  * m[10] * m[15] + m[4]  * m[11] * m[14] + m[8]  * m[6]  * m[15] - m[8]  * m[7]  * m[14] - m[12] * m[6]  * m[11] + m[12] * m[7]  * m[10];
    inv[8] = m[4]  * m[9] * m[15] - m[4]  * m[11] * m[13] - m[8]  * m[5] * m[15] + m[8]  * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
    inv[12] = -m[4]  * m[9] * m[14] + m[4]  * m[10] * m[13] + m[8]  * m[5] * m[14] - m[8]  * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
    inv[1] = -m[1]  * m[10] * m[15] + m[1]  * m[11] * m[14] + m[9]  * m[2] * m[15] - m[9]  * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
    inv[5] = m[0]  * m[10] * m[15] - m[0]  * m[11] * m[14] - m[8]  * m[2] * m[15] + m[8]  * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
    inv[9] = -m[0]  * m[9] * m[15] + m[0]  * m[11] * m[13] + m[8]  * m[1] * m[15] - m[8]  * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
    inv[13] = m[0]  * m[9] * m[14] - m[0]  * m[10] * m[13] - m[8]  * m[1] * m[14] + m[8]  * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
    inv[2] = m[1]  * m[6] * m[15] - m[1]  * m[7] * m[14] - m[5]  * m[2] * m[15] + m[5]  * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
    inv[6] = -m[0]  * m[6] * m[15] + m[0]  * m[7] * m[14] + m[4]  * m[2] * m[15] - m[4]  * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
    inv[10] = m[0]  * m[5] * m[15] - m[0]  * m[7] * m[13] - m[4]  * m[1] * m[15] + m[4]  * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
    inv[14] = -m[0]  * m[5] * m[14] + m[0]  * m[6] * m[13] + m[4]  * m[1] * m[14] - m[4]  * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
    inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
    inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
    inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
    inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];

    let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
    if (!det) return Mat4.identity();
    det = 1.0 / det;
    for (let i = 0; i < 16; i++) inv[i] *= det;
    return inv;
  }
}

export class SceneNode {
  constructor(name = 'node') {
    this.name = name;
    this.position = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.scale = [1, 1, 1];
    this.localMatrix = Mat4.identity();
    this.worldMatrix = Mat4.identity();
    this.children = [];
    this.parent = null;
    this.mesh = null;
    this.color = [1, 1, 1];
    this.roughness = 0.6;
    this.emissive = 0.0;
    this.visible = true;
    this.partIndex = -1;
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  updateWorldMatrix(parentWorldMatrix = null) {
    this.localMatrix = Mat4.compose(this.position, this.rotation, this.scale);
    if (parentWorldMatrix) {
      this.worldMatrix = Mat4.multiply(parentWorldMatrix, this.localMatrix);
    } else {
      this.worldMatrix = this.localMatrix;
    }
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].updateWorldMatrix(this.worldMatrix);
    }
  }
}

export class MeshPrimitives {
  /**
   * Builds a deformed organic UV sphere/ellipsoid with custom shape callback
   * `deformFn(x, y, z, u, v) => [nx, ny, nz]` and recomputes smooth vertex normals.
   */
  static createSculptedSphere(latBands = 28, lonBands = 36, deformFn = null) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const grid = [];
    for (let lat = 0; lat <= latBands; lat++) {
      const v = lat / latBands;
      const theta = v * Math.PI;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const row = [];
      for (let lon = 0; lon <= lonBands; lon++) {
        const u = lon / lonBands;
        const phi = u * Math.PI * 2;
        let x = Math.cos(phi) * sinTheta;
        let y = cosTheta;
        let z = Math.sin(phi) * sinTheta;
        if (deformFn) {
          const d = deformFn(x, y, z, u, v);
          x = d[0]; y = d[1]; z = d[2];
        }
        row.push([x, y, z]);
        uvs.push(u, v);
      }
      grid.push(row);
    }

    for (let lat = 0; lat <= latBands; lat++) {
      for (let lon = 0; lon <= lonBands; lon++) {
        const p = grid[lat][lon];
        positions.push(p[0], p[1], p[2]);

        const pL = grid[lat][ (lon - 1 + lonBands) % lonBands ];
        const pR = grid[lat][ (lon + 1) % lonBands ];
        const pU = grid[Math.max(0, lat - 1)][lon];
        const pD = grid[Math.min(latBands, lat + 1)][lon];

        const tx = Vec3.sub(pR, pL);
        const ty = Vec3.sub(pD, pU);
        let n = Vec3.cross(ty, tx);
        if (Vec3.len(n) < 1e-5) {
          n = Vec3.norm(p);
        } else {
          n = Vec3.norm(n);
        }
        normals.push(n[0], n[1], n[2]);
      }
    }

    for (let lat = 0; lat < latBands; lat++) {
      for (let lon = 0; lon < lonBands; lon++) {
        const first = lat * (lonBands + 1) + lon;
        const second = first + lonBands + 1;
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  static createCylinderDisc(radiusTop = 1, radiusBottom = 1, height = 0.2, radialSegments = 48) {
    return MeshPrimitives.createSculptedSphere(12, radialSegments, (x, y, z) => {
      const r = y >= 0 ? radiusTop : radiusBottom;
      const squashY = y * (height * 0.5);
      const radialScale = Math.sqrt(Math.max(0.001, 1 - y * y * 0.65));
      return [x * r / radialScale, squashY, z * r / radialScale];
    });
  }

  static createTorus(majorRadius = 0.72, tubeRadius = 0.09, radialSegs = 20, tubularSegs = 36) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let j = 0; j <= radialSegs; j++) {
      for (let i = 0; i <= tubularSegs; i++) {
        const u = (i / tubularSegs) * Math.PI * 2;
        const v = (j / radialSegs) * Math.PI * 2;

        const cx = (majorRadius + tubeRadius * Math.cos(v)) * Math.cos(u);
        const cy = tubeRadius * Math.sin(v);
        const cz = (majorRadius + tubeRadius * Math.cos(v)) * Math.sin(u);

        const nx = Math.cos(v) * Math.cos(u);
        const ny = Math.sin(v);
        const nz = Math.cos(v) * Math.sin(u);

        positions.push(cx, cy, cz);
        normals.push(nx, ny, nz);
        uvs.push(i / tubularSegs, j / radialSegs);
      }
    }

    for (let j = 1; j <= radialSegs; j++) {
      for (let i = 1; i <= tubularSegs; i++) {
        const a = (tubularSegs + 1) * j + i - 1;
        const b = (tubularSegs + 1) * (j - 1) + i - 1;
        const c = (tubularSegs + 1) * (j - 1) + i;
        const d = (tubularSegs + 1) * j + i;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }
}

export class Raycaster {
  static screenToRay(ndcX, ndcY, projMatrix, viewMatrix) {
    const vp = Mat4.multiply(projMatrix, viewMatrix);
    const invVP = Mat4.invert(vp);
    const nearPt = Vec3.transformMat4([ndcX, ndcY, -1], invVP);
    const farPt = Vec3.transformMat4([ndcX, ndcY, 1], invVP);
    const dir = Vec3.norm(Vec3.sub(farPt, nearPt));
    return { origin: nearPt, direction: dir };
  }

  static intersectSphere(ray, center, radius) {
    const oc = Vec3.sub(ray.origin, center);
    const b = Vec3.dot(oc, ray.direction);
    const c = Vec3.dot(oc, oc) - radius * radius;
    const disc = b * b - c;
    if (disc < 0) return null;
    const t = -b - Math.sqrt(disc);
    if (t < 0) return null;
    const point = Vec3.add(ray.origin, Vec3.scale(ray.direction, t));
    const normal = Vec3.norm(Vec3.sub(point, center));
    return { distance: t, point, normal };
  }

  static intersectGroundPlane(ray, planeY = 0) {
    if (Math.abs(ray.direction[1]) < 1e-5) return null;
    const t = (planeY - ray.origin[1]) / ray.direction[1];
    if (t < 0) return null;
    const point = Vec3.add(ray.origin, Vec3.scale(ray.direction, t));
    return { distance: t, point, normal: [0, 1, 0] };
  }
}

export class SceneManager {
  constructor() {
    this.root = new SceneNode('root');
    this.environmentCode = 'DREAM_ROOM';
    this.ambientColor = [0.96, 0.90, 0.96];
    this.keyLightDir = Vec3.norm([0.45, 0.78, 0.55]);
    this.keyLightColor = [1.0, 0.97, 0.94];
    this.rimLightColor = [0.78, 0.72, 1.0];
    this.groundShadowStrength = 0.28;
  }

  update() {
    this.root.updateWorldMatrix(null);
  }
}
