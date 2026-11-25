/* 見た目の型「story」の動き（demo.js のあとに読む）
 * - 読み込み画面（1回の訪問で1度だけ）
 * - 写真のコラージュ：幕が開くように出て、6秒ごとに別の組に入れ替わる／手書き風のキャッチと大きな英字が出る
 * - 会社紹介の写真：スクロールに合わせて画面いっぱいに広がり、白黒からカラーになる
 * - 番号つきの強み：見ている項目に合わせて左の番号と見出しが切り替わる／写真が自動で切り替わる
 * - 写真の壁：スクロールで列が左右にずれる
 * - 応募ゾーン：コピーが止まったまま暗転 → 写真の3列が縮小しながら上下に動く → 見出しと入口3つが出る
 * - ヘッダー：スクロールでロゴが小さくなる／メニューはリンクを押すと閉じる／応募ゾーンでは隠れる
 */
(function () {
  var d = document, W = window, root = d.documentElement;
  var still = /[?&]shot=1/.test(location.search) || (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var $$ = function (s, el) { return [].slice.call((el || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* メニュー */
  var tg = d.getElementById('st-menu');
  $$('.st-modal a').forEach(function (a) { a.addEventListener('click', function () { if (tg) tg.checked = false; }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && tg) tg.checked = false; });

  /* 写真のコラージュ */
  var fv = d.getElementById('st-fv');
  function startFv() {
    if (!fv) return;
    var panels = $$('.st-fv-panel', fv);
    panels.forEach(function (p) { $$('.st-fv-img', p).forEach(function (f, k) { f.style.setProperty('--k', k); }); });
    fv.classList.add('is-start');
    if (!panels.length) return;
    panels[0].classList.add('on');
    if (still || panels.length < 2) return;
    var cur = 0;
    setInterval(function () {
      var a = panels[cur], b = panels[(cur + 1) % panels.length];
      a.classList.remove('on'); a.classList.add('off');
      b.classList.remove('off'); b.classList.add('on');
      setTimeout(function () { a.classList.remove('off'); }, 1900);
      cur = (cur + 1) % panels.length;
    }, 6000);
  }

  /* 読み込み画面 */
  var ld = d.querySelector('.st-loader');
  var seen = false;
  try { seen = !!sessionStorage.getItem('st-loaded'); } catch (e) {}
  if (ld && !still && !seen) {
    root.classList.add('st-loading');
    setTimeout(function () {
      ld.classList.add('is-end');
      root.classList.remove('st-loading');
      try { sessionStorage.setItem('st-loaded', '1'); } catch (e) {}
      setTimeout(function () { if (ld.parentNode) ld.parentNode.removeChild(ld); }, 900);
      startFv();
    }, 2500);
  } else {
    if (ld && ld.parentNode) ld.parentNode.removeChild(ld);
    startFv();
  }

  /* スクロールに合わせて動くもの */
  var grow = d.querySelector('[data-grow]'), gImg = grow && grow.querySelector('.st-grow-img');
  var pts = $$('.st-point'), numCol = d.querySelector('.st-num-col'), labels = $$('.st-points-labels span');
  var hd = d.querySelector('.st-header');
  var curPt = -1, ticking = false;
  // 応募ゾーン
  var ctas = $$('[data-stcta]').map(function (el) {
    return { el: el, main: el.querySelector('.st-cta-main'), inner: el.querySelector('.st-cta-inner'), sticky: el.querySelector('.st-cta-imgs-sticky'), col: el.querySelector('.st-col'), items: el.querySelector('.st-cta-items') };
  });
  function ctaStep(c, vh, mobile) {
    var er = c.el.getBoundingClientRect();
    // ① コピーが画面に入ったら、文字と写真が出る
    if (er.top < vh * 0.5 && er.bottom > 0) c.el.classList.add('is-inview');
    else if (er.top >= vh * 0.6) c.el.classList.remove('is-inview');
    // ② コピーが止まったあと、スクロールに合わせて暗転
    var mr = c.main.getBoundingClientRect();
    var opa = still ? 1 : clamp(-mr.top / (vh * 0.8), 0, 1);
    c.main.style.setProperty('--opa', opa.toFixed(3));
    c.el.classList.toggle('is-bg-show', opa >= 0.98);
    root.classList.toggle('st-hd-hide', opa > 0.4 && er.bottom > vh * 0.5);
    // ③ 写真の3列：縮小しながら、1・3列目は上へ、2列目は下へ
    var ir = c.inner.getBoundingClientRect();
    var q = still ? 0.5 : clamp(-ir.top / Math.max(1, ir.height - vh), 0, 1);
    var s0 = mobile ? 1.35 : 1.5;
    var colH = c.col ? c.col.offsetHeight : vh * 2;
    var M = Math.max(0, Math.min(colH - vh, colH * 0.5) * 0.9);
    c.sticky.style.setProperty('--scale', (s0 - (s0 - 1) * q).toFixed(4));
    c.sticky.style.setProperty('--moveY', (-M * q).toFixed(1) + 'px');
    c.sticky.style.setProperty('--moveYr', (M * q).toFixed(1) + 'px');
    // ④ 見出しと入口3つ
    var tr = c.items.getBoundingClientRect();
    if (still || (tr.top < vh * 0.2 && tr.bottom > vh * 0.4)) c.el.classList.add('is-show');
    else if (tr.top > vh * 0.45) c.el.classList.remove('is-show');
  }
  function onScroll() {
    ticking = false;
    var vh = W.innerHeight, vw = root.clientWidth, y = W.scrollY;
    if (hd) hd.classList.toggle('is-scrolled', y > 80);
    ctas.forEach(function (c) { ctaStep(c, vh, vw < 768); });
    if (grow && gImg) {
      var r = grow.getBoundingClientRect();
      var p = still ? 1 : ease(clamp(-r.top / Math.max(1, r.height - vh), 0, 1));
      var w0 = r.width, h0 = Math.min(r.width * 1.2, vh * 0.68);
      gImg.style.setProperty('--w', (w0 + (vw - w0) * p) + 'px');
      gImg.style.setProperty('--h', (h0 + (vh - h0) * p) + 'px');
      gImg.style.setProperty('--r', (-(vw - r.right) * p) + 'px');
      gImg.style.setProperty('--g', String(1 - p));
    }
    if (pts.length) {
      var idx = 0;
      pts.forEach(function (el, i) { if (el.getBoundingClientRect().top < vh * 0.55) idx = i; });
      if (idx !== curPt) {
        curPt = idx;
        if (numCol) numCol.style.setProperty('--n', idx);
        labels.forEach(function (l, i) { l.classList.toggle('on', i === idx); });
      }
    }
  }
  W.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  W.addEventListener('resize', onScroll);
  W.addEventListener('load', function () {
    onScroll();
    // なめらかスクロール（Lenis）が動いているときは、同じ時計（GSAPのticker）で毎フレーム合わせる
    if (W.gsap && !still) { var lastY = -1; W.gsap.ticker.add(function () { if (W.scrollY !== lastY) { lastY = W.scrollY; onScroll(); } }); }
  });
  onScroll();

  /* 強みの写真：3.6秒ごとに切り替え */
  if (!still) {
    var groups = $$('[data-slides]');
    setInterval(function () {
      groups.forEach(function (g) {
        var f = $$('figure', g), i = f.findIndex(function (x) { return x.classList.contains('on'); });
        f[i].classList.remove('on'); f[(i + 1) % f.length].classList.add('on');
      });
    }, 3600);
  }

  /* 写真の壁・コラージュ：GSAP があれば、スクロールで少しずつずらす */
  W.addEventListener('load', function () {
    var gsap = W.gsap, ST = W.ScrollTrigger;
    if (still || !gsap || !ST) return;
    $$('.st-row').forEach(function (row, i) {
      gsap.fromTo(row, { x: (i % 2 ? -1 : 1) * 80 }, { x: (i % 2 ? 1 : -1) * 80, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    if (fv) {
      gsap.to(fv.querySelector('.st-fv-stage'), { yPercent: 10, ease: 'none', scrollTrigger: { trigger: fv, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(fv.querySelector('.st-fv-en'), { xPercent: -8, ease: 'none', scrollTrigger: { trigger: fv, start: 'top top', end: 'bottom top', scrub: true } });
    }
    ST.refresh();
  });
})();
