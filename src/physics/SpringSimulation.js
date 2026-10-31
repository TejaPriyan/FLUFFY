export class Spring1D {
  constructor(stiffness = 140, damping = 14, initialValue = 0) {
    this.value = initialValue;
    this.target = initialValue;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  impulse(force) {
    this.velocity += force;
  }

  update(dt) {
    const safeDt = Math.min(dt, 0.05);
    const accel = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
    this.velocity += accel * safeDt;
    this.value += this.velocity * safeDt;
    return this.value;
  }
}

export class Spring3D {
  constructor(stiffness = 120, damping = 12) {
    this.x = new Spring1D(stiffness, damping, 0);
    this.y = new Spring1D(stiffness, damping, 0);
    this.z = new Spring1D(stiffness, damping, 0);
  }

  setTarget(tx, ty, tz) {
    this.x.target = tx;
    this.y.target = ty;
    this.z.target = tz;
  }

  impulse(fx, fy, fz) {
    this.x.impulse(fx);
    this.y.impulse(fy);
    this.z.impulse(fz);
  }

  update(dt) {
    this.x.update(dt);
    this.y.update(dt);
    this.z.update(dt);
    return [this.x.value, this.y.value, this.z.value];
  }
}
