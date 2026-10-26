/* SAHRA — 3D world.
   A low-poly Sinai: dunes → palms & camps → Red Sea → night sky.
   The camera flies through it as the page scrolls; sky, light, stars,
   lanterns and campfires change from golden hour to night. */
function initScene(canvas) {
  if (!window.THREE) return null;
  let R;
  try { R = new THREE.WebGLRenderer({ canvas, antialias: innerWidth > 800, powerPreference: 'high-performance', alpha: false }); }
  catch (e) { return null; }

  const mobile = innerWidth < 800;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  let pr = Math.min(devicePixelRatio || 1, weak ? 1 : (mobile ? 1.25 : 1.5));
  R.setPixelRatio(pr);
  canvas.addEventListener('webglcontextlost', e => e.preventDefault());

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(58, 1, 0.5, 900);
  scene.fog = new THREE.FogExp2(0xd9805a, 0.006);

  const clamp01 = x => Math.min(1, Math.max(0, x));
  const smooth = (a, b, x) => { x = clamp01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- soft textures ---------- */
  const tex = (size, draw) => { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); return new THREE.CanvasTexture(c); };
  const glowTex = tex(128, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, '#fff'); r.addColorStop(.25, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  const cloudTex = tex(256, (g, s) => {
    for (let i = 0; i < 16; i++) {
      const x = s * (.2 + Math.random() * .6), y = s * (.4 + Math.random() * .25), r = s * (.1 + Math.random() * .16);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
  });
  const moonTex = tex(256, (g, s) => {
    const o = g.createRadialGradient(s / 2, s / 2, s * .1, s / 2, s / 2, s / 2); o.addColorStop(0, 'rgba(200,215,255,.55)'); o.addColorStop(1, 'rgba(200,215,255,0)'); g.fillStyle = o; g.fillRect(0, 0, s, s);
    g.fillStyle = '#f4f1e6'; g.beginPath(); g.arc(s / 2, s / 2, s * .13, 0, 7); g.fill();
    g.fillStyle = 'rgba(160,160,170,.35)'; [[-.04, -.03, .03], [.04, .03, .045], [.0, .06, .022]].forEach(c => { g.beginPath(); g.arc(s / 2 + c[0] * s, s / 2 + c[1] * s, c[2] * s, 0, 7); g.fill(); });
  });

  /* ---------- terrain height (shared by tents / palms / camera) ---------- */
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
  const sandA = new THREE.Color('#D8B27C'), sandB = new THREE.Color('#F0D3A0'), rock = new THREE.Color('#B96545'), stone = new THREE.Color('#8B8175'), deep = new THREE.Color('#3b8a8e');
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
  scene.add(new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: true })));

  /* ---------- Red Sea ---------- */
  const wg = new THREE.PlaneGeometry(420, 260, mobile ? 50 : 90, mobile ? 40 : 64);
  wg.rotateX(-Math.PI / 2);
  const wp = wg.attributes.position, wx = [], wz = [];
  for (let i = 0; i < wp.count; i++) { wx.push(wp.getX(i)); wz.push(wp.getZ(i)); }
  const water = new THREE.Mesh(wg, new THREE.MeshPhongMaterial({ color: 0x176B78, transparent: true, opacity: 0.88, shininess: 110, specular: 0xffd9a0, flatShading: true }));
  water.position.set(0, -1.2, -235);
  scene.add(water);

  /* far coast across the sea */
  const fg = new THREE.PlaneGeometry(900, 80, 60, 1); fg.rotateX(-Math.PI / 2);
  const fp = fg.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i); fp.setY(i, fp.getZ(i) < 0 ? Math.max(0, 22 + Math.sin(x * .02) * 14 + Math.sin(x * .09) * 7 + Math.sin(x * .31) * 2) : -6); }
  fg.computeVertexNormals();
  const farMat = new THREE.MeshBasicMaterial({ color: 0x2a4b5a, fog: true });
  const far = new THREE.Mesh(fg, farMat); far.position.set(0, -2, -430); scene.add(far);

  /* ---------- sky dome (with sun glow) ---------- */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(750, 32, 20), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunC: { value: new THREE.Color() }, sunD: { value: new THREE.Vector3(0, 0, -1) }, glow: { value: 1 } },
    vertexShader: 'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top;uniform vec3 bot;uniform vec3 sunC;uniform vec3 sunD;uniform float glow;varying vec3 v;void main(){float h=smoothstep(-.05,.6,v.y);vec3 c=mix(bot,top,h);float s=max(dot(normalize(v),normalize(sunD)),0.);c+=sunC*(pow(s,18.)*.28+pow(s,160.)*.55)*glow;gl_FragColor=vec4(c,1.);}'
  }));
  scene.add(sky);

  const sunMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffb36b, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sun = new THREE.Sprite(sunMat); sun.scale.set(80, 80, 1); scene.add(sun);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, transparent: true, depthWrite: false, opacity: 0 })); moon.scale.set(110, 110, 1); scene.add(moon);

  /* glitter path on the water */
  const glit = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc27a, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .45 }));
  glit.scale.set(26, 150, 1); scene.add(glit);

  /* twinkling stars */
  const N = mobile ? 900 : 1700, sp = new Float32Array(N * 3), sph = new Float32Array(N), ssz = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * Math.PI * 2, v = Math.random() * 1.35 - 0.1, r = 640;
    sp[i * 3] = Math.cos(u) * Math.cos(v) * r; sp[i * 3 + 1] = Math.sin(v) * r; sp[i * 3 + 2] = Math.sin(u) * Math.cos(v) * r;
    sph[i] = Math.random() * 6.28; ssz[i] = Math.random() < .08 ? rnd(3.2, 4.6) : rnd(1.3, 2.4);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('ph', new THREE.BufferAttribute(sph, 1)); sg.setAttribute('sz', new THREE.BufferAttribute(ssz, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, uniforms: { t: { value: 0 }, op: { value: 0 }, px: { value: pr } },
    vertexShader: 'attribute float ph;attribute float sz;uniform float t;uniform float op;uniform float px;varying float a;void main(){a=(.55+.45*sin(t*1.6+ph))*op;gl_PointSize=sz*px;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying float a;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,.95,.86,smoothstep(.5,0.,d)*a);}'
  });
  const stars = new THREE.Points(sg, starMat); scene.add(stars);

  /* shooting stars */
  const shoot = [0, 1].map(() => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false, blending: THREE.AdditiveBlending }));
    l.frustumCulled = false; l.userData = { life: 0, v: new THREE.Vector3(), p: new THREE.Vector3() }; scene.add(l); return l;
  });

  /* clouds */
  const clouds = [];
  for (let i = 0; i < (mobile ? 7 : 12); i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: 0xffffff, fog: false, transparent: true, depthWrite: false, opacity: .5 }));
    const w = rnd(70, 140); s.scale.set(w, w * .32, 1); s.position.set(rnd(-220, 220), rnd(42, 80), rnd(-330, -40)); s.userData.sp = rnd(.6, 1.6); clouds.push(s); scene.add(s);
  }

  /* ---------- palms ---------- */
  const palms = new THREE.Group();
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x7b5a3c, roughness: 1, flatShading: true });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x2f7a55, roughness: .9, flatShading: true, side: THREE.DoubleSide });
  const leafG = new THREE.PlaneGeometry(.9, 3.6, 1, 3); leafG.translate(0, 1.8, 0);
  for (let i = 0; i < (mobile ? 10 : 18); i++) {
    const x = (Math.random() < .5 ? -1 : 1) * rnd(10, 34), z = rnd(-128, -70), y = H(x, z);
    if (y > 5) continue;
    const g = new THREE.Group(), th = rnd(4.5, 7);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.16, .3, th, 6), trunkM); tr.position.y = th / 2; tr.rotation.z = rnd(-.15, .15); g.add(tr);
    for (let k = 0; k < 8; k++) {
      const l = new THREE.Mesh(leafG, leafM); l.position.set(tr.rotation.z * -th * .5, th, 0);
      l.rotation.order = 'YXZ'; l.rotation.y = k * .785 + rnd(-.1, .1); l.rotation.x = 1.0 + rnd(-.15, .3); l.scale.setScalar(rnd(.85, 1.25)); g.add(l);
    }
    g.position.set(x, y - .3, z); g.userData.ph = Math.random() * 6; palms.add(g);
  }
  scene.add(palms);

  /* ---------- camps: tents, fire, lanterns ---------- */
  const tents = new THREE.Group(), glows = [];
  const spots = [[-16, 6], [-24, -6], [20, -18], [-12, -34], [26, -46], [-30, -60]];
  spots.forEach((t, i) => {
    const y = H(t[0], t[1]);
    const m = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.2, 4), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xF5EBDD : 0xB96545, roughness: 1, flatShading: true }));
    m.position.set(t[0], y + 1.5, t[1]); m.rotation.y = Math.PI / 4 + i; tents.add(m);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.5), new THREE.MeshBasicMaterial({ color: 0xffb36b, transparent: true, opacity: 0 }));
    door.position.set(t[0] + Math.sin(m.rotation.y + .78) * 1.4, y + .9, t[1] + Math.cos(m.rotation.y + .78) * 1.4); door.rotation.y = m.rotation.y + .78; tents.add(door); glows.push(door);
  });
  scene.add(tents);
  const fireP = new THREE.Vector3(-8, H(-8, -12), -12);
  const fire = new THREE.PointLight(0xff9a4a, 0, 26); fire.position.set(fireP.x, fireP.y + 1.6, fireP.z); scene.add(fire);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff8a3a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  flame.scale.set(4, 5, 1); flame.position.set(fireP.x, fireP.y + 1.3, fireP.z); scene.add(flame);
  const logs = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.1, .35, 7), new THREE.MeshStandardMaterial({ color: 0x3a2a20, flatShading: true })); logs.position.set(fireP.x, fireP.y + .1, fireP.z); scene.add(logs);

  const L = mobile ? 40 : 90, lp = new Float32Array(L * 3), lv = [];
  for (let i = 0; i < L; i++) { lp[i * 3] = rnd(-34, 30); lp[i * 3 + 1] = rnd(2, 26); lp[i * 3 + 2] = rnd(-70, 10); lv.push(rnd(.5, 1.4)); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const lanterns = new THREE.Points(lg, new THREE.PointsMaterial({ map: glowTex, color: 0xffb35c, size: 14, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(lanterns);

  /* ---------- yacht + dolphins ---------- */
  const boat = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xF5EBDD, flatShading: true, side: THREE.DoubleSide });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.6, .8, 6), white);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.84, 2.4, 4), white); bow.rotation.set(Math.PI / 2, Math.PI / 4, 0); bow.scale.set(1, 1, .43); bow.position.set(0, 0, -4.1);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 2.6), new THREE.MeshStandardMaterial({ color: 0xB96545, flatShading: true })); cab.position.set(0, .9, .6);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 8, 6), white); mast.position.set(0, 4.6, -.6);
  const sailG = new THREE.BufferGeometry(); sailG.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 7.6, -.5, 0, 1.6, -.5, 0, 1.6, 3.4]), 3)); sailG.computeVertexNormals();
  const sail = new THREE.Mesh(sailG, white);
  const jibG = new THREE.BufferGeometry(); jibG.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 7.2, -.7, 0, 1.4, -.7, 0, 1.4, -4]), 3)); jibG.computeVertexNormals();
  const jib = new THREE.Mesh(jibG, new THREE.MeshStandardMaterial({ color: 0xFFE2A0, flatShading: true, side: THREE.DoubleSide }));
  boat.add(hull, bow, cab, mast, sail, jib);
  const wake = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: .35, depthWrite: false })); wake.scale.set(5, 14, 1); wake.position.set(0, -.5, 7); boat.add(wake);
  boat.position.set(7, -1, -192); boat.rotation.y = .5; scene.add(boat);

  const dol = new THREE.Group();
  const dm = new THREE.MeshStandardMaterial({ color: 0x5d7f93, flatShading: true });
  const db = new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 6), dm); db.scale.set(.8, .8, 2.6);
  const dn = new THREE.Mesh(new THREE.ConeGeometry(.2, .8, 6), dm); dn.rotation.x = -Math.PI / 2; dn.position.z = -1.5;
  const df = new THREE.Mesh(new THREE.ConeGeometry(.22, .6, 4), dm); df.position.set(0, .6, .1);
  const dt = new THREE.Mesh(new THREE.ConeGeometry(.4, .7, 4), dm); dt.rotation.x = Math.PI / 2; dt.scale.set(1, 1, .25); dt.position.z = 1.8;
  dol.add(db, dn, df, dt); dol.visible = false; scene.add(dol);
  let dolT = -3;

  /* ---------- drifting dust ---------- */
  const D = mobile ? 120 : 260, dp = new Float32Array(D * 3);
  for (let i = 0; i < D; i++) { dp[i * 3] = (Math.random() - .5) * 90; dp[i * 3 + 1] = Math.random() * 22; dp[i * 3 + 2] = -Math.random() * 90; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xf1d3a0, size: 2, sizeAttenuation: false, transparent: true, opacity: .5, depthWrite: false }));
  scene.add(dust);

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xffe0b5, 0x2b3f4a, .9); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffb36b, 1.6); dir.position.set(-70, 35, -60); scene.add(dir);

  /* ---------- time of day (scroll progress 0 → 1) ---------- */
  const K = a => a.map(h => new THREE.Color(h));
  const TOP = K(['#2a4a5c', '#3b8fa0', '#1f7f8c', '#0a1a24', '#050d14']);
  const BOT = K(['#d9805a', '#e9c9a0', '#8fd0cc', '#2a4b5a', '#142B35']);
  const SUN = K(['#ffb36b', '#fff0d0', '#ffffff', '#ff9a6a', '#9db4ff']);
  const SEA = K(['#176B78', '#1b8a96', '#1d97a2', '#17566a', '#103a4c']);
  const FAR = K(['#6d5a66', '#4a7d86', '#3c7480', '#1b3745', '#0b1b25']);
  const SI = [1.25, 1.0, .85, .65, .3], HI = [.7, .72, .72, .55, .4];
  const stops = [0, .3, .6, .85, 1], tmp2 = new THREE.Color();
  function mix(arr, p, out) {
    for (let i = 0; i < 4; i++) if (p <= stops[i + 1]) { out.copy(arr[i]).lerp(arr[i + 1], (p - stops[i]) / (stops[i + 1] - stops[i])); return out; }
    return out.copy(arr[4]);
  }
  function mixN(arr, p) {
    for (let i = 0; i < 4; i++) if (p <= stops[i + 1]) return arr[i] + (arr[i + 1] - arr[i]) * (p - stops[i]) / (stops[i + 1] - stops[i]);
    return arr[4];
  }
  let night = 0;
  function atmosphere(p) {
    mix(TOP, p, sky.material.uniforms.top.value);
    mix(BOT, p, sky.material.uniforms.bot.value);
    scene.fog.color.copy(sky.material.uniforms.bot.value);
    mix(SUN, p, tmp2); dir.color.copy(tmp2); sunMat.color.copy(tmp2); sky.material.uniforms.sunC.value.copy(tmp2);
    mix(SEA, p, water.material.color); mix(FAR, p, farMat.color);
    dir.intensity = mixN(SI, p); hemi.intensity = mixN(HI, p);
    night = smooth(.7, .95, p);
    starMat.uniforms.op.value = smooth(.66, .94, p);
    sunMat.opacity = 1 - smooth(.78, .95, p);
    sky.material.uniforms.glow.value = 1 - night * .8;
    glit.material.opacity = .45 * (1 - night); glit.material.color.copy(tmp2);
    moon.material.opacity = smooth(.72, .95, p);
    glows.forEach(g => g.material.opacity = night * .9);
    fire.intensity = night * 2.2; flame.material.opacity = night * .95;
    lanterns.material.opacity = night * .9;
    clouds.forEach(cl => { cl.material.color.copy(tmp2).lerp(new THREE.Color(0xffffff), .5); cl.material.opacity = .5 - night * .38; });
    scene.fog.density = 0.006 - night * 0.002;
  }

  /* ---------- loop ---------- */
  let target = 0, cur = 0, camY = 9, mx = 0, my = 0, t = 0, paused = false, last = performance.now(), lastTarget = 0, roll = 0;
  let slow = 0, frames = 0, waves = true, fn = 0;
  const sunV = new THREE.Vector3();
  function frame(now) {
    requestAnimationFrame(frame);
    if (paused || document.hidden) { last = now; return; }
    const dtRaw = (now - last) / 1000, dt = Math.min(.05, dtRaw); last = now;
    t += reduce ? 0 : dt;

    // adaptive quality: if the device struggles, step down
    frames++; if (dtRaw > .034) slow++;
    if (frames === 90) {
      if (slow > 45 && pr > 1) { pr = Math.max(1, pr - .5); R.setPixelRatio(pr); starMat.uniforms.px.value = pr; resize(); }
      else if (slow > 45) waves = false;
      frames = 0; slow = 0;
    }

    cur += (target - cur) * (reduce ? 1 : Math.min(1, dt * 4.5));
    const vel = (target - lastTarget) / Math.max(dt, .001); lastTarget = target;
    roll += ((Math.max(-1, Math.min(1, vel * .5)) * .05) - roll) * Math.min(1, dt * 4);

    const z = 45 - cur * 300;
    const x = Math.sin(cur * 5) * 9 + mx * 4;
    const want = Math.max(8.5 - 3.6 * smooth(.15, .65, cur), Math.max(H(x, z), -1.2) + 3.4);
    camY += (want - camY) * Math.min(1, dt * 3);
    cam.position.set(x, camY + Math.sin(t * .5) * .15, z);
    cam.lookAt(x * .4 + mx * 10, camY - 3.5 - my * 3, z - 45);
    cam.rotation.z += roll;

    sky.position.copy(cam.position); stars.position.copy(cam.position);
    sun.position.set(cam.position.x - 70, 24 + cam.position.y * .3, cam.position.z - 330);
    sunV.copy(sun.position).sub(cam.position); sky.material.uniforms.sunD.value.copy(sunV);
    glit.position.set(cam.position.x - 52, -.4, cam.position.z - 300);
    moon.position.set(cam.position.x + 80, 110, cam.position.z - 330);
    far.position.set(cam.position.x * .3, -2, -430);
    dust.position.set(cam.position.x, cam.position.y - 8, cam.position.z);
    starMat.uniforms.t.value = t;

    const dpA = dg.attributes.position.array;
    for (let i = 0; i < D; i++) { dpA[i * 3] += dt * 2.2; if (dpA[i * 3] > 45) dpA[i * 3] = -45; dpA[i * 3 + 1] += Math.sin(t + i) * .004; }
    dg.attributes.position.needsUpdate = true;

    clouds.forEach(cl => { cl.position.x += dt * cl.userData.sp; if (cl.position.x > 240) cl.position.x = -240; });
    palms.children.forEach(g => { g.rotation.z = Math.sin(t * .8 + g.userData.ph) * .018; });

    if (night > .02 && !reduce) {
      const lp_ = lg.attributes.position.array;
      for (let i = 0; i < L; i++) { lp_[i * 3 + 1] += dt * lv[i]; lp_[i * 3] += Math.sin(t * .6 + i) * dt * .4; if (lp_[i * 3 + 1] > 32) lp_[i * 3 + 1] = 1; }
      lg.attributes.position.needsUpdate = true;
      const fl = .75 + Math.sin(t * 17) * .12 + Math.sin(t * 31) * .08; fire.intensity = night * 2.2 * fl; flame.scale.set(3.6 + fl, 4.4 + fl * 1.6, 1);
      // shooting stars
      if (night > .5) shoot.forEach(s => {
        const u = s.userData;
        if (u.life <= 0 && Math.random() < dt * .22) {
          u.life = 1; u.p.set(cam.position.x + rnd(-250, 250), cam.position.y + rnd(120, 300), cam.position.z - rnd(250, 500)); u.v.set(rnd(-1, 1) > 0 ? 160 : -160, -70, 30);
        }
        if (u.life > 0) {
          u.life -= dt * 1.3; u.p.addScaledVector(u.v, dt);
          const a = s.geometry.attributes.position.array; a[0] = u.p.x; a[1] = u.p.y; a[2] = u.p.z; a[3] = u.p.x - u.v.x * .12; a[4] = u.p.y - u.v.y * .12; a[5] = u.p.z - u.v.z * .12;
          s.geometry.attributes.position.needsUpdate = true; s.material.opacity = Math.max(0, u.life);
        }
      });
    }

    fn++;
    if (cur > .4 && waves && !reduce && (fn & 1)) {
      for (let i = 0; i < wp.count; i++) wp.setY(i, Math.sin(wx[i] * .12 + t * 1.2) * .28 + Math.cos(wz[i] * .1 + t) * .22);
      wp.needsUpdate = true;
    }
    boat.position.y = -1 + Math.sin(t * 1.3) * .12; boat.rotation.z = Math.sin(t * .9) * .04; sail.rotation.y = Math.sin(t * .5) * .05;

    // dolphin arc every ~8 s while the sea is in view
    if (cur > .45 && cur < .85 && !reduce) {
      dolT += dt;
      if (dolT > 0 && dolT < 1.8) { const k = dolT / 1.8; dol.visible = true; dol.position.set(-6 + k * 12, -1.3 + Math.sin(k * Math.PI) * 3.2, -184 - k * 4); dol.rotation.set(Math.cos(k * Math.PI) * .7, .3, 0); }
      else dol.visible = false;
      if (dolT > 8) dolT = -rnd(0, 3);
    } else dol.visible = false;

    atmosphere(cur);
    R.render(scene, cam);
  }
  function resize() {
    R.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight;
    cam.fov = innerWidth < 700 ? 70 : 58;
    cam.updateProjectionMatrix();
  }
  // ignore the tiny height changes caused by mobile address bars; only react to real resizes
  let lw = innerWidth, lh = innerHeight, rt = 0;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (innerWidth !== lw || Math.abs(innerHeight - lh) > 140) { lw = innerWidth; lh = innerHeight; resize(); } }, 120);
  });
  resize(); atmosphere(0); requestAnimationFrame(frame);

  return {
    set: p => { target = clamp01(p); },
    pointer: (x, y) => { mx = x; my = y; },
    pause: v => { paused = v; }
  };
}
