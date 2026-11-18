/* BABY's ceramic robot is rendered as a collection of lit 3D meshes. */
const vertexSource = `
  precision mediump float;
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  uniform mat4 uModel;
  uniform mat4 uProjection;
  uniform float uDistance;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vLocal;
  void main() {
    vec4 position = uModel * vec4(aPosition, 1.0);
    vPosition = position.xyz;
    vNormal = mat3(uModel) * aNormal;
    vLocal = aPosition;
    gl_Position = uProjection * vec4(position.xyz - vec3(0.0, 0.0, uDistance), 1.0);
  }
`;

const fragmentSource = `
  precision mediump float;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vLocal;
  uniform float uDistance;
  uniform vec3 uColor;
  uniform vec4 uMaterial;
  uniform vec4 uFace;
  const float PI = 3.14159265;

  vec3 studio(vec3 ray, float roughness) {
    float sky = smoothstep(-0.62, 0.9, ray.y);
    vec3 light = mix(vec3(0.15, 0.27, 0.54), vec3(0.63, 0.79, 1.02), sky);
    vec3 panel = normalize(vec3(-0.62, 0.53, 0.64));
    vec3 strip = normalize(vec3(0.88, 0.24, -0.10));
    float key = pow(max(dot(ray, panel), 0.0), mix(19.0, 3.0, roughness));
    float edge = pow(max(dot(ray, strip), 0.0), mix(30.0, 6.0, roughness));
    return light + key * vec3(1.45, 1.52, 1.56) + edge * vec3(0.17, 0.42, 0.91);
  }

  vec3 lightSurface(vec3 normal, vec3 view, vec3 light, vec3 illumination,
                    vec3 color, vec3 f0, float metal, float roughness) {
    vec3 halfAngle = normalize(view + light);
    float nl = max(dot(normal, light), 0.0);
    float nv = max(dot(normal, view), 0.0005);
    float nh = max(dot(normal, halfAngle), 0.0);
    float vh = max(dot(view, halfAngle), 0.0);
    float a = roughness * roughness;
    float a2 = a * a;
    float d = (nh * a2 - nh) * nh + 1.0;
    float distribution = a2 / max(PI * d * d, 0.00005);
    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    float geometry = nv * nl / ((nv * (1.0 - k) + k) * (nl * (1.0 - k) + k));
    vec3 fresnel = f0 + (1.0 - f0) * pow(1.0 - vh, 5.0);
    vec3 diffuse = (1.0 - fresnel) * (1.0 - metal) * color / PI;
    vec3 specular = distribution * geometry * fresnel / max(4.0 * nl * nv, 0.001);
    return (diffuse + specular) * illumination * nl;
  }

  float pill(vec2 p, float reach, float radius) {
    p.y -= clamp(p.y, -reach, reach);
    return length(p) - radius;
  }

  vec3 facialLights(vec3 p) {
    float front = smoothstep(0.084, 0.151, p.z);
    vec2 face = p.xy - vec2(uFace.z, 0.0);
    float blink = max(uFace.x, 0.05);
    vec2 eye = vec2(abs(face.x) - 0.283, (face.y - 0.077) / blink);
    float eyeDistance = pill(eye, 0.065, 0.065);
    float eyeCore = 1.0 - smoothstep(-0.015, 0.004, eyeDistance);
    float eyeHalo = exp(-max(eyeDistance, 0.0) * 19.0) * sqrt(blink);
    vec3 eyes = vec3(0.10, 0.78, 1.20) * eyeHalo * 0.36 + vec3(0.59, 1.25, 1.53) * eyeCore;
    vec2 mouth = face - vec2(0.0, -0.216);
    float smileX = clamp(mouth.x, -0.12, 0.12);
    float smile = length(mouth - vec2(smileX, 2.9 * smileX * smileX)) - 0.014;
    float opening = 0.025 + uFace.y * 0.048;
    float openMouth = (length(mouth / vec2(0.108 + uFace.y * 0.021, opening)) - 1.0) * opening;
    float mouthDistance = mix(smile, openMouth, smoothstep(0.10, 0.28, uFace.y));
    float mouthCore = 1.0 - smoothstep(-0.006, 0.005, mouthDistance);
    vec3 smileLight = vec3(0.15, 0.85, 1.0) * (mouthCore + 0.10 * exp(-max(mouthDistance, 0.0) * 32.0));
    return front * (eyes + smileLight) * (1.0 + uFace.w * 0.15);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 view = normalize(vec3(0.0, 0.0, uDistance) - vPosition);
    float nv = clamp(dot(normal, view), 0.0, 1.0);
    float metal = uMaterial.x;
    float roughness = uMaterial.y;
    vec3 color = uColor;
    bool visor = uMaterial.w > 0.5;
    if (visor) {
      color += vec3(0.009, 0.017, 0.034) * smoothstep(-0.52, 0.55, vLocal.y);
      color += vec3(0.001, 0.004, 0.010) * pow(max(0.0, 1.0 - abs(vLocal.x)), 3.0);
    }
    vec3 f0 = mix(vec3(0.045), color, metal);
    vec3 diffuse = color * (1.0 - metal) * mix(vec3(0.30, 0.39, 0.60), vec3(0.76, 0.84, 0.99), normal.y * 0.5 + 0.5);
    vec3 value = diffuse * 0.47;
    value += lightSurface(normal, view, normalize(vec3(-0.66, 0.86, 0.78)),
      vec3(2.28, 2.32, 2.40), color, f0, metal, roughness);
    value += lightSurface(normal, view, normalize(vec3(0.88, 0.21, -0.57)),
      vec3(0.22, 0.59, 1.57), color, f0, metal, roughness);
    value += lightSurface(normal, view, normalize(vec3(0.62, -0.37, 0.89)),
      vec3(0.42, 0.54, 0.76), color, f0, metal, roughness);
    vec3 ray = reflect(-view, normal);
    vec3 fresnel = f0 + (max(vec3(1.0 - roughness), f0) - f0) * pow(1.0 - nv, 4.0);
    value += studio(ray, roughness) * fresnel * (0.56 + 0.43 * metal);
    if (visor) {
      value *= 0.58;
      float reflection = smoothstep(-0.22, 0.47, ray.y) * pow(max(0.0, ray.z), 5.0);
      value += reflection * vec3(0.016, 0.030, 0.048);
      value += facialLights(vLocal);
    } else {
      value += color * uMaterial.z * (0.92 + uFace.w * 0.35);
    }
    value = value / (value + vec3(0.78));
    gl_FragColor = vec4(pow(clamp(value, 0.0, 1.0), vec3(1.0 / 2.20)), 1.0);
  }
`;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const radians = (degrees) => degrees * Math.PI / 180;

