# Maryam Maghareh — academic website

A responsive one-page academic website designed for GitHub Pages. It uses a WVU-inspired blue-and-gold palette, subtle pharmaceutical-science animation, full-viewport sections, and scroll-triggered reveals.

## Publish at `maryammaghareh`

1. On GitHub, create a **public** repository named `maryammaghareh` under the `SRasoulHosseini` account.
2. Upload everything in this folder to the repository root. `index.html` must remain at the top level.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. The site will appear at `https://srasoulhosseini.github.io/maryammaghareh/` after GitHub finishes deploying.

All site paths are relative, so the project works correctly at that address.

## Add the exact LinkedIn portrait

LinkedIn blocks automated retrieval, so the website currently tries a verified public academic-profile portrait and then an illustrated fallback.

For the exact, full-quality portrait, export the LinkedIn image as JPG, name it `maryam-portrait.jpg`, and place it in `assets/`. No HTML or CSS change is needed—the local image is already the first source the page loads.

Recommended crop: portrait orientation, at least 760 × 950 pixels, with the face centered in the upper half.

## Update content

- Edit text and links in `index.html`.
- Edit colors and layout variables at the top of `styles.css`.
- Motion and navigation behavior live in `script.js`.
- The page respects visitors’ reduced-motion preference automatically.

## Files

```text
maryammaghareh/
├── index.html
├── styles.css
├── script.js
├── README.md
└── assets/
    ├── favicon.svg
    ├── portrait-fallback.svg
    └── maryam-portrait.jpg  ← add the original portrait here
```
