export const FUR_VERTEX_SHADER_GL2 = `#version 300 es
precision highp float;

// 7-segment curved hair lock template
layout(location = 0) in vec3 a_tplPos; // x: [-1..1] across lock, y: [0..1] root-to-tip t, z: S-wave

// Per-instance attributes
layout(location = 1) in vec3 a_rootPos;
layout(location = 2) in vec3 a_normal;     // Tangent-combed growth direction
layout(location = 3) in vec4 a_strandMeta; // x: lengthMul, y: widthMul, z: seedVar, w: partIndex
layout(location = 4) in vec2 a_guideInfo;  // x: primaryGuideIdx, y: secondaryGuideIdx

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_partMatrices[5];
uniform vec3 u_guideDisplacements[64];
uniform vec3 u_cameraPos;

uniform float u_furLength;
uniform float u_time;
uniform float u_windStrength;
uniform float u_windEnabled;

out float v_t;
out float v_colorVar;
out vec3 v_worldNormal;
out vec3 v_strandTangent;
out vec3 v_worldPos;
out float v_edgeX;

void main() {
  int partIdx = clamp(int(a_strandMeta.w + 0.5), 0, 4);
  mat4 partMat = u_partMatrices[partIdx];

  float t = a_tplPos.y;
  float lenMul = a_strandMeta.x * u_furLength;

  // Transform follicle root and combed growth direction by the skeletal part matrix
  vec3 worldRoot = (partMat * vec4(a_rootPos, 1.0)).xyz;
  vec3 growDir = normalize(mat3(partMat) * a_normal);
  vec3 surfNorm = normalize(mat3(partMat) * normalize(a_rootPos));

  // Build local orthonormal frame for smooth S-curve hair flow
  vec3 upRef = abs(growDir.y) < 0.90 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 curlAxis1 = normalize(cross(growDir, upRef));
  vec3 curlAxis2 = normalize(cross(growDir, curlAxis1));

  // Sample guide strand dynamic physics displacement
  int g0 = clamp(int(a_guideInfo.x + 0.5), 0, 63);
  int g1 = clamp(int(a_guideInfo.y + 0.5), 0, 63);
  vec3 guideDisp = mix(u_guideDisplacements[g0], u_guideDisplacements[g1], 0.38);

  // Smooth, graceful S-curve wave along each hair shaft
  float seed = a_strandMeta.z * 17.3 + dot(a_rootPos, vec3(11.3, 15.7, 9.7));
  float curlAmp = 0.052 * lenMul * sin(t * 3.14159);
  vec3 sCurve = (
    curlAxis1 * sin(t * 3.6 + seed) +
    curlAxis2 * cos(t * 2.8 + seed * 1.3)
  ) * curlAmp;

  // Gentle breeze wave
  float phase = dot(a_rootPos, vec3(7.3, 5.1, 9.7)) + u_time * 3.0;
  vec3 windFlutter = vec3(
    sin(phase) * 0.052,
    cos(phase * 0.8) * 0.022,
    cos(phase * 1.1) * 0.052
  ) * u_windStrength * u_windEnabled;

  // Natural cubic/quadratic hair arch: lifts slightly out from follicle, then drapes softly downward
  float lift = sin(t * 3.14159) * 0.045 * lenMul;
  float bendFactor = pow(t, 1.50);
  vec3 gravityDrape = vec3(0.0, -0.175 * lenMul, 0.0);
  vec3 totalBend = surfNorm * lift + (guideDisp + windFlutter + gravityDrape) * bendFactor + sCurve;

  // Compute curved hair spine position and analytical tangent
  vec3 spinePos = worldRoot + growDir * (t * lenMul) + totalBend;
  vec3 dBend = 1.50 * pow(max(t, 0.02), 0.50) * (guideDisp + windFlutter + gravityDrape);
  vec3 tangent = normalize(growDir * lenMul + dBend);

  // View-aligned ribbon cross-section
  vec3 toCam = normalize(u_cameraPos - spinePos);
  vec3 side = normalize(cross(tangent, toCam));
  if (length(side) < 0.01) {
    side = vec3(1.0, 0.0, 0.0);
  }

  // Keep lock width gentle and slender so each carved filament is a fine hair thread
  float lockWidth = 0.0165 * a_strandMeta.y * (0.90 + 0.15 * t);
  vec3 finalPos = spinePos + side * (a_tplPos.x * lockWidth);

  v_t = t;
  v_colorVar = a_strandMeta.z;
  v_worldNormal = surfNorm;
  v_strandTangent = tangent;
  v_worldPos = finalPos;
  v_edgeX = a_tplPos.x;

  gl_Position = u_proj * u_view * vec4(finalPos, 1.0);
}
`;

