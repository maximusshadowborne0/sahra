(function () {
  const S = window.SAHRA, PH = window.SAHRA_PHOTOS || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ALL = [...S.operation, ...S.stays, ...S.activities];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;

  /* ---------------- 3D world ---------------- */
  let world = null;
  try { world = initScene($('#world')); } catch (e) { console.warn('3D disabled', e); }
  if (!world) document.body.classList.add('nogl');
  window.__sahra = { world, ALL };

  /* ---------------- smooth scroll (Lenis, mouse/trackpad only) ---------------- */
  let lenis = null;
  if (window.Lenis && window.gsap && !reduce) {
    lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------------- photos ---------------- */
  const heroSrc = x => (PH[x.id] && PH[x.id].src) || x.image;
  const galSrc = x => (PH[x.id] && PH[x.id].gallery && PH[x.id].gallery.length) ? PH[x.id].gallery : x.gallery;
  // Generated artwork shown behind (and instead of) a photo if it is missing or slow
  function art(x) {
    const sea = /sea|reef|coral|yacht|lagoon|blue|beach|scuba|panorama|sail/.test(x.tags);
    const [a, b] = x.g, o = (x.seed % 5) * 6;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="${280 + o}" cy="${150 + o}" r="${44 + o / 2}" fill="#F5EBDD" opacity=".85"/>` +
      (sea
        ? `<path d="M0 300Q100 ${280 - o} 200 300T400 300V500H0Z" fill="#176B78" opacity=".55"/><path d="M0 360Q120 ${335 + o} 240 360T400 355V500H0Z" fill="#142B35" opacity=".5"/><path d="M0 430Q150 ${405 - o} 300 430T400 425V500H0Z" fill="#142B35" opacity=".75"/>`
        : `<path d="M0 320Q100 ${270 - o} 200 320T400 310V500H0Z" fill="#142B35" opacity=".25"/><path d="M0 390Q120 ${345 + o} 240 390T400 380V500H0Z" fill="#142B35" opacity=".45"/><path d="M0 450Q150 ${415 - o} 300 450T400 440V500H0Z" fill="#142B35" opacity=".72"/>`) + '</svg>';
    return `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
  }
  const photo = x => `<div class="ph" style="background-image:${art(x)}"><img src="${heroSrc(x)}" alt="${x.name}" loading="lazy" decoding="async" onload="this.parentNode.classList.add('ld')" onerror="this.remove()"></div>`;
  const card = x => `<a class="card" href="#/${x.id}" data-tilt aria-label="${x.kind}: ${x.name}">${photo(x)}<div class="cap"><span>${x.kind}</span><h3>${x.name}</h3></div></a>`;

  /* ---------------- render ---------------- */
  const panels = [
    { t: 'Operation', p: 'Hiace, bus and airplane', href: '#ops', x: S.operation[0] },
    { t: 'Hotels & camps', p: `${S.stays.length} places to stay`, href: '#stays', x: S.stays[0] },
    { t: "Travel's activities", p: `${S.activities.length} experiences`, href: '#acts', x: S.activities[2] }
  ];
  $('#svc').innerHTML = panels.map(p => `<a class="panel" href="${p.href}" data-tilt>${photo(p.x)}<div class="cap"><h3>${p.t}</h3><p>${p.p}</p></div></a>`).join('');
  $('#opsGrid').innerHTML = S.operation.map(card).join('');
  $('#track').innerHTML = S.activities.map(card).join('');
  const renderStays = (k, animate) => {
    $('#stayGrid').innerHTML = S.stays.filter(x => k === 'all' || x.kind === k).map(card).join('');
    if (animate && window.gsap && !reduce) gsap.from('#stayGrid .card', { opacity: 0, y: 40, rotateX: -12, duration: .8, stagger: .06, ease: 'power3.out' });
  };
  renderStays('all');
  $$('#tabs button').forEach(b => b.onclick = () => {
    $$('#tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); renderStays(b.dataset.k, true);
  });
  $('#wa').href = `https://wa.me/${S.brand.whatsapp}`;
  $('#mail').href = `mailto:${S.brand.email}`; $('#mail').textContent = S.brand.email;
  $('#bigName').innerHTML = 'SAHRA'.split('').map(c => `<span>${c}</span>`).join('');
  const places = ['Dahab', 'Sharm El Sheikh', 'Nuweiba', 'Taba', 'Saint Catherine', 'Ras Mohamed', 'Blue Hole', 'Wadi Ghazala'];
  $('#mq').innerHTML = [...places, ...places].map(p => `<span>${p}</span>`).join('');

  /* ---------------- nav ---------------- */
  const nav = $('#nav'), detail = $('#detail');
  addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 60), { passive: true });
  $('#menuBtn').onclick = () => { const o = nav.classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); if (lenis) o ? lenis.stop() : lenis.start(); };
  $$('#links a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); if (lenis) lenis.start(); }));

  // in-page anchors (works with the pinned activities section)
  function goTo(sel) {
    const t = $(sel); if (!t) return;
    let y = null;
    if (window.ScrollTrigger) { const st = ScrollTrigger.getAll().find(s => s.pin === t); if (st) y = st.start; }
    if (y === null) y = t.getBoundingClientRect().top + scrollY;
    if (lenis) lenis.scrollTo(y, { duration: 1.8 }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const h = a.getAttribute('href');
    if (h === '#/' && a.classList.contains('brand') && !detail.classList.contains('on')) { e.preventDefault(); if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (h.length > 1 && !h.startsWith('#/')) { e.preventDefault(); goTo(h); }
  });

  /* ---------------- pointer effects (mouse only) ---------------- */
  if (fine && !reduce) {
    let raf;
    document.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const c = e.target.closest && e.target.closest('[data-tilt]');
      if (c) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          c.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`;
        });
      }
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      if (world) world.pointer(nx, ny);
      $('#heroIn').style.transform = `rotateY(${nx * 7}deg) rotateX(${-ny * 5}deg)`;
    });
    document.addEventListener('pointerout', e => { const c = e.target.closest && e.target.closest('[data-tilt]'); if (c) c.style.transform = ''; });

    // custom cursor
    const cur = $('#cursor'); let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    (function loop() { x += (tx - x) * .2; y += (ty - y) * .2; cur.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(loop); })();
    document.addEventListener('pointerover', e => {
      const card = e.target.closest('[data-tilt]'), link = e.target.closest('a,button,input');
      cur.classList.toggle('big', !!card); cur.classList.toggle('link', !card && !!link);
    });

    // magnetic buttons
    $$('.btn,.pill,.fab').forEach(b => {
      b.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; });
      b.addEventListener('pointerleave', () => b.style.transform = '');
    });
  }

  /* ---------------- scroll animation (GSAP) ---------------- */
  const chap = [[0, 'The desert'], [.28, 'The coast'], [.55, 'The Red Sea'], [.85, 'The night sky']];
  function startAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on('scroll', ScrollTrigger.update);

    ScrollTrigger.create({
      trigger: document.body, start: 0, end: 'max',
      onUpdate: s => {
        if (world) world.set(s.progress);
        $('#chBar').style.transform = `scaleY(${s.progress})`;
        $('#chapter').style.opacity = s.progress > .965 ? 0 : 1;
        const c = [...chap].reverse().find(c => s.progress >= c[0]);
        if (c && $('#chName').textContent !== c[1]) $('#chName').textContent = c[1];
      }
    });

    if (!reduce) {
      gsap.from('#bigName span', { yPercent: 120, rotateX: -90, opacity: 0, duration: 1.8, stagger: .13, ease: 'expo.out', delay: .2 });
      gsap.from('.hero .sub, .hero .cta, .cue', { opacity: 0, y: 30, duration: 1.2, delay: 1.1, stagger: .2, ease: 'power3.out' });
      gsap.set('.rv', { opacity: 0, y: 50 });
      ScrollTrigger.batch('.rv', { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1, stagger: .12, ease: 'power3.out' }) });
      $$('.panel, #opsGrid .card').forEach((c, i) => gsap.from(c, { opacity: 0, y: 70, rotateX: -12, duration: 1, delay: (i % 3) * .1, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 92%', once: true } }));
    }

    const mm = gsap.matchMedia();
    mm.add('(min-width: 800px)', () => {
      const t = $('#track'), dist = () => Math.max(0, t.scrollWidth - innerWidth + 40);
      gsap.to(t, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#acts', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .7, invalidateOnRefresh: true } });
    });
    addEventListener('load', () => ScrollTrigger.refresh());
    addEventListener('orientationchange', () => setTimeout(() => ScrollTrigger.refresh(), 300));
  }

  /* ---------------- loader ---------------- */
  function hideLoader() {
    const l = $('#loader'); if (!l || l.dataset.done) return; l.dataset.done = 1;
    if (window.gsap) gsap.to(l, { opacity: 0, duration: .9, onComplete: () => l.remove() }); else l.remove();
    startAnimations();
  }
  if (document.readyState === 'complete') setTimeout(hideLoader, 400); else addEventListener('load', () => setTimeout(hideLoader, 400));
  setTimeout(hideLoader, 3500); // failsafe

  /* ---------------- detail pages ---------------- */
  let lastFocus = null, current = null;
  function showDetail(x) {
    current = x;
    const same = ALL.filter(a => a.kind === x.kind), i = same.indexOf(x);
    const prev = same[(i - 1 + same.length) % same.length], next = same[(i + 1) % same.length];
    const hero = heroSrc(x), big = /loremflickr/.test(hero) ? hero.replace(/\/\d+\/\d+\//, '/1600/1000/') : hero;
    const credit = PH[x.id] && PH[x.id].credit ? `<p class="credit">Photo: ${PH[x.id].credit}</p>` : '';
    $('#dbg').innerHTML = x.video
      ? `<video src="${x.video}" poster="${hero}" autoplay muted loop playsinline></video>`
      : `<img src="${big}" alt="" onerror="this.onerror=null;this.src='${hero}'">`;
    $('#dc').innerHTML = `
      <div class="kind">${x.kind}</div>
      <h1>${x.name}</h1>
      <p class="lead">${x.short}</p>
      <p class="long">${x.long}</p>
      <div class="facts"><div><small>Duration</small><b>${x.duration}</b></div><div><small>Season</small><b>${x.season}</b></div><div><small>Group</small><b>${x.group}</b></div><div><small>From</small><b>${x.price}</b></div></div>
      <ul class="hl">${x.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
      <div class="gal">${galSrc(x).map(g => `<div><img src="${g}" alt="${x.name}" loading="lazy" onerror="this.parentNode.remove()"></div>`).join('')}</div>
      <div class="tools"><button class="btn" id="bookBtn">Ask our AI to book</button><a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${S.brand.whatsapp}?text=${encodeURIComponent('Hello Sahra, I am interested in ' + x.name)}">WhatsApp</a>${navigator.share ? '<button class="sw" id="shBtn">Share</button>' : ''}</div>
      ${credit}
      <div class="pn"><a href="#/${prev.id}"><small>Previous</small>${prev.name}</a><a href="#/${next.id}" style="text-align:right"><small>Next</small>${next.name}</a></div>`;
    $('#bookBtn').onclick = () => openChat('I want to book ' + x.name);
    const sh = $('#shBtn'); if (sh) sh.onclick = () => navigator.share({ title: 'Sahra — ' + x.name, url: location.href }).catch(() => {});
    document.title = `${x.name} — Sahra`;
    if (!detail.classList.contains('on')) lastFocus = document.activeElement;
    detail.classList.add('on'); detail.setAttribute('aria-hidden', 'false'); detail.scrollTop = 0;
    document.body.classList.add('lock'); if (world) world.pause(true); if (lenis) lenis.stop();
    $('#back').focus({ preventScroll: true });
    if (window.gsap && !reduce) gsap.from('#dc > *', { opacity: 0, y: 40, duration: .9, stagger: .07, delay: .3, ease: 'power3.out' });
  }
  function hideDetail() {
    if (!detail.classList.contains('on')) return;
    detail.classList.remove('on'); detail.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock'); if (world) world.pause(false); if (lenis) lenis.start();
    document.title = 'Sahra — Sinai, from the desert to the Red Sea'; current = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function route() {
    const id = location.hash.replace(/^#\/?/, '');
    const x = ALL.find(a => a.id === id);
    if (x) showDetail(x); else hideDetail();
  }
  addEventListener('hashchange', route);
  $('#back').onclick = () => { location.hash = '#/'; };
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (detail.classList.contains('on')) $('#back').click(); else closeChat(); }
    if (current && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      const same = ALL.filter(a => a.kind === current.kind), i = same.indexOf(current);
      if (e.key === 'ArrowRight') location.hash = '#/' + same[(i + 1) % same.length].id;
      if (e.key === 'ArrowLeft') location.hash = '#/' + same[(i - 1 + same.length) % same.length].id;
    }
  });
  route();

  /* ---------------- AI concierge ---------------- */
  const KB = [
    [/hotel|room|stay|sleep/, `We work with ${S.stays.filter(s => s.kind === 'Hotel').length} hotels. Open Hotels & camps and tap any one for its full page.`],
    [/camp|tent|bedouin/, `Our ${S.stays.filter(s => s.kind === 'Camp').length} camps are in the desert and by the sea. Tap one in Hotels & camps.`],
    [/bus|hiace|van|transport|transfer|airplane|flight|fly|airport/, 'We run private Hiace vans, group buses and flights to Sharm with a transfer waiting for you.'],
    [/dive|diving|blue hole|snorkel|reef/, 'Diving and the Blue Hole run daily with certified instructors and all equipment.'],
    [/yacht|boat|sail/, 'We have yacht trips from Dahab and Taba, half day or full day.'],
    [/safari|desert|sfare|star|night|movie/, 'Our desert safari, stargazing and movie nights are favourites. Tell me your dates and I will suggest a plan.'],
    [/price|cost|how much|cheap|budget/, 'Prices depend on dates and group size. Tell me both and the team will send an exact quote.'],
    [/book|reserve|available/, 'Wonderful. Please share your dates, number of guests and city, and the team will confirm.'],
    [/hi|hello|hey|salam|مرحبا|اهلا/, 'Welcome to Sahra! Looking for a stay, transport or an activity?']
  ];
  const hist = [];
  const msg = (t, w) => { const d = document.createElement('div'); d.className = 'm ' + w; d.textContent = t; $('#msgs').append(d); $('#msgs').scrollTop = 1e6; return d; };
  async function reply(t) {
    hist.push({ role: 'user', content: t });
    let out = '';
    if (S.chatEndpoint) {
      try { const r = await fetch(S.chatEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: hist }) }); out = (await r.json()).reply || ''; } catch (e) { /* use built-in answers */ }
    }
    if (!out) { const k = KB.find(k => k[0].test(t.toLowerCase())); out = k ? k[1] : 'Tell me your dates, group size and interests and I will suggest a plan.'; }
    hist.push({ role: 'assistant', content: out });
    return out;
  }
  async function ask(t) {
    t = (t || '').trim(); if (!t) return; msg(t, 'u');
    const dots = document.createElement('div'); dots.className = 'm b typing'; dots.innerHTML = '<i></i><i></i><i></i>'; $('#msgs').append(dots); $('#msgs').scrollTop = 1e6;
    const [out] = await Promise.all([reply(t), new Promise(r => setTimeout(r, 700))]);
    dots.remove(); msg(out, 'b');
  }
  function openChat(t) { $('#chat').classList.add('on'); if (t) ask(t); else setTimeout(() => $('#ci').focus(), 300); }
  function closeChat() { $('#chat').classList.remove('on'); }
  $('#fab').onclick = () => $('#chat').classList.toggle('on');
  $('#chatX').onclick = closeChat;
  $('#cs').onclick = () => { ask($('#ci').value); $('#ci').value = ''; };
  $('#ci').onkeydown = e => { if (e.key === 'Enter') $('#cs').click(); };
  $$('[data-chat]').forEach(b => b.addEventListener('click', () => openChat()));
  msg('Hello, I am the Sahra concierge. How can I help plan your trip?', 'b');
  $('#qr').innerHTML = ['Hotels', 'Camps', 'Diving', 'Transport', 'Prices'].map(q => `<button>${q}</button>`).join('');
  $$('#qr button').forEach(b => b.onclick = () => ask(b.textContent));
})();
