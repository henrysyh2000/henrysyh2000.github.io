"""Package the explicitly approved, self-contained single-story visualization.

All original bytes, including Plotly data and model runtimes, are preserved.
Only a parent-frame height reporter is appended for the website embed.
"""
from pathlib import Path
import hashlib
import json
import sys
from html.parser import HTMLParser


class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.models = []
        self.external = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("type") == "application/x-model-runtime":
            self.models.append(attrs["id"])
        for key in ("src", "href"):
            if key in attrs:
                self.external.append(attrs[key])


source = Path(sys.argv[1]).read_bytes()
text = source.decode("utf-8")
scan = Scripts()
scan.feed(text)
assert scan.models == ["model-runtime-" + k for k in ("llama", "gemma", "qwen3", "mistral", "phi")]
assert not scan.external, "The approved artifact must remain self-contained."
assert text.count("One source story across five models.") == 1
assert "let selected='llama'" in text
assert not any(value in text for value in ("/Users/", "/home/", "file:///", "api_key", "max_new_tokens"))
reporter = b'''\n<script>
(() => {
  if (window.parent === window) return;
  const root = document.getElementById('lens-experiment-lab');
  if (!root) return;
  let previous = 0, pending;
  function report() {
    clearTimeout(pending);
    pending = setTimeout(() => {
      const height = Math.ceil(root.getBoundingClientRect().bottom + window.scrollY + 24);
      if (Math.abs(height - previous) < 3) return;
      previous = height;
      window.parent.postMessage({type: 'research-visualization-height', height}, '*');
    }, 80);
  }
  new ResizeObserver(report).observe(root);
  window.addEventListener('load', report);
  report();
})();
</script>\n'''
assert source.count(b'</body>') == 1
result = source.replace(b'</body>', reporter + b'</body>', 1)
assert result.replace(reporter, b'', 1) == source
destination = Path(sys.argv[2])
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_bytes(result)
print(json.dumps({"source_sha256": hashlib.sha256(source).hexdigest(),
                  "output_sha256": hashlib.sha256(result).hexdigest(),
                  "scope": "one source story; five existing model views; LLaMA default",
                  "data_transformations": "none; original artifact bytes preserved"}))
