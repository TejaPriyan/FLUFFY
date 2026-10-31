import { SceneNode, MeshPrimitives } from '../core/SceneManager.js';
import { FUR_PALETTES, EYE_PALETTES } from '../storage/SaveManager.js';

export class CharacterBuilder {
  static build(renderer) {
    const rootNode = new SceneNode('characterRoot');
    rootNode.position = [0, 0, 0];

    // Shared procedural geometries
    const sphereGeom = renderer.uploadGeometry(MeshPrimitives.createSculptedSphere(24, 32));
    const torusGeom = renderer.uploadGeometry(MeshPrimitives.createTorus(0.58, 0.065, 16, 32));

    // Organic pear-bean body mesh
    const bodyGeom = renderer.uploadGeometry(
      MeshPrimitives.createSculptedSphere(28, 36, (x, y, z) => {
        const bellyBulge = 1.0 + Math.max(0, -y + 0.2) * 0.22;
        return [x * 0.76 * bellyBulge, y * 0.66, z * 0.72 * bellyBulge];
      })
    );

    // Chubby-cheeked head mesh
    const headGeom = renderer.uploadGeometry(
      MeshPrimitives.createSculptedSphere(28, 36, (x, y, z) => {
        const cheekExpand = 1.0 + Math.max(0, -y * 0.5 + 0.15) * 0.26 * Math.abs(x);
        return [x * 0.70 * cheekExpand, y * 0.56, z * 0.63];
      })
    );

    // Tapered rounded ear capsule
    const earGeom = renderer.uploadGeometry(
      MeshPrimitives.createSculptedSphere(20, 24, (x, y, z) => {
        const taper = 1.0 - Math.max(0, y) * 0.28;
        return [x * 0.19 * taper, (y + 0.7) * 0.25, z * 0.10];
      })
    );

    // Body Node (Part 0)
    const bodyPivot = new SceneNode('bodyPivot');
    bodyPivot.position = [0, 0.68, 0];
    rootNode.add(bodyPivot);

    const bodyNode = new SceneNode('body');
    bodyNode.mesh = bodyGeom;
    bodyNode.color = [...FUR_PALETTES.white.skin];
    bodyNode.roughness = 0.75;
    bodyNode.partIndex = 0;
    bodyPivot.add(bodyNode);

    // Head Node (Part 1)
    const headPivot = new SceneNode('headPivot');
    headPivot.position = [0, 0.62, 0.06];
    bodyPivot.add(headPivot);

    const headNode = new SceneNode('head');
    headNode.mesh = headGeom;
    headNode.color = [...FUR_PALETTES.white.skin];
    headNode.roughness = 0.72;
    headNode.partIndex = 1;
    headPivot.add(headNode);

    // Left & Right Ears (Parts 2 & 3)
    const leftEarNode = new SceneNode('leftEar');
    leftEarNode.mesh = earGeom;
    leftEarNode.position = [-0.42, 0.44, -0.02];
    leftEarNode.rotation = [0.08, 0.0, 0.36];
    leftEarNode.color = [...FUR_PALETTES.white.skin];
    leftEarNode.partIndex = 2;
    headNode.add(leftEarNode);

    const leftInnerEar = new SceneNode('leftInnerEar');
    leftInnerEar.mesh = sphereGeom;
    leftInnerEar.position = [0, 0.17, 0.075];
    leftInnerEar.scale = [0.10, 0.16, 0.035];
    leftInnerEar.color = [0.97, 0.68, 0.74];
    leftInnerEar.roughness = 0.65;
    leftEarNode.add(leftInnerEar);

    const rightEarNode = new SceneNode('rightEar');
    rightEarNode.mesh = earGeom;
    rightEarNode.position = [0.42, 0.44, -0.02];
    rightEarNode.rotation = [0.08, 0.0, -0.36];
    rightEarNode.color = [...FUR_PALETTES.white.skin];
    rightEarNode.partIndex = 3;
    headNode.add(rightEarNode);

    const rightInnerEar = new SceneNode('rightInnerEar');
    rightInnerEar.mesh = sphereGeom;
    rightInnerEar.position = [0, 0.17, 0.075];
    rightInnerEar.scale = [0.10, 0.16, 0.035];
    rightInnerEar.color = [0.97, 0.68, 0.74];
    rightInnerEar.roughness = 0.65;
    rightEarNode.add(rightInnerEar);

    // Tail Node (Part 4)
    const tailNode = new SceneNode('tail');
    tailNode.mesh = sphereGeom;
    tailNode.position = [0, -0.14, -0.74];
    tailNode.scale = [0.25, 0.25, 0.27];
    tailNode.color = [...FUR_PALETTES.white.skin];
    tailNode.partIndex = 4;
    bodyPivot.add(tailNode);

    // Cute Stubby Arms / Paws
    const leftArm = new SceneNode('leftArm');
    leftArm.mesh = sphereGeom;
    leftArm.position = [-0.66, 0.02, 0.25];
    leftArm.rotation = [0.2, 0, 0.45];
    leftArm.scale = [0.16, 0.24, 0.16];
    leftArm.color = [...FUR_PALETTES.white.tip];
    bodyPivot.add(leftArm);

    const rightArm = new SceneNode('rightArm');
    rightArm.mesh = sphereGeom;
    rightArm.position = [0.66, 0.02, 0.25];
    rightArm.rotation = [0.2, 0, -0.45];
    rightArm.scale = [0.16, 0.24, 0.16];
    rightArm.color = [...FUR_PALETTES.white.tip];
    bodyPivot.add(rightArm);

    // Chubby Feet + Pink Toe Pads
    const leftFoot = new SceneNode('leftFoot');
    leftFoot.mesh = sphereGeom;
    leftFoot.position = [-0.34, -0.58, 0.24];
    leftFoot.scale = [0.21, 0.13, 0.27];
    leftFoot.color = [...FUR_PALETTES.white.tip];
    bodyPivot.add(leftFoot);

    const leftPad = new SceneNode('leftPad');
    leftPad.mesh = sphereGeom;
    leftPad.position = [0, -0.15, 0.55];
    leftPad.scale = [0.52, 0.42, 0.48];
    leftPad.color = [0.97, 0.66, 0.74];
    leftFoot.add(leftPad);

    const rightFoot = new SceneNode('rightFoot');
    rightFoot.mesh = sphereGeom;
    rightFoot.position = [0.34, -0.58, 0.24];
    rightFoot.scale = [0.21, 0.13, 0.27];
    rightFoot.color = [...FUR_PALETTES.white.tip];
    bodyPivot.add(rightFoot);

    const rightPad = new SceneNode('rightPad');
    rightPad.mesh = sphereGeom;
    rightPad.position = [0, -0.15, 0.55];
    rightPad.scale = [0.52, 0.42, 0.48];
    rightPad.color = [0.97, 0.66, 0.74];
    rightFoot.add(rightPad);

    // Expressive Oversized Glossy Eyes
    const buildEye = (sideSign) => {
      const eyeGroup = new SceneNode(sideSign < 0 ? 'leftEyeGroup' : 'rightEyeGroup');
      eyeGroup.position = [sideSign * 0.24, 0.04, 0.61];

      // Colored iris dome
      const iris = new SceneNode('iris');
      iris.mesh = sphereGeom;
      iris.scale = [0.135, 0.155, 0.075];
      iris.color = [...EYE_PALETTES.amber.color];
      iris.roughness = 0.12;
      eyeGroup.add(iris);

      // Deep dark velvet pupil center
      const pupil = new SceneNode('pupil');
      pupil.mesh = sphereGeom;
      pupil.position = [0, 0, 0.032];
      pupil.scale = [0.095, 0.112, 0.055];
      pupil.color = [0.06, 0.05, 0.08];
      pupil.roughness = 0.08;
      eyeGroup.add(pupil);

      // Primary bright starlight catchlight
      const specMain = new SceneNode('specMain');
      specMain.mesh = sphereGeom;
      specMain.position = [-0.038 * sideSign, 0.048, 0.078];
      specMain.scale = [0.036, 0.040, 0.02];
      specMain.color = [1.0, 1.0, 1.0];
      specMain.emissive = 0.85;
      eyeGroup.add(specMain);

      // Secondary lower sparkle catchlight
      const specSub = new SceneNode('specSub');
      specSub.mesh = sphereGeom;
      specSub.position = [0.032 * sideSign, -0.042, 0.076];
      specSub.scale = [0.018, 0.018, 0.015];
      specSub.color = [1.0, 1.0, 1.0];
      specSub.emissive = 0.85;
      eyeGroup.add(specSub);

      return { eyeGroup, iris, pupil };
    };

    const leftEye = buildEye(-1);
    const rightEye = buildEye(1);
    headNode.add(leftEye.eyeGroup);
    headNode.add(rightEye.eyeGroup);

    // Expressive Eyebrows
    const leftBrow = new SceneNode('leftBrow');
    leftBrow.mesh = sphereGeom;
    leftBrow.position = [-0.24, 0.23, 0.62];
    leftBrow.rotation = [0, 0, 0.12];
    leftBrow.scale = [0.095, 0.026, 0.032];
    leftBrow.color = [0.35, 0.28, 0.32];
    headNode.add(leftBrow);

    const rightBrow = new SceneNode('rightBrow');
    rightBrow.mesh = sphereGeom;
    rightBrow.position = [0.24, 0.23, 0.62];
    rightBrow.rotation = [0, 0, -0.12];
    rightBrow.scale = [0.095, 0.026, 0.032];
    rightBrow.color = [0.35, 0.28, 0.32];
    headNode.add(rightBrow);

    // Tiny Boopable Berry Nose
    const nose = new SceneNode('nose');
    nose.mesh = sphereGeom;
    nose.position = [0, -0.04, 0.66];
    nose.scale = [0.056, 0.040, 0.042];
    nose.color = [0.95, 0.46, 0.58];
    nose.roughness = 0.3;
    headNode.add(nose);

    // Rosy Cheek Blushes
    const leftBlush = new SceneNode('leftBlush');
    leftBlush.mesh = sphereGeom;
    leftBlush.position = [-0.38, -0.07, 0.56];
    leftBlush.rotation = [0, -0.42, 0];
    leftBlush.scale = [0.095, 0.055, 0.028];
    leftBlush.color = [1.0, 0.55, 0.68];
    leftBlush.emissive = 0.18;
    headNode.add(leftBlush);

    const rightBlush = new SceneNode('rightBlush');
    rightBlush.mesh = sphereGeom;
    rightBlush.position = [0.38, -0.07, 0.56];
    rightBlush.rotation = [0, 0.42, 0];
    rightBlush.scale = [0.095, 0.055, 0.028];
    rightBlush.color = [1.0, 0.55, 0.68];
    rightBlush.emissive = 0.18;
    headNode.add(rightBlush);

    // Expressive 3D Sculpted Mouth ("w" cat smile + open happy/surprised tongue)
    const mouthGroup = new SceneNode('mouthGroup');
    mouthGroup.position = [0, -0.13, 0.645];
    headNode.add(mouthGroup);

    const mouthLeft = new SceneNode('mouthLeft');
    mouthLeft.mesh = sphereGeom;
    mouthLeft.position = [-0.036, 0, 0];
    mouthLeft.rotation = [0, 0, 0.32];
    mouthLeft.scale = [0.044, 0.015, 0.018];
    mouthLeft.color = [0.36, 0.22, 0.28];
    mouthGroup.add(mouthLeft);

    const mouthRight = new SceneNode('mouthRight');
    mouthRight.mesh = sphereGeom;
    mouthRight.position = [0.036, 0, 0];
    mouthRight.rotation = [0, 0, -0.32];
    mouthRight.scale = [0.044, 0.015, 0.018];
    mouthRight.color = [0.36, 0.22, 0.28];
    mouthGroup.add(mouthRight);

    const mouthOpen = new SceneNode('mouthOpen');
    mouthOpen.mesh = sphereGeom;
    mouthOpen.position = [0, -0.018, -0.005];
    mouthOpen.scale = [0.042, 0.001, 0.02];
    mouthOpen.color = [0.94, 0.42, 0.54];
    mouthGroup.add(mouthOpen);

    // 4 Selectable 3D Accessories
    // 1. Small Bow (on head near left ear)
    const bowGroup = new SceneNode('accessory_bow');
    bowGroup.position = [-0.28, 0.45, 0.25];
    bowGroup.rotation = [0.15, 0.25, 0.32];
    headNode.add(bowGroup);

    const bowKnot = new SceneNode('bowKnot');
    bowKnot.mesh = sphereGeom;
    bowKnot.scale = [0.055, 0.055, 0.048];
    bowKnot.color = [1.0, 0.36, 0.58];
    bowGroup.add(bowKnot);

    const bowLoopL = new SceneNode('bowLoopL');
    bowLoopL.mesh = sphereGeom;
    bowLoopL.position = [-0.095, 0.01, 0];
    bowLoopL.rotation = [0, 0, 0.2];
    bowLoopL.scale = [0.095, 0.068, 0.038];
    bowLoopL.color = [1.0, 0.44, 0.66];
    bowGroup.add(bowLoopL);

    const bowLoopR = new SceneNode('bowLoopR');
    bowLoopR.mesh = sphereGeom;
    bowLoopR.position = [0.095, 0.01, 0];
    bowLoopR.rotation = [0, 0, -0.2];
    bowLoopR.scale = [0.095, 0.068, 0.038];
    bowLoopR.color = [1.0, 0.44, 0.66];
    bowGroup.add(bowLoopR);

    // 2. Collar with Golden Bell (around neck)
    const collarGroup = new SceneNode('accessory_collar');
    collarGroup.position = [0, 0.36, 0.05];
    collarGroup.rotation = [0.12, 0, 0];
    collarGroup.visible = false;
    bodyPivot.add(collarGroup);

    const collarRing = new SceneNode('collarRing');
    collarRing.mesh = torusGeom;
    collarRing.color = [0.92, 0.26, 0.36];
    collarRing.roughness = 0.4;
    collarGroup.add(collarRing);

    const collarBell = new SceneNode('collarBell');
    collarBell.mesh = sphereGeom;
    collarBell.position = [0, -0.06, 0.60];
    collarBell.scale = [0.085, 0.085, 0.085];
    collarBell.color = [1.0, 0.82, 0.24];
    collarBell.roughness = 0.18;
    collarGroup.add(collarBell);

    // 3. Tiny Hat (perched on top of head)
    const hatGroup = new SceneNode('accessory_hat');
    hatGroup.position = [0.05, 0.54, 0.04];
    hatGroup.rotation = [-0.08, 0, -0.10];
    hatGroup.visible = false;
    headNode.add(hatGroup);

    const hatBrim = new SceneNode('hatBrim');
    hatBrim.mesh = sphereGeom;
    hatBrim.scale = [0.34, 0.04, 0.34];
    hatBrim.color = [0.46, 0.38, 0.88];
    hatGroup.add(hatBrim);

    const hatCrown = new SceneNode('hatCrown');
    hatCrown.mesh = sphereGeom;
    hatCrown.position = [0, 0.14, 0];
    hatCrown.scale = [0.22, 0.18, 0.22];
    hatCrown.color = [0.56, 0.48, 0.96];
    hatGroup.add(hatCrown);

    const hatPom = new SceneNode('hatPom');
    hatPom.mesh = sphereGeom;
    hatPom.position = [0, 0.32, 0];
    hatPom.scale = [0.075, 0.075, 0.075];
    hatPom.color = [1.0, 0.92, 0.55];
    hatGroup.add(hatPom);

    // 4. Cozy Scarf (wrapped around neck with hanging tail)
    const scarfGroup = new SceneNode('accessory_scarf');
    scarfGroup.position = [0, 0.35, 0.06];
    scarfGroup.rotation = [0.10, 0, 0];
    scarfGroup.visible = false;
    bodyPivot.add(scarfGroup);

    const scarfWrap = new SceneNode('scarfWrap');
    scarfWrap.mesh = torusGeom;
    scarfWrap.scale = [1.06, 1.45, 1.06];
    scarfWrap.color = [0.96, 0.46, 0.38];
    scarfGroup.add(scarfWrap);

    const scarfTail = new SceneNode('scarfTail');
    scarfTail.mesh = sphereGeom;
    scarfTail.position = [0.22, -0.18, 0.56];
    scarfTail.rotation = [0.15, 0, -0.18];
    scarfTail.scale = [0.11, 0.22, 0.055];
    scarfTail.color = [0.96, 0.46, 0.38];
    scarfGroup.add(scarfTail);

    return {
      rootNode,
      bodyPivot,
      bodyNode,
      headPivot,
      headNode,
      leftEarNode,
      rightEarNode,
      tailNode,
      leftArm,
      rightArm,
      leftFoot,
      rightFoot,
      leftEye,
      rightEye,
      leftBrow,
      rightBrow,
      nose,
      leftBlush,
      rightBlush,
      mouthGroup,
      mouthLeft,
      mouthRight,
      mouthOpen,
      accessories: {
        bow: bowGroup,
        collar: collarGroup,
        hat: hatGroup,
        scarf: scarfGroup
      }
    };
  }
}
