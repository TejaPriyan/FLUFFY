import { FUR_VERTEX_SHADER_GL2, FUR_FRAGMENT_SHADER_GL2 } from './FurShaders.js';
import { FurGenerator } from './FurGenerator.js';

export class FurRenderer {
  constructor(gl, renderer, maxStrands = 15000) {
    this.gl = gl;
    this.renderer = renderer;
    this.maxStrands = maxStrands;

    const tpl = FurGenerator.buildTemplateGeometry();
    const data = FurGenerator.generateGuidesAndStrands(maxStrands);
    this.guides = data.guides;
    this.totalStrands = data.totalStrands;
    this.indexCount = tpl.indices.length;

    this.program = renderer.createProgram(FUR_VERTEX_SHADER_GL2, FUR_FRAGMENT_SHADER_GL2);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // 0: Template vertex positions
    const tplPosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tplPosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, tpl.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    // Template indices
    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tpl.indices, gl.STATIC_DRAW);

    // 1: Instance rootPos
    const rootBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rootBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data.rootPositions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);

    // 2: Instance normal
    const normBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);

    // 3: Instance strandMeta
    const metaBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, metaBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data.strandMeta, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(3, 1);

    // 4: Instance guideInfo
    const guideBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, guideBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data.guideInfo, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(4, 1);

    gl.bindVertexArray(null);

    // Cache uniform locations
    this.u = {
      proj: gl.getUniformLocation(this.program, 'u_proj'),
      view: gl.getUniformLocation(this.program, 'u_view'),
      partMatrices: gl.getUniformLocation(this.program, 'u_partMatrices[0]'),
      guideDisplacements: gl.getUniformLocation(this.program, 'u_guideDisplacements[0]'),
      cameraPos: gl.getUniformLocation(this.program, 'u_cameraPos'),
      furLength: gl.getUniformLocation(this.program, 'u_furLength'),
      time: gl.getUniformLocation(this.program, 'u_time'),
      windStrength: gl.getUniformLocation(this.program, 'u_windStrength'),
      windEnabled: gl.getUniformLocation(this.program, 'u_windEnabled'),
      rootColor: gl.getUniformLocation(this.program, 'u_rootColor'),
      tipColor: gl.getUniformLocation(this.program, 'u_tipColor'),
      keyLightDir: gl.getUniformLocation(this.program, 'u_keyLightDir'),
      keyLightColor: gl.getUniformLocation(this.program, 'u_keyLightColor'),
      rimLightColor: gl.getUniformLocation(this.program, 'u_rimLightColor'),
      ambientColor: gl.getUniformLocation(this.program, 'u_ambientColor'),
      shadowStrength: gl.getUniformLocation(this.program, 'u_shadowStrength')
    };

    this.partMatrixFlat = new Float32Array(5 * 16);
  }

  render(camera, scene, partMatrices, furPhysics, palette, settings, activeRatio) {
    const gl = this.gl;
    const instanceCount = Math.max(800, Math.floor(this.totalStrands * activeRatio));

    for (let i = 0; i < 5; i++) {
      this.partMatrixFlat.set(partMatrices[i], i * 16);
    }

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.uniformMatrix4fv(this.u.proj, false, camera.projMatrix);
    gl.uniformMatrix4fv(this.u.view, false, camera.viewMatrix);
    gl.uniformMatrix4fv(this.u.partMatrices, false, this.partMatrixFlat);
    gl.uniform3fv(this.u.guideDisplacements, furPhysics.displacementsFlat);
    gl.uniform3fv(this.u.cameraPos, camera.eyePosition);

    gl.uniform1f(this.u.furLength, settings.furLength || 1.0);
    gl.uniform1f(this.u.time, furPhysics.time);
    gl.uniform1f(this.u.windStrength, settings.windStrength || 0.45);
    gl.uniform1f(this.u.windEnabled, settings.windEnabled ? 1.0 : 0.0);

    gl.uniform3fv(this.u.rootColor, palette.root);
    gl.uniform3fv(this.u.tipColor, palette.tip);
    gl.uniform3fv(this.u.keyLightDir, scene.keyLightDir);
    gl.uniform3fv(this.u.keyLightColor, scene.keyLightColor);
    gl.uniform3fv(this.u.rimLightColor, scene.rimLightColor);
    gl.uniform3fv(this.u.ambientColor, scene.ambientColor);

    const shadowMult = settings.shadowQuality === 'OFF' ? 0.0 :
                       settings.shadowQuality === 'LOW' ? 0.5 :
                       settings.shadowQuality === 'MEDIUM' ? 0.85 : 1.15;
    gl.uniform1f(this.u.shadowStrength, shadowMult);

    gl.disable(gl.CULL_FACE);
    gl.drawElementsInstanced(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0, instanceCount);
    gl.enable(gl.CULL_FACE);
    gl.bindVertexArray(null);

    return instanceCount;
  }
}
