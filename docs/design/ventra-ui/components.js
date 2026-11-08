/* @ds-bundle: {"format":4,"namespace":"VentraGlass","components":[{"name":"Wordmark"},{"name":"GlassButton"},{"name":"IconButton"},{"name":"GlassCard"},{"name":"IconTile"},{"name":"Badge"},{"name":"StatCard"},{"name":"AnalyticsCard"},{"name":"SearchField"},{"name":"TextField"},{"name":"SelectPill"},{"name":"SegmentedTabs"},{"name":"Toggle"},{"name":"Checkbox"},{"name":"TopBar"},{"name":"BottomNav"},{"name":"AppFrame"},{"name":"Chip"},{"name":"PromoCard"},{"name":"Icon"}]} */
(function () {
  var React = window.React, h = React.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function omit(p, keys) { var o = {}; for (var k in p) if (keys.indexOf(k) < 0) o[k] = p[k]; return o; }

  /* Line icons, 24px grid, 1.8 stroke, round caps. */
  var PATHS = {
    home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
    leads: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.5a4 4 0 0 1 0 7.5M19 14a5 5 0 0 1 3 5v2',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
    calendar: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 9h16M8 2v4M16 2v4M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    bell: 'M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0',
    user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21a8 8 0 0 1 16 0',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    plus: 'M12 5v14M5 12h14',
    chat: 'M4 12a8 8 0 0 1 8-8 8 8 0 0 1 0 16H4l2-2.8A7.9 7.9 0 0 1 4 12zM8.5 12h.01M12 12h.01M15.5 12h.01',
    headset: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2zM18 18a4 4 0 0 1-4 3h-2',
    chart: 'M6 20V12M12 20V5M18 20v-9',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    up: 'M12 19V5M6 11l6-6 6 6',
    down: 'M12 5v14M6 13l6 6 6-6',
    check: 'M5 12.5l4.5 4.5L19 7',
    chevron: 'M6 9l6 6 6-6',
    close: 'M6 6l12 12M18 6L6 18',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
    alert: 'M12 9v4M12 17h.01M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z'
  };
  var uid = 0;
  function Icon(p) {
    var d = PATHS[p.name] || PATHS.more;
    var kids = [], stroke = 'currentColor';
    if (p.gradient) {
      var id = 'vg-ig-' + (++uid);
      kids.push(h('defs', { key: 'd' }, h('linearGradient', { id: id, x1: '0', y1: '0', x2: '1', y2: '1' },
        h('stop', { offset: '0', className: 'vg-g-' + p.gradient + '-a' }), h('stop', { offset: '1', className: 'vg-g-' + p.gradient + '-b' }))));
      stroke = 'url(#' + id + ')';
    }
    kids.push(h('path', { key: 'p', d: d }));
    return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: stroke, strokeWidth: p.strokeWidth || (p.name === 'more' ? 3.2 : 1.8), strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', width: p.size, height: p.size, className: p.className }, kids);
  }

  function Wordmark(p) {
    var gid = 'vg-mark-' + (p.id || 'g');
    return h(p.href ? 'a' : 'span', { className: cx('vg-wordmark', p.className), href: p.href, 'aria-label': 'VENTRA' },
      h('svg', { viewBox: '0 0 34 30', 'aria-hidden': 'true' },
        h('defs', null, h('linearGradient', { id: gid, x1: '0', y1: '0', x2: '1', y2: '1' },
          h('stop', { offset: '0', className: 'vg-mark-a' }), h('stop', { offset: '1', className: 'vg-mark-b' }))),
        /* The V mark: same geometry as the app's clip-path (0 0,28% 0,50% 62%,72% 0,100% 0,62% 100%,38% 100%). */
        h('polygon', { points: '0,0 9.5,0 17,18.6 24.5,0 34,0 21.1,30 12.9,30', fill: 'url(#' + gid + ')' })),
      p.markOnly ? null : h('span', null, 'VENTRA'));
  }

  function GlassButton(p) {
    var rest = omit(p, ['variant', 'size', 'icon', 'iconRight', 'block', 'className', 'children', 'href']);
    return h(p.href ? 'a' : 'button', Object.assign({ type: p.href ? undefined : 'button', href: p.href, className: cx('vg-btn', 'vg-btn-' + (p.variant || 'glass'), (p.variant || 'glass') === 'glass' && 'vg-bead', p.size && p.size !== 'md' && 'vg-btn-' + p.size, p.block && 'vg-btn-block', p.className) }, rest),
      p.icon ? h(Icon, { name: p.icon }) : null, p.children, p.iconRight ? h(Icon, { name: p.iconRight }) : null);
  }

  function IconButton(p) {
    var rest = omit(p, ['icon', 'label', 'dot', 'variant', 'size', 'className', 'strokeWidth']);
    return h('button', Object.assign({ type: 'button', 'aria-label': p.label, className: cx('vg-iconbtn', p.variant === 'violet' ? 'vg-iconbtn-violet' : 'vg-bead', p.size === 'sm' && 'vg-iconbtn-sm', p.className) }, rest),
      h(Icon, { name: p.icon, strokeWidth: p.strokeWidth }), p.dot ? h('span', { className: 'vg-dot', 'aria-hidden': 'true' }) : null);
  }

  function GlassCard(p) {
    var rest = omit(p, ['as', 'tight', 'promo', 'cyan', 'className', 'children']);
    return h(p.as || 'section', Object.assign({ className: cx('vg-card vg-glass', p.tight && 'vg-card-tight', p.promo && 'vg-promo', p.cyan && 'vg-cyan', p.className) }, rest), p.children);
  }

  function IconTile(p) {
    var tone = p.tone || 'violet';
    return h('span', { className: cx('vg-tile vg-bead', 'vg-tone-' + tone, p.size === 'sm' && 'vg-tile-sm', p.className), 'aria-hidden': 'true' }, h(Icon, { name: p.icon, strokeWidth: 2.4, gradient: tone }));
  }

  function Badge(p) {
    var icon = p.icon || (p.trend === 'up' ? 'up' : p.trend === 'down' ? 'down' : null);
    return h('span', { className: cx('vg-badge', 'vg-badge-' + (p.tone || 'neutral'), p.className) }, icon ? h(Icon, { name: icon, strokeWidth: 2.4 }) : null, p.children);
  }

  function StatCard(p) {
    return h(GlassCard, { className: 'vg-stat' },
      h(IconTile, { icon: p.icon, tone: p.tone }),
      h('div', { className: 'vg-stat-body' },
        h('div', { className: 'vg-stat-label' }, p.label),
        h('div', { className: 'vg-stat-row' }, h('span', { className: 'vg-stat-value' }, p.value), p.badge || null, p.control || null)),
      p.onMenu ? h('span', { className: 'vg-stat-menu' }, h(IconButton, { icon: 'more', size: 'sm', strokeWidth: 3.2, label: 'More options for ' + p.label, onClick: p.onMenu })) : null);
  }

  function smooth(xy) {
    if (!xy.length) return '';
    var d = 'M' + xy[0][0].toFixed(1) + ' ' + xy[0][1].toFixed(1);
    for (var i = 0; i < xy.length - 1; i++) {
      var p0 = xy[i - 1] || xy[i], p1 = xy[i], p2 = xy[i + 1], p3 = xy[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6, c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + [c1x, c1y, c2x, c2y, p2[0], p2[1]].map(function (n) { return n.toFixed(1); }).join(' ');
    }
    return d;
  }
  function AnalyticsCard(p) {
    var pts = p.points || [], w = 640, ht = 170, pad = 12, top = 18;
    var max = Math.max.apply(null, pts.concat([1])), min = Math.min.apply(null, pts.concat([0]));
    var span = (max - min) || 1, id = 'vg-ch-' + (++uid);
    var xy = pts.map(function (v, i) { return [pad + i * (w - pad * 2) / Math.max(pts.length - 1, 1), ht - pad - (v - min) / span * (ht - pad - top)]; });
    var line = smooth(xy);
    var area = xy.length ? line + ' L' + xy[xy.length - 1][0].toFixed(1) + ' ' + ht + ' L' + xy[0][0].toFixed(1) + ' ' + ht + ' Z' : '';
    return h(GlassCard, { className: p.className },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } }, h(IconTile, { icon: 'chart', tone: 'indigo', size: 'sm' }), h('div', { style: { display: 'grid', minWidth: 0 } }, h('h2', { style: { margin: 0, font: '600 20px/26px var(--font-sans)' } }, p.title), p.note ? h('span', { className: 'vg-sample' }, p.note) : null)),
      h('svg', { className: 'vg-chart', viewBox: '0 0 ' + w + ' ' + ht, role: 'img', 'aria-label': p.title + ' trend' },
        h('defs', null,
          h('linearGradient', { id: id + 'a', x1: '0', y1: '0', x2: '0', y2: '1' }, h('stop', { offset: '0', className: 'vg-area-a' }), h('stop', { offset: '1', className: 'vg-area-b' })),
          h('linearGradient', { id: id + 'l', x1: '0', y1: '0', x2: '1', y2: '0' }, h('stop', { offset: '0', className: 'vg-line-a' }), h('stop', { offset: '1', className: 'vg-line-b' }))),
        h('rect', { className: 'plot', x: pad, y: 4, width: w - pad * 2, height: ht - 4, rx: 14 }),
        h('path', { d: area, fill: 'url(#' + id + 'a)' }), h('path', { className: 'line', d: line, stroke: 'url(#' + id + 'l)' }),
        xy.map(function (q, i) { var last = i === xy.length - 1; return (i === 0 || last || i % 2 === 1) ? h('circle', { key: i, className: last ? 'end' : 'pt', cx: q[0], cy: q[1], r: last ? 9 : 4.5 }) : null; })),
      h('div', { className: 'vg-metrics' }, (p.metrics || []).map(function (m, i) {
        return h('div', { key: i, className: 'vg-metric' }, h('span', { className: 'vg-metric-value' }, m.value), h('span', { className: 'vg-metric-label' }, m.label), m.delta ? h(Badge, { tone: m.trend === 'down' ? 'danger' : 'success', trend: m.trend || 'up' }, m.delta) : null);
      })));
  }

  function SearchField(p) {
    var rest = omit(p, ['action', 'className', 'label', 'style']);
    return h('label', { className: cx('vg-field vg-bead', p.className), style: p.style },
      h(Icon, { name: 'search' }),
      h('span', { style: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' } }, p.label || 'Search'),
      h('input', Object.assign({ type: 'search' }, rest)),
      p.action ? h(IconButton, { icon: p.action.icon, label: p.action.label, variant: 'violet', size: 'sm', onClick: p.action.onClick }) : null);
  }

  function TextField(p) {
    var id = p.id || ('vg-f-' + (p.label || 'x').replace(/\W+/g, '-').toLowerCase());
    var rest = omit(p, ['label', 'hint', 'state', 'className', 'id']);
    var hintId = p.hint ? id + '-hint' : undefined;
    return h('div', { className: p.className },
      p.label ? h('label', { className: 'vg-field-label', htmlFor: id }, p.label) : null,
      h('div', { className: cx('vg-field vg-bead', p.state === 'valid' && 'vg-field-valid', p.state === 'invalid' && 'vg-field-invalid') },
        h('input', Object.assign({ id: id, 'aria-invalid': p.state === 'invalid' ? 'true' : undefined, 'aria-describedby': hintId }, rest)),
        p.state === 'valid' ? h('span', { className: 'vg-field-state', 'aria-label': 'Looks good' }, h(Icon, { name: 'check', strokeWidth: 2.6 })) : null,
        p.state === 'invalid' ? h('span', { className: 'vg-field-state', 'aria-hidden': 'true' }, h(Icon, { name: 'alert', strokeWidth: 2.2 })) : null),
      p.hint ? h('p', { id: hintId, className: cx('vg-field-hint', p.state === 'invalid' && 'is-error') }, p.hint) : null);
  }

  function SelectPill(p) {
    var rest = omit(p, ['options', 'className', 'label']);
    return h('span', { className: cx('vg-select vg-bead', p.className) },
      h('select', Object.assign({ 'aria-label': p.label }, rest), (p.options || []).map(function (o) { var v = typeof o === 'string' ? o : o.value; return h('option', { key: v, value: v }, typeof o === 'string' ? o : o.label); })),
      h(Icon, { name: 'chevron', strokeWidth: 2.2 }));
  }

  function SegmentedTabs(p) {
    var st = React.useState(p.defaultValue || (p.items && p.items[0])), val = p.value !== undefined ? p.value : st[0];
    return h('div', { className: cx('vg-tabs vg-glass', p.className), role: 'tablist', 'aria-label': p.label },
      (p.items || []).map(function (it) {
        return h('button', { key: it, type: 'button', role: 'tab', className: 'vg-tab', 'aria-selected': it === val ? 'true' : 'false', onClick: function () { st[1](it); p.onChange && p.onChange(it); } }, it);
      }));
  }

  function Toggle(p) {
    var st = React.useState(!!p.defaultChecked), on = p.checked !== undefined ? p.checked : st[0];
    var btn = h('button', { type: 'button', role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': p.label ? undefined : p.ariaLabel, className: 'vg-toggle', onClick: function () { st[1](!on); p.onChange && p.onChange(!on); } });
    return p.label ? h('label', { className: 'vg-inline' }, btn, p.label) : btn;
  }

  function Checkbox(p) {
    var st = React.useState(!!p.defaultChecked), on = p.checked !== undefined ? p.checked : st[0];
    return h('label', { className: 'vg-inline' },
      h('button', { type: 'button', role: 'checkbox', 'aria-checked': on ? 'true' : 'false', className: 'vg-check', onClick: function () { st[1](!on); p.onChange && p.onChange(!on); } }, h(Icon, { name: 'check', strokeWidth: 3 })),
      p.label);
  }

  function TopBar(p) {
    return h('header', { className: cx('vg-topbar', p.className) },
      h(Wordmark, { href: p.homeHref || '#', id: 'top' }),
      h(IconButton, { icon: 'bell', label: p.unread ? 'Notifications, ' + p.unread + ' unread' : 'Notifications', dot: !!p.unread }),
      h(IconButton, { icon: 'user', label: 'Account' }));
  }

  var NAV = [{ id: 'home', label: 'Home', icon: 'home' }, { id: 'leads', label: 'Leads', icon: 'leads' }, { id: 'team', label: 'AI Team', icon: 'sparkle' }, { id: 'bookings', label: 'Bookings', icon: 'calendar' }, { id: 'more', label: 'More', icon: 'more' }];
  function BottomNav(p) {
    var items = p.items || NAV;
    return h('nav', { className: cx('vg-nav vg-glass', p.className), 'aria-label': 'Main' },
      items.map(function (it) { return h('a', { key: it.id, href: it.href || '#', 'aria-current': it.id === (p.active || 'home') ? 'page' : undefined }, h(Icon, { name: it.icon }), h('span', null, it.label)); }));
  }


  function AppFrame(p) { var rest = omit(p, ['className', 'children']); return h('div', Object.assign({ className: cx('vg-frame vg-glass vg-sheet', p.className) }, rest), p.children); }
  function Chip(p) {
    var rest = omit(p, ['icon', 'className', 'children']);
    return h('button', Object.assign({ type: 'button', className: cx('vg-chip vg-bead', p.className) }, rest), h('span', null, p.children), p.icon ? h(Icon, { name: p.icon }) : null);
  }
  function PromoCard(p) {
    return h(GlassCard, { promo: true, className: p.className, style: p.style },
      h('span', { className: 'vg-promo-glow', 'aria-hidden': 'true' }),
      h('h3', { style: { margin: '0 0 6px', font: '600 22px/28px var(--font-sans)' } }, p.title),
      p.text ? h('p', { style: { margin: '0 0 18px', font: '500 15px/22px var(--font-sans)', color: 'var(--ink-muted)' } }, p.text) : null,
      p.action ? h(GlassButton, { variant: 'glass', className: 'vg-bead', icon: p.action.icon, onClick: p.action.onClick }, p.action.label) : null);
  }

  /* Optional true refraction (Chromium only). Builds a bevel displacement map (kube.io technique: Snell-style bend along a
     convex edge, X/Y encoded in red/green) and applies it as backdrop-filter: url(#vg-refract) on floating cards.
     Safari and Firefox ignore url() in backdrop-filter, so this is skipped there and the CSS edge ring stands in. */
  function enableRefraction(opts) {
    opts = opts || {};
    var ua = navigator.userAgent, chromium = /Chrome\/|Chromium\/|Edg\//.test(ua) && !/OPR\/|SamsungBrowser/.test(ua);
    if (!chromium || document.getElementById('vg-refract')) return false;
    var N = 256, bw = opts.bezel || 0.16, c = document.createElement('canvas'); c.width = c.height = N;
    var ctx = c.getContext('2d'), img = ctx.createImageData(N, N), d = img.data;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var u = (x + .5) / N, v = (y + .5) / N, dx = Math.min(u, 1 - u), dy = Math.min(v, 1 - v);
      var t = Math.min(dx, dy) / bw; var px = 0, py = 0;
      if (t < 1) { var h = Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t))); var m = 1 - h; /* strong at the very edge, 0 at the end of the bezel */
        if (dx < dy) px = (u < .5 ? 1 : -1) * m; else py = (v < .5 ? 1 : -1) * m; }
      var i = (y * N + x) * 4; d[i] = 128 + px * 127; d[i + 1] = 128 + py * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    svg.innerHTML = '<filter id="vg-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage href="' + c.toDataURL() + '" preserveAspectRatio="none" result="map"/><feDisplacementMap in="SourceGraphic" in2="map" scale="' + (opts.scale || 18) + '" xChannelSelector="R" yChannelSelector="G"/></filter>';
    document.body.appendChild(svg); document.documentElement.classList.add('vg-refract');
    return true;
  }

  var api = { enableRefraction: enableRefraction, AppFrame: AppFrame, Chip: Chip, PromoCard: PromoCard, Icon: Icon, Wordmark: Wordmark, GlassButton: GlassButton, IconButton: IconButton, GlassCard: GlassCard, IconTile: IconTile, Badge: Badge, StatCard: StatCard, AnalyticsCard: AnalyticsCard, SearchField: SearchField, TextField: TextField, SelectPill: SelectPill, SegmentedTabs: SegmentedTabs, Toggle: Toggle, Checkbox: Checkbox, TopBar: TopBar, BottomNav: BottomNav };
  window.VentraGlass = Object.assign(window.VentraGlass || {}, api);
})();
