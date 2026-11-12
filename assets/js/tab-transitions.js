/* Direction for the tab slide (styles in assets/css/tab-transitions.css).
   Loaded in <head> without defer so the arriving page knows the direction before its first frame. */
(function () {
  'use strict';

  var KEY = 'tab-direction';
  var root = document.documentElement;

  function tabLinks() {
    return Array.prototype.slice.call(
      document.querySelectorAll('.site-nav .visible-links:not(.visible-links--life) a'));
  }
  function tabOf(pathname) {
    var links = tabLinks();
    for (var i = 0; i < links.length; i += 1) {
      if (new URL(links[i].href, window.location.href).pathname === pathname) return i;
    }
    return -1;
  }
  function currentTab() {
    var links = tabLinks();
    for (var i = 0; i < links.length; i += 1) {
      if (links[i].getAttribute('aria-current') === 'page') return i;
    }
    return tabOf(window.location.pathname);
  }
  function forget() {
    try { window.sessionStorage.removeItem(KEY); } catch (error) { /* storage unavailable */ }
  }
  function clear() { root.removeAttribute('data-tab-direction'); }

  // Leaving a page: slide only when the destination is another header tab.
  window.addEventListener('pageswap', function (event) {
    if (!event.viewTransition) { forget(); return; }
    var direction = null;
    try {
      var target = tabOf(new URL(event.activation.entry.url).pathname);
      var from = currentTab();
      if (target >= 0 && from >= 0 && target !== from) direction = target > from ? 'forward' : 'back';
    } catch (error) { /* no activation info: treat as an ordinary navigation */ }
    if (!direction) {
      forget();
      event.viewTransition.skipTransition();
      return;
    }
    try { window.sessionStorage.setItem(KEY, direction); } catch (error) { /* storage unavailable */ }
  });

  // Arriving: pick the direction up; without one this was not a tab change, so no transition.
  window.addEventListener('pagereveal', function (event) {
    var direction = null;
    try { direction = window.sessionStorage.getItem(KEY); } catch (error) { /* storage unavailable */ }
    forget();
    if (!event.viewTransition) return;
    if (direction !== 'forward' && direction !== 'back') {
      event.viewTransition.skipTransition();
      return;
    }
    root.setAttribute('data-tab-direction', direction);
    event.viewTransition.finished.then(clear, clear);
    window.setTimeout(clear, 1500);
  });

  // Tabs that switch inside one page (the Life tabs) slide the same way.
  window.tabSlide = function (direction, update) {
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || still) { update(); return; }
    // The switch itself must never wait on a frame that is not coming (a page that is not being painted).
    var done = false;
    var once = function () { if (!done) { done = true; update(); } };
    root.setAttribute('data-tab-direction', direction);
    document.startViewTransition(once).finished.then(clear, clear);
    window.setTimeout(once, 500);
    window.setTimeout(clear, 1500);
  };
})();
