/* eslint-disable */
/**
 * Design Mode bridge — runs INSIDE the preview iframe.
 *
 * Injected by the preview route only when ?design=1. Lets the parent IDE overlay
 * drive a Cursor-style visual editing experience over a plain static site:
 *  - click to select an element (Shift/Cmd-click to multi-select)
 *  - Shift+drag to box an area (selects intersecting elements)
 *  - Escape to clear
 * Captured DOM context is posted to the parent via postMessage. No source files
 * are touched here — the parent forwards context to the agent.
 *
 * Plain ES5-ish browser JS (not bundled). Keep dependency-free.
 */
(function () {
  'use strict';

  var MAX_HTML = 2000;
  var MAX_TEXT = 300;
  var enabled = false;
  var selected = []; // array of elements
  var origin = location.origin;

  var STYLE_KEYS = [
    'display', 'position', 'flexDirection', 'justifyContent', 'alignItems', 'gap',
    'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'color', 'backgroundColor',
    'margin', 'padding', 'width', 'height', 'borderRadius', 'textAlign',
  ];

  // ── Overlay styles (scoped, high z-index, ignore in capture) ────────────────
  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-design-mode', '');
  styleEl.textContent =
    '[data-dm-hover]{outline:2px solid #6aa3ff !important;outline-offset:1px !important;cursor:crosshair !important;}' +
    '[data-dm-selected]{outline:2px solid #ff7a18 !important;outline-offset:1px !important;}' +
    '#__dm_box{position:fixed;z-index:2147483646;border:1.5px dashed #ff7a18;background:rgba(255,122,24,0.08);pointer-events:none;display:none;}' +
    'html.__dm_on *{cursor:crosshair !important;}';
  document.documentElement.appendChild(styleEl);

  var box = document.createElement('div');
  box.id = '__dm_box';
  document.documentElement.appendChild(box);

  function post(msg) {
    try { window.parent.postMessage(msg, origin); } catch (e) { /* ignore */ }
  }

  function isOwn(el) {
    return el === styleEl || el === box || (el.getAttribute && el.getAttribute('data-design-mode') !== null);
  }

  // ── Selector + xpath builders ───────────────────────────────────────────────
  function cssSelector(el) {
    if (!(el instanceof Element)) return '';
    if (el.id) return '#' + CSS.escape(el.id);
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== document.body && parts.length < 6) {
      var sel = node.nodeName.toLowerCase();
      if (node.classList && node.classList.length) {
        sel += '.' + Array.prototype.slice.call(node.classList)
          .filter(function (c) { return c.indexOf('__dm') !== 0; })
          .map(function (c) { return CSS.escape(c); }).join('.');
      }
      var parent = node.parentNode;
      if (parent) {
        var siblings = Array.prototype.filter.call(parent.children, function (c) {
          return c.nodeName === node.nodeName;
        });
        if (siblings.length > 1) {
          sel += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
        }
      }
      parts.unshift(sel);
      node = node.parentNode;
    }
    return parts.join(' > ');
  }

  function xpath(el) {
    if (!(el instanceof Element)) return '';
    if (el.id) return '//*[@id="' + el.id + '"]';
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1) {
      var ix = 1;
      var sib = node.previousElementSibling;
      while (sib) { if (sib.nodeName === node.nodeName) ix++; sib = sib.previousElementSibling; }
      parts.unshift(node.nodeName.toLowerCase() + '[' + ix + ']');
      node = node.parentNode;
      if (node === document.body) { parts.unshift('body'); break; }
    }
    return '/' + parts.join('/');
  }

  function pickAttrs(el) {
    var keep = ['href', 'src', 'alt', 'role', 'type', 'name', 'title', 'aria-label', 'data-dev-source'];
    var out = {};
    for (var i = 0; i < keep.length; i++) {
      var v = el.getAttribute && el.getAttribute(keep[i]);
      if (v != null) out[keep[i]] = String(v).slice(0, 200);
    }
    return out;
  }

  function pickStyles(el) {
    var cs = window.getComputedStyle(el);
    var out = {};
    for (var i = 0; i < STYLE_KEYS.length; i++) {
      var k = STYLE_KEYS[i];
      var v = cs[k];
      if (v) out[k] = String(v);
    }
    return out;
  }

  function describe(el) {
    var r = el.getBoundingClientRect();
    return {
      cssSelector: cssSelector(el),
      xpath: xpath(el),
      tagName: el.tagName.toLowerCase(),
      id: el.id || '',
      classList: Array.prototype.slice.call(el.classList || []).filter(function (c) { return c.indexOf('__dm') !== 0; }),
      attributes: pickAttrs(el),
      outerHTML: (el.outerHTML || '').slice(0, MAX_HTML),
      innerText: (el.innerText || el.textContent || '').trim().slice(0, MAX_TEXT),
      computedStyles: pickStyles(el),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  }

  function projectPage() {
    // Strip the /preview/<slug>/ prefix client-side too, so the parent has a hint.
    var m = location.pathname.match(/^\/preview\/[^/]+\/(.*)$/);
    var rel = m ? m[1] : location.pathname.replace(/^\/+/, '');
    rel = rel.split('?')[0].split('#')[0];
    if (!rel || rel.endsWith('/')) rel += 'index.html';
    return rel;
  }

  function emitSelection() {
    post({
      type: 'design:selection',
      pagePath: projectPage(),
      viewport: { w: window.innerWidth, h: window.innerHeight },
      selections: selected.map(describe),
    });
  }

  function clearSelection() {
    selected.forEach(function (el) { el.removeAttribute('data-dm-selected'); });
    selected = [];
    post({ type: 'design:cleared' });
  }

  function toggleSelect(el, additive) {
    if (!additive) {
      selected.forEach(function (s) { if (s !== el) s.removeAttribute('data-dm-selected'); });
      selected = selected.filter(function (s) { return s === el; });
    }
    var idx = selected.indexOf(el);
    if (idx >= 0) {
      el.removeAttribute('data-dm-selected');
      selected.splice(idx, 1);
    } else {
      el.setAttribute('data-dm-selected', '');
      selected.push(el);
    }
    emitSelection();
  }

  // ── Event handlers ──────────────────────────────────────────────────────────
  var hoverEl = null;
  function onMove(e) {
    if (!enabled || dragging) return;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (hoverEl && hoverEl !== el) hoverEl.removeAttribute('data-dm-hover');
    if (el && !isOwn(el) && el.nodeType === 1) {
      el.setAttribute('data-dm-hover', '');
      hoverEl = el;
    }
  }

  function onClick(e) {
    if (!enabled) return;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isOwn(el)) return;
    e.preventDefault();
    e.stopPropagation();
    toggleSelect(el, e.shiftKey || e.metaKey || e.ctrlKey);
  }

  // Block navigation while in design mode.
  function onClickCapture(e) {
    if (!enabled) return;
    var a = e.target && e.target.closest ? e.target.closest('a,button,[type=submit]') : null;
    if (a) { e.preventDefault(); e.stopPropagation(); }
  }

  // Shift+drag area selection.
  var dragging = false, dragStart = null;
  function onDown(e) {
    if (!enabled || !e.shiftKey) return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    box.style.display = 'block';
    box.style.left = e.clientX + 'px';
    box.style.top = e.clientY + 'px';
    box.style.width = '0px';
    box.style.height = '0px';
    e.preventDefault();
  }
  function onDrag(e) {
    if (!dragging || !dragStart) return;
    var x = Math.min(e.clientX, dragStart.x), y = Math.min(e.clientY, dragStart.y);
    var w = Math.abs(e.clientX - dragStart.x), h = Math.abs(e.clientY - dragStart.y);
    box.style.left = x + 'px'; box.style.top = y + 'px';
    box.style.width = w + 'px'; box.style.height = h + 'px';
  }
  function onUp(e) {
    if (!dragging || !dragStart) return;
    dragging = false;
    box.style.display = 'none';
    var x1 = Math.min(e.clientX, dragStart.x), y1 = Math.min(e.clientY, dragStart.y);
    var x2 = Math.max(e.clientX, dragStart.x), y2 = Math.max(e.clientY, dragStart.y);
    if (x2 - x1 < 5 && y2 - y1 < 5) return; // treat as click
    // Select top-level elements intersecting the box.
    var all = document.body.querySelectorAll('*');
    var hits = [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (isOwn(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      var intersects = r.left < x2 && r.right > x1 && r.top < y2 && r.bottom > y1;
      // Only keep elements whose parent is NOT also fully in box (avoid deep noise).
      if (intersects && r.width * r.height < (x2 - x1) * (y2 - y1) * 4) hits.push(el);
    }
    // Keep the shallowest distinct hits (cap to 8).
    selected.forEach(function (s) { s.removeAttribute('data-dm-selected'); });
    selected = hits.slice(0, 8);
    selected.forEach(function (s) { s.setAttribute('data-dm-selected', ''); });
    var nr = { x: x1 / window.innerWidth, y: y1 / window.innerHeight, w: (x2 - x1) / window.innerWidth, h: (y2 - y1) / window.innerHeight };
    post({ type: 'design:annotation', annotation: { kind: 'area', rect: nr } });
    emitSelection();
    dragStart = null;
  }

  function onKey(e) {
    if (!enabled) return;
    if (e.key === 'Escape') clearSelection();
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    document.documentElement.classList.add('__dm_on');
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClickCapture, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('mousemove', onDrag, true);
    document.addEventListener('mouseup', onUp, true);
    document.addEventListener('keydown', onKey, true);
  }

  function disable() {
    enabled = false;
    document.documentElement.classList.remove('__dm_on');
    if (hoverEl) hoverEl.removeAttribute('data-dm-hover');
    clearSelection();
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClickCapture, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('mousedown', onDown, true);
    document.removeEventListener('mousemove', onDrag, true);
    document.removeEventListener('mouseup', onUp, true);
    document.removeEventListener('keydown', onKey, true);
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== origin || !e.data || typeof e.data !== 'object') return;
    var t = e.data.type;
    if (t === 'design:enable') enable();
    else if (t === 'design:disable') disable();
    else if (t === 'design:clear') clearSelection();
  });

  // Auto-enable: the script is only injected when ?design=1, so the user already
  // turned Design Mode on. Parent can still disable/re-enable without reloading.
  post({ type: 'design:ready' });
  enable();
})();
