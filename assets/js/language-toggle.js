/* EN / 中 toggle. Switching swaps the article in place, without a reload, using the same lens
   change as the Research / Life switch: the knob slides and stretches, a hairline sweeps the
   header, the article steps out and the other edition steps in. The player and the toggle are
   left untouched, so music keeps playing. Each edition keeps its own URL, and without
   JavaScript the toggle is a plain link to the other page. */
(function () {
  'use strict';

  var toggle = document.querySelector('a.lang-toggle');
  var wrap = document.querySelector('.page__inner-wrap');
  if (!toggle || !wrap || !window.fetch || !window.DOMParser || !window.history.pushState) return;

  var KEEP = '.nb-bgm, .lang-toggle-row, .llama-trajectory, link, script, style';
  var SECTION = 'section.page__content';
  var OUT = [{ opacity: 1, transform: 'none', filter: 'blur(0)' },
             { opacity: 0, transform: 'translateY(-4px)', filter: 'blur(3px)' }];
  var IN = [{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(3px)' },
            { opacity: 1, transform: 'none', filter: 'blur(0)' }];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var masthead = document.querySelector('.site-masthead');
  var editions = {};
  var busy = false;

  function currentLang() { return /^zh/i.test(document.documentElement.lang || '') ? 'zh' : 'en'; }
  function otherLang(lang) { return lang === 'zh' ? 'en' : 'zh'; }

  var paths = {};
  paths[currentLang()] = window.location.pathname;
  paths[otherLang(currentLang())] = new URL(toggle.href, window.location.href).pathname;

  function load(pathname) {
    if (!editions[pathname]) {
      editions[pathname] = fetch(pathname, { credentials: 'same-origin' })
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.text();
        })
        .then(function (html) { return new DOMParser().parseFromString(html, 'text/html'); })
        .catch(function (error) { delete editions[pathname]; throw error; });
    }
    return editions[pathname];
  }

  // Replace everything from the other edition except the player, the toggle and loaded assets,
  // which stay exactly where they are. Both editions come from the same template, so the kept
  // nodes line up one to one.
  function swapChildren(current, incoming) {
    var kept = [];
    Array.prototype.slice.call(current.children).forEach(function (node) {
      if (node.matches(KEEP) || node.matches(SECTION)) kept.push(node);
      else node.remove();
    });
    var next = 0;
    Array.prototype.forEach.call(incoming.children, function (node) {
      if (node.matches(SECTION) || node.matches(KEEP)) {
        var match = kept[next];
        if (!match || match.tagName !== node.tagName) throw new Error('editions differ in structure');
        if (node.matches(SECTION)) swapChildren(match, node);
        next += 1;
        return;
      }
      current.insertBefore(document.importNode(node, true), kept[next] || null);
    });
  }

  function render(doc, lang) {
    var incoming = doc.querySelector('.page__inner-wrap');
    if (!incoming) throw new Error('other edition has no article');
    swapChildren(wrap, incoming);

    var main = document.getElementById('main');
    Array.prototype.slice.call(document.querySelectorAll('#main > .page__related')).forEach(function (node) { node.remove(); });
    var related = doc.querySelector('#main > .page__related');
    if (main && related) main.appendChild(document.importNode(related, true));

    document.documentElement.lang = doc.documentElement.lang || (lang === 'zh' ? 'zh-CN' : 'en');
    document.title = doc.title;
    var article = wrap.closest('article');
    var incomingArticle = incoming.closest('article');
    if (article && incomingArticle) {
      if (incomingArticle.hasAttribute('lang')) article.setAttribute('lang', incomingArticle.getAttribute('lang'));
      else article.removeAttribute('lang');
    }

    var other = otherLang(lang);
    toggle.classList.toggle('is-zh', lang === 'zh');
    toggle.setAttribute('href', paths[other]);
    toggle.setAttribute('hreflang', other === 'zh' ? 'zh-CN' : 'en');
    toggle.setAttribute('aria-label', other === 'zh' ? '阅读中文版' : 'Read this entry in English');

    if (window.NotebookCharts) window.NotebookCharts.render();
  }

  function parts() {
    return Array.prototype.filter.call(wrap.children, function (node) { return !node.matches(KEEP); })
      .concat(Array.prototype.slice.call(document.querySelectorAll('#main > .page__related')));
  }
  function replay(element, className) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(function () { element.classList.remove(className); }, 800);
  }

  function show(lang, push) {
    if (busy || lang === currentLang()) return;
    busy = true;
    var pathname = paths[lang];
    var animated = !reduceMotion.matches && typeof wrap.animate === 'function';
    var leaving = [];
    var stepOut = Promise.resolve();
    toggle.classList.toggle('is-zh', lang === 'zh');
    if (animated) {
      replay(toggle, 'is-switching');
      replay(masthead, 'is-sweeping');
      leaving = parts().map(function (part) {
        return part.animate(OUT, { duration: 170, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
      });
      stepOut = new Promise(function (resolve) { window.setTimeout(resolve, 170); });
    }
    Promise.all([load(pathname), stepOut]).then(function (results) {
      render(results[0], lang);
      leaving.forEach(function (animation) { animation.cancel(); });
      if (push) window.history.pushState({ lang: lang }, '', pathname);
      if (animated) {
        parts().forEach(function (part) {
          part.animate(IN, { duration: 440, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
        });
      }
      busy = false;
    }).catch(function () {
      window.location.href = pathname; // anything unexpected: fall back to the plain link
    });
  }

  toggle.addEventListener('click', function (event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    show(otherLang(currentLang()), true);
  });

  // Back and forward move between the two editions without a reload as well.
  window.addEventListener('popstate', function () {
    var pathname = window.location.pathname;
    if (pathname === paths.zh) show('zh', false);
    else if (pathname === paths.en) show('en', false);
  });

  // Fetch the other edition ahead of time so the switch is immediate.
  var warm = function () { load(paths[otherLang(currentLang())]).catch(function () {}); };
  if (window.requestIdleCallback) window.requestIdleCallback(warm);
  else window.setTimeout(warm, 600);
})();
