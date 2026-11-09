/* АйсикБел — подбор по площади, каталог, заявка */
(function () {
  'use strict';
  var WA = 'https://wa.me/375291933373';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initHeader(); initDrawer(); initReveal(); initSel(); initCatalog(); initForm();
    var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
  });

  function initHeader() {
    var hd = document.getElementById('hd'); if (!hd) return;
    function upd() { hd.classList.toggle('is-stuck', window.scrollY > 20); }
    upd(); addEventListener('scroll', upd, { passive: true });
  }

  function initDrawer() {
    var b = document.getElementById('burger'), d = document.getElementById('drawer');
    if (!b || !d) return;
    var last = null;
    function open() {
      last = document.activeElement; d.hidden = false;
      b.setAttribute('aria-expanded', 'true'); document.body.classList.add('is-locked');
      var x = document.getElementById('drawer-x'); if (x) x.focus({ preventScroll: true });
    }
    function close() {
      d.hidden = true; b.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      if (last) last.focus({ preventScroll: true });
    }
    b.addEventListener('click', function () { d.hidden ? open() : close(); });
    var x = document.getElementById('drawer-x'); if (x) x.addEventListener('click', close);
    d.addEventListener('click', function (e) {
      if (e.target.closest('a')) { close(); return; }
      if (!e.target.closest('.drawer__in')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (d.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var it = d.querySelectorAll('a, button'); if (!it.length) return;
      var f = it[0], l = it[it.length - 1];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    });
    addEventListener('resize', function () { if (innerWidth > 1080 && !d.hidden) close(); });
  }

  function initReveal() {
    var els = [].slice.call(document.querySelectorAll('.sec__head, .pc, .stp, .serv__list li, .qa, .works__grid figure, .gal__i, .mont2__grid div, .brands__list li'));
    if (!els.length || reduced) return;
    els.forEach(function (el) { el.classList.add('rv'); });
    var raf = false;
    function check() {
      raf = false;
      var line = innerHeight * 0.95;
      els = els.filter(function (el) {
        if (el.getBoundingClientRect().top < line) { el.classList.add('is-in'); return false; }
        return true;
      });
      if (!els.length) removeEventListener('scroll', onScroll);
    }
    function onScroll() { if (!raf) { raf = true; requestAnimationFrame(check); } }
    check(); addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
  }

  /* подбор по площади в герое */
  function initSel() {
    var r = document.getElementById('area'); if (!r) return;
    var out = document.getElementById('areaOut'), kw = document.getElementById('kwOut'),
        cnt = document.getElementById('cntOut'), go = document.getElementById('selGo');
    var counts = null;
    function paint() {
      var v = +r.value, pct = (v - r.min) / (r.max - r.min) * 100;
      r.style.setProperty('--p', pct + '%');
      out.textContent = v;
      kw.textContent = (Math.round(v / 10 * 10 / 10 * 10) / 10).toFixed(1).replace('.', ',');
      if (counts) cnt.textContent = 'моделей этого класса: ' + counts.filter(function (a) { return a >= v && a <= v * 1.5; }).length;
      if (go) go.href = 'catalog.html?a=' + v;
    }
    fetch('assets/data/products.json').then(function (r2) { return r2.json(); }).then(function (list) {
      counts = list.map(function (p) { return p.a || 0; });
      paint();
    }).catch(function () {});
    r.addEventListener('input', paint);
    paint();
  }

  /* каталог */
  function initCatalog() {
    var grid = document.getElementById('grid'); if (!grid) return;
    var state = { b: 'all', a: 0, inv: false, wifi: false, min: 1050, max: 23391, sort: 'pop', q: '' };
    var all = [], cart = [];
    var found = document.getElementById('found'), empty = document.getElementById('empty'),
        cartEl = document.getElementById('cart'), cartN = document.getElementById('cartN'), cartSum = document.getElementById('cartSum');
    var params = new URLSearchParams(location.search), areaParam = +params.get('a') || 0;
    if (areaParam) state.a = areaParam;

    function money(n) { return n.toLocaleString('ru-RU').replace(/,/g, ' ').replace(/\u00a0/g, ' ') + ' руб.'; }

    function render() {
      var list = all.filter(function (p) {
        if (state.b !== 'all' && p.b !== state.b) return false;
        if (state.a && (p.a || 0) > state.a) return false;
        if (state.inv && !p.i) return false;
        if (state.wifi && !p.w) return false;
        if (p.p < state.min || p.p > state.max) return false;
        if (state.q && p.n.toLowerCase().indexOf(state.q) === -1) return false;
        return true;
      });
      if (state.sort === 'cheap') list.sort(function (x, y) { return x.p - y.p; });
      else if (state.sort === 'exp') list.sort(function (x, y) { return y.p - x.p; });
      else if (state.sort === 'area') list.sort(function (x, y) { return (y.a || 0) - (x.a || 0); });
      found.textContent = list.length;
      empty.hidden = list.length > 0;
      grid.innerHTML = list.map(function (p) {
        var tags = [];
        if (p.i) tags.push('инвертор');
        if (p.w) tags.push('Wi-Fi');
        if (p.a) tags.push('до ' + p.a + ' м²');
        return '<article class="pc"><div class="pc__img"><img src="assets/img/p/' + p.m + '" alt="' + p.n.replace(/"/g, '') + '" width="520" height="225" loading="lazy" decoding="async"></div>' +
          '<div class="pc__b"><p class="pc__br">' + p.b + '</p><h3 class="pc__n">' + p.n + '</h3>' +
          '<p class="pc__t">' + (p.k ? String(p.k).replace('.', ',') + ' кВт · ' : '') + tags.join(', ') + '</p>' +
          '<div class="pc__f"><p class="pc__p">' + p.p.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' <i>руб.</i></p>' +
          '<button class="pc__add' + (cart.indexOf(p.n) > -1 ? ' is-on' : '') + '" type="button" data-n="' + p.n + '" aria-label="В заявку">' + (cart.indexOf(p.n) > -1 ? '✓' : '+') + '</button></div></div></article>';
      }).join('');
      grid.querySelectorAll('.pc').forEach(function (el, i) {
        if (i < 8) { el.classList.remove('rv'); el.classList.add('is-in'); }
      });
    }

    function paintCart() {
      cartEl.hidden = cart.length === 0;
      cartN.textContent = cart.length;
      var sum = 0;
      all.forEach(function (p) { if (cart.indexOf(p.n) > -1) sum += p.p; });
      cartSum.textContent = cart.length ? money(sum) : '';
      document.body.style.paddingBottom = cart.length ? '62px' : '';
    }

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.pc__add'); if (!btn) return;
      var n = btn.getAttribute('data-n'), i = cart.indexOf(n);
      if (i > -1) cart.splice(i, 1); else cart.push(n);
      btn.classList.toggle('is-on', i === -1);
      btn.textContent = i === -1 ? '✓' : '+';
      paintCart();
    });

    document.getElementById('cartSend').addEventListener('click', function () {
      var lines = ['Заявка с сайта:', 'Модели:'];
      cart.forEach(function (n) { lines.push('— ' + n); });
      lines.push('Цены: ' + money(cart.reduce(function (s, n) {
        var f = all.filter(function (p) { return p.n === n; })[0]; return s + (f ? f.p : 0);
      }, 0)));
      window.open(WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
    document.getElementById('cartClear').addEventListener('click', function () { cart = []; paintCart(); render(); });

    document.getElementById('brandChips').addEventListener('click', function (e) {
      var c = e.target.closest('.chip'); if (!c) return;
      this.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('is-on'); });
      c.classList.add('is-on'); state.b = c.getAttribute('data-b'); render();
    });
    document.getElementById('areaChips').addEventListener('click', function (e) {
      var c = e.target.closest('.chip'); if (!c) return;
      this.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('is-on'); });
      c.classList.add('is-on'); state.a = +c.getAttribute('data-a'); render();
    });
    document.getElementById('f-inv').addEventListener('change', function () { state.inv = this.checked; render(); });
    document.getElementById('f-wifi').addEventListener('change', function () { state.wifi = this.checked; render(); });
    ['f-min', 'f-max'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () {
        state[id === 'f-min' ? 'min' : 'max'] = +this.value || 0; render();
      });
    });
    document.getElementById('sort').addEventListener('change', function () { state.sort = this.value; render(); });
    document.getElementById('reset').addEventListener('click', function () {
      state = { b: 'all', a: 0, inv: false, wifi: false, min: 1050, max: 23391, sort: 'pop', q: '' };
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('is-on', c.getAttribute('data-b') === 'all' || c.getAttribute('data-a') === '0'); });
      document.getElementById('f-inv').checked = false;
      document.getElementById('f-wifi').checked = false;
      document.getElementById('f-min').value = 1050;
      document.getElementById('f-max').value = 23391;
      document.getElementById('sort').value = 'pop';
      render();
    });
    var fb = document.getElementById('filterOpen'), fl = document.getElementById('filters');
    if (fb && fl) {
      if (innerWidth <= 1080) fl.hidden = true;
      fb.addEventListener('click', function () { fl.hidden = !fl.hidden; });
    }

    fetch('assets/data/products.json').then(function (r) { return r.json(); }).then(function (list) {
      all = list; render(); paintCart();
      if (state.a) {
        var chip = document.querySelector('.chip[data-a="' + state.a + '"]');
        if (chip) { document.querySelectorAll('#areaChips .chip').forEach(function (c) { c.classList.remove('is-on'); }); chip.classList.add('is-on'); }
      }
    }).catch(function () {
      grid.innerHTML = '<p class="cat__empty">Каталог не загрузился. Позвоните — назовём наличие и цены: +375 (29) 193 33 73</p>';
    });
  }

  function initForm() {
    var f = document.getElementById('lead-form'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = document.getElementById('f-name'), p = document.getElementById('f-phone'), bad = false;
      [n, p].forEach(function (el) {
        if (!el.value.trim()) { el.style.borderColor = '#FF5C29'; bad = true; } else { el.style.borderColor = ''; }
      });
      var ok = document.getElementById('form-ok'); ok.classList.add('is-on');
      if (bad) { ok.textContent = 'Заполните имя и телефон, иначе мы не сможем ответить.'; return; }
      var text = ['Заявка с сайта АйсикБел', 'Имя: ' + n.value.trim(), 'Телефон: ' + p.value.trim(),
        'Город: ' + document.getElementById('f-city').value,
        'Площадь и задача: ' + (document.getElementById('f-note').value.trim() || 'не указано')].join('\n');
      ok.textContent = 'Заявка собрана. Открываем WhatsApp — останется нажать «Отправить».';
      window.open(WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      f.reset();
    });
  }
})();
