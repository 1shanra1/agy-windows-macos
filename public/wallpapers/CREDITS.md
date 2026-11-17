# Halcyon OS — Wallpaper Credits

All wallpapers are real photographs from Wikimedia Commons under free licenses (no AI imagery). Resized to 2560px long edge (JPEG q82–84); thumbs at 320px in `thumbs/`. `meadow.jpg` is a 16:10 crop of the original (no color/retouch changes). CC BY / BY-SA require visible attribution — surface these lines in Desktop & Screen Saver prefs / About This Computer.

| File | Label | Subject | Author | License | Source |
|---|---|---|---|---|---|
| `meadow.jpg` (default) | Meadow | Vivid green pasture under deep-blue sky with white cumulus, Henley-on-Thames, England — cropped 16:10 (bottom 14% incl. photographer watermark removed, 5% sky top and 6.6% each side trimmed) | Scott Wylie (Flickr) | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Green_and_Blue_Landscape,_Henley-on-Thames.jpg |
| `golden.jpg` | Golden Hour | Palouse hills at golden hour from Steptoe Butte, May 2023 | Caleb Riston (User:FriendlyToaster) | CC0 | https://commons.wikimedia.org/wiki/File:PalouseFromSteptoeButteMay2023-1.jpg |
| `dusk.jpg` | Dusk | Milky Way arching over the Hooker Valley, New Zealand | Paul Stewart | CC0 | https://commons.wikimedia.org/wiki/File:Milky_Way_over_the_Hooker_valley.jpg |
| `coast.jpg` | Valley Fog | Rolling green hills with valley fog, Pleasanton/East Bay hills, California | Jay Huang (Flickr) | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Rolling_Hills_-_Flickr_-_Jaykhuang.jpg |

Attribution strings (ready to paste):
- "Green and Blue Landscape, Henley-on-Thames" by Scott Wylie, CC BY 2.0 (cropped)
- "Palouse from Steptoe Butte" by Caleb Riston, CC0
- "Milky Way over the Hooker Valley" by Paul Stewart, CC0
- "Rolling Hills" © Jay Huang, CC BY 2.0

Composition notes for implementers:
- `meadow` — 16:10 native (2560×1600). Bliss-like: green field bottom ~22%, treeline horizon ~78%; cumulus fills upper-left/center, deep blue at top-right behind menu bar. Use `object-fit: cover; object-position: center 60%`. Bright white clouds sit behind the left icon column — keep desktop-label text shadows on.
- `golden` — bright sun bloom at top-center sits under the menu bar; allow a 0–6% top darkening gradient only if menu-bar legibility needs it. Anchor `center 60%`.
- `dusk` — dark; use light desktop-label text (default). Anchor `center 40%` to keep the Milky Way arch.
- `coast` ("Valley Fog") — 2:1; `object-position: center 55%`. Busy by design — an alternate, not a default.
