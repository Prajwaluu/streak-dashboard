// Three.js r186, locally bundled so the flame works offline.
// One tiny WebGL scene feeds both flame canvases; rerenders never allocate
// additional GPU contexts. The original silhouette is the still fallback.
import {WebGLRenderer, CanvasTexture, Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial} from './vendor/three-fire.js';

const vertexShader = `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const fragmentShader = `
  uniform sampler2D uMask;
  uniform float uTime;
  uniform float uHeat;
  uniform float uNight;
  uniform float uMotion;
  varying vec2 vUv;
  float hash(float n){ return fract(sin(n * 127.1) * 43758.5453); }
  void main(){
    vec2 uv = vUv;
    float t = uTime;
    float motion = uMotion * uHeat;
    float rise = smoothstep(0.28, 0.90, uv.y);
    float flicker = sin(t * 3.7) * 0.55 + sin(t * 8.1 + 1.2) * 0.3;
    vec2 warped = uv;
    // The base stays anchored while the tip lashes sideways and stretches.
    warped.x += (sin(uv.y * 9.0 - t * 5.2) * 0.045 + sin(t * 2.7) * 0.055) * rise * motion;
    warped.y = 0.25 + (uv.y - 0.25) / (1.0 + flicker * 0.10 * motion);
    warped.y += sin(t * 4.1 + uv.x * 9.0) * rise * 0.025 * motion;
    float body = texture2D(uMask, warped).a;
    vec2 corePoint = (uv - vec2(0.49, 0.37)) * vec2(5.4, 3.7);
    float core = exp(-dot(corePoint, corePoint) * 2.9);
    vec2 glowPoint = (uv - vec2(0.50 + sin(t * 2.7) * 0.018 * motion, 0.46)) * vec2(1.7, 1.35);
    float halo = exp(-dot(glowPoint, glowPoint) * 3.6);
    float pulse = 0.82 + (sin(t * 3.7) * 0.20 + flicker * 0.13) * motion;
    float glow = halo * (0.62 + uNight * 0.12) * pulse * uHeat;
    vec3 ember = vec3(1.0, 0.09, 0.005);
    vec3 gold = vec3(1.0, 0.46, 0.035);
    vec3 light = vec3(1.0, 0.96, 0.73);
    // Waves of heat travel upwards inside the original flame silhouette.
    float flow = sin(warped.y * 25.0 - t * 8.0 + sin(warped.x * 22.0 + t * 3.2)) * 0.5 + 0.5;
    float heat = core * 0.70 + flow * 0.24 * motion;
    vec3 fire = mix(ember, gold, 1.0 - smoothstep(0.28, 0.72, uv.y));
    fire = mix(fire, light, clamp(heat, 0.0, 1.0));
    vec2 innerUv = (warped - vec2(0.5, 0.25)) / vec2(0.56, 0.65 + flicker * 0.08 * motion) + vec2(0.5, 0.25);
    float inner = texture2D(uMask, innerUv).a;
    fire = mix(fire, light, inner * 0.88);
    fire = mix(vec3(0.55, 0.53, 0.48), fire, uHeat);
    // Bright, upward-moving sparks have tiny luminous trails.
    float sparks = 0.0, trails = 0.0;
    for(int i = 0; i < 7; i++){
      float seed = float(i) + 1.0;
      float phase = fract(t * (0.28 + seed * 0.024) + hash(seed));
      vec2 pos = vec2(0.32 + hash(seed + 8.0) * 0.36 + sin(t * 2.0 + seed) * 0.09 * phase, 0.58 + phase * 0.39);
      vec2 sparkPoint = (uv - pos) * vec2(70.0, 85.0);
      vec2 trailPoint = (uv - pos + vec2(0.0, 0.017)) * vec2(75.0, 32.0);
      float fade = sin(phase * 3.14159);
      sparks += exp(-dot(sparkPoint, sparkPoint)) * fade;
      trails += exp(-dot(trailPoint, trailPoint)) * fade * 0.28;
    }
    sparks *= motion; trails *= motion;
    float flameAlpha = body * (0.65 + uHeat * 0.35);
    float outside = glow * (1.0 - body);
    float alpha = clamp(flameAlpha + outside + sparks + trails, 0.0, 1.0);
    vec3 color = (fire * flameAlpha + gold * (outside + trails) + light * sparks) / max(alpha, 0.001);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

let renderer;
try{
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', {alpha:true, antialias:false, depth:false, stencil:false, powerPreference:'low-power', preserveDrawingBuffer:true});
  if(context) renderer = new WebGLRenderer({canvas, context, alpha:true, antialias:false, depth:false, stencil:false, powerPreference:'low-power', preserveDrawingBuffer:true});
}catch{ /* The SVG flame remains available on constrained devices. */ }

if(renderer){
  const resolution = 192;
  renderer.setSize(resolution, resolution, false);
  renderer.setClearColor(0x000000, 0);
  const mask = document.createElement('canvas'); mask.width = mask.height = 192;
  const paint = mask.getContext('2d');
  paint.scale(4, 4); paint.fillStyle = '#fff';
  paint.fill(new Path2D('M24 4c2 7 10 11 10 22a10 10 0 1 1-20 0c0-5 3-8 4-11 1 4 3 6 5 6-1-6-1-11 1-17z'));
  const texture = new CanvasTexture(mask);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const uniforms = {uMask:{value:texture}, uTime:{value:1.6}, uHeat:{value:1}, uNight:{value:0}, uMotion:{value:reduced.matches ? 0 : 1}};
  const material = new ShaderMaterial({uniforms, vertexShader, fragmentShader, transparent:true, depthTest:false, depthWrite:false});
  const geometry = new PlaneGeometry(2, 2);
  const scene = new Scene(); scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 2); camera.position.z = 1;
  const targets = new Map();
  let frame = 0, previousFrame = 0, alive = true, contextLost = false;
  const draw = target => {
    uniforms.uHeat.value = target.host.dataset.fire === '1' ? 1 : 0;
    uniforms.uNight.value = document.documentElement.dataset.theme === 'night' ? 1 : 0;
    renderer.render(scene, camera);
    target.context.clearRect(0, 0, resolution, resolution);
    target.context.drawImage(renderer.domElement, 0, 0);
    target.host.classList.add('fire-ready');
  };
  const shouldRun = () => alive && !contextLost && !document.hidden && !reduced.matches && [...targets.values()].some(t => t.visible && t.host.isConnected && t.host.dataset.fire === '1');
  const tick = time => {
    frame = 0;
    if(!shouldRun()) return;
    // 30fps is ample for a small flame and leaves the phone's GPU at ease.
    if(time - previousFrame >= 1000 / 30){
      previousFrame = time; uniforms.uTime.value = time / 1000;
      for(const target of targets.values()) if(target.visible && target.host.isConnected && target.host.dataset.fire === '1') draw(target);
    }
    frame = requestAnimationFrame(tick);
  };
  const resume = () => { if(shouldRun() && !frame) frame = requestAnimationFrame(tick); };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; };
  const visibility = new IntersectionObserver(entries => {
    for(const entry of entries){ const target = targets.get(entry.target); if(target) target.visible = entry.isIntersecting; }
    if(shouldRun()) resume(); else stop();
  });
  const sync = () => {
    if(!alive) return;
    for(const [host, target] of targets){
      if(!host.isConnected){ visibility.unobserve(host); target.canvas.remove(); targets.delete(host); }
    }
    for(const host of document.querySelectorAll('[data-fire]')){
      if(targets.has(host)) continue;
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = resolution; canvas.setAttribute('aria-hidden','true');
      canvas.dataset.motion = reduced.matches ? 'reduced' : 'animated';
      const context = canvas.getContext('2d'); if(!context) continue;
      host.append(canvas);
      const target = {host, canvas, context, visible:false}; targets.set(host, target); visibility.observe(host);
      if(!contextLost) draw(target);
    }
    resume();
  };
  const mutations = new MutationObserver(sync);
  mutations.observe(document.body, {childList:true, subtree:true});
  const appearance = new MutationObserver(() => { if(!contextLost) for(const t of targets.values()) draw(t); });
  appearance.observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  const onVisibility = () => { if(document.hidden) stop(); else resume(); };
  const onMotion = () => {
    stop(); uniforms.uMotion.value = reduced.matches ? 0 : 1;
    uniforms.uTime.value = 1.6;
    for(const t of targets.values()){
      t.canvas.dataset.motion = reduced.matches ? 'reduced' : 'animated';
      if(!contextLost) draw(t);
    }
    resume();
  };
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onMotion);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); contextLost = true; stop(); for(const t of targets.values()) t.host.classList.remove('fire-ready');
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => { contextLost = false; for(const t of targets.values()) draw(t); resume(); });
  window.addEventListener('pagehide', event => {
    stop();
    if(event.persisted) return;
    alive = false; mutations.disconnect(); appearance.disconnect(); visibility.disconnect();
    document.removeEventListener('visibilitychange', onVisibility); reduced.removeEventListener('change', onMotion);
    texture.dispose(); geometry.dispose(); material.dispose(); renderer.dispose();
    targets.clear();
  });
  window.addEventListener('pageshow', resume);
  sync();
}
