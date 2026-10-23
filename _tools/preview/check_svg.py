"""Check the SVG nesting regression in packaged HTML, not just tag counts."""
from pathlib import Path
import re
import json
import sys
import xml.etree.ElementTree as ET

for name in sys.argv[1:]:
    text = Path(name).read_text()
    match = re.search(r'<svg class="travel-atlas__map"[\s\S]*?</svg>', text)
    assert match, name
    # HTML permits boolean data attributes; XML parsing needs an explicit value.
    markup = re.sub(r'\bdata-travel-map(?=[\s>])', 'data-travel-map=""', match.group())
    root = ET.fromstring(markup)
    assert root.attrib['viewBox'] == '0 5 360 170'
    water = root.find("rect[@class='travel-atlas__water']")
    assert water is not None and len(water) == 0, 'Background must not contain map parts'
    land = root.find("g[@class='travel-atlas__land']")
    assert land is not None and len(land) == 1 and land[0].tag == 'path'
    assert len(land[0].attrib['d']) > 50000
    pins = root.findall("g[@class='travel-atlas__pin']")
    locations = json.loads(re.search(r'<script type="application/json" data-travel-locations>(.*?)</script>', text, re.S).group(1))
    assert len(pins) == len(locations), 'Markers must be direct SVG children'
    for pin in pins:
        assert len(pin.findall('circle')) == 3
        assert all(len(circle) == 0 for circle in pin.findall('circle'))
    print(f'PASS: standalone land, empty background, {len(pins)} sibling markers and {len(pins)*3} independent circles:', name)
