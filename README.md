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
