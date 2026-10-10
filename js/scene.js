/* SAHRA — 3D world.
   A low-poly Sinai: dunes → coast → Red Sea → night sky.
   The camera flies through it as the page scrolls. */
function initScene(canvas) {
  if (!window.THREE) return null;
  let R;
  try { R = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }

  const mobile = innerWidth < 800;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  R.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75));

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(58, 1, 0.5, 720);
  scene.fog = new THREE.FogExp2(0xd9805a, 0.006);

  const clamp01 = x => Math.min(1, Math.max(0, x));
  const smooth = (a, b, x) => { x = clamp01((x - a) / (b - a)); return x * x * (3 - 2 * x); };

  /* ---------- terrain height (shared by tents / camera) ---------- */
  function H(x, z) {
    const ridge = 1 - Math.abs(Math.sin(x * 0.045 + Math.sin(z * 0.02) * 3));
    let h = ridge * ridge * 7 + Math.sin(x * 0.13 + z * 0.09) * 0.6 + Math.sin(z * 0.07 + x * 0.02) * 1.2;
    const sea = smooth(-130, -185, z);
    h = h * (1 - sea) + (-4.5 + Math.sin(x * 0.03) * 0.8) * sea;
    h += smooth(52, 125, Math.abs(x)) * (16 + Math.abs(Math.sin(z * 0.05 + x * 0.03)) * 22 + Math.sin(z * 0.13) * 4);
    return h;
  }

  /* ---------- terrain mesh ---------- */
  const sx = mobile ? 110 : 190, sz = mobile ? 130 : 230;
  const tg = new THREE.PlaneGeometry(360, 420, sx, sz);
  tg.rotateX(-Math.PI / 2); tg.translate(0, 0, -130);
  const pos = tg.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  const sandA = new THREE.Color('#D8B27C'), sandB = new THREE.Color('#E0BB86'),
        rock = new THREE.Color('#B96545'), stone = new THREE.Color('#8B8175'), deep = new THREE.Color('#3b8a8e');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = H(x, z);
    pos.setY(i, h);
    c.copy(sandA).lerp(sandB, clamp01(h / 7));
    c.lerp(rock, smooth(8, 22, h) * 0.8).lerp(stone, smooth(18, 34, h) * 0.8);
    c.lerp(deep, smooth(-135, -185, z) * (1 - smooth(8, 18, h)) * 0.5);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  tg.computeVertexNormals();
  scene.add(new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: false })));

  /* ---------- Red Sea ---------- */
  const wg = new THREE.PlaneGeometry(360, 230, mobile ? 50 : 90, mobile ? 40 : 60);
  wg.rotateX(-Math.PI / 2);
  const wp = wg.attributes.position, wx = [], wz = [];
  for (let i = 0; i < wp.count; i++) { wx.push(wp.getX(i)); wz.push(wp.getZ(i)); }
  const water = new THREE.Mesh(wg, new THREE.MeshPhongMaterial({
    color: 0x176B78, transparent: true, opacity: 0.86, shininess: 90, specular: 0xffd9a0, flatShading: true
  }));
  water.position.set(0, -1.2, -225);
  scene.add(water);

  /* ---------- sky, sun, stars ---------- */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(650, 24, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top;uniform vec3 bot;varying vec3 v;void main(){float h=smoothstep(-.05,.55,v.y);gl_FragColor=vec4(mix(bot,top,h),1.);}'
  }));
  scene.add(sky);

  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const cx = cv.getContext('2d'), gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
  const sunMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color: 0xffb36b, fog: false, transparent: true, depthWrite: false });
  const sun = new THREE.Sprite(sunMat); sun.scale.set(110, 110, 1); scene.add(sun);

  const N = 1800, sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * Math.PI * 2, v = Math.random() * 1.35 - 0.1, r = 560;
    sp[i * 3] = Math.cos(u) * Math.cos(v) * r; sp[i * 3 + 1] = Math.sin(v) * r; sp[i * 3 + 2] = Math.sin(u) * Math.cos(v) * r;
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff3dc, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  scene.add(stars);

  /* ---------- camps (tents) ---------- */
  const tents = new THREE.Group();
  [[-16, 6], [-24, -6], [20, -18], [-12, -34], [26, -46], [-30, -60]].forEach((t, i) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.2, 4), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xF5EBDD : 0xB96545, roughness: 1, flatShading: true }));
    m.position.set(t[0], H(t[0], t[1]) + 1.5, t[1]); m.rotation.y = Math.PI / 4 + i; tents.add(m);
    const glow = new THREE.PointLight(0xffb36b, 0.0, 14); glow.position.set(t[0], H(t[0], t[1]) + 2, t[1]); tents.add(glow);
  });
  scene.add(tents);

  /* ---------- yacht ---------- */
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.6, .8, 7), new THREE.MeshStandardMaterial({ color: 0xF5EBDD, flatShading: true }));
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 2.6), new THREE.MeshStandardMaterial({ color: 0xB96545, flatShading: true }));
  cab.position.set(0, .9, -.4);
  const mast = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5.5, 3), new THREE.MeshStandardMaterial({ color: 0xF5EBDD, flatShading: true, side: THREE.DoubleSide }));
  mast.position.set(0, 3.6, 1); mast.scale.z = .08;
  boat.add(hull, cab, mast); boat.position.set(7, -1, -192); boat.rotation.y = .5;
  scene.add(boat);

  /* ---------- drifting dust ---------- */
  const D = 260, dp = new Float32Array(D * 3);
  for (let i = 0; i < D; i++) { dp[i * 3] = (Math.random() - .5) * 90; dp[i * 3 + 1] = Math.random() * 11; dp[i * 3 + 2] = -Math.random() * 90; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xf1d3a0, size: 1.6, sizeAttenuation: false, transparent: true, opacity: .35, depthWrite: false }));
  scene.add(dust);

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xffe0b5, 0x2b3f4a, .5); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffb36b, 1.0); dir.position.set(-70, 35, -60); scene.add(dir);

  /* ---------- time of day (scroll progress 0 → 1) ---------- */
  const K = a => a.map(h => new THREE.Color(h));
  const TOP = K(['#2a4a5c', '#3b8fa0', '#1f7f8c', '#0a1a24', '#050d14']);
  const BOT = K(['#d9805a', '#e9c9a0', '#8fd0cc', '#2a4b5a', '#142B35']);
  const SUN = K(['#ffb36b', '#fff0d0', '#ffffff', '#ff9a6a', '#9db4ff']);
  const SI = [1.0, 1.1, 1.1, .7, .3], HI = [.5, .65, .75, .5, .3];
  const stops = [0, .3, .6, .85, 1], tmp = new THREE.Color(), tmp2 = new THREE.Color();
  function mix(arr, p, out) {
    for (let i = 0; i < 4; i++) if (p <= stops[i + 1]) { out.copy(arr[i]).lerp(arr[i + 1], (p - stops[i]) / (stops[i + 1] - stops[i])); return out; }
    return out.copy(arr[4]);
  }
  function mixN(arr, p) {
    for (let i = 0; i < 4; i++) if (p <= stops[i + 1]) return arr[i] + (arr[i + 1] - arr[i]) * (p - stops[i]) / (stops[i + 1] - stops[i]);
    return arr[4];
  }
  function atmosphere(p) {
    mix(TOP, p, sky.material.uniforms.top.value);
    mix(BOT, p, sky.material.uniforms.bot.value);
    scene.fog.color.copy(sky.material.uniforms.bot.value);
    mix(SUN, p, tmp2); dir.color.copy(tmp2); sunMat.color.copy(tmp2);
    dir.intensity = mixN(SI, p); hemi.intensity = mixN(HI, p);
    stars.material.opacity = smooth(.68, .95, p);
    sunMat.opacity = 1 - smooth(.8, .95, p) * .35;
    const night = smooth(.7, .95, p);
    tents.children.forEach(o => { if (o.isPointLight) o.intensity = night * 1.6; });
    scene.fog.density = 0.006 - night * 0.002;
  }

  /* ---------- loop ---------- */
  let target = 0, cur = 0, camY = 9, mx = 0, my = 0, t = 0, paused = false, last = performance.now();
  // Adaptive quality: if the device is slow, step down automatically (2 high, 1 medium, 0 low)
  let q = 2, acc = 0, nf = 0, tick = 0, waveStep = 2, warm = 0;
  function applyQuality() {
    if (q <= 1) { R.setPixelRatio(1); resize(); waveStep = 3; }
    if (q === 0) { dust.visible = false; waveStep = 6; scene.fog.density = 0.008; }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (paused || document.hidden) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    t += reduce ? 0 : dt;
    warm += dt; acc += dt; nf++;
    if (nf === 40) { if (warm > 1.5 && acc / nf > 0.034 && q > 0) { q--; applyQuality(); } acc = 0; nf = 0; }
    cur += (target - cur) * (reduce ? 1 : Math.min(1, dt * 4.5));

    const z = 45 - cur * 300;
    const x = Math.sin(cur * 5) * 9 + mx * 4;
    const want = Math.max(8.5 - 3.6 * smooth(.15, .65, cur), Math.max(H(x, z), -1.2) + 3.4);
    camY += (want - camY) * Math.min(1, dt * 3);
    cam.position.set(x, camY + Math.sin(t * .5) * .15, z);
    cam.lookAt(x * .4 + mx * 10, camY - 3.5 - my * 3, z - 45);

    sky.position.copy(cam.position); stars.position.copy(cam.position);
    sun.position.set(cam.position.x - 70, 24 + cam.position.y * .3, cam.position.z - 330);
    dust.position.set(cam.position.x, cam.position.y - 8, cam.position.z);
    const dpA = dg.attributes.position.array;
    for (let i = 0; i < D; i++) { dpA[i * 3] += dt * 2.2; if (dpA[i * 3] > 45) dpA[i * 3] = -45; dpA[i * 3 + 1] += Math.sin(t + i) * .004; }
    dg.attributes.position.needsUpdate = true;

    if (cur > .45 && !reduce && (++tick % waveStep === 0)) {
      for (let i = 0; i < wp.count; i++)
        wp.setY(i, Math.sin(wx[i] * .12 + t * 1.2) * .28 + Math.cos(wz[i] * .1 + t) * .22);
      wp.needsUpdate = true;
    }
    boat.position.y = -1 + Math.sin(t * 1.3) * .12; boat.rotation.z = Math.sin(t * .9) * .04;
    atmosphere(cur);
    R.render(scene, cam);
  }
  function resize() {
    R.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight;
    cam.fov = innerWidth < 700 ? 70 : 58;
    cam.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize(); atmosphere(0); requestAnimationFrame(frame);

  return {
    set: p => { target = clamp01(p); },
    pointer: (x, y) => { mx = x; my = y; },
    pause: v => { paused = v; },
    info: () => ({ quality: q, triangles: R.info.render.triangles, calls: R.info.render.calls, pixelRatio: R.getPixelRatio() })
  };
}
