# Maryam Maghareh — Pharmaceutical Sciences

A personal research website for **https://maryammaghareh.github.io/**.

The design connects Maryam’s pharmacy training, research in neurovascular injury,
and earlier work on drug-delivery systems. WVU blue (#002855) and gold (#eaaa00)
anchor an editorial layout and three original, conceptual scientific illustrations.
The illustrations are not experimental results or anatomically complete models.

## Preview

Open `index.html` in a browser. No install or build is needed to view the delivered
site. To serve it locally, run `python3 -m http.server 8000` in this folder, then
open http://localhost:8000.

## Update the GitHub Pages website

1. Extract this ZIP on your computer.
2. Open the **maryammaghareh / maryammaghareh.github.io** repository on GitHub.
3. Choose **Add file → Upload files**. Upload the extracted contents into the
   repository root, preserving the `assets` and `tools` folders. Do not upload
   the ZIP itself or place everything inside a new enclosing folder.
4. Commit the changes to the branch used by GitHub Pages.
5. Under **Settings → Pages**, confirm that Pages publishes from that branch’s
   root. Wait for its deployment to complete, then reload the website.

This package does not make a live deployment or modify your repository for you.

## Files and maintenance

- `index.html`: content, inline illustrations, metadata, and generated inline CSS/JS.
- `styles.css`: editable stylesheet source.
- `script.js`: editable interaction source.
- `assets/Maryam_Maghareh_CV.pdf`: the supplied five-page CV, copied unchanged.
- `assets/favicon.svg`: custom MM mark.
- `tools/build.py`: synchronizes CSS/JS source into `index.html`.
- `tools/validate.py`: checks the package’s links, document, and build consistency.
- `tools/check-interactions.cjs`: checks interaction logic with Node’s built-in APIs.
- `.nojekyll`: allows the static files to be served directly by GitHub Pages.

Edit content directly in `index.html`. After editing `styles.css` or `script.js`,
run `python3 tools/build.py`, then upload the updated `index.html` and the source
files. Embedding the styles and interactions prevents stale or missed separate
uploads from breaking the layout. The source files remain available for maintenance.

Run `python3 tools/validate.py` and `node tools/check-interactions.cjs` after changes.
These checks do not replace browser layout and accessibility testing.

## Content and assets

Content follows the supplied updated CV. Her PhD is explicitly marked **in
progress**; her BS and PharmD are completed. All seven publication links from the
previous website are preserved. Those destinations could not be checked live in
the editing environment. The current email comes from her CV.

The old package had no local portrait; its remote image was unavailable. This
version uses the original scientific artwork as the opening visual. A supplied
portrait can be integrated later without relying on LinkedIn or ResearchGate
image hosting. No substitute portrait has been created.

## Interaction and accessibility

- Native anchor scrolling; no scroll snapping or wheel interception.
- Sticky navigation, measured header offsets, and a reading progress line.
- Keyboard-accessible research tabs (arrow keys, Home, End).
- A motion pause button; system reduced-motion settings disable animation.
- Illustrations pause when offscreen, while printing, or in a hidden browser tab.
- Content is visible with JavaScript disabled; animation is an optional enhancement.
- No analytics, cookies, third-party scripts, external fonts, or remote image dependencies.
- A print stylesheet is included; download the original CV for a complete CV layout.

This is an independent personal website, not an official WVU website.
