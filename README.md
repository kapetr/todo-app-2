# todo-app-2

Simple todo app — TypeScript + React + Vite, deployed to GitHub Pages.

## Development

```
npm install
npm run dev
```

## Deployment

The app deploys to GitHub Pages via GitHub Actions on every push to `main`.

### Setup (one-time, requires `workflow` OAuth scope)

1. Go to **Settings → Pages** and set Source to **"GitHub Actions"**.
2. Add `.github/workflows/deploy.yml` with the content below — requires a token or PAT with the `workflow` scope.

```bash
# With a PAT that has workflow scope:
git clone https://github.com/kapetr/todo-app-2.git
cd todo-app-2
mkdir -p .github/workflows
# paste deploy.yml content below, then:
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy workflow"
git push
```

### Workflow file

**`.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
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
