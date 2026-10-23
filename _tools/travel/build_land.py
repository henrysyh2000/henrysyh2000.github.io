"""Generate the inline atlas silhouette from Natural Earth's ne_110m_land.geojson.
Usage: python3 _tools/travel/build_land.py /path/to/ne_110m_land.geojson
The input is public-domain geographic data; the output has no remote dependency.
"""
from pathlib import Path
import json
import sys

parts = []
for feature in json.loads(Path(sys.argv[1]).read_text())['features']:
    geometry = feature['geometry']
    polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
    for polygon in polygons:
        for ring in polygon:
            projected = [(lon + 180, 90 - lat) for lon, lat, *_ in ring]
            parts.append('M' + 'L'.join(f'{x:.2f},{y:.2f}' for x, y in projected) + 'Z')
output = Path(__file__).resolve().parents[2] / '_includes/travel-land.svg'
output.write_text('<g class="travel-atlas__land" fill-rule="evenodd" aria-hidden="true"><path d="' + ''.join(parts) + '"/></g>\n')
