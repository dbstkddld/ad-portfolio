(function () {
  var D = document, root = D.documentElement;
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || D).querySelectorAll(s)); };
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var live = !still;
  var snap = $('#snap'), scs = $$('.sc'), dots = $$('#dots a');
  var cl = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  // ---------- 화면 밖 영상 정지 ----------
  var vio = new IntersectionObserver(function (es) {
    es.forEach(function (x) { if (x.isIntersecting && !still && !x.target.controls) x.target.play().catch(function () {}); else x.target.pause(); });
  }, { threshold: 0.05 });
  $$('video').forEach(function (v) { if (still) v.pause(); vio.observe(v); });

  // ---------- 장면 이동 ----------
  var cur = 0, forced = -1;
  function go(id) {
    var i = scs.findIndex(function (s) { return s.id === id; });
    if (i < 0) return;
    if (live) { forced = i; snap.scrollTo({ top: scs[i].offsetTop, behavior: 'smooth' }); }
    else scs[i].scrollIntoView({ behavior: 'auto' });
  }
  $$('[data-go]:not(.cd)').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); go(a.getAttribute('data-go')); }); });
  dots.forEach(function (d) { d.addEventListener('click', function (e) { e.preventDefault(); go(d.getAttribute('href').slice(1)); }); });

  // ---------- 회전목마 (D) ----------
  var rings = [];
  function Ring(stage) {
    var ring = $('.ring', stage), all = $$('.cd', ring), cap = $('.cap', stage);
    var auto = stage.hasAttribute('data-auto');
    var vis = all, n = all.length, pos = 0, vel = 0, drag = false, moved = 0, lx = 0, lastInt = 0, front = null;
    var cw = 300, R = 450, step = 45, rmode = true, inView = true, reTimer = 0, fa = 0;
    var floor = $('.floor', stage);
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(stage);

    function layout() {
      var w = stage.clientWidth, h = stage.clientHeight, mob = w <= 860;
      cw = Math.min(w * (mob ? 0.7 : 0.26), h * 0.95, 430);
      stage.style.setProperty('--cw', cw + 'px');
      rmode = n >= 5;
      step = rmode ? 360 / n : 40;
      R = n < 2 ? 0 : cw * 1.15 / (2 * Math.sin(step * Math.PI / 360));
      ring.style.transform = 'translateZ(' + (-R) + 'px) rotateX(-8deg)';
    }
    function setCap(c, idx) {
      if (!cap || c === front) return;
      var first = front === null; front = c;
      var put = function () {
        cap.innerHTML = '';
        var a = D.createElement('span'); a.className = 'no sy'; a.textContent = (idx + 1 < 10 ? '0' : '') + (idx + 1) + ' / ' + (n < 10 ? '0' : '') + n;
        var b = D.createElement('b'); b.textContent = c.getAttribute('data-t');
        var i = D.createElement('i'); i.textContent = c.getAttribute('data-b') || '';
        cap.appendChild(a); cap.appendChild(b); cap.appendChild(i); cap.classList.remove('sw');
      };
      if (first) put(); else { cap.classList.add('sw'); setTimeout(put, 180); }
    }
    function render() {
      var fi = rmode ? ((Math.round(pos) % n) + n) % n : cl(Math.round(pos), 0, n - 1);
      for (var k = 0; k < n; k++) {
        var d = k - pos;
        if (rmode) { d = ((d % n) + n) % n; if (d > n / 2) d -= n; }
        var a = d * step, c = Math.cos(a * Math.PI / 180), s = 1 + 0.13 * Math.max(0, 1 - Math.abs(d));
        var op = (0.38 + 0.62 * (c + 1) / 2);
        if (!rmode && Math.abs(d) > 2.6) op = 0;
        var el = vis[k];
        el.style.transform = 'translate(-50%,-50%) rotateY(' + a.toFixed(2) + 'deg) translateZ(' + R.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        el.style.opacity = op.toFixed(3);
        el.style.pointerEvents = op < 0.05 ? 'none' : '';
      }
      if (floor) { fa += 0.18; floor.style.setProperty('--fa', fa + 'deg'); }
      setCap(vis[fi], fi);
    }
    function tick() {
      if (inView && n) {
        if (!drag) {
          pos += vel; vel *= 0.92;
          if (auto && rmode && performance.now() - lastInt > 2600) pos += 0.0022;
          else if (Math.abs(vel) < 0.004) pos += (Math.round(pos) - pos) * 0.12;
        }
        if (!rmode) pos = cl(pos, drag ? -0.4 : 0, drag ? n - 0.6 : n - 1);
        render();
      }
      requestAnimationFrame(tick);
    }
    function nudge(dir) { lastInt = performance.now(); pos = Math.round(pos) + dir; vel = 0; }

    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.nv')) return;
      drag = true; moved = 0; lx = e.clientX; vel = 0; lastInt = performance.now(); stage.classList.add('drag');
    });
    addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - lx; lx = e.clientX; moved += Math.abs(dx);
      var dp = -dx / (cw * 0.55); pos += dp; vel = cl(dp, -0.3, 0.3); lastInt = performance.now();
    });
    var end = function () { drag = false; stage.classList.remove('drag'); };
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    stage.addEventListener('wheel', function (e) {
      var h = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (h) e.preventDefault();               // 가로 휠은 회전만, 세로 휠은 회전 + 페이지 이동
      vel = cl(vel + (e.deltaX + e.deltaY) * 0.0005, -0.25, 0.25); lastInt = performance.now();
    }, { passive: false });
    $$('.cd', ring).forEach(function (c) {
      c.setAttribute('draggable', 'false');
      c.addEventListener('click', function (e) {
        e.preventDefault();
        if (moved > 6) return;
        go(c.getAttribute('data-go'));
      });
    });
    $$('.nv', stage).forEach(function (b) { b.addEventListener('click', function () { nudge(b.classList.contains('n') ? 1 : -1); }); });
    addEventListener('resize', layout);

    // 필터용: 보이는 카드 집합 교체
    this.set = function (list, animate) {
      var prev = vis;
      vis = list; n = list.length; pos = 0; vel = 0; front = null;
      all.forEach(function (c) {
        var show = list.indexOf(c) >= 0;
        if (show && c.hidden && animate) { c.hidden = false; c.style.opacity = 0; c.style.transform = 'translate(-50%,-50%) scale(.5)'; void c.offsetWidth; }
        c.hidden = !show;
      });
      if (animate) { all.forEach(function (c) { c.classList.add('re'); }); clearTimeout(reTimer); reTimer = setTimeout(function () { all.forEach(function (c) { c.classList.remove('re'); }); }, 900); }
      layout(); render();
    };
    this.step = nudge; this.stage = stage;
    if (live) { layout(); render(); requestAnimationFrame(tick); }
  }

  // ---------- 필터 (#filter/<key>) ----------
  var browse = $('#sc-browse'), bring = null, btns = $$('.fbtn'), cards = browse ? $$('.cd', browse) : [];
  function keyFromHash() { return (location.hash.match(/^#filter\/(.+)$/) || [])[1] || 'all'; }
  var lastKey = null;
  function applyFilter(animate) {
    var k = keyFromHash(); if (k === lastKey) return;
    lastKey = k;
    var list = cards.filter(function (c) { return k === 'all' || c.getAttribute('data-k').split(' ').indexOf(k) >= 0; });
    if (!list.length) { list = cards; }
    btns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-k') === k); });
    if (bring) bring.set(list, animate);
    else cards.forEach(function (c) { c.hidden = list.indexOf(c) < 0; });
  }

  // ---------- 라이브 모드 (C 장면 전환) ----------
  if (live) {
    root.classList.add('live');
    // 글자 쪼개기 (단어 단위 줄바꿈 유지)
    $$('[data-split]').forEach(function (el) {
      var t = el.textContent, n = 0; el.setAttribute('aria-label', t); el.textContent = '';
      t.split(' ').forEach(function (w, wi) {
        if (wi) el.appendChild(D.createTextNode(' '));
        var wd = D.createElement('span'); wd.className = 'wd'; wd.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < w.length; i++) { var c = D.createElement('span'); c.className = 'ch'; c.style.setProperty('--i', n++); c.textContent = w[i]; wd.appendChild(c); }
        el.appendChild(wd);
      });
    });
    // 셔터 띠 7개 + 대각선 와이프
    var sh = $('#sh'), wp = $('#wp'), N = 7, sx = '';
    for (var i = 0; i < N; i++) { var odd = i % 2; sx += '<i style="top:' + (i * 100 / N) + '%;height:' + (100 / N + 0.3) + '%;--n:' + i + ';--from:' + (odd ? '101%' : '-101%') + ';--to:' + (odd ? '-101%' : '101%') + '"></i>'; }
    sh.innerHTML = sx;
    var busy = false, type = '', tmr = null, ready = false;
    var vh = function () { return snap.clientHeight; };
    var activate = function (i) { scs.forEach(function (s, k) { s.classList.toggle('on', k === i); }); dots.forEach(function (d, k) { d.classList.toggle('on', k === i); }); };
    var cover = function (t, col) {
      if (t === 'shutter') {
        sh.style.display = 'block'; sh.className = 'sh prep'; void sh.offsetWidth; sh.className = 'sh'; void sh.offsetWidth; sh.classList.add('closed');
        [].forEach.call(sh.children, function (e) { e.style.background = col; });
      } else {
        wp.style.display = 'block'; wp.style.background = col;
        wp.animate([{ clipPath: 'polygon(-30% 0,-30% 0,-60% 100%,-60% 100%)' }, { clipPath: 'polygon(-30% 0,130% 0,130% 100%,-60% 100%)' }], { duration: 380, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' });
      }
    };
    var reveal = function (t) {
      if (t === 'shutter') { sh.classList.add('open'); setTimeout(function () { sh.style.display = 'none'; sh.className = 'sh'; }, 900); }
      else {
        var a = wp.animate([{ clipPath: 'polygon(-30% 0,130% 0,130% 100%,-60% 100%)' }, { clipPath: 'polygon(130% 0,130% 0,100% 100%,100% 100%)' }], { duration: 480, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' });
        a.onfinish = function () { wp.style.display = 'none'; wp.getAnimations().forEach(function (x) { x.cancel(); }); };
      }
    };
    var tries = 0;
    var settle = function () {
      var i = Math.round(snap.scrollTop / vh());
      // 스냅이 안 맞고 멈추면(브라우저마다 다름) 가장 가까운 장면으로 직접 맞춘다
      if (Math.abs(snap.scrollTop - i * vh()) > 3 && tries++ < 3) { snap.scrollTo({ top: i * vh(), behavior: tries < 3 ? 'smooth' : 'auto' }); tmr = setTimeout(settle, 450); return; }
      tries = 0; cur = i; forced = -1; activate(i);
      if (busy) { busy = false; reveal(type); }
    };
    snap.addEventListener('scroll', function () {
      if (!ready) return;
      var y = snap.scrollTop, d = Math.abs(y - cur * vh());
      if (!busy && d > 8) {
        var tgt = forced >= 0 ? forced : cl(y > cur * vh() ? cur + 1 : cur - 1, 0, scs.length - 1);
        busy = true; type = tgt % 2 ? 'shutter' : 'wipe'; cover(type, scs[tgt].getAttribute('data-c') || '#FFE600');
      }
      clearTimeout(tmr); tmr = setTimeout(settle, 160);
    }, { passive: true });
    // 세로 휠 한 번 = 장면 하나 (마우스·트랙패드 모두 같은 동작)
    var wlock = 0, lastW = 0;
    snap.addEventListener('wheel', function (e) {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      var now = Date.now(), gap = now - lastW; lastW = now;
      // 트랙패드 관성처럼 이어지는 휠은 한 동작으로 본다
      if (now < wlock || gap < 200 || Math.abs(e.deltaY) < 4) return;
      wlock = now + 900;
      var i = cl(cur + (e.deltaY > 0 ? 1 : -1), 0, scs.length - 1);
      if (i !== cur) { forced = i; snap.scrollTo({ top: scs[i].offsetTop, behavior: 'smooth' }); }
    }, { passive: false });
    D.addEventListener('keydown', function (e) {
      var k = e.key, tg = e.target.tagName;
      if (tg === 'VIDEO' || (k === ' ' && (tg === 'BUTTON' || tg === 'A'))) return;
      if (k === 'ArrowDown' || k === 'PageDown' || k === ' ') { e.preventDefault(); snap.scrollBy({ top: vh(), behavior: 'smooth' }); }
      else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); snap.scrollBy({ top: -vh(), behavior: 'smooth' }); }
      else if (k === 'ArrowLeft' || k === 'ArrowRight') {
        var r = rings.filter(function (r) { return r.stage.closest('.sc') === scs[cur]; })[0];
        if (r) r.step(k === 'ArrowRight' ? 1 : -1);
      }
    });
  }

  $$('[data-ring]').forEach(function (s) { rings.push(new Ring(s)); if (s.closest('#sc-browse')) bring = rings[rings.length - 1]; });
  applyFilter(false);
  addEventListener('hashchange', function () { if (/^#filter\//.test(location.hash)) { applyFilter(true); if (browse) go('sc-browse'); } });

  if (live) {
    // 시작 위치: 해시(#filter/…, #sc-…)
    var h = location.hash, target = null;
    if (/^#filter\//.test(h)) target = browse; else if (h.length > 1) target = D.getElementById(h.slice(1));
    if (target && target.classList.contains('sc')) snap.scrollTop = target.offsetTop;
    setTimeout(function () { cur = Math.round(snap.scrollTop / snap.clientHeight); activate(cur); ready = true; }, 350);
    activate(Math.round(snap.scrollTop / snap.clientHeight));
  }
})();
