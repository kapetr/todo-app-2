# todo-app-2

Simple todo app — TypeScript + React + Vite, deployed to GitHub Pages.

## Development

```
npm install
npm run dev
```

## Deployment

The app deploys to GitHub Pages via GitHub Actions on every push to `main`.

### Setup (one-time)

1. Go to **Settings → Pages** and set Source to **"GitHub Actions"**.
2. Add `.github/workflows/deploy.yml` with the content below (requires `workflow` scope).

### Workflow file

**`.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```