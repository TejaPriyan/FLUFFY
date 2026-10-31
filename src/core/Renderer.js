export const MESH_VERTEX_SHADER_GL2 = `#version 300 es
precision highp float;

layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;

out vec3 v_worldPos;
out vec3 v_worldNormal;
out vec2 v_uv;

void main() {
  vec4 wp = u_model * vec4(a_pos, 1.0);
  v_worldPos = wp.xyz;
  v_worldNormal = normalize(mat3(u_model) * a_normal);
  v_uv = a_uv;
  gl_Position = u_proj * u_view * wp;
}
`;

export const MESH_FRAGMENT_SHADER_GL2 = `#version 300 es
precision highp float;

in vec3 v_worldPos;
in vec3 v_worldNormal;
in vec2 v_uv;

uniform vec3 u_color;
uniform float u_roughness;
uniform float u_emissive;
uniform vec3 u_keyLightDir;
uniform vec3 u_keyLightColor;
uniform vec3 u_rimLightColor;
uniform vec3 u_ambientColor;
uniform vec3 u_cameraPos;
uniform vec3 u_petPos;
uniform float u_shadowStrength;
uniform float u_isPlatform;

out vec4 outColor;

void main() {
  vec3 N = normalize(v_worldNormal);
  vec3 L = normalize(u_keyLightDir);
  vec3 V = normalize(u_cameraPos - v_worldPos);
  vec3 H = normalize(L + V);

  float ndl = dot(N, L);
  float wrapDiff = clamp((ndl + 0.45) / 1.45, 0.0, 1.0);

  float specPower = mix(64.0, 8.0, u_roughness);
  float spec = pow(max(0.0, dot(N, H)), specPower) * (1.0 - u_roughness * 0.85);

  float rim = pow(1.0 - max(0.0, dot(N, V)), 3.0) * 0.38;

  vec3 lit = u_color * (u_ambientColor * 0.52 + u_keyLightColor * wrapDiff * 0.65)
           + u_keyLightColor * spec * 0.45
           + u_rimLightColor * rim * 0.25
           + u_color * u_emissive;

  // Soft contact shadow directly underneath Fluffy on the platform
  if (u_isPlatform > 0.5 && v_worldNormal.y > 0.2) {
    vec2 d = v_worldPos.xz - u_petPos.xz;
    float r = length(d);
    float heightAtten = 1.0 / (1.0 + max(0.0, u_petPos.y) * 0.85);
    float shadowRadius = 0.88 * (1.0 + max(0.0, u_petPos.y) * 0.25);
    float blob = (1.0 - smoothstep(0.15, shadowRadius, r)) * heightAtten * u_shadowStrength;

    // Subtle concentric cozy rug weave rings on the platform top
    float ring = sin(length(v_worldPos.xz) * 18.0) * 0.018;
    lit = lit * (1.0 - blob * 0.48) + vec3(ring);
  }

  outColor = vec4(lit, 1.0);
}
`;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.isWebGL2 = !!this.gl;

    if (!this.gl) {
      throw new Error('WebGL2 is required for hardware-instanced procedural fur rendering.');
    }

    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.meshProgram = this.createProgram(MESH_VERTEX_SHADER_GL2, MESH_FRAGMENT_SHADER_GL2);
    this.uMesh = {
      proj: gl.getUniformLocation(this.meshProgram, 'u_proj'),
      view: gl.getUniformLocation(this.meshProgram, 'u_view'),
      model: gl.getUniformLocation(this.meshProgram, 'u_model'),
      color: gl.getUniformLocation(this.meshProgram, 'u_color'),
      roughness: gl.getUniformLocation(this.meshProgram, 'u_roughness'),
      emissive: gl.getUniformLocation(this.meshProgram, 'u_emissive'),
      keyLightDir: gl.getUniformLocation(this.meshProgram, 'u_keyLightDir'),
      keyLightColor: gl.getUniformLocation(this.meshProgram, 'u_keyLightColor'),
      rimLightColor: gl.getUniformLocation(this.meshProgram, 'u_rimLightColor'),
      ambientColor: gl.getUniformLocation(this.meshProgram, 'u_ambientColor'),
      cameraPos: gl.getUniformLocation(this.meshProgram, 'u_cameraPos'),
      petPos: gl.getUniformLocation(this.meshProgram, 'u_petPos'),
      shadowStrength: gl.getUniformLocation(this.meshProgram, 'u_shadowStrength'),
      isPlatform: gl.getUniformLocation(this.meshProgram, 'u_isPlatform')
    };
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile error: ' + log);
    }
    return shader;
  }

  createProgram(vsSource, fsSource) {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      throw new Error('Program link error: ' + log);
    }
    return prog;
  }

  uploadGeometry(geomData) {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, geomData.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const normBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.bufferData(gl.ARRAY_BUFFER, geomData.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, geomData.uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geomData.indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    return {
      vao,
      indexCount: geomData.indices.length
    };
  }

  resize(dprCap = 1.75) {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.gl.viewport(0, 0, width, height);
    return { width, height };
  }

  clear() {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  renderSceneNodes(rootNode, camera, scene, petWorldPos, settings) {
    const gl = this.gl;
    gl.useProgram(this.meshProgram);

    gl.uniformMatrix4fv(this.uMesh.proj, false, camera.projMatrix);
    gl.uniformMatrix4fv(this.uMesh.view, false, camera.viewMatrix);
    gl.uniform3fv(this.uMesh.keyLightDir, scene.keyLightDir);
    gl.uniform3fv(this.uMesh.keyLightColor, scene.keyLightColor);
    gl.uniform3fv(this.uMesh.rimLightColor, scene.rimLightColor);
    gl.uniform3fv(this.uMesh.ambientColor, scene.ambientColor);
    gl.uniform3fv(this.uMesh.cameraPos, camera.eyePosition);
    gl.uniform3fv(this.uMesh.petPos, petWorldPos);

    const shadowMult = settings.shadowQuality === 'OFF' ? 0.0 :
                       settings.shadowQuality === 'LOW' ? 0.5 :
                       settings.shadowQuality === 'MEDIUM' ? 0.85 : 1.15;
    gl.uniform1f(this.uMesh.shadowStrength, shadowMult);

    const stack = [rootNode];
    while (stack.length > 0) {
      const node = stack.pop();
      if (!node.visible) continue;

      if (node.mesh) {
        gl.bindVertexArray(node.mesh.vao);
        gl.uniformMatrix4fv(this.uMesh.model, false, node.worldMatrix);
        gl.uniform3fv(this.uMesh.color, node.color);
        gl.uniform1f(this.uMesh.roughness, node.roughness);
        gl.uniform1f(this.uMesh.emissive, node.emissive);
        gl.uniform1f(this.uMesh.isPlatform, node.name === 'platformTop' ? 1.0 : 0.0);
        gl.drawElements(gl.TRIANGLES, node.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
      }

      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
    gl.bindVertexArray(null);
  }
}
