# Portable local preview

Package a scratch Jekyll build for local review. This does not build, commit, or publish.

```sh
python3 _tools/preview/package_preview.py /path/to/jekyll-output /path/to/preview-folder
python3 _tools/preview/check_svg.py /path/to/preview-folder/index.html
node _tools/preview/check_navigation.cjs /path/to/preview-folder/index.html
```

The serializer must close non-void self-closing elements explicitly. In SVG, `rect`, `path`, and `circle` are not HTML void tags; dropping their closing boundaries makes later map elements invisible descendants of a shape. The regression check validates nesting, not just the presence of 27 marker strings.

Life navigation resolves URLs before comparing paths and hashes, so `/#gti-mark-8` on the site and `index.html#gti-mark-8` in portable previews both work. Same-document clicks and browser history update the selected Life tab. The navigation check uses a mocked DOM and does not claim a browser screenshot check.

The preview can include an explicitly selected local draft from the scratch build. Never stage or publish these output folders, or infer publication authorization from a preview.