function translation(x = 0, y = 0, z = 0) {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

function rotateX(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

function rotateY(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

function rotateZ(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function multiply(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    const offset = column * 4;
    for (let row = 0; row < 4; row++) {
      result[offset + row] = a[row] * b[offset] + a[row + 4] * b[offset + 1]
        + a[row + 8] * b[offset + 2] + a[row + 12] * b[offset + 3];
    }
  }
  return result;
}

function perspective(aspect) {
  const f = 1 / Math.tan(radians(39) / 2);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, -1.008, -1, 0, 0, -0.201, 0]);
}

function normalized(x, y, z) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function surface(vertices, indices, columns, rows, vertex) {
  const start = vertices.length / 6;
  const rowSize = columns + 1;
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      vertices.push(...vertex(column / columns, row / rows));
      if (row < rows && column < columns) {
        const a = start + row * rowSize + column;
        indices.push(a, a + 1, a + rowSize, a + 1, a + rowSize + 1, a + rowSize);
      }
    }
  }
}

function roundedBox(half, radius, segments = 20) {
  const vertices = [], indices = [];
  const core = half.map((value) => value - radius);
  for (let axis = 0; axis < 3; axis++) {
    for (const side of [-1, 1]) {
      const first = (axis + 1) % 3, second = (axis + 2) % 3;
      surface(vertices, indices, segments, segments, (u, v) => {
        const p = [0, 0, 0];
        p[axis] = half[axis] * side;
        p[first] = (2 * u - 1) * half[first];
        p[second] = (2 * v - 1) * half[second];
        const base = p.map((value, i) => clamp(value, -core[i], core[i]));
        const n = normalized(p[0] - base[0], p[1] - base[1], p[2] - base[2]);
        return [...base.map((value, i) => value + n[i] * radius), ...n];
      });
    }
  }
  return { vertices, indices };
}

