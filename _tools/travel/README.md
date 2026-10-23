# Travel atlas data

Website redesign approved for publication by the user on 2026-10-23. Map contains approximate reference points, not visited addresses or travel routes. Recent places and years come from `_data/travel.yml`; no within-year order is implied. The user confirmed Charleston, West Virginia on 2026-10-23; all 43 recorded places are plotted.

- Land: Natural Earth `ne_110m_land.geojson`, public domain, equirectangular projection (x = lon + 180, y = 90 - lat). Generated SVG: `_includes/travel-land.svg`.
- Most city coordinates: Natural Earth `ne_10m_populated_places_simple.geojson` (match name and country; London is Ontario and Vancouver is British Columbia).
- Napa and Yosemite Valley reference: US Census 2024 California Gazetteer. Yosemite is a regional marker, not a claimed visit address.
- Lake Tahoe: polygon centroid of Natural Earth `ne_10m_lakes.geojson`.
- Niagara Falls: rounded regional coordinate, not a Canadian/US bank assertion.
- Sources: https://github.com/nvkelso/natural-earth-vector/tree/master/geojson ; https://www.naturalearthdata.com/about/terms-of-use/ ; https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_06.txt

No live tile service, API key, geocoding requests, or tracking is needed. Five existing photo notes are from 2023 and remain clearly dated in the separate earlier-notes section.

The user added Chicago, Nanning (Guangxi), Beijing, Tokyo and Seoul for 2026. East Asia view includes southern China.

2025 also includes Louisville, Atlanta, White Sulphur Springs (West Virginia, confirmed by the user) and Chattanooga. Repeated cities use one marker with multiple visit years. White Sulphur Springs coordinates use the 2024 US Census West Virginia Gazetteer.

2019 includes Siena, Rome and Florence, Italy. The atlas now also plots the previously recorded 2022/2023 places; Census gazetteers provide Cambridge, Malibu and Princeton reference points, and Natural Bridge is a rounded regional marker. All-years and earlier-year filters preserve the 2024–2026 view.
