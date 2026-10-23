// Exercise Life navigation without browser access. This checks behavior, not pixels.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('function syncLocation'));
assert.ok(script, 'Navigation script is included');
function element(attrs = {}) {
  return { attrs, style: {}, listeners: {}, checked: false,
    getAttribute(k) { return this.attrs[k] ?? null; },
    setAttribute(k,v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(k,f) { this.listeners[k] = f; },
  };
}
function check(address, hrefPrefix, nativePage = '') {
  const toggle = element(), research = element(), life = element();
  const researchNav = element(), lifeNav = element();
  const tabs = ['travel','gti-mark-8'].map(n => Object.assign(element(),{id:'tab-'+n}));
  const links = ['travel','gti-mark-8'].map(n => element({href:hrefPrefix+'#'+n}));
  lifeNav.querySelectorAll = () => links;
  const selectors = { '.visible-links:not(.visible-links--life)':researchNav, '.visible-links--life':lifeNav, '.mode-content--research':research, '.mode-content--life':life };
  const document = { body:element({'data-life-page':nativePage}), listeners:{},
    getElementById:() => toggle, querySelector:s => selectors[s],
    querySelectorAll:s => s === '.life-tab' ? tabs : [],
    addEventListener(k,f) { this.listeners[k] = f; },
  };
  const window = { location:new URL(address), listeners:{},
    addEventListener(k,f) { this.listeners[k] = f; },
    history:{pushState(_a,_b,url) { window.location = new URL(url,window.location.href); }},
  };
  vm.runInNewContext(script,{document,window,URL,Number});
  function shown(name) {
    assert.equal(toggle.checked,true);
    if (nativePage === name) { assert.equal(research.style.display,''); assert.equal(life.style.display,'none'); }
    else { assert.equal(life.style.display,''); assert.equal(research.style.display,'none'); }
    assert.equal(tabs.find(t => t.id === 'tab-'+name).style.display,'');
    assert.equal(tabs.find(t => t.id !== 'tab-'+name).style.display,'none');
    assert.equal(links.find(l => l.attrs.href.endsWith('#'+name)).attrs['aria-current'],'page');
  }
  function click(index) {
    let prevented=false;
    lifeNav.listeners.click({target:{closest:()=>links[index]},button:0,preventDefault(){ prevented=true; }});
    return prevented;
  }
  if (window.location.hash || nativePage) shown(window.location.hash.slice(1) || nativePage);
  assert.ok(click(1),'same-page GTI navigation intercepted'); shown('gti-mark-8');
  assert.equal(window.location.hash,'#gti-mark-8');
  assert.ok(click(0),'same-page Travel navigation intercepted'); shown('travel');
  window.location.hash='#gti-mark-8'; window.listeners.hashchange(); shown('gti-mark-8');
  window.location.hash='#travel'; window.listeners.popstate(); shown('travel');
  toggle.checked=false; toggle.listeners.change();
  assert.equal(life.style.display,'none'); assert.equal(research.style.display,'');
  assert.equal(window.location.hash,'');
  toggle.checked=true; toggle.listeners.change(); shown('travel');
  return {window,lifeNav,links};
}
check('file:///tmp/preview/index.html#travel','index.html');
check('file:///tmp/preview/index.html#gti-mark-8','index.html');
check('https://henrysyh2000.github.io/#travel','/');
check('file:///tmp/preview/gti-ea888-en.html#gti-mark-8','gti-ea888-en.html','gti-mark-8');
// On an article page, home Life links should navigate normally to the homepage.
const state=check('file:///tmp/preview/gti-ea888-en.html#gti-mark-8','gti-ea888-en.html','gti-mark-8');
state.links[0].attrs.href='index.html#travel';
state.lifeNav.listeners.click({target:{closest:()=>state.links[0]},button:0,preventDefault(){throw Error('cross-page link should not be intercepted');}});
console.log('PASS: file/site URLs, Travel↔GTI, deep links, hash/history changes, toggle and article navigation. Mocked DOM; no visual browser check.');
