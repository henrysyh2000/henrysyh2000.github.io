/* BGM player at the top of a notebook entry.
   Nothing is requested from the provider until the reader presses play. */
(function () {
  'use strict';

  var EMBED = {
    youtube: function (id) {
      return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
        '?autoplay=1&rel=0&playsinline=1';
    }
  };
  function words() {
    return /^zh/i.test(document.documentElement.lang || '') ? { play: '播放', stop: '停止' } : { play: 'Play', stop: 'Stop' };
  }

  function setup(root) {
    var embed = EMBED[root.getAttribute('data-provider')];
    var id = root.getAttribute('data-id');
    var button = root.querySelector('.nb-bgm__play');
    var frame = root.querySelector('.nb-bgm__frame');
    var titleNode = root.querySelector('.nb-bgm__title');
    if (!embed || !id || !button || !frame) return;
    var title = titleNode ? titleNode.textContent : 'BGM';

    function describe(open) {
      button.setAttribute('aria-label', (open ? words().stop : words().play) + ' ' + title);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    button.hidden = false;
    describe(false);
    button.addEventListener('click', function () {
      var open = root.classList.toggle('is-open');
      if (open) {
        var player = document.createElement('iframe');
        player.src = embed(id);
        player.title = title;
        player.allow = 'autoplay; encrypted-media; picture-in-picture';
        player.referrerPolicy = 'strict-origin-when-cross-origin';
        player.allowFullscreen = true;
        frame.appendChild(player);
      } else {
        frame.textContent = '';
      }
      frame.hidden = !open;
      describe(open);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.nb-bgm'), setup);
})();
