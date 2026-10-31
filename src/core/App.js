import { SceneManager, SceneNode, MeshPrimitives, Vec3 } from './SceneManager.js';
import { Renderer } from './Renderer.js';
import { CameraController } from './CameraController.js';
import { PerformanceManager } from './PerformanceManager.js';
import { FurRenderer } from '../fur/FurRenderer.js';
import { FurPhysics } from '../fur/FurPhysics.js';
import { FurInteraction } from '../fur/FurInteraction.js';
import { Character } from '../character/Character.js';
import { MouseController } from '../interaction/MouseController.js';
import { TouchController } from '../interaction/TouchController.js';
import { KeyboardController } from '../interaction/KeyboardController.js';
import { UIManager } from '../ui/UIManager.js';
import { SoundManager } from '../audio/SoundManager.js';
import { SaveManager, FUR_PALETTES } from '../storage/SaveManager.js';
import { DREAM_ROOM_ENV } from '../environment/DreamRoom.js';
import { FOREST_ENV } from '../environment/ForestEnvironment.js';
import { NIGHT_SKY_ENV } from '../environment/NightSky.js';

export const ENVIRONMENTS = {
  DREAM_ROOM: DREAM_ROOM_ENV,
  FOREST: FOREST_ENV,
  NIGHT_SKY: NIGHT_SKY_ENV
};

