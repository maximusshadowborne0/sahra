(function () {
  const S = window.SAHRA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ALL = [...S.operation, ...S.stays, ...S.activities];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const T = S.tiers;

  /* ---------------- 3D world ---------------- */
  let world = null;
  try { world = initScene($('#world')); } catch (e) { console.warn('3D disabled', e); }
  if (!world) document.body.classList.add('nogl');

  /* ---------------- brand logo (optional image) ---------------- */
  if (S.brand.logo) $$('.brand span img').forEach(i => i.src = S.brand.logo);

  /* ---------------- generated art ---------------- */
  let uid = 0;
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const W = 400, HH = 500;
  const wave = (r, y, amp, color, n = 4) => { const w = W / n; let d = `M0 ${HH}L0 ${y}`; for (let i = 0; i < n; i++) { d += `Q${(w * i + w / 2).toFixed(0)} ${(y + (i % 2 ? 1 : -1) * amp * (.5 + r() * .8)).toFixed(0)} ${(w * (i + 1)).toFixed(0)} ${(y + (r() - .5) * amp * .6).toFixed(0)}`; } return `<path d="${d}L${W} ${HH}Z" fill="${color}"/>`; };
  const peaks = (r, y, amp, color, n = 6) => { let d = `M0 ${HH}L0 ${y}`; for (let i = 1; i <= n; i++) d += `L${(W * i / n - W / n / 2).toFixed(0)} ${(y - amp * (.4 + r() * .9)).toFixed(0)}L${(W * i / n).toFixed(0)} ${(y + r() * amp * .3).toFixed(0)}`; return `<path d="${d}L${W} ${HH}Z" fill="${color}"/>`; };
  const sunC = (r, c, y = 190) => { const x = 110 + r() * 180, id = 'sg' + (++uid); return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset=".35" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><circle cx="${x.toFixed(0)}" cy="${y}" r="120" fill="url(#${id})"/><circle cx="${x.toFixed(0)}" cy="${y}" r="38" fill="${c}"/>`; };
  const starsS = (r, n) => Array.from({ length: n }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 300).toFixed(0)}" r="${(.6 + r() * 1.5).toFixed(1)}" fill="#fff" opacity="${(.4 + r() * .6).toFixed(2)}"/>`).join('');
  const palm = (x, y, s, r) => { let o = `<path d="M${x} ${y}Q${x + 8 * s} ${y - 40 * s} ${x + 3 * s} ${y - 80 * s}" stroke="#4a3626" stroke-width="${3.4 * s}" fill="none" stroke-linecap="round"/>`; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .62 + (r() - .5) * .2; o += `<path d="M${x + 3 * s} ${y - 80 * s}q${Math.cos(a) * 26 * s} ${Math.sin(a) * 24 * s - 4 * s} ${Math.cos(a) * 46 * s} ${Math.sin(a) * 30 * s + 16 * s}" stroke="#2f7a55" stroke-width="${3 * s}" fill="none" stroke-linecap="round"/>`; } return o; };
  const DEF = { sea: ['#3b8fa0', '#f0d9a8'], sunset: ['#4a2b5a', '#f39a5f'], desert: ['#e88f62', '#f6d6a1'], mountain: ['#3a4f7a', '#f2b08a'], night: ['#050d14', '#1f4256'], dive: ['#0b3b52', '#38b6c4'], road: ['#2a4a5c', '#e9a070'], sky: ['#2f7fa5', '#bfe3ef'], camp: ['#2b3a5e', '#e59a62'], hotel: ['#3b8fa0', '#f3c991'], resort: ['#2a9db0', '#f5d9a6'] };
  const SC = {
    sea: r => sunC(r, '#fff2cf', 230) + wave(r, 330, 16, '#2aa1a6') + wave(r, 385, 20, '#176B78') + wave(r, 445, 24, '#0f4c58'),
    sunset: r => sunC(r, '#ffd08a', 260) + wave(r, 340, 12, '#7a3d62') + wave(r, 400, 18, '#3d2447') + wave(r, 450, 20, '#24142c'),
    desert: r => sunC(r, '#fff0c4', 210) + wave(r, 300, 26, '#d79a62', 3) + wave(r, 370, 34, '#c47a4a', 3) + wave(r, 440, 30, '#8f4e32', 3),
    mountain: r => sunC(r, '#ffe3b8', 250) + peaks(r, 330, 110, '#6b5a78') + peaks(r, 390, 90, '#8a4f4f') + peaks(r, 460, 70, '#3d2a35'),
    night: r => starsS(r, 70) + `<circle cx="${(260 + r() * 90).toFixed(0)}" cy="90" r="22" fill="#f4f1e6"/>` + wave(r, 380, 24, '#1a3140', 3) + wave(r, 450, 24, '#0b1a22', 3),
    dive: r => `<g opacity=".18" fill="#fff">${[60, 150, 250, 330].map(x => `<path d="M${x} 0l40 0l-70 500l-60 0z"/>`).join('')}</g>` + Array.from({ length: 14 }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 360).toFixed(0)}" r="${(2 + r() * 6).toFixed(1)}" fill="none" stroke="#fff" opacity=".45"/>`).join('') + `<g fill="#ffb36b"><path d="M${(100 + r() * 100).toFixed(0)} 250q22 -16 44 0q-22 16 -44 0zM${(250 + r() * 60).toFixed(0)} 300q18 -13 36 0q-18 13 -36 0z"/></g>` + wave(r, 420, 20, '#1d7f8f', 5) + `<path d="M40 500v-60q-8-30 6-40q6 20 14 0q14 22 4 40v60zM300 500v-80q-10-26 8-44q8 24 18 2q14 20 2 42v80z" fill="#ff7a6b"/>`,
    road: r => sunC(r, '#ffd79a', 250) + peaks(r, 330, 50, '#5b4658') + `<path d="M0 500L0 380L400 380L400 500Z" fill="#2c3a44"/><path d="M165 380L235 380L380 500L20 500Z" fill="#1b2630"/><g fill="#f5ebdd">${[0, 1, 2, 3].map(i => `<path d="M${198 - i * 4} ${392 + i * 26}h${4 + i * 8}l${i * 2 + 2} 14h-${6 + i * 8}z"/>`).join('')}</g>`,
    sky: r => sunC(r, '#fff6d8', 150) + Array.from({ length: 5 }, () => `<ellipse cx="${(r() * W).toFixed(0)}" cy="${(260 + r() * 200).toFixed(0)}" rx="${(60 + r() * 70).toFixed(0)}" ry="${(14 + r() * 14).toFixed(0)}" fill="#fff" opacity=".55"/>`).join('') + `<g transform="translate(${(120 + r() * 100).toFixed(0)} 200) rotate(-18)" fill="#fff"><path d="M0 0l90 8l22 -10l8 3l-18 12l18 12l-8 3l-22 -10l-90 8l-10 -8z"/></g>`,
    camp: r => starsS(r, 40) + wave(r, 330, 24, '#c27a52', 3) + [[90, 380, 1], [220, 400, 1.2], [320, 370, .9]].map(t => `<path d="M${t[0]} ${t[1]}l${-34 * t[2]} 0l${34 * t[2]} ${-60 * t[2]}l${34 * t[2]} ${60 * t[2]}z" fill="${t[2] > 1 ? '#f5ebdd' : '#b96545'}"/>`).join('') + wave(r, 440, 22, '#8f4e32', 3) + `<circle cx="200" cy="448" r="26" fill="#ffb36b" opacity=".35"/><circle cx="200" cy="450" r="7" fill="#ffd08a"/>`,
    hotel: r => sunC(r, '#fff0c4', 210) + wave(r, 360, 14, '#2aa1a6') + Array.from({ length: 4 }, (_, i) => { const x = 40 + i * 84, h = 120 + r() * 90; return `<rect x="${x}" y="${360 - h}" width="68" height="${h + 20}" fill="${i % 2 ? '#f5ebdd' : '#e8d3b0'}"/>` + Array.from({ length: Math.floor(h / 28) }, (_, k) => `<rect x="${x + 10}" y="${360 - h + 12 + k * 28}" width="14" height="14" fill="#1b6f80" opacity=".8"/><rect x="${x + 40}" y="${360 - h + 12 + k * 28}" width="14" height="14" fill="#1b6f80" opacity=".8"/>`).join(''); }).join('') + wave(r, 420, 20, '#176B78') + wave(r, 470, 20, '#0f4c58'),
    resort: r => sunC(r, '#fff0c4', 200) + wave(r, 330, 14, '#37b3b8') + palm(70, 400, 1.2, r) + palm(330, 410, 1.05, r) + `<path d="M120 440q80 -22 160 0v40h-160z" fill="#8fe3e6" opacity=".9"/>` + wave(r, 450, 16, '#0f4c58')
  };
  const artSVG = (scene, seed, hue) => {
    const r = rng(hash(seed)), d = DEF[scene] || DEF.sea, id = 'ag' + (++uid);
    const top = hue ? hue[1] : d[0], bot = hue ? hue[0] : d[1];
    return `<svg viewBox="0 0 ${W} ${HH}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs><rect width="${W}" height="${HH}" fill="url(#${id})"/>${(SC[scene] || SC.sea)(r)}</svg>`;
  };
  const sceneOf = x => x.section === 'stay' ? (x.kind === 'Camp' ? 'camp' : x.kind === 'Resort' ? 'resort' : 'hotel') : x.scene;
  const initials = n => n.replace(/[()&]/g, '').split(/\s+/).filter(w => !/^(hotel|camp|resort|dahab|the)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || n[0];
  const artOf = (x, big) => {
    const hue = x.section === 'stay' ? T[x.tier].hue : null;
    const img = x.cover ? `<img src="${esc(big ? x.coverBig : x.cover)}" alt="${esc(x.name)}" loading="${big ? 'eager' : 'lazy'}" decoding="async" onload="this.classList.add('ld')" onerror="this.remove()">` : '';
    const mono = (x.section === 'stay' && !x.cover) ? `<span class="mono">${esc(initials(x.name))}</span>` : '';
    return `<div class="art">${artSVG(sceneOf(x), x.id, hue)}${mono}${img}</div>`;
  };
  const sym = n => '$'.repeat(n);
  const waNum = (S.brand.whatsapp || '').replace(/\D/g, '');
  const HAS_WA = /^\d{10,15}$/.test(waNum) && !/0{6,}/.test(waNum);
  const contactURL = text => HAS_WA ? `https://wa.me/${waNum}?text=${encodeURIComponent(text)}` : `mailto:${S.brand.email}?subject=${encodeURIComponent('Sahra request')}&body=${encodeURIComponent(text)}`;
  const CONTACT_LABEL = HAS_WA ? 'WhatsApp' : 'Email us';
  const ext = a => { if (HAS_WA) { a.target = '_blank'; a.rel = 'noopener'; } };

  /* smooth scroll (Lenis) — optional, falls back to native */
  let lenis = null;
  const scrollToEl = el => { if (!el) return; if (lenis) lenis.scrollTo(el, { duration: 1.3 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  function initSmooth() {
    if (reduce || !window.Lenis || !window.gsap) return;
    try {
      lenis = new Lenis({ duration: 1.05, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    } catch (e) { lenis = null; }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const h = a.getAttribute('href'); if (h === '#' || h.startsWith('#/')) return;
    let el = null; try { el = document.querySelector(h); } catch (er) { }
    if (el) { e.preventDefault(); scrollToEl(el); }
  });

  /* scroll reveals (CSS does the animation; this only flips a class) */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -5% 0px', threshold: .04 }) : null;
  const reveal = root => $$('.rv:not(.in)', root || document).forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------------- card templates ---------------- */
  const card = x => {
    const st = x.section === 'stay', mediaN = x.pics.length;
    const badges = st ? `<span class="badge l">${esc(x.kind)}</span><span class="badge r">${sym(T[x.tier].sym)}</span>${x.vids.length ? '<span class="badge vid" style="left:auto;right:14px;top:44px">' + x.vids.length + ' videos</span>' : ''}` : '';
    const sub = st ? (mediaN ? `${mediaN} photos · ${x.vids.length} videos` : 'Photos, reels & booking links') : esc(x.short);
    return `<a class="card tilt rv" href="#/${x.id}" data-id="${x.id}"${x.vids.length ? ` data-pv="${esc(x.vids[0].src)}"` : ''}>${artOf(x)}${badges}<div class="cap"><span>${st ? esc(T[x.tier].name) : esc(x.kind)}</span><h3>${esc(x.name)}</h3><p>${sub}</p></div></a>`;
  };
  const actCard = x => `<a class="card" href="#/${x.id}" data-depth>${artOf(x)}<div class="cap"><span>${esc(x.kind)}</span><h3>${esc(x.name)}</h3><p>${esc(x.short)}</p></div></a>`;

  /* ---------------- static sections ---------------- */
  const withMedia = S.stays.find(s => s.pics.length);
  const panels = [
    { t: 'Operation', p: 'Hiace, bus and airplane', href: '#ops', x: S.operation[0] },
    { t: 'Hotels & camps', p: `${S.stays.length} places to stay, in four price ranges`, href: '#ranges', x: withMedia || S.stays[0] },
    { t: "Travel's activities", p: `${S.activities.length} experiences`, href: '#acts', x: S.activities.find(a => a.id === 'stars') || S.activities[0] }
  ];
  $('#svc').innerHTML = panels.map(p => `<a class="panel tilt rv" href="${p.href}">${artOf(p.x)}<span class="arrow">→</span><div class="cap"><h3>${p.t}</h3><p>${p.p}</p></div></a>`).join('');
  $('#opsGrid').innerHTML = S.operation.map(card).join('');
  $('#track').innerHTML = S.activities.map(actCard).join('');
  $('#wa').href = contactURL('Hello Sahra, I would like to plan a trip.'); $('#wa').textContent = HAS_WA ? 'WhatsApp us' : 'Email us'; ext($('#wa'));
  $('#wa2').href = $('#wa').href; $('#wa2').textContent = HAS_WA ? 'WhatsApp' : 'Email us'; ext($('#wa2'));
  $('#mail').href = `mailto:${S.brand.email}`; $('#mail').textContent = S.brand.email;
  $('#bigName').innerHTML = 'SAHRA'.split('').map(c => `<span>${c}</span>`).join('');
  $('#stats').innerHTML = [[S.stays.length, 'Places to stay'], [S.activities.length, 'Experiences'], [S.tierOrder.length, 'Price ranges'], ['24/7', 'AI concierge']].map(s => `<li><b data-n="${typeof s[0] === 'number' ? s[0] : ''}">${s[0]}</b><span>${s[1]}</span></li>`).join('');
  const names = S.stays.map(s => esc(s.name));
  $('#mq').innerHTML = [...names, ...names].map(n => `<span>${n}</span>`).join('');

  /* price ranges */
  $('#rangeGrid').innerHTML = S.tierOrder.map(k => {
    const t = T[k], n = S.stays.filter(s => s.tier === k).length;
    const coins = Array.from({ length: t.sym }, (_, i) => `<i class="coin" style="left:${i * 38}px;--z:${i * 8}px;animation-delay:${i * .35}s">$</i>`).join('');
    return `<button class="range tilt rv" data-tier="${k}" style="--h1:${t.hue[0]};--h2:${t.hue[1]}"><div class="coins">${coins}</div><small>${esc(t.sub)}</small><h3>${esc(t.name)}</h3><p>${esc(t.blurb)}</p>${t.from ? `<div class="from">${esc(t.from)}</div>` : ''}<div class="n"><span><b>${n}</b> places</span><i class="go">→</i></div></button>`;
  }).join('');

  /* ---------------- stays: filters ---------------- */
  const F = { kind: 'all', tier: 'all', q: '' };
  const kinds = [['all', 'All'], ['Hotel', 'Hotels'], ['Resort', 'Resorts'], ['Camp', 'Camps']];
  $('#kindTabs').innerHTML = kinds.map(k => `<button data-k="${k[0]}" class="${k[0] === 'all' ? 'on' : ''}">${k[1]} <small>${k[0] === 'all' ? S.stays.length : S.stays.filter(s => s.kind === k[0]).length}</small></button>`).join('');
  $('#tierTabs').innerHTML = `<button data-t="all" class="on">All ranges</button>` + S.tierOrder.map(k => `<button data-t="${k}"><span class="s">${sym(T[k].sym)}</span>${esc(T[k].name)}</button>`).join('');
  const tierRank = k => S.tierOrder.indexOf(k);
  const sorted = S.stays.slice().sort((a, b) => (b.pics.length > 0) - (a.pics.length > 0) || tierRank(a.tier) - tierRank(b.tier) || a.name.localeCompare(b.name));
  function renderStays(animate = true) {
    const q = F.q.trim().toLowerCase();
    const list = sorted.filter(s => (F.kind === 'all' || s.kind === F.kind) && (F.tier === 'all' || s.tier === F.tier) && (!q || s.name.toLowerCase().includes(q)));
    $('#stayGrid').innerHTML = list.map(card).join('');
    $('#empty').hidden = list.length > 0;
    $('#count').textContent = `Showing ${list.length} of ${S.stays.length} places` + (F.tier !== 'all' ? ` · ${T[F.tier].name}` : '');
    $$('#kindTabs button').forEach(b => b.classList.toggle('on', b.dataset.k === F.kind));
    $$('#tierTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === F.tier));
    $$('#stayGrid .card').forEach((c, i) => c.style.setProperty('--d', (i % 4) * .07 + 's'));
    reveal($('#stayGrid'));
    clearTimeout(renderStays.t); if (window.ScrollTrigger) renderStays.t = setTimeout(() => ScrollTrigger.refresh(), 120);
  }
  renderStays(false);
  $('#kindTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { F.kind = b.dataset.k; renderStays(); } });
  $('#tierTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { F.tier = b.dataset.t; renderStays(); } });
  $('#q').addEventListener('input', e => { F.q = e.target.value; renderStays(false); });
  $('#rangeGrid').addEventListener('click', e => {
    const b = e.target.closest('.range'); if (!b) return;
    F.tier = b.dataset.tier; F.kind = 'all'; F.q = ''; $('#q').value = ''; renderStays();
    scrollToEl($('#stays'));
  });

  /* video preview on hover (desktop): short delay, clean abort */
  if (fine) {
    const stop = c => { clearTimeout(c._t); const v = c.querySelector('.pv'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); } };
    $('#stayGrid').addEventListener('pointerover', e => {
      const c = e.target.closest('.card[data-pv]'); if (!c || c._t || c.querySelector('.pv')) return;
      c._t = setTimeout(() => {
        const v = document.createElement('video'); v.className = 'pv'; v.src = c.dataset.pv; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
        v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s;z-index:1';
        c.querySelector('.art').append(v); v.play().then(() => { v.style.opacity = 1; }).catch(() => stop(c));
      }, 280);
    });
    $('#stayGrid').addEventListener('pointerout', e => { const c = e.target.closest('.card[data-pv]'); if (!c || c.contains(e.relatedTarget)) return; stop(c); c._t = 0; });
  }

  /* ---------------- spotlight (a stay with videos) ---------------- */
  const spotItem = S.stays.find(s => s.vids.length >= 2);
  if (spotItem) {
    $('#spot').hidden = false;
    $('#spotName').textContent = spotItem.name;
    $('#spotText').textContent = `${spotItem.pics.length} photos and ${spotItem.vids.length} videos, ready to explore. See the rooms, the garden and the vibe before you book.`;
    $('#spotBtn').href = '#/' + spotItem.id;
    const vs = spotItem.vids.slice(0, 3);
    $('#phones').innerHTML = vs.map((v, i) => `<div class="ph rv" style="--d:${i * .12}s" data-i="${i}"><img src="${esc(v.poster)}" alt="" loading="lazy">${i === 1 ? `<video src="${esc(v.src)}" muted loop playsinline preload="none"></video>` : ''}</div>`).join('');
    const mid = $('#phones video');
    if (mid && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => en.isIntersecting ? mid.play().catch(() => { }) : mid.pause()), { threshold: .4 }).observe(mid);
    $('#phones').addEventListener('click', e => { const p = e.target.closest('.ph'); if (p) openLB(spotItem.vids.map((v, i) => ({ type: 'vid', src: v.src, poster: v.poster, cap: `${spotItem.name} · video ${i + 1} of ${spotItem.vids.length}` })), +p.dataset.i); });
  }

  /* ---------------- nav ---------------- */
  const nav = $('#nav');
  const prog = $('#prog');
  addEventListener('scroll', () => {
    nav.classList.toggle('solid', scrollY > 60);
    const m = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${m > 0 ? scrollY / m : 0})`;
  }, { passive: true });
  $('#menuBtn').onclick = () => { const o = nav.classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); };
  $$('#links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  /* ---------------- hero intro classes ---------------- */
  $$('#bigName span').forEach((sp, i) => sp.style.setProperty('--i', i));
  $$('.hero .hero-emblem, .hero .eyebrow, .hero .sub, .hero .cta, .stats, .cue').forEach((el, i) => { el.classList.add('rise'); el.style.setProperty('--d', (.45 + i * .14) + 's'); });

  /* ---------------- tilt, glare, magnetic, cursor glow (one throttled handler) ---------------- */
  if (fine && !reduce) {
    const glow = $('#glow'), heroIn = $('#heroIn'), letters = $$('#bigName span');
    let ev = null, raf = 0;
    const apply = () => {
      raf = 0; const e = ev; if (!e) return;
      glow.style.opacity = 1; glow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      if (world) world.pointer(nx, ny);
      if (scrollY < innerHeight) { heroIn.style.transform = `rotateY(${nx * 8}deg) rotateX(${-ny * 6}deg)`; letters.forEach((l, i) => l.style.translate = `${nx * (i - 2) * 8}px 0`); }
      const t = e.target;
      const c = t.closest && t.closest('.tilt');
      if (c) {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, k = c.classList.contains('panel') ? 7 : 16;
        c.style.transition = 'none'; c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
        c.style.transform = `perspective(900px) rotateY(${(x - .5) * k}deg) rotateX(${-(y - .5) * k}deg) translateZ(14px)`;
      }
      const m = t.closest && t.closest('.mag');
      if (m) { const r = m.getBoundingClientRect(); m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .28}px)`; }
    };
    document.addEventListener('pointermove', e => { ev = e; if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
    document.addEventListener('pointerout', e => {
      const c = e.target.closest && e.target.closest('.tilt'); if (c && !c.contains(e.relatedTarget)) { c.style.transition = 'transform .45s cubic-bezier(.2,.7,.2,1)'; c.style.transform = ''; setTimeout(() => { c.style.transition = ''; }, 470); }
      const m = e.target.closest && e.target.closest('.mag'); if (m && !m.contains(e.relatedTarget)) m.style.transform = '';
    });
  }

  /* ---------------- scroll animation (GSAP / ScrollTrigger) ---------------- */
  let started = false;
  function startAnimations() {
    if (started) return; started = true;
    document.documentElement.classList.add('ready');
    reveal();
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    initSmooth();
    ScrollTrigger.create({ trigger: document.body, start: 0, end: 'max', onUpdate: s => world && world.set(s.progress) });

    $$('#stats b[data-n]').forEach(b => { const n = +b.dataset.n; if (!n) return; const o = { v: 0 }; b.textContent = '0'; gsap.to(o, { v: n, duration: 1.8, delay: 1.1, ease: 'power2.out', onUpdate: () => { b.textContent = Math.round(o.v); } }); });

    if (!reduce) {
      const words = ['the Red Sea', 'the mountains', 'the stars', 'the desert'], rot = $('#rot'); let wi = 0;
      setInterval(() => { if (document.hidden) return; gsap.to(rot, { opacity: 0, y: -12, duration: .35, onComplete: () => { rot.textContent = words[++wi % words.length]; gsap.fromTo(rot, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .45 }); } }); }, 2800);
    }

    // Activities: pinned sideways scroll with depth, on larger screens
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const t = $('#track'), dist = () => Math.max(0, t.scrollWidth - innerWidth + 40);
      const cards = $$('#track .card');
      gsap.to(t, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#acts', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true,
        onUpdate: () => { if (reduce) return; const mid = innerWidth / 2; cards.forEach(c => { const r = c.getBoundingClientRect(), d = (r.left + r.width / 2 - mid) / innerWidth; c.style.transform = `rotateY(${Math.max(-30, Math.min(30, -d * 38))}deg) translateZ(${-Math.abs(d) * 90}px) scale(${1 - Math.min(.12, Math.abs(d) * .16)})`; }); } } });
      return () => cards.forEach(c => { c.style.transform = ''; });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 800);
  }

  /* ---------------- loader ---------------- */
  const ldBar = $('#ldBar'); let ldP = 0;
  const ldT = setInterval(() => { ldP = Math.min(90, ldP + 6); ldBar.style.width = ldP + '%'; }, 90);
  function hideLoader() {
    const l = $('#loader'); if (!l || l.dataset.done) return; l.dataset.done = 1; clearInterval(ldT); ldBar.style.width = '100%';
    if (window.gsap) gsap.to(l, { opacity: 0, duration: .9, delay: .25, onComplete: () => l.remove() }); else l.remove();
    startAnimations();
  }
  addEventListener('load', () => setTimeout(hideLoader, 500));
  setTimeout(hideLoader, 3500); // failsafe

  /* ---------------- links meta ---------------- */
  const LK = {
    booking: { n: 'Booking.com', c: '#003580', a: 'B', g: 'book' }, site: { n: 'Official website', c: '#176B78', a: '↗', g: 'book' },
    ota: { n: 'More booking sites', c: '#7a5af8', a: '⌂', g: 'book' }, ggl: { n: 'Google Hotels', c: '#4285f4', a: 'G', g: 'book' }, map: { n: 'Map', c: '#ea4335', a: '⌖', g: 'book' },
    ig: { n: 'Instagram', c: '#c13584', a: 'IG', g: 'watch' }, tt: { n: 'TikTok reels', c: '#222', a: '♪', g: 'watch' }, fb: { n: 'Facebook', c: '#1877f2', a: 'f', g: 'watch' },
    yt: { n: 'YouTube', c: '#e62117', a: '▶', g: 'watch' }, drive: { n: 'Photos & videos folder', c: '#188038', a: '▤', g: 'watch' }
  };
  const host = u => { try { return new URL(u).hostname.replace(/^www\.|^m\./, '').split('.').slice(-2, -1)[0] || 'link'; } catch (e) { return 'link'; } };
  const linkCard = (k, urls) => {
    const m = LK[k]; if (!urls || !urls.length) return '';
    const chips = urls.length > 1 ? `<div class="more">${urls.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${['ota', 'site', 'ggl'].includes(k) ? esc(host(u)) : '#' + (i + 1)}</a>`).join('')}</div>` : '';
    return `<div class="lk-card"><a class="top" href="${esc(urls[0])}" target="_blank" rel="noopener noreferrer"><i style="background:${m.c};width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font:600 13px var(--sans);flex:none;color:#fff;font-style:normal">${m.a}</i><span><b style="display:block;font-weight:500;font-size:16px;line-height:1.2">${m.n}</b><small style="opacity:.6;font-size:12.5px">${urls.length > 1 ? urls.length + ' links' : 'Open ↗'}</small></span></a>${chips}</div>`;
  };

  /* ---------------- detail pages ---------------- */
  const detail = $('#detail');
  let curItem = null;
  function listFor(x) { return x.section === 'stay' ? sorted.filter(s => s.tier === x.tier) : ALL.filter(a => a.kind === x.kind); }
  function killBg() { const v = $('#dbg video'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } }
  let lastFocus = null;
  function setInert(on) { ['#page', '#nav', '#world'].forEach(q => { const el = $(q); if (el) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); } }); }
  function showDetail(x) {
    if (!detail.classList.contains('on')) lastFocus = document.activeElement;
    curItem = x;
    const same = listFor(x), i = same.indexOf(x), prev = same[(i - 1 + same.length) % same.length], next = same[(i + 1) % same.length];
    const st = x.section === 'stay';
    killBg();
    const bg = x.vids.length ? `<div class="art"><img src="${esc(x.vids[0].poster)}" alt="" class="ld"><video data-src="${esc(x.vids[0].src)}" muted loop playsinline preload="none" style="opacity:0;transition:opacity .8s"></video></div>` : artOf(x, true);
    $('#dbg').innerHTML = bg;
    const bv = $('#dbg video'); if (bv) { const want = x; setTimeout(() => { if (curItem === want && bv.isConnected) { bv.src = bv.dataset.src; bv.play().then(() => { bv.style.opacity = 1; }).catch(() => { }); } }, 700); }
    const cats = st ? [...new Set(x.pics.map(p => p.cat))] : [];
    const facts = st
      ? [['Range', `${sym(T[x.tier].sym)} ${T[x.tier].name}`], ['Type', x.kind], ['Location', x.location], ['Rates', x.price]]
      : [['Duration', x.duration], ['Group', x.group], ['Price', x.price]];
    const L = x.links || {};
    const book = ['booking', 'site', 'ota', 'ggl', 'map'].map(k => linkCard(k, L[k])).join('');
    const watch = ['ig', 'tt', 'fb', 'yt', 'drive'].map(k => linkCard(k, L[k])).join('');
    $('#dc').innerHTML = `
      <div class="kind">${st ? esc(x.kind) + ' · ' + esc(T[x.tier].name) : esc(x.kind)}</div>
      <h1>${esc(x.name)}</h1>
      <p class="lead">${esc(st ? T[x.tier].sub : x.short)}</p>
      <p class="long">${esc(x.long)}</p>
      <div class="facts">${facts.map(f => `<div><small>${f[0]}</small><b>${esc(f[1])}</b></div>`).join('')}</div>
      <div class="cta"><button class="btn mag" id="bookBtn">Ask our AI for a quote</button><a class="btn ghost mag" id="dContact" href="${esc(contactURL('Hello Sahra, I am interested in ' + x.name))}">${CONTACT_LABEL}</a><button class="btn ghost mag" id="planBtn">Plan a trip here</button></div>
      ${x.vids.length ? `<h2 class="sec">Videos</h2><div class="reels">${x.vids.map((v, k) => `<button class="reel" data-v="${k}" aria-label="Play video ${k + 1}"><img src="${esc(v.poster)}" alt="" loading="lazy"><i>▶</i></button>`).join('')}</div>` : ''}
      ${x.pics.length ? `<h2 class="sec">Photos</h2>${cats.length > 1 ? `<div class="tabs gtabs" id="gtabs"><button class="on" data-c="all">All ${x.pics.length}</button>${cats.map(c => `<button data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}<div class="gal" id="gal"></div>` : (st ? `<h2 class="sec">Photos & videos</h2><div class="soon">Our own photos and videos of ${esc(x.name)} are being added. Meanwhile, the reels and booking pages below show the place in full.</div>` : '')}
      ${book ? `<h2 class="sec">Where to book</h2><div class="links-grid">${book}</div>` : ''}
      ${watch ? `<h2 class="sec">Watch &amp; follow</h2><div class="links-grid">${watch}</div>` : ''}
      <div class="pn"><a href="#/${prev.id}"><small>← Previous</small>${esc(prev.name)}</a><a href="#/${next.id}" style="text-align:right"><small>Next →</small>${esc(next.name)}</a></div>`;
    const renderGal = c => {
      const items = x.pics.filter(p => c === 'all' || p.cat === c);
      $('#gal').innerHTML = items.map((p, k) => `<button data-k="${k}" aria-label="Open photo ${k + 1}"><img src="${esc(p.thumb)}" alt="${esc(x.name)} ${esc(p.cat)}" loading="lazy" decoding="async"></button>`).join('');
      $('#gal').onclick = e => { const b = e.target.closest('button'); if (b) openLB(items.map(p => ({ type: 'img', src: p.src, cap: `${x.name} · ${p.cat}` })), +b.dataset.k); };
    };
    if (x.pics.length) { renderGal('all'); const gt = $('#gtabs'); if (gt) gt.onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('#gtabs button').forEach(z => z.classList.toggle('on', z === b)); renderGal(b.dataset.c); }; }
    $$('.reel', $('#dc')).forEach(b => b.onclick = () => openLB(x.vids.map((v, k) => ({ type: 'vid', src: v.src, poster: v.poster, cap: `${x.name} · video ${k + 1} of ${x.vids.length}` })), +b.dataset.v));
    $('#bookBtn').onclick = () => openChat('I want a quote for ' + x.name);
    ext($('#dContact'));
    $('#planBtn').onclick = () => { planFor(x); };
    detail.classList.add('on'); detail.setAttribute('aria-hidden', 'false'); detail.scrollTop = 0;
    document.body.classList.add('lock'); if (lenis) lenis.stop(); setInert(true); if (world) world.pause(true);
    detail.setAttribute('aria-label', x.name); setTimeout(() => $('#back').focus({ preventScroll: true }), 60);
    document.title = x.name + ' — Sahra';
    if (window.gsap && !reduce) gsap.from('#dc > .kind, #dc > h1, #dc > .lead, #dc > .long, #dc > .facts, #dc > .cta', { opacity: 0, y: 30, duration: .8, stagger: .07, delay: .15, ease: 'power3.out', clearProps: 'all' });
  }
  function hideDetail() {
    if (!detail.classList.contains('on')) return;
    detail.classList.remove('on'); detail.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock'); if (lenis) lenis.start(); setInert(false); if (world) world.pause(false);
    killBg(); if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { }
    document.title = 'Sahra — Sinai, from the desert to the Red Sea'; curItem = null;
  }
  function route() {
    const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const x = ALL.find(a => a.id === id);
    if (x) showDetail(x); else hideDetail();
  }
  addEventListener('hashchange', route);
  $('#back').onclick = () => { location.hash = '#/'; };

  /* ---------------- lightbox (photos + videos) ---------------- */
  const lb = $('#lb'); let lbItems = [], lbI = 0;
  function lbShow() {
    const it = lbItems[lbI]; if (!it) return;
    killLBVideo();
    $('#lbStage').innerHTML = it.type === 'vid'
      ? `<video src="${esc(it.src)}" poster="${esc(it.poster || '')}" controls autoplay playsinline loop></video>`
      : `<img src="${esc(it.src)}" alt="${esc(it.cap || '')}">`;
    $('#lbCap').textContent = `${it.cap || ''}  ·  ${lbI + 1} / ${lbItems.length}`;
    const one = lbItems.length < 2; $('#lbP').hidden = one; $('#lbN').hidden = one;
    const nx = lbItems[(lbI + 1) % lbItems.length]; if (nx && nx.type === 'img') new Image().src = nx.src;
  }
  function openLB(items, i) { lbItems = items; lbI = i || 0; lbShow(); lb.classList.add('on'); lb.setAttribute('aria-hidden', 'false'); }
  function killLBVideo() { const v = $('#lbStage video'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } }
  function closeLB() { lb.classList.remove('on'); lb.setAttribute('aria-hidden', 'true'); killLBVideo(); setTimeout(() => { if (!lb.classList.contains('on')) $('#lbStage').innerHTML = ''; }, 350); }
  const lbGo = d => { lbI = (lbI + d + lbItems.length) % lbItems.length; lbShow(); };
  $('#lbX').onclick = closeLB; $('#lbP').onclick = () => lbGo(-1); $('#lbN').onclick = () => lbGo(1);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.id === 'lbStage') closeLB(); });
  let sx0 = null;
  lb.addEventListener('touchstart', e => { sx0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (sx0 == null) return; const d = e.changedTouches[0].clientX - sx0; if (Math.abs(d) > 50 && !e.target.closest('video')) lbGo(d < 0 ? 1 : -1); sx0 = null; }, { passive: true });
  addEventListener('keydown', e => {
    if (lb.classList.contains('on')) { if (e.key === 'Escape') closeLB(); else if (e.key === 'ArrowRight') lbGo(1); else if (e.key === 'ArrowLeft') lbGo(-1); return; }
    if (e.key === 'Escape') { if ($('#chat').classList.contains('on')) closeChat(); else if (detail.classList.contains('on')) location.hash = '#/'; }
  });

  /* ---------------- AI concierge ---------------- */
  const stayNames = n => n.map(s => `<a data-open="${s.id}">${esc(s.name)}</a>`).join(', ');
  const byTier = k => S.stays.filter(s => s.tier === k);
  const wa = t => contactURL(t);
  const findStay = t => {
    const q = t.toLowerCase();
    return S.stays.find(s => q.includes(s.name.toLowerCase())) ||
      S.stays.find(s => { const w = s.name.toLowerCase().replace(/[()&]/g, '').split(/\s+/).filter(x => x.length > 3 && !/^(hotel|camp|resort|dahab|house|lagoon|island|view|club|luxury)$/.test(x)); return w.some(x => q.includes(x)); });
  };
  const tierReply = k => `Our <b>${esc(T[k].name)}</b> range (${sym(T[k].sym)}) has ${byTier(k).length} places: ${stayNames(byTier(k).slice(0, 8))}${byTier(k).length > 8 ? ' and more' : ''}. Tap a name to open its page, or tell me your dates and group size for a quote.`;
  const KB = [
    [/budget|cheap|cheapest|essential|low cost|affordable|اقتصاد|رخيص/, () => tierReply('budget')],
    [/luxury|vip|5.?star|five.?star|spa|business|فاخر/, () => tierReply('luxury')],
    [/premium|resort|pool|aqua/, () => tierReply('premium')],
    [/comfort|middle|mid.?range|medium|normal|متوسط/, () => tierReply('comfort')],
    [/camp|tent|bedouin|hostel/, () => `We have ${S.stays.filter(s => s.kind === 'Camp').length} camps: ${stayNames(S.stays.filter(s => s.kind === 'Camp'))}.`],
    [/hotel|room|stay|sleep|accommodation/, () => `We work with ${S.stays.length} places in four price ranges: Essential, Comfort, Premium and Luxury & VIP. Which range suits you? You can also open <a data-go="#ranges">Choose your range</a>.`],
    [/bus|hiace|van|transport|transfer|airplane|flight|fly|airport/, () => 'We run private Hiace vans, group buses and flights to Sharm with a transfer waiting for you.'],
    [/dive|diving|blue hole|snorkel|reef/, () => 'Diving and the Blue Hole run daily with certified instructors and all equipment.'],
    [/yacht|boat|sail/, () => 'We have yacht trips from Dahab and Taba, half day or full day.'],
    [/safari|desert|star|night|movie/, () => 'Our desert safari, stargazing and movie nights are favourites. Tell me your dates and I will suggest a plan.'],
    [/price|cost|how much|rate/, () => 'Rates depend on the place, dates and group size. Pick a range (Essential, Comfort, Premium, Luxury) or a hotel, share your dates, and the team will send an exact quote.'],
    [/book|reserve|available|quote/, () => `Wonderful. Please share your dates, number of guests and the hotel or range you like, and the team will confirm. Or message us on <a href="${wa('Hello Sahra, I would like to book')}"${HAS_WA ? ' target="_blank" rel="noopener"' : ''}>${CONTACT_LABEL}</a>.`],
    [/^(hi|hello|hey|salam|hola)|مرحبا|اهلا|سلام/, () => 'Welcome to Sahra! Looking for a stay, transport or an activity?']
  ];
  const hist = [];
  const msg = (t, w, html) => { const d = document.createElement('div'); d.className = 'm ' + w; html ? d.innerHTML = t : d.textContent = t; $('#msgs').append(d); $('#msgs').scrollTop = 1e6; };
  async function reply(t) {
    hist.push({ role: 'user', content: t });
    let out = '', html = true;
    if (S.chatEndpoint) {
      try { const r = await fetch(S.chatEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: hist }) }); out = (await r.json()).reply || ''; html = false; } catch (e) { /* fall back */ }
    }
    if (!out) {
      const s = findStay(t), low = t.toLowerCase();
      if (s) out = `<b>${esc(s.name)}</b> is in our ${esc(T[s.tier].name)} range (${sym(T[s.tier].sym)}). <a data-open="${s.id}">Open its page</a> for photos, reels and booking links.` + (/book|quote|price|cost|reserve|rate/.test(low) ? ` Send me your dates and guests, or <a href="${wa('Hello Sahra, I am interested in ' + s.name)}"${HAS_WA ? ' target="_blank" rel="noopener"' : ''}>${HAS_WA ? 'message us on WhatsApp' : 'email us'}</a>.` : '');
      else { const k = KB.find(k => k[0].test(low)); out = k ? k[1]() : 'Tell me your dates, group size and budget (Essential, Comfort, Premium or Luxury) and I will suggest a plan.'; }
    }
    hist.push({ role: 'assistant', content: out.replace(/<[^>]+>/g, '') });
    return [out, html];
  }
  async function ask(t) { t = (t || '').trim(); if (!t) return; msg(t, 'u'); const [o, h] = await reply(t); setTimeout(() => msg(o, 'b', h), 450); }
  function openChat(t) { $('#chat').classList.add('on'); if (t) ask(t); else setTimeout(() => $('#ci').focus(), 300); }
  function closeChat() { $('#chat').classList.remove('on'); }
  $('#fab').onclick = () => $('#chat').classList.toggle('on');
  $('#chatX').onclick = closeChat;
  $('#cs').onclick = () => { ask($('#ci').value); $('#ci').value = ''; };
  $('#ci').onkeydown = e => { if (e.key === 'Enter') $('#cs').click(); };
  $$('[data-chat]').forEach(b => b.addEventListener('click', () => openChat()));
  $('#msgs').addEventListener('click', e => {
    const a = e.target.closest('a[data-open],a[data-go]'); if (!a) return;
    closeChat(); if (a.dataset.open) location.hash = '#/' + a.dataset.open; else { if (detail.classList.contains('on')) location.hash = '#/'; setTimeout(() => scrollToEl($(a.dataset.go)), 80); }
  });
  msg('Hello, I am the Sahra concierge. Tell me your budget and I will match you with a stay.', 'b');
  $('#qr').innerHTML = ['Budget stays', 'Comfort', 'Premium', 'Luxury & VIP', 'Camps', 'Transport'].map(q => `<button>${q}</button>`).join('');
  $$('#qr button').forEach(b => b.onclick = () => ask(b.textContent));

  /* ---------------- plan-a-trip form ---------------- */
  const pT = $('#pTier'), pS = $('#pStay');
  S.tierOrder.forEach(k => pT.insertAdjacentHTML('beforeend', `<option value="${k}">${sym(T[k].sym)} ${esc(T[k].name)}</option>`));
  S.tierOrder.forEach(k => { const og = document.createElement('optgroup'); og.label = T[k].name; S.stays.filter(x => x.tier === k).sort((a, b) => a.name.localeCompare(b.name)).forEach(x => og.insertAdjacentHTML('beforeend', `<option value="${x.id}">${esc(x.name)}</option>`)); pS.append(og); });
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset()); const iso = today.toISOString().slice(0, 10);
  $('#pIn').min = iso; $('#pOut').min = iso;
  $('#pIn').addEventListener('change', () => { $('#pOut').min = $('#pIn').value || iso; });
  function planText() {
    const v = id => $(id).value.trim(), st = S.stays.find(x => x.id === pS.value), tr = pT.value;
    const nights = v('#pIn') && v('#pOut') ? Math.round((new Date(v('#pOut')) - new Date(v('#pIn'))) / 864e5) : 0;
    return ['Hello Sahra, I would like to plan a trip.', v('#pName') && 'Name: ' + v('#pName'), v('#pIn') && 'Arrival: ' + v('#pIn'), v('#pOut') && 'Departure: ' + v('#pOut') + (nights > 0 ? ` (${nights} nights)` : ''), 'Guests: ' + (v('#pGuests') || '2'), tr && 'Budget range: ' + T[tr].name, st && 'Place: ' + st.name, v('#pMsg') && 'Notes: ' + v('#pMsg')].filter(Boolean).join('\n');
  }
  function planOK() {
    const err = $('#pErr'), a = $('#pIn').value, b = $('#pOut').value, g = +$('#pGuests').value;
    let m = '';
    if (a && b && b <= a) m = 'Departure must be after arrival.';
    else if (!(g >= 1 && g <= 200)) m = 'Please enter between 1 and 200 guests.';
    err.hidden = !m; err.textContent = m; return !m;
  }
  $('#planForm').addEventListener('submit', e => {
    e.preventDefault(); if (!planOK()) return;
    const u = contactURL(planText()); if (HAS_WA) window.open(u, '_blank', 'noopener'); else location.href = u;
  });
  $('#pMail').addEventListener('click', e => { e.preventDefault(); if (!planOK()) return; location.href = `mailto:${S.brand.email}?subject=${encodeURIComponent('Sahra trip request')}&body=${encodeURIComponent(planText())}`; });
  if (!HAS_WA) { $('#pSend').textContent = 'Send by email'; $('#pMail').hidden = true; $('#wa2').closest('p').hidden = true; }
  function planFor(x) {
    location.hash = '#/';
    setTimeout(() => { if (x.section === 'stay') { pS.value = x.id; pT.value = x.tier; } scrollToEl($('#plan')); }, 120);
  }

  route();
  reveal();
})();
