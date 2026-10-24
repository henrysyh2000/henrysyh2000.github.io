"""Extract only the LLaMA sample, preserving all trace arrays and tokens."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib, html, json, re, sys

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(); self.scripts=[]; self.active=False
    def handle_starttag(self,tag,attrs):
        if tag=='script':self.active=True;self.attrs=dict(attrs);self.parts=[]
    def handle_data(self,text):
        if self.active:self.parts.append(text)
    def handle_endtag(self,tag):
        if tag=='script':self.scripts.append((self.attrs,''.join(self.parts)));self.active=False

source=Path(sys.argv[1]).read_bytes();text=source.decode('utf-8');repo=Path(sys.argv[2])
scan=Scripts();scan.feed(text)
library=next(s for a,s in scan.scripts if 'plotly.js v4.0.0' in s)
runtime=next(s for a,s in scan.scripts if a.get('id')=='model-runtime-llama')
decoder=json.JSONDecoder();tail=runtime.split('Plotly.newPlot(',1)[1].lstrip();args=[]
for i in range(4):
    value,end=decoder.raw_decode(tail);args.append(value);tail=tail[end:].lstrip()
    if i<3:
        assert tail.startswith(',');tail=tail[1:].lstrip()
tokens=decoder.raw_decode(runtime.split('var TOKENS = ',1)[1])[0]
panel=text.split('id="model-card-llama"',1)[1].split('data-model="gemma"',1)[0]
sentences=[html.unescape(re.sub('<[^>]*>','',s)) for s in re.findall(r'<p>(.*?)</p>',panel,re.S)[:2]]
payload={'model':'Llama-3.1-8B-Instruct','layers':32,'tokens':tokens,'data':args[1],'layout':args[2],'config':args[3],
         'source_story':"Don't judge people based on appearances alone; appearances can be deceptive.",
         'analogy':sentences[0],'literal':sentences[1]}
assert len(tokens)==26 and len(payload['data'])==12+4*26+4*32
encoded=json.dumps(payload,ensure_ascii=True,separators=(',',':'))
assert not any(s in encoded for s in ('Gemma-2-','Qwen3-8B','Mistral-7B','Phi-4-mini','/Users/','/home/','api_key'))
outputs={repo/'assets/js/plotly-4.0.0.min.js':library,
         repo/'assets/research-notebook/2026-10-22/llama-data.js':'window.HenryLlamaExample = '+encoded+';\n'}
for path,content in outputs.items():path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content)
print(json.dumps({'source_sha256':hashlib.sha256(source).hexdigest(),'scope':'one source story; LLaMA only','traces':len(payload['data']),'plotted_data':'unchanged','library_sha256':hashlib.sha256(library.encode()).hexdigest()}))
