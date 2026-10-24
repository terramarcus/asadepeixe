// Cardume 3D de carpas aladas (baseado na folha de personagem da marca) que foge do cursor.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { EffectComposer } from '../vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/postprocessing/RenderPass.js';
import { AfterimagePass } from '../vendor/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from '../vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/postprocessing/OutputPass.js';

// Tons de laranja das carpas
const PALETTE = [
  { color: '#E8641A', weight: 0.25 }, // laranja da marca, mais vivo
  { color: '#F07A22', weight: 0.2 },  // laranja
  { color: '#D9481A', weight: 0.18 }, // laranja-avermelhado
  { color: '#F39532', weight: 0.17 }, // laranja dourado
  { color: '#C93A17', weight: 0.1 },  // vermelho koi
  { color: '#F6A640', weight: 0.1 },  // âmbar
];

/* Geometria de uma carpa alada, apontando para +Z (corpo ~1,05 + cauda).
   aPart: 0 = corpo, 1 = asas (batem), 2 = cauda (véu), 3 = nadadeiras em leque, 4 = olhos,
          5 = barbilhões (bigodes), 6 = nadadeiras-folha (com nervura central).
   aMask: corpo 0 (focinho) → 1 (cauda); asas, cauda e nadadeiras 0 (raiz) → 1 (ponta).
   aCross: asas −1 → 1 de um lado ao outro da pena (0 = ráquis); nadadeiras 0 → 1 entre o primeiro e o último raio. */
const WING_ROOT_X = 0.045, WING_ROOT_Y = 0.15;