export class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.saveManager = new SaveManager();
    this.settings = this.saveManager.state;

    this.sound = new SoundManager(this.settings.soundEnabled);
    this.scene = new SceneManager();
    this.camera = new CameraController();
    this.perf = new PerformanceManager(this.settings.graphicsQuality);

    this.renderer = new Renderer(canvas);
    this.furRenderer = new FurRenderer(this.renderer.gl, this.renderer, 15000);
    this.furPhysics = new FurPhysics(this.furRenderer.guides);
    this.furInteraction = new FurInteraction(this.furPhysics);

    this.buildEnvironmentProps();
    this.character = new Character(
      this.renderer,
      this.scene,
      this.furPhysics,
      this.sound,
      this.settings
    );

    this.isBrushMode = false;
    this.ui = new UIManager(this);
    this.mouseController = new MouseController(canvas, this);
    this.touchController = new TouchController(canvas, this);
    this.keyboardController = new KeyboardController(this);

    this.setEnvironment(this.settings.environment);
    this.handleResize();

    window.addEventListener('resize', () => this.handleResize());
    document.addEventListener('visibilitychange', () => {
      this.perf.isTabHidden = document.hidden;
    });

    this.lastTime = performance.now();
    this.lastStatSaveTime = 0;
    this.lastRenderedStrands = 0;
  }

  buildEnvironmentProps() {
    const platTopGeom = this.renderer.uploadGeometry(
      MeshPrimitives.createCylinderDisc(2.15, 2.22, 0.14, 48)
    );
    const platBaseGeom = this.renderer.uploadGeometry(
      MeshPrimitives.createCylinderDisc(2.26, 2.34, 0.18, 48)
    );
    const sphereGeom = this.renderer.uploadGeometry(
      MeshPrimitives.createSculptedSphere(14, 18)
    );

    this.platformTop = new SceneNode('platformTop');
    this.platformTop.mesh = platTopGeom;
    this.platformTop.position = [0, -0.07, 0];
    this.platformTop.roughness = 0.85;
    this.scene.root.add(this.platformTop);

    this.platformBase = new SceneNode('platformBase');
    this.platformBase.mesh = platBaseGeom;
    this.platformBase.position = [0, -0.14, 0];
    this.platformBase.roughness = 0.90;
    this.scene.root.add(this.platformBase);

    // Forest decorative bushes & mushrooms around platform perimeter
    this.forestGroup = new SceneNode('forestProps');
    this.scene.root.add(this.forestGroup);
    const bushAngles = [0.6, 1.3, 2.1, 4.1, 4.9, 5.5];
    for (let i = 0; i < bushAngles.length; i++) {
      const ang = bushAngles[i];
      const rad = 1.82 + (i % 2) * 0.15;
      const bush = new SceneNode('bush_' + i);
      bush.mesh = sphereGeom;
      bush.position = [Math.cos(ang) * rad, 0.12, Math.sin(ang) * rad];
      bush.scale = [0.26, 0.20, 0.24];
      bush.color = i % 2 === 0 ? [0.36, 0.74, 0.48] : [0.46, 0.82, 0.54];
      this.forestGroup.add(bush);
    }

    // Night sky glowing 3D stars
    this.nightGroup = new SceneNode('nightProps');
    this.scene.root.add(this.nightGroup);
    for (let i = 0; i < 18; i++) {
      const star = new SceneNode('star_' + i);
      star.mesh = sphereGeom;
      const angle = (i / 18) * Math.PI * 2;
      const dist = 3.2 + (i % 3) * 0.9;
      star.position = [
        Math.cos(angle) * dist,
        1.1 + (i % 5) * 0.52,
        -1.5 - Math.abs(Math.sin(angle)) * 2.2
      ];
      const s = 0.045 + (i % 3) * 0.02;
      star.scale = [s, s, s];
      star.color = [1.0, 0.96, 0.78];
      star.emissive = 0.9;
      this.nightGroup.add(star);
    }

    // Floating 3D Emotion & Ambient Particles
    this.particles = [];
    this.particleGroup = new SceneNode('particles');
    this.scene.root.add(this.particleGroup);
    for (let i = 0; i < 20; i++) {
      const pNode = new SceneNode('particle_' + i);
      pNode.mesh = sphereGeom;
      pNode.visible = false;
      pNode.emissive = 0.65;
      this.particleGroup.add(pNode);
      this.particles.push({
        node: pNode,
        life: 0,
        maxLife: 1,
        vel: [0, 0, 0]
      });
    }
  }

  spawnParticles(type = 'heart', count = 4) {
    let spawned = 0;
    const headPos = Vec3.transformMat4([0, 0.35, 0.2], this.character.headNode.worldMatrix);
    for (const p of this.particles) {
      if (p.life <= 0 && spawned < count) {
        p.life = 0.85 + Math.random() * 0.45;
        p.maxLife = p.life;
        p.node.visible = true;
        p.node.position = [
          headPos[0] + (Math.random() - 0.5) * 0.7,
          headPos[1] + (Math.random() - 0.2) * 0.4,
          headPos[2] + (Math.random() - 0.5) * 0.5
        ];
        p.vel = [
          (Math.random() - 0.5) * 0.6,
          0.85 + Math.random() * 0.65,
          (Math.random() - 0.5) * 0.6
        ];
        p.node.color = type === 'heart' ? [1.0, 0.45, 0.68] : [1.0, 0.92, 0.45];
        spawned++;
      }
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      if (p.life > 0) {
        p.life -= dt;
        if (p.life <= 0) {
          p.node.visible = false;
        } else {
          p.node.position[0] += p.vel[0] * dt;
          p.node.position[1] += p.vel[1] * dt;
          p.node.position[2] += p.vel[2] * dt;
          const s = 0.055 * Math.sin((p.life / p.maxLife) * Math.PI);
          p.node.scale = [s, s, s];
        }
      }
    }
  }

  setEnvironment(envCode) {
    const env = ENVIRONMENTS[envCode] || ENVIRONMENTS.DREAM_ROOM;
    this.settings.environment = env.code;
    this.saveManager.save({ environment: env.code });

    const container = document.getElementById('app-container');
    if (container) {
      container.style.background = env.cssBackground;
      container.dataset.env = env.code;
    }

    this.scene.environmentCode = env.code;
    this.scene.ambientColor = [...env.ambientColor];
    this.scene.keyLightDir = Vec3.norm(env.keyLightDir);
    this.scene.keyLightColor = [...env.keyLightColor];
    this.scene.rimLightColor = [...env.rimLightColor];

    this.platformTop.color = [...env.platformTopColor];
    this.platformBase.color = [...env.platformRimColor];

    this.forestGroup.visible = (env.code === 'FOREST');
    this.nightGroup.visible = (env.code === 'NIGHT_SKY');

    if (this.ui) this.ui.syncAll();
  }

  setBrushMode(flag) {
    this.isBrushMode = !!flag;
    this.canvas.classList.toggle('mode-brush', this.isBrushMode);
    if (this.ui) this.ui.syncAll();
  }

  triggerAction(action) {
    if (action === 'pet') {
      const msg = this.character.triggerPet((t, n) => this.spawnParticles(t, n));
      this.furPhysics.applyGlobalShakeImpulse(0.3);
      this.ui.showToast(msg);
    } else if (action === 'brush') {
      this.setBrushMode(!this.isBrushMode);
      if (this.isBrushMode) {
        this.character.triggerBrush((t, n) => this.spawnParticles(t, n));
        this.furPhysics.applyGlobalShakeImpulse(0.35);
        this.ui.showToast('Brush mode ON — drag across fur to groom!');
      } else {
        this.ui.showToast('Brush mode OFF');
      }
    } else if (action === 'jump') {
      const msg = this.character.triggerJump((t, n) => this.spawnParticles(t, n));
      this.ui.showToast(msg);
    } else if (action === 'sleep') {
      const msg = this.character.toggleSleep();
      this.ui.showToast(msg);
    } else if (action === 'shake') {
      const msg = this.character.triggerShake((t, n) => this.spawnParticles(t, n));
      this.ui.showToast(msg);
    } else if (action === 'wind') {
      const next = !this.settings.windEnabled;
      this.updateSetting('windEnabled', next);
      this.ui.showToast(next ? 'Gentle breeze enabled!' : 'Breeze paused');
    } else if (action === 'reset-cam') {
      this.camera.reset();
      this.ui.showToast('Camera view reset');
    }
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveManager.save({ [key]: value });

    if (key === 'graphicsQuality') {
      this.perf.setQuality(value);
      this.handleResize();
    }
    if (key === 'furColor' || key === 'eyeColor' || key === 'accessory') {
      this.character.applyCustomization(this.settings);
    }
    if (this.ui) this.ui.syncAll();
  }

  resetAllSettings() {
    this.settings = this.saveManager.reset();
    this.perf.setQuality(this.settings.graphicsQuality);
    this.sound.setEnabled(this.settings.soundEnabled);
    this.character.applyCustomization(this.settings);
    this.setEnvironment(this.settings.environment);
    this.handleResize();
  }

  handleResize() {
    const dprCap = this.perf.getPreset().dprCap;
    const { width, height } = this.renderer.resize(dprCap);
    this.camera.resize(width, height);
  }

  advanceSimulation(rawDt) {
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    this.character.update(dt, this.settings);
    this.updateParticles(dt);
    this.scene.update();

    const partMatrices = this.character.getPartMatrices();
    this.furPhysics.update(dt, partMatrices, this.settings);

    this.camera.update(dt, this.character.rootNode.position, this.settings.reducedMotion);

    this.renderer.clear();
    this.renderer.renderSceneNodes(
      this.scene.root,
      this.camera,
      this.scene,
      this.character.rootNode.position,
      this.settings
    );

    const activeRatio = this.perf.getActiveRatio(this.settings.furDensity);
    const palette = FUR_PALETTES[this.settings.furColor] || FUR_PALETTES.white;
    this.lastRenderedStrands = this.furRenderer.render(
      this.camera,
      this.scene,
      partMatrices,
      this.furPhysics,
      palette,
      this.settings,
      activeRatio
    );

    this.perf.update(dt);
    this.ui.updateHUD(
      this.character.personality,
      this.character.stateMachine,
      this.perf.fps,
      this.lastRenderedStrands
    );

    // Periodically persist personality stats
    this.lastStatSaveTime += dt;
    if (this.lastStatSaveTime > 4.0) {
      this.lastStatSaveTime = 0;
      this.saveManager.save({
        stats: {
          happiness: this.character.personality.happiness,
          energy: this.character.personality.energy,
          affection: this.character.personality.affection,
          curiosity: this.character.personality.curiosity,
          sleepiness: this.character.personality.sleepiness
        }
      });
    }
  }

  step(now) {
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (!this.perf.isTabHidden) {
      this.advanceSimulation(rawDt);
    }

    this.rafId = requestAnimationFrame((t) => this.step(t));
  }

  start() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame((t) => {
      this.lastTime = t;
      this.step(t);
    });
  }
}