function ellipsoid(scale) {
  const vertices = [], indices = [];
  surface(vertices, indices, 28, 18, (u, v) => {
    const angle = u * Math.PI * 2;
    const latitude = v * Math.PI;
    const p = [Math.cos(angle) * Math.sin(latitude), Math.cos(latitude), Math.sin(angle) * Math.sin(latitude)];
    return [...p.map((value, i) => value * scale[i]), ...normalized(...p.map((value, i) => value / scale[i]))];
  });
  return { vertices, indices };
}

function ring(major, minor) {
  const vertices = [], indices = [];
  surface(vertices, indices, 38, 12, (u, v) => {
    const orbit = u * Math.PI * 2;
    const section = v * Math.PI * 2;
    const radial = major + minor * Math.cos(section);
    return [
      Math.cos(orbit) * radial, Math.sin(orbit) * radial, Math.sin(section) * minor,
      Math.cos(orbit) * Math.cos(section), Math.sin(orbit) * Math.cos(section), Math.sin(section),
    ];
  });
  return { vertices, indices };
}

function material(hex, metal, roughness, emission = 0, face = false) {
  const color = [hex >> 16, (hex >> 8) & 255, hex & 255].map((channel) => Math.pow(channel / 255, 2.2));
  return { color, surface: [metal, roughness, emission, face ? 1 : 0] };
}

function constructMeshes(gl, buffers) {
  const pearl = material(0xe8f1ff, 0.10, 0.36);
  const highlight = material(0xf4f8ff, 0.22, 0.27);
  const blue = material(0x265bd5, 0.46, 0.29);
  const seam = material(0x182951, 0.54, 0.32);
  const bevel = material(0x3565ac, 0.73, 0.27);
  const glass = material(0x070f26, 0.56, 0.22, 0, true);
  const light = material(0x5cc9ff, 0.22, 0.27, 0.75);
  const parts = [];

  function createMesh(shape) {
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    if (vertexBuffer) buffers.push(vertexBuffer);
    if (indexBuffer) buffers.push(indexBuffer);
    if (!vertexBuffer || !indexBuffer) throw new Error("Unable to create WebGL buffers");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);
    return { vertexBuffer, indexBuffer, count: shape.indices.length };
  }

  function place(mesh, shell, x, y, z, rotation) {
    const offset = translation(x, y, z);
    parts.push({ mesh, shell, model: rotation ? multiply(offset, rotation) : offset });
  }

  place(createMesh(roundedBox([1.02, 0.747, 0.633], 0.41, 24)), pearl, 0, 0.125, -0.032);
  place(createMesh(roundedBox([0.883, 0.587, 0.217], 0.198, 24)), bevel, 0, 0.151, 0.478);
  place(createMesh(roundedBox([0.842, 0.542, 0.159], 0.153, 24)), glass, 0, 0.152, 0.559);
  place(createMesh(roundedBox([0.618, 0.223, 0.469], 0.214)), blue, 0, -0.54, -0.072);
  place(createMesh(ellipsoid([0.458, 0.103, 0.371])), seam, 0, -0.722, -0.061);
  place(createMesh(ring(0.290, 0.018)), light, 0, -0.792, -0.061, rotateX(Math.PI / 2));
  place(createMesh(ellipsoid([0.06, 0.181, 0.06])), bevel, 0.225, 0.871, -0.101, rotateZ(-0.20));
  place(createMesh(ellipsoid([0.099, 0.086, 0.087])), highlight, 0.252, 1.043, -0.101);
  place(createMesh(ellipsoid([0.058, 0.056, 0.050])), light, 0.265, 1.060, -0.048);

  const bearing = createMesh(ellipsoid([0.19, 0.37, 0.37]));
  const shell = createMesh(ellipsoid([0.135, 0.344, 0.344]));
  const metalRing = createMesh(ring(0.270, 0.025));
  const halo = createMesh(ring(0.215, 0.012));
  const cap = createMesh(ellipsoid([0.045, 0.225, 0.225]));
  const pin = createMesh(ellipsoid([0.078, 0.123, 0.091]));
  for (const side of [-1, 1]) {
    const outward = rotateY(side * Math.PI / 2);
    place(bearing, seam, side * 0.948, 0.116, -0.138);
    place(shell, highlight, side * 1.043, 0.116, -0.138);
    place(metalRing, bevel, side * 1.153, 0.116, -0.138, outward);
    place(cap, blue, side * 1.155, 0.116, -0.138);
    place(halo, light, side * 1.188, 0.116, -0.138, outward);
    place(pin, highlight, side * 0.858, -0.492, -0.087, rotateZ(side * 0.44));
  }
  return parts;
}