function koiGeometry() {
  const pos = [], part = [], mask = [], cross = [], index = [];
  const add = (x, y, z, p, m, c = 0) => { pos.push(x, y, z); part.push(p); mask.push(m); cross.push(c); return pos.length / 3 - 1; };
  const tri = (a, b, c) => index.push(a, b, c);
  const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  const v = (x, y, z) => new THREE.Vector3(x, y, z);

  // ----- Corpo: anéis elípticos, alto e robusto como uma carpa -----
  const RINGS = 22, SIDES = 18, Z0 = 0.58, Z1 = -0.46;
  const radius = (t) => 0.17 * Math.sin(Math.PI * Math.pow(t, 0.6)) + 0.03 * t;
  const ring = [];
  for (let i = 0; i < RINGS; i++) {
    const t = i / (RINGS - 1);
    const z = Z0 + (Z1 - Z0) * t;
    const r = radius(t) + (i === 0 ? 0.01 : 0);
    const ry = r * 1.12, rx = r * 0.7, yOff = -0.015 * Math.sin(Math.PI * t);
    const row = [];
    for (let j = 0; j < SIDES; j++) {
      const a = (j / SIDES) * Math.PI * 2;
      row.push(add(Math.cos(a) * rx, Math.sin(a) * ry + yOff, z, 0, t));
    }
    ring.push(row);
  }
  for (let i = 0; i < RINGS - 1; i++) {
    for (let j = 0; j < SIDES; j++) {
      const a = ring[i][j], b = ring[i][(j + 1) % SIDES], c = ring[i + 1][j], d = ring[i + 1][(j + 1) % SIDES];
      tri(a, c, b); tri(b, c, d);
    }
  }
  const nose = add(0, -0.01, Z0 + 0.035, 0, 0);
  for (let j = 0; j < SIDES; j++) tri(nose, ring[0][j], ring[0][(j + 1) % SIDES]);

  // ----- Olhos -----
  for (const s of [1, -1]) {
    const c = v(0.074 * s, 0.045, 0.43), R = 0.03, rows = 5, cols = 8, start = pos.length / 3;
    for (let i = 0; i <= rows; i++) {
      const th = (i / rows) * Math.PI;
      for (let j = 0; j < cols; j++) {
        const ph = (j / cols) * Math.PI * 2;
        add(c.x + R * Math.sin(th) * Math.cos(ph), c.y + R * Math.cos(th), c.z + R * Math.sin(th) * Math.sin(ph), 4, 0);
      }
    }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const a = start + i * cols + j, b = start + i * cols + (j + 1) % cols;
      tri(a, a + cols, b); tri(b, a + cols, b + cols);
    }
  }

  // Nadadeira genérica: leque de raios a partir de uma raiz, em um plano (u = direção, w = abertura)
  const fin = (root, dir, open, len, spread, rays, p = 3, steps = 3, shape = (a) => 0.75 + 0.25 * Math.cos(a * 1.4), curl = 0) => {
    const grid = [];
    for (let k = 0; k < rays; k++) {
      const a = -spread / 2 + (k / (rays - 1)) * spread;
      const d = dir.clone().multiplyScalar(Math.cos(a)).add(open.clone().multiplyScalar(Math.sin(a))).normalize();
      const L = len * shape(a);
      const col = [];
      for (let m = 1; m <= steps; m++) {
        const t = m / steps;
        // curl: os raios de fora curvam de volta para o centro (lobos em véu)
        const q = root.clone().add(d.clone().multiplyScalar(L * t)).add(open.clone().multiplyScalar(-Math.sin(a) * curl * len * t * t));
        col.push(add(q.x, q.y, q.z, p, m / steps, k / (rays - 1)));
      }
      grid.push(col);
    }
    const r = add(root.x, root.y, root.z, p, 0, 0.5);
    for (let k = 0; k < rays - 1; k++) {
      tri(r, grid[k][0], grid[k + 1][0]);
      for (let m = 0; m < steps - 1; m++) quad(grid[k][m], grid[k][m + 1], grid[k + 1][m + 1], grid[k + 1][m]);
    }
  };

  // ----- Cauda em véu: longa, em fios de luz que esvoaçam (lobos de cima e de baixo mais longos) -----
  fin(v(0, 0, Z1 + 0.03), v(0, 0, -1), v(0, 1, 0), 1.55, 1.25, 25, 2, 16,
    (a) => 0.5 + 0.7 * Math.pow(Math.abs(Math.sin(a * 1.6)), 0.6), 0.6);

  // Nadadeira em forma de folha: contorno + nervura central (aCross −1 → 1, aMask raiz → ponta)
  const leaf = (root, dir, across, len, width, bend = 0.25) => {
    dir = dir.clone().normalize();
    const w = across.clone().sub(dir.clone().multiplyScalar(across.dot(dir))).normalize();
    const nrm = new THREE.Vector3().crossVectors(dir, w).normalize();
    const N = 9, rows = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const half = width * Math.sin(Math.PI * Math.pow(t, 0.75)) * 0.5;
      const c = root.clone().add(dir.clone().multiplyScalar(len * t)).add(nrm.clone().multiplyScalar(bend * len * t * t));
      rows.push([-1, 0, 1].map((cx) => { const q = c.clone().add(w.clone().multiplyScalar(half * cx)); return add(q.x, q.y, q.z, 6, t, cx); }));
    }
    for (let k = 0; k < N; k++) for (let j = 0; j < 2; j++) quad(rows[k][j], rows[k + 1][j], rows[k + 1][j + 1], rows[k][j + 1]);
  };
  leaf(v(0, 0.16, -0.12), v(0, 0.55, -1), v(0, 0, 1), 0.26, 0.13);                 // dorsal
  for (const s of [1, -1]) {
    leaf(v(0.075 * s, -0.08, 0.28), v(0.55 * s, -0.6, -0.65), v(0, 0, 1), 0.52, 0.17); // peitorais
    leaf(v(0.05 * s, -0.14, -0.06), v(0.3 * s, -0.8, -0.6), v(0, 0, 1), 0.34, 0.12);   // ventrais
  }
  leaf(v(0, -0.12, -0.28), v(0, -0.7, -0.8), v(0, 0, 1), 0.26, 0.11);               // anal

  // Barbilhões (bigodes) longos e curvos, saindo da boca
  for (const s of [1, -1]) {
    const pts = [v(0.03 * s, -0.06, 0.6), v(0.08 * s, -0.14, 0.61), v(0.13 * s, -0.25, 0.56), v(0.15 * s, -0.37, 0.46), v(0.14 * s, -0.46, 0.36)];
    const ids = pts.flatMap((q, k) => { const r = 0.012 * (1 - k / pts.length * 0.6); return [add(q.x - r, q.y, q.z, 5, k / (pts.length - 1)), add(q.x + r, q.y, q.z, 5, k / (pts.length - 1))]; });
    for (let k = 0; k < pts.length - 1; k++) quad(ids[k * 2], ids[k * 2 + 1], ids[k * 2 + 3], ids[k * 2 + 2]);
  }

  // ----- Asas de pássaro, presas no dorso e abertas para cima em "V" -----
  const DIHEDRAL = 0.95; // inclinação da asa para cima (V alto, como na referência)
  for (const s of [1, -1]) {
    const root = v(WING_ROOT_X * s, WING_ROOT_Y, 0.2);
    const edge = v(Math.cos(DIHEDRAL) * s, Math.sin(DIHEDRAL), -0.45).normalize(); // bordo de ataque, varrido para trás
    const back = v(0, -0.35, -1).normalize(); // penas apontam para trás e um pouco para baixo
    const normal = new THREE.Vector3().crossVectors(edge, back).normalize();
    const SPAN = 0.95;
    const rows = [
      { n: 15, range: 1.0, len: [0.3, 0.78], w: 0.14, lift: 0, dark: 1 },     // primárias e secundárias
      { n: 11, range: 0.78, len: [0.18, 0.38], w: 0.15, lift: 0.018, dark: 0.6 }, // coberteiras maiores
      { n: 8, range: 0.55, len: [0.1, 0.2], w: 0.13, lift: 0.032, dark: 0.35 },   // coberteiras menores, junto ao bordo
    ];
    for (const R of rows) {
      for (let f = 0; f < R.n; f++) {
        const u = (f / (R.n - 1)) * R.range;
        const base = root.clone().add(edge.clone().multiplyScalar(SPAN * u)).add(normal.clone().multiplyScalar(R.lift));
        // as penas apontam para trás e, perto da ponta, abrem para fora
        const open = THREE.MathUtils.smoothstep(u, 0.5, 1.0) * 0.85;
        const dir = back.clone().lerp(edge, open).normalize();
        const width = new THREE.Vector3().crossVectors(dir, normal).normalize();
        const len = (R.len[0] + (R.len[1] - R.len[0]) * Math.pow(u / R.range, 1.15)) * (u > 0.93 ? 0.88 : 1);
        const at = (dist, side) => base.clone()
          .add(dir.clone().multiplyScalar(dist))
          .add(width.clone().multiplyScalar(side))
          .add(normal.clone().multiplyScalar(0.12 * dist * dist)); // pena curva levemente
        const w = R.w;
        const mk = (dist, side) => { const q = at(dist, side); return add(q.x, q.y, q.z, 1, (dist / len) * R.dark, side / (w * 0.5)); };
        const b1 = mk(0, -w / 2), b2 = mk(0, w / 2);
        const m1 = mk(len * 0.72, -w * 0.5), m2 = mk(len * 0.72, w * 0.5);
        const n1 = mk(len * 0.9, -w * 0.38), n2 = mk(len * 0.9, w * 0.38);
        const tip = mk(len, 0);
        tri(b1, b2, m2); tri(b1, m2, m1); tri(m1, m2, n2); tri(m1, n2, n1); tri(n1, n2, tip);
      }
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setAttribute('aMask', new THREE.Float32BufferAttribute(mask, 1));
  g.setAttribute('aCross', new THREE.Float32BufferAttribute(cross, 1));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function pickColor() {
  let r = Math.random();
  for (const p of PALETTE) { if ((r -= p.weight) <= 0) return p.color; }
  return PALETTE[0].color;
}

/* ---------- Estilo neon: só contornos de luz ----------
   A silhueta acende nas bordas (fresnel); penas, escamas e raios das nadadeiras viram linhas finas de luz.
   Mistura aditiva: as luzes se somam e o brilho (bloom) + rastro (afterimage) fazem o resto. */
function neonMaterial(uTime) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `
      attribute float aPart; attribute float aMask; attribute float aCross; attribute float aPhase;
      uniform float uTime;
      varying float vPart; varying float vMask; varying float vCross;
      varying vec3 vLocal; varying vec3 vN; varying vec3 vView; varying vec3 vCol;
      void main() {
        vec3 p = position, n = normal;
        vPart = aPart; vMask = aMask; vCross = aCross; vLocal = position;
        if (aPart > 0.5 && aPart < 1.5) {
          float side = sign(position.x);
          float ang = (sin(uTime * (5.4 + fract(aPhase * 7.31) * 1.4) + aPhase) * 0.55 - 0.05) * side; // ritmo próprio de cada carpa
          float c = cos(ang), s = sin(ang);
          float px = p.x - ${WING_ROOT_X.toFixed(3)} * side, py = p.y - ${WING_ROOT_Y.toFixed(3)};
          p.x = px * c - py * s + ${WING_ROOT_X.toFixed(3)} * side;
          p.y = px * s + py * c + ${WING_ROOT_Y.toFixed(3)};
          n.xy = vec2(n.x * c - n.y * s, n.x * s + n.y * c);
        } else {
          float amp = clamp((0.3 - position.z) / 1.25, 0.0, 1.0);
          p.x += sin(position.z * 5.5 - uTime * 7.0 + aPhase) * 0.1 * pow(amp, 1.6);
          if (aPart > 1.5 && aPart < 2.5) {          // véu: os fios esvoaçam, mais nas pontas
            float m = aMask;
            p.x += sin(m * 4.5 - uTime * 4.2 + aPhase + vCross * 1.5) * 0.24 * m * m;
            p.y += sin(m * 3.5 - uTime * 3.4 + aPhase * 1.3) * 0.09 * m;
          } else if (aPart > 4.5 && aPart < 5.5) {   // bigodes balançam de leve
            p.x += sin(uTime * 2.5 + aPhase) * 0.03 * aMask;
          }
        }
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * mat3(instanceMatrix) * n);
        vView = -mv.xyz;
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #else
          vCol = vec3(1.0, 0.45, 0.1);
        #endif
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vPart; varying float vMask; varying float vCross;
      varying vec3 vLocal; varying vec3 vN; varying vec3 vView; varying vec3 vCol;
      void main() {
        vec3 N = normalize(vN), V = normalize(vView);
        float facing = abs(dot(N, V));
        float rim = pow(1.0 - facing, 4.5);                        // contorno fino da silhueta
        float lines = 0.0, fill = 0.0;
        if (vPart < 0.5) {                                         // corpo: só o contorno, interior escuro e translúcido
          rim *= 2.5; fill = 0.035;
        } else if (vPart < 1.5) {                                  // penas: contorno + ráquis, com leve preenchimento
          float a = abs(vCross);
          lines = max(1.0 - smoothstep(0.0, 0.09, a), smoothstep(0.78, 0.97, a)) * 0.6;
          fill = 0.05 + 0.04 * vMask;
        } else if (vPart < 2.5) {                                  // véu da cauda: fios de luz + bordas, sumindo nas pontas
          float strands = pow(abs(sin(vCross * 3.14159 * 7.0)), 30.0) * 0.6;
          float edges = 1.0 - smoothstep(0.0, 0.035, min(vCross, 1.0 - vCross));
          lines = (strands + edges) * (1.0 - 0.55 * vMask);
          fill = 0.13 * (1.0 - 0.65 * vMask);   // véu translúcido
          rim *= 0.4;
        } else if (vPart < 3.5) {                                  // nadadeiras em leque
          lines = pow(abs(sin(vCross * 3.14159 * 9.0)), 14.0) * 0.55 + smoothstep(0.82, 1.0, vMask) * 0.7;
        } else if (vPart < 4.5) {                                  // olho: anel
          lines = pow(1.0 - facing, 2.0) * 2.4;
          rim = 0.0;
        } else if (vPart < 5.5) {                                  // bigodes: fio de luz que afina na ponta
          lines = 1.7 * (1.0 - 0.5 * vMask);
          rim = 0.0;
        } else {                                                   // nadadeira-folha: contorno + nervura
          float a = abs(vCross);
          lines = max(1.0 - smoothstep(0.0, 0.08, a), smoothstep(0.8, 0.98, a)) * 0.9;
          fill = 0.07;
          rim *= 0.5;
        }
        float fade = smoothstep(27.0, 9.0, length(vView));        // peixes ao fundo mais fracos
        float glow = (rim * 0.9 + lines + fill) * fade;
        // neon laranja: a cor do peixe domina; só o núcleo das linhas mais fortes puxa para o amarelo-claro
        vec3 col = mix(vCol * vec3(1.0, 0.85, 0.7), vec3(1.0, 0.72, 0.38), clamp(lines * 0.3, 0.0, 0.45));
        gl_FragColor = vec4(col * glow * 0.38, 1.0);
      }`,
  });
}

