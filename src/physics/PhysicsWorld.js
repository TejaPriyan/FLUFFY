import { Spring1D, Spring3D } from './SpringSimulation.js';

export class PhysicsWorld {
  constructor() {
    this.gravity = -22.0;
    this.groundY = 0.0;

    // Vertical jump & ground physics
    this.posY = 0.0;
    this.velY = 0.0;
    this.isGrounded = true;

    // Horizontal platform position (walking)
    this.posX = 0.0;
    this.posZ = 0.0;
    this.velX = 0.0;
    this.velZ = 0.0;
    this.facingYaw = 0.0;

    // Secondary motion springs
    this.bodySquash = new Spring1D(210, 15, 0); // +y stretch / -y squash
    this.bodyTilt = new Spring3D(130, 12);
    this.earLeftSpring = new Spring3D(150, 10);
    this.earRightSpring = new Spring3D(150, 10);
    this.tailSpring = new Spring3D(165, 11);
    this.headSpring = new Spring3D(140, 14);

    // Frame deltas for fur inertia
    this.deltaPos = [0, 0, 0];
    this.angularVelYaw = 0;
  }

  triggerJump(jumpSpeed = 7.4) {
    if (!this.isGrounded && this.posY > 0.15) return false;
    this.velY = jumpSpeed;
    this.isGrounded = false;
    this.bodySquash.impulse(3.6);
    this.earLeftSpring.impulse(0, -4.5, 1.5);
    this.earRightSpring.impulse(0, -4.5, 1.5);
    this.tailSpring.impulse(0, -3.5, 0);
    return true;
  }

  update(dt, onLandCallback) {
    const safeDt = Math.min(dt, 0.05);
    const prevX = this.posX;
    const prevY = this.posY;
    const prevZ = this.posZ;

    if (!this.isGrounded || this.velY > 0) {
      this.velY += this.gravity * safeDt;
      this.posY += this.velY * safeDt;

      // Ear drag while airborne
      const airForce = -this.velY * 0.04;
      this.earLeftSpring.setTarget(airForce, 0, airForce * 0.5);
      this.earRightSpring.setTarget(airForce, 0, -airForce * 0.5);

      if (this.posY <= this.groundY) {
        const impactSpeed = Math.abs(this.velY);
        this.posY = this.groundY;
        this.velY = 0;
        this.isGrounded = true;

        // Landing squash and ear/tail secondary bounce!
        const squashImpulse = -Math.min(impactSpeed * 0.65, 5.5);
        this.bodySquash.impulse(squashImpulse);
        this.earLeftSpring.impulse(3.8, -5.0, -2.5);
        this.earRightSpring.impulse(3.8, -5.0, 2.5);
        this.tailSpring.impulse(-4.5, -3.5, 0);
        this.earLeftSpring.setTarget(0, 0, 0);
        this.earRightSpring.setTarget(0, 0, 0);

        if (onLandCallback && impactSpeed > 1.5) {
          onLandCallback(impactSpeed);
        }
      }
    }

    this.bodySquash.update(safeDt);
    this.bodyTilt.update(safeDt);
    this.earLeftSpring.update(safeDt);
    this.earRightSpring.update(safeDt);
    this.tailSpring.update(safeDt);
    this.headSpring.update(safeDt);

    this.deltaPos[0] = (this.posX - prevX) / Math.max(safeDt, 0.001);
    this.deltaPos[1] = (this.posY - prevY) / Math.max(safeDt, 0.001);
    this.deltaPos[2] = (this.posZ - prevZ) / Math.max(safeDt, 0.001);
  }
}
