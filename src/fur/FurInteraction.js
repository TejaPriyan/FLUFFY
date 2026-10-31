import { Raycaster, Vec3 } from '../core/SceneManager.js';

export class FurInteraction {
  constructor(furPhysics) {
    this.furPhysics = furPhysics;
    this.lastHitPoint = null;
  }

  /**
   * Raycasts against the character's head, body, ears, and ground platform.
   */
  raycastCharacter(ndcX, ndcY, camera, character) {
    const ray = Raycaster.screenToRay(ndcX, ndcY, camera.projMatrix, camera.viewMatrix);

    const headWorldPos = Vec3.transformMat4([0, 0, 0], character.headNode.worldMatrix);
    const bodyWorldPos = Vec3.transformMat4([0, 0, 0], character.bodyNode.worldMatrix);

    const hitHead = Raycaster.intersectSphere(ray, headWorldPos, 0.72);
    const hitBody = Raycaster.intersectSphere(ray, bodyWorldPos, 0.78);
    const hitGround = Raycaster.intersectGroundPlane(ray, 0.0);

    if (hitHead && (!hitBody || hitHead.distance <= hitBody.distance + 0.08)) {
      return { region: 'head', ...hitHead, ray };
    }
    if (hitBody) {
      // Check if click was near the bottom feet area
      if (hitBody.point[1] < character.rootNode.position[1] + 0.32) {
        return { region: 'feet', ...hitBody, ray };
      }
      return { region: 'body', ...hitBody, ray };
    }
    if (hitGround && Vec3.len([hitGround.point[0], 0, hitGround.point[2]]) < 2.35) {
      return { region: 'ground', ...hitGround, ray };
    }
    return null;
  }

  handlePointerStroke(hit, partMatrices, isBrushMode = false) {
    if (!hit || (hit.region !== 'head' && hit.region !== 'body' && hit.region !== 'feet')) {
      this.lastHitPoint = null;
      return false;
    }

    let strokeVec = [0, -0.8, 0];
    if (this.lastHitPoint) {
      const delta = Vec3.sub(hit.point, this.lastHitPoint);
      if (Vec3.len(delta) > 0.002) {
        strokeVec = Vec3.scale(Vec3.norm(delta), isBrushMode ? 5.5 : 3.4);
      }
    } else {
      // Initial tap/pet gently parts fur outward from normal
      strokeVec = Vec3.scale(hit.normal, 2.2);
    }

    this.lastHitPoint = hit.point;
    this.furPhysics.applyLocalForce(
      hit.point,
      strokeVec,
      isBrushMode ? 0.82 : 0.65,
      isBrushMode,
      partMatrices
    );
    return true;
  }
}
