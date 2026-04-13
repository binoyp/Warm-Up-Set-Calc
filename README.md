# Warmup Calculator

Powerlifting warm-up set calculator with plate math and progressive loading.

## Deploy to GitHub Pages

### 1. Create a GitHub repo

```bash
cd warmup-calc
git init
git add .
git commit -m "initial commit"
git remote add origin git@github.com:YOUR_USERNAME/warmup-calc.git
git push -u origin main
```

### 2. Enable GitHub Pages

Go to your repo → **Settings** → **Pages** → under **Source**, select **GitHub Actions**.

That's it. The included workflow (`.github/workflows/deploy.yml`) will build and deploy automatically on every push to `main`.

Your site will be live at: `https://YOUR_USERNAME.github.io/warmup-calc/`

### Custom domain (optional)

If you want to use your own domain instead of `github.io`:

1. In repo Settings → Pages → Custom domain, enter your domain
2. Change `base` in `vite.config.js` from `'/warmup-calc/'` to `'/'`
3. Push — the workflow redeploys automatically

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # output in dist/
```

## Offline Cache + Chrome Install

This app is now configured as a Progressive Web App (PWA):

- A service worker caches app assets for offline/local use after first load.
- A web app manifest enables installability in Chrome.
- The UI shows an "Install in Chrome" button when Chrome fires the install prompt event.

To test locally:

1. Build and preview:

```bash
npm run build
npm run preview
```

2. Open the preview URL in Chrome.
3. Use the in-app install button, or Chrome's address-bar install option.
4. After first load, you can reload while offline and the app shell should still open.
