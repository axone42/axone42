# SUIT Variable

- Upstream: https://github.com/sun-typeface/SUIT/tree/v2.0.5
- Original file: https://raw.githubusercontent.com/sun-typeface/SUIT/v2.0.5/fonts/variable/woff2/SUIT-Variable.woff2
- Version: 2.0.5, unmodified WOFF2, weight range 100–900.
- Copyright (c) 2022, SUNN (http://sun.fo/suit), with Reserved Font Name SUIT.
- License: SIL Open Font License 1.1; the complete notice is included in `OFL.txt`.

Self-hosted for consistent Korean, Latin, and numeric text across the site. `app/font-subset.css` defines both variable faces with disjoint Unicode ranges.

`AXONE-Web-Sans.woff2` is a subset generated from the original with `tooling/subset-font.py` and fontTools. It preserves the outlines and variable weight axis, covers characters in the application source, and retains the original copyright and OFL notices. Its internal family is renamed **AXONE Web Sans** to respect the reserved font name. It is also distributed under `OFL.txt`.

The root layout preloads only the subset. `app/font-subset.css` selects it using Unicode ranges; other characters, including user-entered text, load the complete original font on demand. Regenerate the subset after substantial content additions. New characters still render correctly without regeneration.
