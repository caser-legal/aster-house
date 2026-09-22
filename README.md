# Aster House

A self-contained responsive editorial landing page for a fictional members-only network of private creative residencies.

The application and newsletter interactions are interface demonstrations. They do not transmit data.

## Run your own copy

No build step and no hosted account are required.

1. Clone this repository.
2. Open `index.html` in a current browser, or serve the folder:

```sh
python3 -m http.server 4173
```

3. Edit `index.html`, `styles.css`, and `script.js` for your own copy. The house names in the page are fictional.

## Optional layout check

`verify.cjs` is an Electron script. It checks desktop, mobile, and 320px layouts, local assets, fragment links, control names, button sizes, the application dialog, and console errors. It can also refresh proof screenshots.

Install Electron yourself, then from this directory:

```sh
electron verify.cjs
```

Responsive JPEG derivatives are served through `srcset`. Original PNGs are source artwork.

## License

MIT. See LICENSE.