/* ---------- Fundo: universo com estrelas e pequenas nebulosas ----------
   Camadas em profundidades diferentes: no scroll (parallax) e seguindo o mouse, as mais distantes andam menos.
   O cursor gera ondas no fundo, mais fortes quanto mais rápido o mouse se move (uWave). */
function spaceBackground(uTime) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime, uAspect: { value: 1 },
      uScroll: { value: 0 },                         // 0 = topo; cresce conforme a página desce
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }, // posição suavizada do mouse no palco (0–1)
      uWave: { value: 0 },                           // força da onda (dispara no clique e some aos poucos)
      uClick: { value: new THREE.Vector2(0.5, 0.5) }, // ponto clicado (0–1)
      uClickT: { value: -100 },                      // momento do clique
    },
    depthTest: false, depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uAspect; uniform float uScroll; uniform vec2 uMouse; uniform float uWave; uniform vec2 uClick; uniform float uClickT;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
      // nebulosa pequena: nuvem de fbm recortada por uma mancha em volta do centro
      vec3 nebula(vec2 p, vec2 c, float size, vec3 tint, float seed) {
        vec2 q = (p - c) / size;
        float blob = exp(-dot(q, q) * 1.6);
        float cloud = fbm(q * 1.8 + seed + vec2(uTime * 0.006, -uTime * 0.004));
        float wisps = fbm(q * 4.0 - seed * 1.7);
        return tint * blob * pow(smoothstep(0.25, 0.85, cloud * 0.75 + wisps * 0.4), 1.6);
      }
      float stars(vec2 p, float density, float size) {
        vec2 cell = floor(p * density), f = fract(p * density) - 0.5;
        float h = hash(cell);
        if (h < 0.965) return 0.0;                         // menos estrelas
        vec2 o = vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5;
        float d = length(f - o * 0.7);
        // brilho máximo ~0,25: abaixo do limiar do bloom, então as estrelas não ganham halo
        return smoothstep(size, 0.0, d) * (h - 0.965) * 7.0;
      }
      void main() {
        vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
        vec2 m = (uMouse - 0.5) * vec2(uAspect, 1.0);
        // onda: anéis que saem do ponto clicado e se espalham, como pedra na água
        vec2 dv = p - (uClick - 0.5) * vec2(uAspect, 1.0);
        float d = length(dv) + 1e-4;
        float age = uTime - uClickT;
        float front = age * 0.55;                                   // raio da frente da onda
        float ring = sin((d - front) * 40.0) * exp(-pow((d - front) * 7.0, 2.0)) * exp(-d * 1.2);
        p += (dv / d) * ring * 0.022 * uWave;
        // movimento seguindo o mouse e parallax no scroll: cada camada numa profundidade
        // (o palco sobe com a página; deslocar a amostra para cima faz a camada "ficar para trás", mais devagar)
        vec2 look = m * 0.05;
        vec2 pFar  = p + look * 0.35 + vec2(0.0, uScroll * 0.62);
        vec2 pNeb  = p + look * 0.6  + vec2(0.0, uScroll * 0.48);
        vec2 pMid  = p + look * 0.8  + vec2(0.0, uScroll * 0.36);
        vec2 pNear = p + look * 1.2  + vec2(0.0, uScroll * 0.22);
        vec3 col = mix(vec3(0.004, 0.008, 0.03), vec3(0.02, 0.035, 0.09), smoothstep(1.1, 0.0, length(pFar - vec2(0.35, 0.2))));
        col += nebula(pNeb, vec2(0.62, 0.22), 0.28, vec3(0.95, 0.33, 0.07), 1.0) * 0.22;  // laranja
        col += nebula(pNeb, vec2(-0.55, 0.3), 0.22, vec3(0.45, 0.16, 0.62), 4.0) * 0.35; // roxa
        col += nebula(pNeb, vec2(0.1, -0.32), 0.25, vec3(0.12, 0.32, 0.8), 9.0) * 0.3;   // azul
        col += nebula(pNeb, vec2(-0.15, 0.38), 0.12, vec3(1.0, 0.6, 0.2), 13.0) * 0.14;  // dourada pequena
        col += vec3(1.0, 0.9, 0.8) * stars(pMid + 11.0, 140.0, 0.1) * 0.6;    // médias
        col += vec3(0.9, 0.95, 1.0) * stars(pNear, 70.0, 0.12);               // próximas
        // a crista da onda acende um pouco, para o movimento ficar visível
        col += vec3(0.95, 0.55, 0.25) * max(ring, 0.0) * 0.05 * uWave;
        col *= mix(0.55, 1.0, smoothstep(-0.7, 0.2, p.x + p.y));   // canto do texto (baixo à esquerda) mais escuro
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  quad.renderOrder = -1;
  return quad;
}