function compile(gl, type, source, shaders) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader");
  shaders.push(shader);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Unable to compile BABY shader");
  return shader;
}

const mountedAvatars = new WeakMap();

function mountPosterMotion(root) {
  const poster = root.querySelector(".avatar");
  if (!poster) return () => {};
  const control = root.ownerDocument.createElement("button");
  const hint = root.querySelector(".orbit-hint");
  const listeners = new AbortController();
  const events = { signal: listeners.signal };
  let pitch = 0, yaw = 0, pointer = null;
  control.type = "button";
  control.className = "poster-orbit";
  control.setAttribute("aria-label", "Tilt BABY with the mouse or arrow keys. Press Enter to reset.");

  function apply(x = 0, y = 0) {
    root.style.setProperty("--poster-pitch", (pitch + y) + "deg");
    root.style.setProperty("--poster-yaw", (yaw + x) + "deg");
  }

  control.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    control.setPointerCapture(event.pointerId);
  }, events);
  control.addEventListener("pointermove", (event) => {
    if (pointer?.id === event.pointerId) {
      yaw = clamp(yaw + (event.clientX - pointer.x) * .34, -40, 40);
      pitch = clamp(pitch - (event.clientY - pointer.y) * .29, -27, 27);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      apply();
    } else if (event.pointerType !== "touch") {
      const bounds = control.getBoundingClientRect();
      apply(((event.clientX - bounds.left) / bounds.width - .5) * 14,
        -((event.clientY - bounds.top) / bounds.height - .5) * 12);
    }
  }, events);
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    control.addEventListener(name, () => { pointer = null; apply(); }, events);
  }
  control.addEventListener("pointerleave", () => apply(), events);
  control.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowLeft": yaw = clamp(yaw - 9, -40, 40); break;
      case "ArrowRight": yaw = clamp(yaw + 9, -40, 40); break;
      case "ArrowUp": pitch = clamp(pitch + 7, -27, 27); break;
      case "ArrowDown": pitch = clamp(pitch - 7, -27, 27); break;
      case "Enter": case " ": pitch = yaw = 0; break;
      default: return;
    }
    event.preventDefault();
    apply();
  }, events);
  control.addEventListener("dblclick", () => { pitch = yaw = 0; apply(); }, events);

  root.append(control);
  root.classList.add("has-interactive-poster");
  if (hint) hint.lastChild.textContent = "Drag to tilt";
  const destroy = () => {
    listeners.abort();
    control.remove();
    root.style.removeProperty("--poster-pitch");
    root.style.removeProperty("--poster-yaw");
    root.classList.remove("has-interactive-poster");
    mountedAvatars.delete(root);
  };
  mountedAvatars.set(root, destroy);
  return destroy;
}