export const FUR_FRAGMENT_SHADER_GL2 = `#version 300 es
precision highp float;

in float v_t;
in float v_colorVar;
in vec3 v_worldNormal;
in vec3 v_strandTangent;
in vec3 v_worldPos;
in float v_edgeX;

uniform vec3 u_rootColor;
uniform vec3 u_tipColor;
uniform vec3 u_keyLightDir;
uniform vec3 u_keyLightColor;
uniform vec3 u_rimLightColor;
uniform vec3 u_ambientColor;
uniform vec3 u_cameraPos;
uniform float u_shadowStrength;

out vec4 outColor;

void main() {
  // Smooth, continuous S-wave along the lock (low frequency so it never aliases into dots!)
  float gentleWave = sin(v_t * 3.6 + v_colorVar * 6.283) * 0.10;
  float fiberCoord = (v_edgeX + gentleWave) * 2.35; // ~4.7 continuous fine hairs per lock
  float fiberId = floor(fiberCoord + 0.5);
  float fiberLocal = fract(fiberCoord + 0.5) - 0.5;
  float distFromHairCenter = abs(fiberLocal) * 2.0; // [0..1] across single hair thread

  // Each individual hair filament has its own staggered natural length (wispy, feathered tips!)
  float fHash = fract(sin(fiberId * 127.1 + v_colorVar * 311.7) * 43758.5453);
  float maxHairLen = 0.58 + 0.42 * fHash;

  // Anti-aliasing guard: when a strand is foreshortened or far away, keep roots solid & smooth
  float fw = fwidth(fiberCoord);
  float aaBlend = clamp(fw * 0.65, 0.0, 0.35);

  float normT = v_t / maxHairLen;
  // Hair filament stays a uniform thin thread from 0..65% and Wispy-tapers only at the tip (65%..100%)
  float allowedRadius = (0.84 + aaBlend) * (1.0 - smoothstep(0.62, 1.0, normT) * 0.78);

  if (abs(v_edgeX) > 0.96 || v_t > maxHairLen || distFromHairCenter > allowedRadius) {
    discard;
  }

  vec3 N = normalize(v_worldNormal);
  vec3 T = normalize(v_strandTangent);
  vec3 L = normalize(u_keyLightDir);
  vec3 V = normalize(u_cameraPos - v_worldPos);

  // Plush subsurface wrap diffuse lighting
  float ndl = dot(N, L);
  float wrapDiff = clamp((ndl + 0.74) / 1.74, 0.0, 1.0);

  // Cylindrical 3D roundness across each fine hair fiber
  float microCyl = 0.87 + 0.13 * sqrt(max(0.0, 1.0 - (distFromHairCenter / max(0.05, allowedRadius))));

  // Silky Marschner / Kajiya-Kay anisotropic hair highlight along the curved tangent
  vec3 Tshifted = normalize(T - N * 0.14);
  float tdl = dot(Tshifted, L);
  float tdv = dot(Tshifted, V);
  float sinTL = sqrt(max(0.0, 1.0 - tdl * tdl));
  float sinTV = sqrt(max(0.0, 1.0 - tdv * tdv));
  float kajSpec = pow(max(0.0, sinTL * sinTV - tdl * tdv), 24.0) * (0.17 + 0.28 * normT);

  // Soft rim halo on backlit wispy hairs
  float rim = pow(1.0 - max(0.0, dot(N, V)), 2.1) * (0.38 + 0.56 * normT);

  // Soft depth shading near the follicle root
  float selfAO = mix(1.0 - 0.20 * u_shadowStrength, 1.02, smoothstep(0.0, 0.75, normT));

  // Blend root and tip colors with subtle per-filament tonal variation so every hair thread is distinct
  vec3 hairColor = mix(u_rootColor, u_tipColor, smoothstep(0.08, 0.88, normT));
  hairColor += vec3((v_colorVar * 0.55 + (fHash - 0.5) * 0.85) * 0.045);

  vec3 lighting = u_ambientColor * 0.48 + u_keyLightColor * (wrapDiff * 0.50 + kajSpec * 0.75);
  vec3 rawRGB = hairColor * lighting * selfAO * microCyl + u_rimLightColor * rim * 0.26;
  // Soft shoulder highlight compression so white fur preserves crisp individual hair strands
  vec3 finalRGB = rawRGB / (1.0 + max(vec3(0.0), rawRGB - 0.82) * 0.55);

  outColor = vec4(finalRGB, 1.0);
}
`;