// calm: para quem prefere movimento reduzido — o cardume nada mais devagar, mas continua vivo e reagindo ao mouse
// style: 'neon' (contornos de luz com rastro, sobre o universo) ou 'realista' (carpas sólidas com escamas e reflexos)
export function createSchool(canvas, { calm = false, style = 'neon', count = null, cameraZ = 14, showcase = null } = {}) {
  // showcase (só para testes): { yaw, pitch } — um peixe parado no centro, no ângulo pedido
  const NEON = style === 'neon';
  const SPEED = calm ? 0.55 : 1;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.remove();
    return { setScroll() {} };
  }
  const isSmallScreen = window.matchMedia('(max-width: 760px)').matches;
  // o neon tem pós-processamento (brilho + rastro): resolução um pouco menor para continuar leve
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, NEON ? 1.25 : 1.75));
  renderer.setClearColor(0x000000, NEON ? 1 : 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0B1630, 11, 24);
  if (!NEON) {
    // Reflexos realistas: um "estúdio" de luz gerado na hora, usado só como ambiente (não aparece no fundo)
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, cameraZ);

  scene.add(new THREE.HemisphereLight(0xffe7d1, 0x3a2a3a, 0.7));
  scene.add(new THREE.AmbientLight(0xffffff, 0.15)); // clareia o lado de baixo das asas
  const sun = new THREE.DirectionalLight(0xfff1e0, 1.9);
  sun.position.set(3, 6, 8);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xffb27a, 1.6); // contraluz quente, como na referência
  rim.position.set(-5, 3, -6);
  scene.add(rim);
  const glow = new THREE.PointLight(0xFFC93C, 10, 7, 1.6); // luz suave no centro do cardume
  scene.add(glow);

  const isSmall = window.matchMedia('(max-width: 760px)').matches;
  const COUNT = count ?? (isSmall ? 12 : 18);

  const geometry = koiGeometry();
  const phases = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) phases[i] = Math.random() * Math.PI * 2; // cada carpa bate as asas no seu tempo
  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));

  const uniforms = { uTime: { value: 0 } };
  const material = new THREE.MeshPhysicalMaterial({
    roughness: 0.4, metalness: 0.08, clearcoat: 0.5, clearcoatRoughness: 0.22, envMapIntensity: 0.5, side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    const flap = `
        float side = sign(position.x);
        float ang = (sin(uTime * (5.4 + fract(aPhase * 7.31) * 1.4) + aPhase) * 0.55 - 0.05) * side; // ritmo próprio de cada carpa
        float wc = cos(ang), ws = sin(ang);`;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aPart;
        attribute float aMask;
        attribute float aCross;
        attribute float aPhase;
        uniform float uTime;
        varying float vPart;
        varying float vMask;
        varying float vCross;
        varying float vSeed;
        varying vec3 vLocal;`)
      // gira as normais das asas junto com o bater, para a luz acompanhar
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        if (aPart > 0.5 && aPart < 1.5) {${flap}
          objectNormal.xy = vec2(objectNormal.x * wc - objectNormal.y * ws, objectNormal.x * ws + objectNormal.y * wc);
        }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vPart = aPart; vMask = aMask; vCross = aCross; vSeed = aPhase; vLocal = position;
        if (aPart > 0.5 && aPart < 1.5) {${flap}
          float px = transformed.x - ${WING_ROOT_X.toFixed(3)} * side, py = transformed.y - ${WING_ROOT_Y.toFixed(3)};
          transformed.x = px * wc - py * ws + ${WING_ROOT_X.toFixed(3)} * side;
          transformed.y = px * ws + py * wc + ${WING_ROOT_Y.toFixed(3)};
        } else {
          // o corpo serpenteia: a onda cresce do focinho para a cauda, que esvoaça
          float amp = clamp((0.3 - position.z) / 1.25, 0.0, 1.0);
          transformed.x += sin(position.z * 5.5 - uTime * 7.0 + aPhase) * 0.1 * pow(amp, 1.6);
        }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vPart;
        varying float vMask;
        varying float vCross;
        varying float vSeed;
        varying vec3 vLocal;
        // escama: cúpula que sobe da borda de trás e desce na borda da frente (fileiras desencontradas, bordas em arco)
        float scaleHeight(vec3 p) {
          float fy = p.y * 27.0 + 60.0;
          float row = floor(fy);
          float cz = fract(p.z * 21.0 + row * 0.5 + pow(fract(fy) - 0.5, 2.0) * 1.4);
          return smoothstep(0.0, 0.8, cz) * (1.0 - smoothstep(0.8, 1.0, cz));
        }
        // pena: ráquis no centro + barbas inclinadas saindo dele
        float featherHeight(float c, float m) {
          float rachis = 1.0 - smoothstep(0.0, 0.14, abs(c));
          float barbs = 0.5 + 0.5 * sin(m * 42.0 + abs(c) * 12.0);
          return rachis * 0.7 + barbs * (1.0 - rachis) * 0.45;
        }
        // relevo a partir de uma altura procedural (mesma técnica do bump map do three.js)
        vec3 perturbH(vec3 surfPos, vec3 n, vec2 dHdxy, float faceDir) {
          vec3 sx = normalize(dFdx(surfPos)), sy = normalize(dFdy(surfPos));
          vec3 r1 = cross(sy, n), r2 = cross(n, sx);
          float det = dot(sx, r1) * faceDir;
          vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
          return normalize(abs(det) * n - grad);
        }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          float hgt = 0.0, amt = 0.0;
          if (vPart < 0.5) { hgt = scaleHeight(vLocal); amt = 0.55; }
          else if (vPart < 1.5) { hgt = featherHeight(vCross, vMask); amt = 0.5; }
          else if (vPart < 3.5) { hgt = 0.5 + 0.5 * sin(vCross * 40.0); amt = 0.35; }
          if (amt > 0.0) normal = perturbH(-vViewPosition, normal, vec2(dFdx(hgt), dFdy(hgt)) * amt, faceDirection);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        if (vPart > 0.5 && vPart < 1.5) roughnessFactor = 0.62;       // penas foscas
        else if (vPart > 1.5 && vPart < 3.5) roughnessFactor = 0.45;  // nadadeiras acetinadas
        else if (vPart > 3.5) roughnessFactor = 0.08;                 // olhos brilhantes`)
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
        #ifdef USE_CLEARCOAT
          if (vPart > 0.5 && vPart < 3.5) material.clearcoat = 0.0;   // verniz só no corpo e nos olhos
        #endif`)
      .replace('#include <color_fragment>', `
        vec3 base = vec3(1.0, 0.45, 0.12);
        #if defined( USE_INSTANCING_COLOR ) || defined( USE_COLOR )
          base = vColor;
        #endif
        vec3 peach = vec3(1.0, 0.74, 0.55);
        if (vPart < 0.5) {
          // corpo: escamas em fileiras desencontradas, dorso mais escuro, barriga dourada e manchas de escamas
          float scaleEdge = 1.0 - scaleHeight(vLocal);
          float topShade = smoothstep(-0.02, 0.16, vLocal.y);
          float belly = smoothstep(0.02, -0.13, vLocal.y);
          float patches = smoothstep(0.45, 0.85, sin(vLocal.z * 9.0 + vSeed * 2.0) * sin(vLocal.y * 15.0 + vSeed * 1.3));
          vec3 c = base;
          c = mix(c, base * vec3(0.8, 0.5, 0.36), topShade * 0.55);
          c = mix(c, base * vec3(1.05, 1.25, 1.4), belly * 0.45);
          c = mix(c, base * vec3(0.55, 0.32, 0.2), patches * 0.45);
          c *= 1.0 - scaleEdge * 0.22;
          diffuseColor.rgb = c;
        } else if (vPart < 1.5) {
          // asas: base laranja-avermelhada perto do corpo, pontas pêssego, com o desenho das penas
          vec3 dark = base * vec3(0.86, 0.5, 0.36);
          vec3 c = mix(dark, base, smoothstep(0.0, 0.45, vMask));
          c = mix(c, mix(base, peach, 0.4), smoothstep(0.5, 1.0, vMask));
          c *= 0.86 + 0.14 * featherHeight(vCross, vMask);
          c = mix(c, peach, (1.0 - smoothstep(0.0, 0.1, abs(vCross))) * 0.25);
          c *= 1.0 - smoothstep(0.75, 1.0, abs(vCross)) * 0.18;
          diffuseColor.rgb = c;
        } else if (vPart < 3.5 || vPart > 4.5) {
          // cauda e nadadeiras: laranja na base, clareando e ficando translúcidas nas pontas
          diffuseColor.rgb = mix(base, mix(base, peach, 0.55), smoothstep(0.25, 1.0, vMask));
          diffuseColor.rgb *= 0.92 + 0.08 * sin(vMask * 40.0 + vLocal.x * 30.0 + vLocal.y * 30.0);
        } else {
          diffuseColor.rgb = vec3(0.03, 0.025, 0.02); // olhos
        }`);
  };

  const mesh = new THREE.InstancedMesh(geometry, NEON ? neonMaterial(uniforms.uTime) : material, COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const tmpColor = new THREE.Color();
  for (let i = 0; i < COUNT; i++) mesh.setColorAt(i, tmpColor.set(pickColor()));
  scene.add(mesh);

  // Neon: fundo de universo + rastro de luz (afterimage) + brilho (bloom)
  let composer = null, bloom = null, space = null;
  if (NEON) {
    scene.fog = null;
    space = spaceBackground(uniforms.uTime);
    scene.add(space);
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new AfterimagePass(0.86));                                  // rastro: cada quadro some aos poucos
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.65, 0.35, 0.32);  // força, raio, limiar
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // Cardume (boids): cada peixe se alinha com os vizinhos, mantém distância e segue o grupo
  const CRUISE = 2.6;            // velocidade de cruzeiro
  const VIEW = 3.2;              // raio de percepção dos vizinhos
  // Estado de cada peixe
  const fish = Array.from({ length: COUNT }, () => ({
    pos: new THREE.Vector3(2 + (Math.random() - 0.5) * 3, 1 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
    vel: new THREE.Vector3(-1, 0.2, 0).multiplyScalar(CRUISE),
    bank: 0,
    phase: Math.random() * Math.PI * 2,
    scale: 0.65 + Math.random() * 0.3,
  }));

  const target = new THREE.Vector3(0, 0, 0);
  const mouseWorld = new THREE.Vector3(0, 0, 0); // centro para onde o cardume nada
  const cursor = new THREE.Vector3(99, 99, 0);      // posição do mouse no plano do cardume
  let cursorInside = false;
  const FLEE_RADIUS = 2.4;
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  let lastPointer = -10;
  let scrollShift = 0;
  let width = 1, height = 1;
  let halfH = 1, halfW = 1;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    width = r.width; height = r.height;
    renderer.setSize(width, height, false);
    if (composer) { composer.setSize(width, height); bloom.resolution.set(width, height); space.material.uniforms.uAspect.value = width / height; }
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
  };
  resize();
  window.addEventListener('resize', resize);

  const bgMouse = new THREE.Vector2(0.5, 0.5); // alvo do mouse para o fundo
  const pointerToWorld = (x, y) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(plane, cursor);
    cursorInside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    bgMouse.set((x - r.left) / r.width, 1 - (y - r.top) / r.height);
    lastPointer = clock.elapsedTime;
  };
  window.addEventListener('pointermove', (e) => pointerToWorld(e.clientX, e.clientY), { passive: true });
  canvas.parentElement.addEventListener('pointerleave', () => { cursorInside = false; });

  // Clique / toque: o cardume se espalha
  const burst = () => {
    for (const f of fish) {
      const away = f.pos.clone().sub(cursor);
      const d = Math.max(away.length(), 0.3);
      away.normalize().multiplyScalar((14 / Math.sqrt(d)) * (0.6 + Math.random() * 0.6));
      f.vel.add(away);
    }
  };
  canvas.parentElement.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    pointerToWorld(e.clientX, e.clientY);
    burst();
    if (space) {
      space.material.uniforms.uClick.value.copy(bgMouse);
      space.material.uniforms.uClickT.value = clock.elapsedTime;
    }
  });

  const dummy = new THREE.Object3D();
  const desired = new THREE.Vector3();
  const steer = new THREE.Vector3();
  const sep = new THREE.Vector3();
  const look = new THREE.Vector3();
  const clock = new THREE.Clock();

  function step(dt) {
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;

    // O cardume passeia sozinho pelo palco (mais à direita, longe do texto)
    mouseWorld.set(halfW * 0.12 + Math.sin(t * 0.22) * halfW * 0.45, halfH * 0.18 + Math.sin(t * 0.37) * halfH * 0.35, Math.cos(t * 0.19) * 1.2);
    // Com o mouse por perto, o centro do cardume foge dele
    if (cursorInside) {
      const dx = mouseWorld.x - cursor.x, dy = mouseWorld.y - cursor.y;
      const d = Math.hypot(dx, dy) || 1;
      const push = Math.max(0, 4.5 - d) * 0.9;
      mouseWorld.x += (dx / d) * push;
      mouseWorld.y += (dy / d) * push;
    }
    mouseWorld.x = THREE.MathUtils.clamp(mouseWorld.x, -halfW * 0.35, halfW * 0.42);
    // Nunca desce até a faixa de baixo, onde ficam o título e os botões
    mouseWorld.y = THREE.MathUtils.clamp(mouseWorld.y, halfH * 0.22, halfH * 0.45);
    target.lerp(mouseWorld, 1 - Math.pow(0.3, dt));
    target.y += scrollShift;
    // Luz suave no centro do cardume
    glow.position.set(target.x, target.y, target.z + 2);

    const align = new THREE.Vector3(), coh = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      const f = fish[i];
      align.set(0, 0, 0); coh.set(0, 0, 0); sep.set(0, 0, 0);
      let n = 0;
      for (let j = 0; j < COUNT; j++) {
        if (i === j) continue;
        const o = fish[j];
        const dx = f.pos.x - o.pos.x, dy = f.pos.y - o.pos.y, dz = f.pos.z - o.pos.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > VIEW * VIEW) continue;
        n++;
        align.add(o.vel);
        coh.add(o.pos);
        if (d2 < 2.2 && d2 > 1e-5) { sep.x += dx / d2; sep.y += dy / d2; sep.z += dz / d2; }
      }
      steer.set(0, 0, 0);
      if (n) {
        align.divideScalar(n).sub(f.vel).multiplyScalar(1.6);   // alinhamento: mesma direção dos vizinhos
        coh.divideScalar(n).sub(f.pos).multiplyScalar(0.45);     // coesão: fica perto do grupo
        steer.add(align).add(coh);
      }
      steer.addScaledVector(sep, 1.8);                          // separação: sem trombar
      // o grupo inteiro segue o "líder" invisível que passeia pelo palco
      desired.copy(target).sub(f.pos);
      steer.addScaledVector(desired, 0.32);

      // Predador: o cursor espanta os peixes próximos e o grupo desvia junto (pelo alinhamento)
      if (cursorInside) {
        const fx = f.pos.x - cursor.x, fy = f.pos.y - cursor.y;
        const d = Math.hypot(fx, fy);
        if (d < FLEE_RADIUS && d > 1e-3) {
          const k = Math.pow(1 - d / FLEE_RADIUS, 2) * 40;
          steer.x += (fx / d) * k;
          steer.y += (fy / d) * k;
        }
      }

      const prevDir = look.copy(f.vel).normalize().clone();
      f.vel.addScaledVector(steer, dt);
      // velocidade quase constante, como peixe de verdade (sobe só quando foge ou se espalha)
      const sp = f.vel.length();
      const goal = THREE.MathUtils.clamp(sp, CRUISE * 0.8, CRUISE * 3.2);
      f.vel.multiplyScalar(goal / Math.max(sp, 1e-3));
      if (sp > CRUISE) f.vel.multiplyScalar(1 - Math.min(dt * 0.9, 0.3));
      f.pos.addScaledVector(f.vel, dt);
      f.pos.z = THREE.MathUtils.clamp(f.pos.z, -4, 3);

      // inclina nas curvas (como um bando de pássaros), suavizado
      const dir = look.copy(f.vel).normalize();
      const turn = prevDir.x * dir.y - prevDir.y * dir.x;
      f.bank += (THREE.MathUtils.clamp(-turn / Math.max(dt, 1e-3) * 0.35, -0.8, 0.8) - f.bank) * Math.min(dt * 4, 1);

      dummy.position.copy(f.pos);
      dummy.lookAt(look.multiplyScalar(1).add(f.pos));
      dummy.rotateZ(f.bank);
      dummy.scale.setScalar(f.scale);
      if (showcase) { dummy.position.set(0, 0, 0); dummy.rotation.set(showcase.pitch || 0, showcase.yaw || 0, 0); dummy.scale.setScalar(1); }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    target.y -= scrollShift;
    mesh.instanceMatrix.needsUpdate = true;
  }

  let visible = true;
  let running = false;
  // Qualidade adaptativa: se o computador não sustentar ~45 quadros/s, baixa a resolução do palco (até 2 vezes)
  let perfFrames = 0, perfTime = 0, perfLevel = 0;
  const PERF_STEPS = [1, 0.75];
  const adapt = (rawDt) => {
    perfFrames++; perfTime += rawDt;
    if (perfTime < 2) return;
    const fps = perfFrames / perfTime;
    perfFrames = 0; perfTime = 0;
    if (fps < 45 && perfLevel < PERF_STEPS.length) {
      const pr = PERF_STEPS[perfLevel++];
      renderer.setPixelRatio(pr);
      if (composer) composer.setPixelRatio(pr);
      resize();
    }
  };

  const loop = () => {
    if (!visible || document.hidden) { running = false; return; }
    running = true;
    const raw = clock.getDelta();
    adapt(raw);
    const dt = Math.min(raw, 1 / 30) * SPEED;
    step(dt);
    if (space) {
      const u = space.material.uniforms;
      // parallax: quanto do palco já subiu com o scroll (em alturas do palco)
      u.uScroll.value = THREE.MathUtils.clamp(-canvas.getBoundingClientRect().top / Math.max(height, 1), 0, 1.5);
      // o fundo acompanha o mouse de leve; a onda só existe depois de um clique e some em ~2,5 s
      u.uMouse.value.lerp(bgMouse, 1 - Math.pow(0.004, dt));
      u.uWave.value = Math.max(0, 1 - (clock.elapsedTime - u.uClickT.value) / 2.5);
    }
    if (composer) composer.render(); else renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  const start = () => { if (!running) { clock.getDelta(); requestAnimationFrame(loop); } };

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }).observe(canvas);
  document.addEventListener('visibilitychange', start);

  start();

  return {
    // p: 0 (topo) → 1 (hero fora da tela). O cardume sobe e “voa” embora.
    setScroll(p) { scrollShift = p * 7; },
  };
}
