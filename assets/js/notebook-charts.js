/* Research Notebook interactive charts.
   Vanilla JS, no dependencies. Each <div class="nb-chart" data-nb-chart="ID">
   is filled from window.NotebookChartData[ID]; the element's own text is the
   fallback shown without JavaScript. Labels are inserted with textContent. */
(function () {
  'use strict';

  var DATA = window.NotebookChartData || {};
  var LANG = 'en';
  var UI_TEXT = {
    zh: { table: '数据表', views: '切换视图', filter: '筛选', item: '项目', value: '数值', share: '占比',
          push: '每层的推力：浅层 → 深层', all: '全部',
          tally: function (n, up, down) { return '这里的 ' + n + ' 把尺子：Hybrid 更高 ' + up + ' 把，更低或未超过 ' + down + ' 把。'; } },
    en: { table: 'Data table', views: 'Switch view', filter: 'Filter', item: 'Item', value: 'Value', share: 'Share',
          push: 'Push per layer: early → late', all: 'All',
          tally: function (n, up, down) { return 'Of these ' + n + ' rulers, Hybrid is higher on ' + up + ' and lower or not ahead on ' + down + '.'; } }
  };
  var UI = UI_TEXT.en;
  function setLanguage() {
    LANG = /^zh/i.test(document.documentElement.lang || '') ? 'zh' : 'en';
    UI = UI_TEXT[LANG];
  }
  setLanguage();
  var VERDICT = { ok: '✓', fail: '✗', mixed: '△', open: '○' };
  var RESULT = {
    higher: { glyph: '▲', zh: '更高', en: 'Higher' },
    slightly: { glyph: '▲', zh: '略高', en: 'Slightly higher' },
    lower: { glyph: '▼', zh: '更低', en: 'Lower' },
    close: { glyph: '▼', zh: '更低，或接近但未超过', en: 'Lower, or close but not ahead' }
  };

  function t(v) {
    if (v == null) return '';
    if (typeof v !== 'object') return String(v);
    return v[LANG] != null ? v[LANG] : (v.en != null ? v.en : v.zh || '');
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function fmt(v, axis, decimals) {
    var d = decimals != null ? decimals : (axis && axis.decimals != null ? axis.decimals : 2);
    var sign = v < 0 ? '−' : (axis && axis.signed && v > 0 ? '+' : '');
    return sign + Math.abs(v).toFixed(d) + (axis && axis.suffix ? axis.suffix : '');
  }
  function count(v) { return Number(v).toLocaleString('en-US'); }

  function makeTip(root) {
    var tip = el('div', 'nbv-tip');
    tip.hidden = true;
    tip.setAttribute('aria-hidden', 'true');
    root.appendChild(tip);
    return {
      show: function (anchor, strong, lines, clientX) {
        tip.textContent = '';
        tip.appendChild(el('strong', null, strong));
        lines.forEach(function (line) { if (line) tip.appendChild(el('span', null, line)); });
        tip.hidden = false;
        var rb = root.getBoundingClientRect();
        var ab = anchor.getBoundingClientRect();
        var x = (clientX != null ? clientX : ab.left + ab.width / 2) - rb.left - tip.offsetWidth / 2;
        x = Math.max(0, Math.min(rb.width - tip.offsetWidth, x));
        var y = ab.top - rb.top - tip.offsetHeight - 8;
        if (y < 0) y = ab.bottom - rb.top + 8;
        tip.style.left = x + 'px';
        tip.style.top = y + 'px';
      },
      hide: function () { tip.hidden = true; }
    };
  }
  function bind(node, tip, strong, lines) {
    lines = lines.filter(Boolean);
    node.tabIndex = 0;
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', lines.concat([strong]).join(', '));
    node.addEventListener('pointermove', function (e) { tip.show(node, strong, lines, e.clientX); });
    node.addEventListener('pointerleave', tip.hide);
    node.addEventListener('focus', function () { tip.show(node, strong, lines); });
    node.addEventListener('blur', tip.hide);
  }

  function makeTabs(labels, onSelect, name) {
    var list = el('div', 'nbv-tabs');
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', name || UI.views);
    var buttons = labels.map(function (label, i) {
      var b = el('button', 'nbv-tab', label);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.addEventListener('click', function () { select(i, false); });
      b.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        select((i + step + labels.length) % labels.length, true);
      });
      list.appendChild(b);
      return b;
    });
    function select(i, focus) {
      buttons.forEach(function (b, k) {
        b.setAttribute('aria-selected', k === i ? 'true' : 'false');
        b.tabIndex = k === i ? 0 : -1;
      });
      if (focus) buttons[i].focus();
      onSelect(i);
    }
    return { node: list, select: select };
  }

  function glyph(kind) {
    var NS = 'http://www.w3.org/2000/svg';
    var fig = el('div', 'nbv-glyph');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 240 64');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', UI.push);
    function add(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      svg.appendChild(n);
      return n;
    }
    var x0 = 8, x1 = 232, top = 14, bottom = 54;
    add('line', { x1: x0, y1: bottom, x2: x1, y2: bottom, 'class': 'nbv-glyph__base' });
    if (kind === 'once') {
      add('line', { x1: x0, y1: bottom, x2: x0, y2: top, 'class': 'nbv-glyph__line' });
      add('line', { x1: x0, y1: bottom, x2: x1, y2: bottom, 'class': 'nbv-glyph__line' });
      add('circle', { cx: x0, cy: top, r: 4.5, 'class': 'nbv-glyph__dot' });
    } else {
      var pts = [];
      for (var i = 0; i <= 40; i++) {
        var u = i / 40;
        var level = kind === 'decay' ? 0.5 * (1 + Math.cos(Math.PI * u)) : 1;
        pts.push((x0 + u * (x1 - x0)).toFixed(1) + ',' + (bottom - level * (bottom - top)).toFixed(1));
      }
      add('polygon', { points: x0 + ',' + bottom + ' ' + pts.join(' ') + ' ' + x1 + ',' + bottom, 'class': 'nbv-glyph__area' });
      add('polyline', { points: pts.join(' '), 'class': 'nbv-glyph__line' });
    }
    fig.appendChild(svg);
    fig.appendChild(el('span', 'nbv-glyph__label', UI.push));
    return fig;
  }

  function rowValueText(panel, row, k) {
    var axis = panel.axis;
    if (panel.mark === 'range') return fmt(row.range[0], axis) + '–' + fmt(row.range[1], axis);
    var text = fmt(row.values[k], axis);
    if (panel.mark === 'point' && row.ci) text += ' [' + fmt(row.ci[0], axis) + ', ' + fmt(row.ci[1], axis) + ']';
    return text;
  }

  function renderPanel(panel, tip) {
    var axis = panel.axis;
    var span = axis.max - axis.min;
    var base = axis.base != null ? axis.base : Math.max(axis.min, Math.min(axis.max, 0));
    function pos(v) { return ((v - axis.min) / span) * 100; }

    var wrap = el('div', 'nbv-panel');
    if (panel.title) wrap.appendChild(el('p', 'nbv-panel__title', t(panel.title)));
    var rows = el('div', 'nbv-rows');
    var n = panel.rows.length;

    var grid = el('div', 'nbv-grid');
    grid.style.gridRow = '1 / span ' + n;
    (axis.ticks || []).forEach(function (tick) {
      var line = el('span', 'nbv-grid__line' + (tick === base ? ' is-base' : ''));
      line.style.left = pos(tick) + '%';
      grid.appendChild(line);
    });
    (panel.refs || []).forEach(function (ref) {
      var p = pos(ref.value);
      var line = el('span', 'nbv-ref');
      line.style.left = p + '%';
      line.appendChild(el('span', 'nbv-ref__label' + (p > 66 ? ' is-right' : p < 20 ? ' is-left' : ''), t(ref.label)));
      grid.appendChild(line);
    });
    if (panel.refs && panel.refs.length) rows.classList.add('has-ref');
    rows.appendChild(grid);

    var series = panel.series || [null];
    panel.rows.forEach(function (row, i) {
      var label = el('div', 'nbv-label', t(row.label));
      label.style.gridRow = String(i + 1);
      var track = el('div', 'nbv-track');
      track.style.gridRow = String(i + 1);

      if (panel.mark === 'range') {
        var lo = pos(row.range[0]), hi = pos(row.range[1]);
        var rline = el('div', 'nbv-barline nbv-barline--thin');
        var seg = el('span', 'nbv-range');
        seg.style.left = lo + '%';
        seg.style.width = (hi - lo) + '%';
        rline.appendChild(seg);
        [lo, hi].forEach(function (p) {
          var dot = el('span', 'nbv-dot');
          dot.style.left = p + '%';
          rline.appendChild(dot);
        });
        var rval = el('span', 'nbv-val', rowValueText(panel, row, 0));
        rval.style.left = 'calc(' + hi + '% + 11px)';
        rline.appendChild(rval);
        bind(rline, tip, rowValueText(panel, row, 0), [t(row.label)]);
        track.appendChild(rline);
      } else if (panel.mark === 'point') {
        var pline = el('div', 'nbv-barline nbv-barline--thin');
        var end = pos(row.values[0]);
        if (row.ci) {
          var whisker = el('span', 'nbv-whisker');
          whisker.style.left = pos(row.ci[0]) + '%';
          whisker.style.width = (pos(row.ci[1]) - pos(row.ci[0])) + '%';
          pline.appendChild(whisker);
          end = Math.max(end, pos(row.ci[1]));
        }
        var pdot = el('span', 'nbv-dot');
        pdot.style.left = pos(row.values[0]) + '%';
        pline.appendChild(pdot);
        var pval = el('span', 'nbv-val', rowValueText(panel, row, 0));
        pval.style.left = 'calc(' + end + '% + 11px)';
        pline.appendChild(pval);
        bind(pline, tip, rowValueText(panel, row, 0), [t(row.label)]);
        track.appendChild(pline);
      } else {
        row.values.forEach(function (v, k) {
          var s = series[k];
          var tone = row.tone || (s && s.tone) || 'method';
          var a = pos(Math.min(base, v)), b = pos(Math.max(base, v));
          var line = el('div', 'nbv-barline');
          var bar = el('span', 'nbv-bar nbv-bar--' + tone + (v < base ? ' is-neg' : '') + (b - a < 0.35 ? ' is-zero' : ''));
          bar.style.left = a + '%';
          bar.style.width = (b - a) + '%';
          line.appendChild(bar);
          var text = rowValueText(panel, row, k);
          var extra = row.extra ? t(Array.isArray(row.extra) ? row.extra[k] : row.extra) : '';
          var val = el('span', 'nbv-val', text);
          if (v < base) {
            val.classList.add('is-neg');
            val.style.right = 'calc(' + (100 - a) + '% + 6px)';
          } else {
            val.style.left = 'calc(' + b + '% + 6px)';
          }
          line.appendChild(val);
          bind(line, tip, text, [s ? t(s.label) : null, t(row.label), extra]);
          track.appendChild(line);
        });
      }
      rows.appendChild(label);
      rows.appendChild(track);
    });

    var ax = el('div', 'nbv-axis');
    ax.style.gridRow = String(n + 1);
    var ticks = axis.ticks || [];
    var allInt = ticks.every(function (x) { return Math.round(x) === x; });
    ticks.forEach(function (tick) {
      var d = axis.tickDecimals != null ? axis.tickDecimals : (allInt ? 0 : 1);
      var label = el('span', 'nbv-axis__tick', fmt(tick, { suffix: axis.suffix, signed: false }, d));
      label.style.left = pos(tick) + '%';
      ax.appendChild(label);
    });
    rows.appendChild(ax);
    wrap.appendChild(rows);
    return wrap;
  }

  function panelTable(panel) {
    var table = el('table', 'nbv-table');
    if (panel.title) table.appendChild(el('caption', null, t(panel.title)));
    var head = el('tr');
    head.appendChild(el('th', null, UI.item));
    var series = panel.series || [null];
    series.forEach(function (s) { head.appendChild(el('th', null, s ? t(s.label) : UI.value)); });
    var thead = el('thead');
    thead.appendChild(head);
    table.appendChild(thead);
    var body = el('tbody');
    panel.rows.forEach(function (row) {
      var tr = el('tr');
      tr.appendChild(el('th', null, t(row.label)));
      series.forEach(function (s, k) { tr.appendChild(el('td', null, rowValueText(panel, row, k))); });
      body.appendChild(tr);
    });
    (panel.refs || []).forEach(function (ref) {
      var tr = el('tr');
      tr.appendChild(el('th', null, t(ref.label)));
      var td = el('td', null, fmt(ref.value, panel.axis));
      td.colSpan = series.length;
      tr.appendChild(td);
      body.appendChild(tr);
    });
    table.appendChild(body);
    return table;
  }

  function details(open, onToggle) {
    var d = el('details', 'nbv-details');
    d.open = open;
    d.appendChild(el('summary', null, UI.table));
    d.addEventListener('toggle', function () { onToggle(d.open); });
    return d;
  }

  function renderBars(root, spec) {
    var tip = makeTip(root);
    var body = el('div', 'nbv-body');
    var tableOpen = false;
    function show(i) {
      tip.hide();
      body.textContent = '';
      var view = spec.views[i];
      if (view.glyph) body.appendChild(glyph(view.glyph));
      var panels = view.panels || [];
      var legendPanel = panels.filter(function (p) { return p.series && p.series.length > 1; })[0];
      if (legendPanel) {
        var legend = el('ul', 'nbv-legend');
        legendPanel.series.forEach(function (s) {
          var li = el('li');
          li.appendChild(el('span', 'nbv-swatch nbv-bar--' + (s.tone || 'method')));
          li.appendChild(el('span', null, t(s.label)));
          legend.appendChild(li);
        });
        body.appendChild(legend);
      }
      panels.forEach(function (panel) { body.appendChild(renderPanel(panel, tip)); });
      if (view.verdict) {
        var v = el('p', 'nbv-verdict');
        v.appendChild(el('span', 'nbv-verdict__mark', VERDICT[view.verdict.tone] || ''));
        v.appendChild(el('span', null, t(view.verdict.text)));
        body.appendChild(v);
      }
      if (view.note) body.appendChild(el('p', 'nbv-note', t(view.note)));
      if (panels.length) {
        var d = details(tableOpen, function (open) { tableOpen = open; });
        panels.forEach(function (panel) { d.appendChild(panelTable(panel)); });
        body.appendChild(d);
      }
    }
    if (spec.views.length > 1) {
      var tabs = makeTabs(spec.views.map(function (v) { return t(v.label); }), show);
      root.appendChild(tabs.node);
      root.appendChild(body);
      tabs.select(0, false);
    } else {
      root.appendChild(body);
      show(0);
    }
  }

  function renderStrip(root, spec) {
    var tip = makeTip(root);
    var total = spec.parts.reduce(function (sum, p) { return sum + p.value; }, 0);
    var strip = el('div', 'nbv-strip');
    var legend = el('ul', 'nbv-legend');
    var table = el('table', 'nbv-table');
    var head = el('tr');
    [UI.item, UI.value, UI.share].forEach(function (h) { head.appendChild(el('th', null, h)); });
    var thead = el('thead');
    thead.appendChild(head);
    table.appendChild(thead);
    var tbody = el('tbody');
    spec.parts.forEach(function (part, i) {
      var share = (part.value / total) * 100;
      var shareText = share.toFixed(1) + '%';
      var seg = el('div', 'nbv-strip__part nbv-strip__part--' + i);
      seg.style.flexGrow = String(part.value);
      if (share >= 12) seg.appendChild(el('span', null, shareText));
      bind(seg, tip, count(part.value), [t(part.label), shareText]);
      strip.appendChild(seg);
      var li = el('li');
      li.appendChild(el('span', 'nbv-swatch nbv-strip__part--' + i));
      li.appendChild(el('span', null, t(part.label)));
      legend.appendChild(li);
      var tr = el('tr');
      tr.appendChild(el('th', null, t(part.label)));
      tr.appendChild(el('td', null, count(part.value)));
      tr.appendChild(el('td', null, shareText));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    root.appendChild(strip);
    root.appendChild(legend);
    if (spec.note) root.appendChild(el('p', 'nbv-note', t(spec.note)));
    var d = details(false, function () {});
    d.appendChild(table);
    root.appendChild(d);
  }

  function renderBoard(root, spec) {
    var list = el('ul', 'nbv-board');
    var tally = el('p', 'nbv-note nbv-board__tally');
    tally.setAttribute('aria-live', 'polite');
    var items = spec.rows.map(function (row) {
      var li = el('li', 'nbv-board__row');
      var main = el('div', 'nbv-board__main');
      main.appendChild(el('strong', null, t(row.name)));
      main.appendChild(el('span', null, t(row.rewards)));
      li.appendChild(main);
      var r = RESULT[row.result];
      var chip = el('div', 'nbv-board__result nbv-board__result--' + row.result);
      chip.appendChild(el('span', 'nbv-board__glyph', r.glyph));
      chip.appendChild(el('span', null, r[LANG]));
      li.appendChild(chip);
      li.appendChild(el('div', 'nbv-board__from', t(row.from)));
      list.appendChild(li);
      return li;
    });
    function show(i) {
      var key = i === 0 ? null : spec.tags[i - 1].key;
      var n = 0, up = 0, down = 0;
      spec.rows.forEach(function (row, k) {
        var on = !key || row.tags.indexOf(key) !== -1;
        items[k].classList.toggle('is-off', !on);
        if (!on) return;
        n++;
        if (row.result === 'higher' || row.result === 'slightly') up++; else down++;
      });
      tally.textContent = UI.tally(n, up, down);
    }
    var labels = [UI.all].concat(spec.tags.map(function (tag) { return t(tag.label); }));
    var tabs = makeTabs(labels, show, UI.filter);
    root.appendChild(tabs.node);
    root.appendChild(list);
    root.appendChild(tally);
    if (spec.note) root.appendChild(el('p', 'nbv-note', t(spec.note)));
    tabs.select(0, false);
  }

  function renderGrid(root, spec) {
    var body = el('div', 'nbv-body');
    function show(i) {
      body.textContent = '';
      var view = spec.views[i];
      var table = el('table', 'nbv-table nbv-table--grid');
      var head = el('tr');
      head.appendChild(el('th', null, t(spec.corner)));
      spec.columns.forEach(function (c) { head.appendChild(el('th', null, t(c))); });
      var thead = el('thead');
      thead.appendChild(head);
      table.appendChild(thead);
      var tbody = el('tbody');
      view.rows.forEach(function (row) {
        var tr = el('tr');
        tr.appendChild(el('th', null, t(row.label)));
        row.cells.forEach(function (cell) {
          var td = el('td', cell.strong ? 'is-strong' : null);
          if (cell.glyph) td.appendChild(el('span', 'nbv-board__glyph', cell.glyph));
          td.appendChild(el('span', null, t(cell.text)));
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
      if (view.note) body.appendChild(el('p', 'nbv-note', t(view.note)));
    }
    var tabs = makeTabs(spec.views.map(function (v) { return t(v.label); }), show);
    root.appendChild(tabs.node);
    root.appendChild(body);
    tabs.select(0, false);
  }

  var RENDER = { bars: renderBars, strip: renderStrip, board: renderBoard, grid: renderGrid };

  function init() {
    setLanguage();
    var nodes = document.querySelectorAll('.nb-chart[data-nb-chart]');
    Array.prototype.forEach.call(nodes, function (root) {
      var spec = DATA[root.getAttribute('data-nb-chart')];
      if (!spec || !RENDER[spec.type] || root.getAttribute('data-ready')) return;
      var fallback = root.textContent;
      try {
        root.textContent = '';
        var header = el('div', 'nbv-head');
        header.appendChild(el('p', 'nbv-title', t(spec.title)));
        if (spec.sub) header.appendChild(el('p', 'nbv-sub', t(spec.sub)));
        root.appendChild(header);
        RENDER[spec.type](root, spec);
        if (spec.source) root.appendChild(el('p', 'nbv-source', t(spec.source)));
        root.setAttribute('role', 'group');
        root.setAttribute('aria-label', t(spec.title));
        root.setAttribute('data-ready', 'true');
      } catch (error) {
        root.textContent = fallback;
        if (window.console) console.error('notebook chart failed:', root.getAttribute('data-nb-chart'), error);
      }
    });
  }

  // The language toggle swaps the article in place and asks for the new charts to be drawn.
  window.NotebookCharts = { render: init };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
