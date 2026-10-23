from pathlib import Path
from html.parser import HTMLParser
from html import escape
from urllib.parse import urlsplit,urlunsplit
import shutil,re,sys,json
source=Path(sys.argv[1])
out=Path(sys.argv[2])
origin='https://henrysyh2000.github.io'
routes={'/':'index.html','/publications/':'publications.html','/blog/':'blog.html','/en/blog/':'blog-en.html','/blog/columns/research-notebook/':'notebook.html','/en/blog/columns/research-notebook/':'notebook-en.html','/cv/':'cv.html','/life/gti/ea888-evo4/':'gti-ea888.html','/en/life/gti/ea888-evo4/':'gti-ea888-en.html'}
routes['/blog/research-notebook-2026-10-22-hidden-state-interventions/'] = 'diary-2026-10-22.html'
routes['/en/blog/research-notebook-2026-10-22-hidden-state-interventions/'] = 'diary-2026-10-22-en.html'
routes['/en/blog/research-notebook-2026-10-21-analogy-diversity/'] = 'diary-2026-10-21-en.html'
routes['/en/blog/smartcal/'] = 'smartcal.html'
routes['/SMARTCAL/'] = 'smartcal-redirect.html'
# Keep every rendered page in the local preview, including the new bilingual diary.
from hashlib import sha256
for entry in sorted(source.rglob('index.html')):
    rel=entry.parent.relative_to(source).as_posix()
    route='/' if rel=='.' else '/'+rel.strip('/')+'/'
    if route not in routes:
        name='preview-'+sha256(route.encode()).hexdigest()[:12]+'.html'
        routes[route]=name
void={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
assets=set()
class Portable(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=False);self.result=[]
 def handle_decl(self,s):self.result.append('<!'+s+'>')
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if tag=='meta' and attrs.get('http-equiv','').lower()=='refresh':
   match=re.fullmatch(r'(\s*\d+\s*;\s*url=)(.*)',attrs.get('content',''),re.I)
   if match:
    target=match.group(2)
    if target.startswith(origin):target=target[len(origin):] or '/'
    u=urlsplit(target)
    if u.path in routes:attrs['content']=match.group(1)+urlunsplit(('','',routes[u.path],u.query,u.fragment))
  for attr in ['href','src','data']:
   value=attrs.get(attr)
   if not value:continue
   if value.startswith(origin):value=value[len(origin):] or '/'
   u=urlsplit(value);path=u.path
   if path in routes:attrs[attr]=urlunsplit(('','',routes[path],u.query,u.fragment))
   elif path.startswith('/assets/'):
    src=source/path.lstrip('/')
    if src.is_file():
     dest=out/path.lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest);assets.add(path)
     attrs[attr]=urlunsplit(('','',path.lstrip('/'),u.query,u.fragment))
   elif value.startswith('/') and not value.startswith('//'):attrs[attr]=origin+value
  self.result.append('<'+tag+''.join(' '+k if v is None else ' '+({'viewbox':'viewBox','preserveaspectratio':'preserveAspectRatio'}.get(k,k))+'="'+escape(v,quote=True)+'"' for k,v in attrs.items())+'>')
  if tag=='head':self.result.append('<meta name="robots" content="noindex,nofollow">')
 def handle_startendtag(self,tag,attrs):
  # SVG shapes are not HTML void elements. Keep their explicit end tags so
  # following land paths and markers cannot become children of the water rect.
  self.handle_starttag(tag,attrs)
  self.handle_endtag(tag)
 def handle_endtag(self,tag):
  if tag not in void:self.result.append('</'+tag+'>')
 def handle_data(self,s):self.result.append(s)
 def handle_entityref(self,s):self.result.append('&'+s+';')
 def handle_charref(self,s):self.result.append('&#'+s+';')
 def handle_comment(self,s):self.result.append('<!--'+s+'-->')
out.mkdir(parents=True,exist_ok=True)
for route,name in routes.items():
 p=Portable();p.feed((source/route.lstrip('/')/'index.html').read_text());p.close();document=''.join(p.result)
 (out/name).write_text(document)
# Copy CSS font/image dependencies if they exist in the built site.
for path in list(assets):
 if path.endswith('.css'):
  for value in re.findall(r'url\([\'\"]?([^\)\'\"]+)',(source/path.lstrip('/')).read_text()):
   if value.startswith(('data:','https:','http:','//')):continue
   p=(source/path.lstrip('/')).parent/urlsplit(value).path
   if p.is_file():
    rel=p.resolve().relative_to(source.resolve());d=out/rel;d.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,d)
for name in routes.values():
 for url in re.findall(r'(?:href|src|data)="([^"]+)"',(out/name).read_text()):
  if url.startswith(('http:','https:','mailto:','#','data:','//')):continue
  assert (out/urlsplit(url).path).is_file(),(name,url)
assert re.search(r'<p class="home-intro__motto"><q>[^<]+</q></p>', (out/'index.html').read_text())
assert 'Lake Tahoe, CA' in (out/'index.html').read_text()
assert 'tab-snooker' not in (out/'index.html').read_text()
assert (out/'assets/pdf/Henry_Resume.pdf').is_file()
print(json.dumps({'pages':len(routes),'referenced_assets':len(assets),'output':str(out),'local_links':'passed'},ensure_ascii=False))
