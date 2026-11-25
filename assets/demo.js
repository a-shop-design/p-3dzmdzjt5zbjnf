/* デモサイトの動き（スクロールで表示・数字のカウント・施工前後スライダー・ヘッダー） */
(function () {
  var d = document, root = d.documentElement;
  var still = /[?&]shot=1/.test(location.search) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.classList.add('js');

  var rv = [].slice.call(d.querySelectorAll('.rv'));
  var nums = [].slice.call(d.querySelectorAll('[data-count]'));
  function count(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    if (!isFinite(to) || to <= 0) return;
    var text = el.textContent, dec = (String(to).split('.')[1] || '').length, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      if (p < 1) requestAnimationFrame(step); else el.textContent = text;
    }
    requestAnimationFrame(step);
  }
  if (still || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        [].forEach.call(e.target.querySelectorAll('[data-count]'), count);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  }

  [].forEach.call(d.querySelectorAll('.ba-slider input'), function (inp) {
    function f() { inp.parentNode.style.setProperty('--pos', inp.value + '%'); }
    inp.addEventListener('input', f); f();
  });

  var hd = d.querySelector('.site-header');
  function onScroll() { if (hd) hd.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var tg = d.getElementById('nav-toggle');
  [].forEach.call(d.querySelectorAll('.site-nav a'), function (a) { a.addEventListener('click', function () { if (tg) tg.checked = false; }); });
})();
