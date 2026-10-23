# EA888 piston teaching figure

This is an original teaching reconstruction, not Volkswagen CAD or a production drawing. The supplied SSP illustration is a structural reference. No OEM artwork is copied into the website.

- `model.mjs` drives every crank angle and piston-position readout. Stroke is 92.8 mm. The 144 mm rod length is a scoped Audi evo4 research-engine reference, not a verified Canadian 2024 GTI part match.
- All exterior dimensions, cylinder spacing, ring geometry and numerical drawing clearances are illustrative. They are **not manufacturing tolerances or service limits**.
- Three functional ring groups illustrate a common architecture, not an identified GTI ring part number. The oil-ring group has multiple visible pieces.
- The cooling-gallery view is a quarter-section teaching reconstruction. Gold marks cavity space. The lifting section is an explanatory device, not a removable piston lid or a workshop procedure. It does not identify this GTI's piston.
- This is kinematics, not a four-stroke combustion, force, thermal or real-RPM simulation. An 8-second revolution is a demonstration speed.

From the repository root:

```sh
node _tools/gti/pistons/build-order.mjs
node _tools/gti/pistons/verify-model.mjs
node _tools/gti/pistons/build.mjs --audit
node _tools/gti/pistons/prepare_english.mjs
```

The build uses the locally installed Anatomy skill. It writes the self-contained `assets/gti/ea888-pistons.html` and static SVG. The website artifact is prepared in English with `prepare_english.mjs`; `?embed=1` removes the standalone introduction. The bilingual source runtime and existing Obsidian copy remain available for local Chinese reading. Reduced motion disables autoplay while keeping manual controls.

`order.json` stores sampled true-shape painter orders (360 integer crank angles and 101 separation states). These are sampled checks, not a mathematical proof between samples. An assembled-pose Anatomy audit, analytical joint checks, SVG renders and DOM simulation supplement them. Browser screenshot and browser line-end checks were unavailable in this session; do not describe them as passed.

The user approved website publication on 2026-10-23. No community upload or recurring task is authorized. Subsequent content revisions still require a new publication request.