export function mountAvatar(root) {
  if (!root) return () => {};
  const mounted = mountedAvatars.get(root);
  if (mounted) return mounted;

  const canvas = root.ownerDocument.createElement("canvas");
  canvas.className = "saathi-avatar-canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "button");
  canvas.setAttribute("aria-label", "Rotate BABY. Drag or use arrow keys. Press Enter to reset.");
  Object.assign(canvas.style, {
    position: "absolute", inset: "0", width: "100%", height: "100%", zIndex: "2",
    display: "block", pointerEvents: "auto", cursor: "grab", touchAction: "pan-y",
  });

  let gl;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true, antialias: true, depth: true, powerPreference: "low-power",
    });
  } catch {
    return mountPosterMotion(root);
  }
  if (!gl) return mountPosterMotion(root);

  const buffers = [], shaders = [];
  const program = gl.createProgram();
  if (!program) return mountPosterMotion(root);
  let meshes;
  try {
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource, shaders));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource, shaders));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Unable to link BABY shaders");
    meshes = constructMeshes(gl, buffers);
  } catch (error) {
    for (const buffer of buffers) gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    console.warn("BABY could not initialize the 3D renderer.", error.message);
    return mountPosterMotion(root);
  } finally {
    for (const shader of shaders) gl.deleteShader(shader);
  }

  const position = gl.getAttribLocation(program, "aPosition");
  const normal = gl.getAttribLocation(program, "aNormal");
  const matrix = gl.getUniformLocation(program, "uModel");
  const projectionUniform = gl.getUniformLocation(program, "uProjection");
  const distanceUniform = gl.getUniformLocation(program, "uDistance");
  const color = gl.getUniformLocation(program, "uColor");
  const surfaceUniform = gl.getUniformLocation(program, "uMaterial");
  const expression = gl.getUniformLocation(program, "uFace");
  gl.useProgram(program);
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.DEPTH_TEST);
  gl.enableVertexAttribArray(position);
  gl.enableVertexAttribArray(normal);

  const document = root.ownerDocument;
  const window = document.defaultView;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const listeners = new AbortController();
  const eventOptions = { signal: listeners.signal };
  const fallback = root.querySelector(".avatar");
  const wasHidden = fallback?.hidden;
  const ariaHidden = root.getAttribute("aria-hidden");
  const stateNode = root.closest("[data-state]");
  let projection, cameraDistance, width = 0, height = 0;
  let hoverX = 0, hoverY = 0, yaw = -0.31, pitch = 0.10, orbitX = 0, orbitY = 0;
  let pointer = null, frame = 0, lastPaint = -Infinity, disposed = false, onscreen = true;
  let pulse = -Infinity;
  let state = stateNode?.dataset.state || "idle";

  function invalidate() {
    if (!frame && !disposed && onscreen && !document.hidden) frame = window.requestAnimationFrame(paint);
  }

  function resize() {
    const bounds = root.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    if (!width || !height) return;
    const density = Math.min(window.devicePixelRatio || 1, 1.7, 790 / Math.max(width, height));
    canvas.width = Math.max(1, Math.floor(width * density));
    canvas.height = Math.max(1, Math.floor(height * density));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const aspect = width / height;
    projection = perspective(aspect);
    cameraDistance = 4.12 * Math.max(1, 1.16 / aspect);
    invalidate();
  }

  function paint(timestamp) {
    frame = 0;
    if (disposed || !onscreen || !width || !height || !root.isConnected || document.hidden) return;
    if (!motion.matches && timestamp - lastPaint < 24) {
      invalidate();
      return;
    }
    lastPaint = timestamp;
    const t = motion.matches ? 0 : timestamp * 0.001;
    const animated = !motion.matches;
    const speaking = state === "speaking";
    const listening = state === "listening";
    const thinking = state === "thinking";
    const idleTurn = animated ? 0.10 * Math.sin(t * 0.72) : 0;
    const idleTilt = animated ? 0.035 * Math.sin(t * 1.0) : 0;
    const targetYaw = -0.31 + idleTurn + orbitX + hoverX;
    const targetPitch = 0.10 + idleTilt + orbitY + hoverY + (listening ? -0.042 : 0);
    const ease = animated ? (pointer ? 0.33 : 0.13) : 1;
    yaw += (targetYaw - yaw) * ease;
    pitch += (targetPitch - pitch) * ease;
    const bob = animated ? 0.075 * Math.sin(t * 1.60) : 0;
    const afterTap = Math.max(0, 1 - (timestamp - pulse) / 470);
    const lift = animated ? 0.13 * Math.sin(afterTap * Math.PI) : 0;
    const roll = animated ? 0.026 * Math.sin(t * 0.87) : 0;
    const body = multiply(translation(0, bob + lift - 0.11, 0), multiply(rotateZ(roll), multiply(rotateY(yaw), rotateX(pitch))));
    const blinkPhase = (t + 0.3) % 4.7;
    const blink = animated && blinkPhase < 0.20 ? 1 - Math.sin(blinkPhase * Math.PI / 0.20) * 0.92 : 1;
    const mouth = speaking
      ? (animated ? 0.24 + 0.75 * Math.abs(Math.sin(t * 14) * Math.cos(t * 6.7)) : 0.72)
      : 0;
    const eyeLine = thinking ? (animated ? 0.015 + 0.043 * Math.sin(t * 1.9) : 0.044) : hoverX * 0.18;
    const intensity = speaking || listening || thinking ? 1 : afterTap;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(projectionUniform, false, projection);
    gl.uniform1f(distanceUniform, cameraDistance);
    gl.uniform4f(expression, blink, mouth, eyeLine, intensity);

    for (const { mesh, shell, model } of meshes) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 24, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
      gl.uniformMatrix4fv(matrix, false, multiply(body, model));
      gl.uniform3fv(color, shell.color);
      gl.uniform4fv(surfaceUniform, shell.surface);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }
    if (animated) invalidate();
  }

  function release(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (event.type === "pointerup" && !pointer.moved) pulse = window.performance.now();
    pointer = null;
    canvas.style.cursor = "grab";
    invalidate();
  }

  function reset() {
    orbitX = orbitY = hoverX = hoverY = 0;
    pulse = window.performance.now();
    invalidate();
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
  }, eventOptions);

  canvas.addEventListener("pointermove", (event) => {
    if (pointer?.id === event.pointerId) {
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (!pointer.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      pointer.moved = true;
      orbitX = clamp(orbitX + dx * 0.011, -1.03, 1.30);
      orbitY = clamp(orbitY + dy * 0.008, -0.65, 0.55);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    } else if (event.pointerType !== "touch") {
      const box = canvas.getBoundingClientRect();
      hoverX = ((event.clientX - box.left) / box.width - 0.5) * 0.29;
      hoverY = ((event.clientY - box.top) / box.height - 0.5) * 0.19;
    }
    invalidate();
  }, eventOptions);

  canvas.addEventListener("pointerleave", () => {
    hoverX = hoverY = 0;
    invalidate();
  }, eventOptions);
  canvas.addEventListener("pointerup", release, eventOptions);
  canvas.addEventListener("pointercancel", release, eventOptions);
  canvas.addEventListener("lostpointercapture", release, eventOptions);
  canvas.addEventListener("dblclick", reset, eventOptions);
  canvas.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowLeft": orbitX = clamp(orbitX - 0.17, -1.03, 1.30); break;
      case "ArrowRight": orbitX = clamp(orbitX + 0.17, -1.03, 1.30); break;
      case "ArrowUp": orbitY = clamp(orbitY - 0.15, -0.65, 0.55); break;
      case "ArrowDown": orbitY = clamp(orbitY + 0.15, -0.65, 0.55); break;
      case "Home":
      case "Enter":
      case " ": reset(); break;
      default: return;
    }
    event.preventDefault();
    invalidate();
  }, eventOptions);

  function stopDrawing() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopDrawing();
    else invalidate();
  }, eventOptions);
  motion.addEventListener("change", invalidate, eventOptions);

  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  const viewportObserver = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => {
    onscreen = entry.isIntersecting;
    if (onscreen) invalidate();
    else stopDrawing();
  }) : null;
  const stateObserver = stateNode ? new MutationObserver(() => {
    state = stateNode.dataset.state;
    invalidate();
  }) : null;
  resizeObserver?.observe(root);
  viewportObserver?.observe(root);
  stateObserver?.observe(stateNode, { attributes: true, attributeFilter: ["data-state"] });
  if (!resizeObserver) window.addEventListener("resize", resize, eventOptions);

  function destroy() {
    if (disposed) return;
    disposed = true;
    stopDrawing();
    listeners.abort();
    resizeObserver?.disconnect();
    viewportObserver?.disconnect();
    stateObserver?.disconnect();
    for (const buffer of buffers) gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    canvas.remove();
    root.classList.remove("has-3d-avatar");
    if (ariaHidden !== null) root.setAttribute("aria-hidden", ariaHidden);
    if (fallback) fallback.hidden = wasHidden;
    mountedAvatars.delete(root);
  }

  canvas.addEventListener("webglcontextlost", destroy, eventOptions);
  root.append(canvas);
  root.classList.add("has-3d-avatar");
  root.removeAttribute("aria-hidden");
  if (fallback) fallback.hidden = true;
  mountedAvatars.set(root, destroy);
  resize();
  return destroy;
}
