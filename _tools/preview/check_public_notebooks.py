"""Publication guard: research notebooks expose qualitative prose, never experiment records."""
from pathlib import Path
from html.parser import HTMLParser
import json,re,sys
from urllib.parse import urlsplit,unquote
root=Path(sys.argv[1])
slugs=['research-notebook-2026-10-21-analogy-diversity','research-notebook-2026-10-22-hidden-state-interventions']
class HTML(HTMLParser):
 def __init__(self):super().__init__();self.hidden=0;self.text=[];self.refs=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t in ('script','style'):self.hidden+=1
  for key in ['href','src','data']:
   if key in a:self.refs.append(a[key])
 def handle_endtag(self,t):
  if t in ('script','style'):self.hidden=max(0,self.hidden-1)
 def handle_data(self,d):
  if not self.hidden:self.text.append(d)
for slug in slugs:
 s=(root/'en/blog'/slug/'index.html').read_text()
 # Remove markup and public literature URL identifiers before checking prose.
 content=re.search(r'<section class="page__content"[^>]*>([\s\S]*?)</section>',s).group(1)
 parsed=HTML();parsed.feed(content);text=' '.join(parsed.text)
 assert '<table' not in content and '<img' not in content and '<pre' not in content,slug
 if slug.endswith('hidden-state-interventions'):
  # Explicit user exception: only the named one-story visualization.
  assert 'one source story' in text and 'single-example view' in text,slug
  assert '<iframe' not in content and 'id="llama-plot"' in content,slug
  assert '/assets/research-notebook/2026-10-22/llama-data.js' in s,slug
  assert not any(model in s for model in ['Gemma-2','Qwen3','Mistral-7B','Phi-4-mini']),slug
  checked=text.replace('LLaMA 3.1','')
 else:checked=text
 assert not re.search(r'\d+\.\d+|\d+%|\bK\s*=|λ|LLaMA|AnaloBench|GPT-4o',checked),slug
 assert 'private notes' in text,slug
 assert 'status: draft' not in s
issues=[];pages=0
for p in root.rglob('*.html'):
 if 'assets' in p.relative_to(root).parts:continue
 parsed=HTML();parsed.feed(p.read_text());pages+=1
 assert not re.search(r'[\u3400-\u4dbf\u4e00-\u9fff]',' '.join(parsed.text)),p
 for ref in parsed.refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc or not u.path:continue
  target=root/unquote(u.path).lstrip('/') if u.path.startswith('/') else p.parent/unquote(u.path)
  if target.is_dir():target/='index.html'
  if not target.is_file():issues.append((str(p.relative_to(root)),ref))
assert not issues,issues
# Feed/search/index output must also be free of the withdrawn experiment detail.
for name in ['feed.xml','search.json','assets/js/lunr/lunr-store.js']:
 p=root/name
 if p.exists():
  assert not any(v in p.read_text() for v in ['10,881','0.3989','3.960','maximum-H10','3,511']),name
assert not (root/'Document').exists()
for name in ['_tools','Private','Public','AGENTS.md','sparkling-whiteboard.md']:
 assert not (root/name).exists(),name
print(json.dumps({'english_pages':pages,'notebook_privacy':'Notebook 01 qualitative only; Notebook 02 has the explicitly approved one-story visualization only','all_local_links':'passed','drafts_and_private_files':'excluded'}))
