/* FARSEA theme scripts */
(function () {
  'use strict';
  var F = window.FARSEA || { t: {}, routes: {} };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Money ---------- */
  function money(cents) {
    var fmt = F.moneyFormat || '€{{amount_with_comma_separator}}';
    function group(n, dec, thou, sep) {
      var parts = (n / 100).toFixed(dec).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thou);
      return parts.join(sep);
    }
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, key) {
      switch (key) {
        case 'amount': return group(cents, 2, ',', '.');
        case 'amount_no_decimals': return group(cents, 0, ',', '.');
        case 'amount_with_comma_separator': return group(cents, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return group(cents, 0, '.', ',');
        case 'amount_with_apostrophe_separator': return group(cents, 2, "'", '.');
        default: return group(cents, 2, ',', '.');
      }
    });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast'); if (!el) return;
    el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2400);
  }

  /* ---------- Menu overlay ---------- */
  (function () {
    var menu = $('#menu'), open = $('#openMenu'), close = $('#closeMenu');
    if (!menu || !open) return;
    function set(v) { menu.hidden = !v; open.setAttribute('aria-expanded', v); document.body.style.overflow = v ? 'hidden' : ''; if (v && close) close.focus(); }
    open.addEventListener('click', function () { set(true); });
    if (close) close.addEventListener('click', function () { set(false); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) set(false); });
  })();

  /* ---------- Treatments slider: endless loop, autoplay, drag, trackpad ---------- */
  $$('[data-slider]').forEach(function (root) {
    var rail = $('[data-rail]', root), view = $('[data-rail-view]', root);
    if (!rail || !view || rail.children.length < 2) return;
    var count = $('[data-count]', root), tick = $('[data-tick]', root);
    var total = rail.children.length, idx = 0, busy = false, timer = null, paused = false;
    var DELAY = parseInt(root.getAttribute('data-delay'), 10) || 5000;
    function pad(n) { return String(n).padStart(2, '0'); }
    function stepW() { return rail.children[0].offsetWidth + parseFloat(getComputedStyle(rail).columnGap || 28); }
    function label() { if (count) count.textContent = pad(idx + 1) + ' / ' + pad(total); }
    function next(from) {
      if (busy) return; busy = true; idx = (idx + 1) % total; label();
      if (reduce) { rail.appendChild(rail.firstElementChild); rail.style.transform = 'translateX(0)'; busy = false; return; }
      if (typeof from === 'number') { rail.style.transform = 'translateX(' + from + 'px)'; void rail.offsetWidth; }
      rail.classList.add('anim'); rail.style.transform = 'translateX(' + (-stepW()) + 'px)';
      rail.addEventListener('transitionend', function done(e) {
        if (e.target !== rail) return; rail.removeEventListener('transitionend', done);
        rail.classList.remove('anim'); rail.appendChild(rail.firstElementChild); rail.style.transform = 'translateX(0)';
        void rail.offsetWidth; busy = false;
      });
    }
    function prev(from) {
      if (busy) return; busy = true; idx = (idx - 1 + total) % total; label();
      rail.insertBefore(rail.lastElementChild, rail.firstElementChild);
      if (reduce) { rail.style.transform = 'translateX(0)'; busy = false; return; }
      rail.classList.remove('anim'); rail.style.transform = 'translateX(' + (-stepW() + (typeof from === 'number' ? from : 0)) + 'px)';
      void rail.offsetWidth;
      rail.classList.add('anim'); rail.style.transform = 'translateX(0)';
      rail.addEventListener('transitionend', function done(e) {
        if (e.target !== rail) return; rail.removeEventListener('transitionend', done); rail.classList.remove('anim'); busy = false;
      });
    }
    function startTick() { if (!tick) return; tick.style.transition = 'none'; tick.style.transform = 'scaleX(0)'; void tick.offsetWidth; tick.style.transition = 'transform ' + DELAY + 'ms linear'; tick.style.transform = 'scaleX(1)'; }
    function stopTick() { if (!tick) return; tick.style.transition = 'none'; tick.style.transform = 'scaleX(0)'; }
    function play() { if (reduce) return; clearInterval(timer); if (paused || document.hidden) return; startTick(); timer = setInterval(function () { next(); startTick(); }, DELAY); }
    function stop() { clearInterval(timer); timer = null; stopTick(); }
    function manual(fn) { fn(); play(); }
    var nb = $('[data-next]', root), pb = $('[data-prev]', root);
    if (nb) nb.addEventListener('click', function () { manual(next); });
    if (pb) pb.addEventListener('click', function () { manual(prev); });
    view.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') manual(next); if (e.key === 'ArrowLeft') manual(prev); });
    [view, $('.rail-ctrl', root)].forEach(function (el) {
      if (!el) return;
      el.addEventListener('mouseenter', function () { paused = true; stop(); });
      el.addEventListener('mouseleave', function () { paused = false; play(); });
      el.addEventListener('focusin', function () { paused = true; stop(); });
      el.addEventListener('focusout', function () { paused = false; play(); });
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });
    var drag = null, justDragged = false;
    view.addEventListener('pointerdown', function (e) {
      if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag = { x: e.clientX, y: e.clientY, dx: 0, axis: null, id: e.pointerId };
    });
    view.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis === 'x') { view.setPointerCapture(e.pointerId); view.classList.add('dragging'); stop(); }
      }
      if (drag.axis !== 'x') return;
      e.preventDefault(); drag.dx = dx; rail.classList.remove('anim'); rail.style.transform = 'translateX(' + dx + 'px)';
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null; view.classList.remove('dragging');
      if (d.axis !== 'x') return;
      justDragged = true; setTimeout(function () { justDragged = false; }, 50);
      var th = Math.min(80, stepW() * 0.18);
      if (d.dx < -th) next(d.dx); else if (d.dx > th) prev(d.dx);
      else { rail.classList.add('anim'); rail.style.transform = 'translateX(0)'; }
      paused = false; play();
    }
    view.addEventListener('pointerup', endDrag);
    view.addEventListener('pointercancel', endDrag);
    view.addEventListener('click', function (e) { if (justDragged) { e.preventDefault(); e.stopPropagation(); } }, true);
    view.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var acc = 0, lock = false, wt = null;
    view.addEventListener('wheel', function (e) {
      var dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (!dx) return;
      e.preventDefault();
      clearTimeout(wt); wt = setTimeout(function () { acc = 0; lock = false; }, 180);
      if (lock) return; acc += dx;
      if (Math.abs(acc) > 40) { lock = true; manual(acc > 0 ? next : prev); acc = 0; }
    }, { passive: false });
    window.addEventListener('resize', function () { rail.classList.remove('anim'); rail.style.transform = 'translateX(0)'; busy = false; });
    play();
  });

  /* ---------- Concerns preview ---------- */
  $$('[data-concerns]').forEach(function (root) {
    var links = $$('.c-list a', root), imgs = $$('.c-preview img', root), cap = $('[data-caption]', root);
    links.forEach(function (a) {
      function show() {
        var i = +a.getAttribute('data-i');
        links.forEach(function (l) { l.classList.toggle('on', l === a); });
        imgs.forEach(function (im, j) { im.classList.toggle('on', j === i); });
        if (cap) cap.textContent = a.querySelector('span').textContent;
      }
      a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
    });
  });

  /* ---------- Cart drawer ---------- */
  var drawer = $('#CartDrawer'), scrim = $('[data-scrim]'), lastFocus = null;
  function openCart() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('on'); if (scrim) scrim.classList.add('on'); });
    document.body.classList.add('locked');
    setTimeout(function () { var x = $('[data-close-cart]', drawer); if (x) x.focus(); }, 350);
  }
  function closeCart() {
    if (!drawer || !drawer.classList.contains('on')) return;
    drawer.classList.remove('on'); if (scrim) scrim.classList.remove('on');
    document.body.classList.remove('locked');
    setTimeout(function () { if (!drawer.classList.contains('on')) drawer.hidden = true; }, 550);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function setCount(n) {
    $$('[data-cart-count]').forEach(function (c) { c.textContent = n; c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); });
  }
  function renderCart(cart) {
    if (!drawer) return;
    var body = $('[data-cart-body]', drawer), foot = $('[data-cart-foot]', drawer), bar = $('[data-ship-bar]', drawer), head = $('[data-cart-head]', drawer);
    setCount(cart.item_count);
    head.textContent = cart.item_count ? '(' + cart.item_count + ')' : '';
    if (!cart.item_count) {
      body.innerHTML = '<div class="bag-empty"><p style="margin:0">' + esc(F.t.empty) + '</p></div>';
      foot.hidden = true; bar.hidden = true; return;
    }
    var free = F.freeShipping || 0, total = cart.total_price;
    if (free > 0) {
      bar.hidden = false;
      var pct = Math.min(100, total / free * 100);
      bar.innerHTML = (total >= free ? esc(F.t.unlocked) : esc(F.t.away).replace('{amount}', money(free - total))) + '<div class="track"><b style="width:' + pct + '%"></b></div>';
    }
    body.innerHTML = cart.items.map(function (it, i) {
      var img = it.image ? '<img src="' + esc(it.image + (it.image.indexOf('?') > -1 ? '&' : '?') + 'width=180') + '" alt="" loading="lazy">' : '<span class="kit-chip" style="width:72px;height:90px;border-radius:10px;background:var(--ink)"></span>';
      var variant = it.variant_title && it.variant_title !== 'Default Title' ? esc(it.variant_title) : '';
      return '<div class="line">' + img + '<div><h3><a href="' + esc(it.url) + '">' + esc(it.product_title) + '</a></h3>' +
        (variant ? '<div class="meta">' + variant + '</div>' : '') +
        '<div class="controls"><div class="qty"><button type="button" data-line="' + (i + 1) + '" data-qty-to="' + (it.quantity - 1) + '" aria-label="' + esc(F.t.less) + '">−</button><output>' + it.quantity + '</output><button type="button" data-line="' + (i + 1) + '" data-qty-to="' + (it.quantity + 1) + '" aria-label="' + esc(F.t.more) + '">+</button></div>' +
        '<button type="button" class="rm" data-line="' + (i + 1) + '" data-qty-to="0">' + esc(F.t.remove) + '</button></div></div>' +
        '<span class="price">' + money(it.final_line_price) + '</span></div>';
    }).join('');
    $('[data-cart-total]', drawer).textContent = money(total);
    foot.hidden = false;
  }
  function fetchCart() { return fetch(F.routes.cart, { headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); }); }
  function addToCart(payload, title) {
    return fetch(F.routes.cartAdd, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw d; return d; }); })
      .then(function () { return fetchCart(); })
      .then(function (cart) { renderCart(cart); toast(String(F.t.added).replace('{product}', title || '')); openCart(); })
      .catch(function (err) { toast((err && err.description) || F.t.error); });
  }
  function changeLine(line, qty) {
    return fetch(F.routes.cartChange, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ line: line, quantity: Math.max(0, qty) }) })
      .then(function (r) { return r.json(); }).then(renderCart).catch(function () { toast(F.t.error); });
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open-cart]');
    if (o && drawer) { e.preventDefault(); fetchCart().then(renderCart).then(openCart); return; }
    if (e.target.closest('[data-close-cart]') || e.target.closest('[data-scrim]')) { closeCart(); return; }
    var q = e.target.closest('[data-qty-to]');
    if (q && drawer && drawer.contains(q)) { changeLine(+q.getAttribute('data-line'), +q.getAttribute('data-qty-to')); return; }
    var a = e.target.closest('[data-add]');
    if (a) {
      e.preventDefault(); e.stopPropagation();
      if (a.disabled) return;
      var label = a.innerHTML;
      a.disabled = true;
      addToCart({ items: [{ id: +a.getAttribute('data-add'), quantity: 1 }] }, a.getAttribute('data-title')).then(function () {
        a.classList.add('done'); a.textContent = '✓ ' + (F.t.addedShort || '');
        setTimeout(function () { a.classList.remove('done'); a.innerHTML = label; a.disabled = false; }, 1600);
      });
    }
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });

  /* ---------- Product page ---------- */
  $$('[data-product]').forEach(function (root) {
    var main = $('.g-main img', root);
    $$('[data-thumb]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (main) { main.removeAttribute('srcset'); main.src = b.getAttribute('data-thumb'); }
        $$('[data-thumb]', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      });
    });
    var form = $('[data-product-form]', root) || document.getElementById('ProductForm');
    if (!form) return;
    var qty = $('[data-qty]', form);
    $$('[data-step]', form).forEach(function (b) {
      b.addEventListener('click', function () { qty.value = Math.max(1, Math.min(20, (+qty.value || 1) + (+b.getAttribute('data-step')))); });
    });
    $$('input[name="id"][type="radio"]', form).forEach(function (r) {
      r.addEventListener('change', function () { var p = $('[data-price]', root); if (p && r.dataset.price) p.innerHTML = r.dataset.price; });
    });
    form.addEventListener('submit', function (e) {
      if (!drawer) return;
      e.preventDefault();
      var fd = new FormData(form);
      var title = (form.querySelector('[data-title]') || {}).getAttribute ? form.querySelector('[data-title]').getAttribute('data-title') : '';
      addToCart({ items: [{ id: +fd.get('id'), quantity: +(fd.get('quantity') || 1) }] }, title);
    });
  });

  /* ---------- Collection: filter chips, sorting, kit placement ---------- */
  $$('[data-collection]').forEach(function (root) {
    var grid = $('[data-grid]', root); if (!grid) return;
    var cards = $$('[data-card]', grid), kit = $('[data-kit]', grid), empty = $('[data-empty]', grid);
    var count = $('[data-count]', root), sortSel = $('[data-sort]', root);
    var filter = 'all', sort = 'featured';
    var narrow = window.matchMedia('(max-width:980px)');
    function apply() {
      var list = cards.filter(function (c) { return c !== kit; });
      list.sort(function (a, b) {
        if (sort === 'asc') return a.dataset.price - b.dataset.price;
        if (sort === 'desc') return b.dataset.price - a.dataset.price;
        return a.dataset.index - b.dataset.index;
      });
      var visible = 0;
      list.forEach(function (c) {
        var tags = (c.dataset.tags || '').split('|');
        var show = filter === 'all' || tags.indexOf(filter) > -1;
        c.hidden = !show; if (show) visible++;
        grid.appendChild(c);
      });
      if (kit) {
        var ktags = (kit.dataset.tags || '').split('|');
        kit.hidden = !(filter === 'all' || ktags.indexOf(filter) > -1);
        var shown = list.filter(function (c) { return !c.hidden; });
        var at = Math.min(narrow.matches ? 2 : Math.floor(+kit.dataset.index) || 3, shown.length);
        if (shown[at]) grid.insertBefore(kit, shown[at]); else grid.appendChild(kit);
      }
      if (empty) { grid.appendChild(empty); empty.hidden = visible > 0 || (kit && !kit.hidden); }
      if (count) count.textContent = visible === 1 ? count.dataset.one : String(count.dataset.other).replace('{n}', visible);
    }
    $$('[data-filter]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.getAttribute('data-filter');
        $$('[data-filter]', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        apply();
      });
    });
    if (sortSel) sortSel.addEventListener('change', function () { sort = sortSel.value; apply(); });
    if (narrow.addEventListener) narrow.addEventListener('change', apply);
    apply();
  });
})();
