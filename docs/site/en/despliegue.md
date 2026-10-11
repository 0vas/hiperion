# Publish the documentation

GitHub Pages publishes this static site from `main` using `.github/workflows/pages.yml`.

## Automatic deployment

In **Settings → Pages → Build and deployment**, select **GitHub Actions**. Documentation changes pushed to `main` build and test the site, then deploy it. Pull requests only validate changes. Use **Run workflow** on **Documentation Pages** to redeploy manually.

The published artifact is `docs/site/.vitepress/dist`. It excludes local state, credentials and the Hyperion server. The deployment uses the `github-pages` environment with `pages: write` and `id-token: write` permissions.

## Languages and paths

Spanish remains at [the site root](https://0vas.github.io/hiperion/); English lives at [/en/](https://0vas.github.io/hiperion/en/). Matching page paths let the language selector retain your location. Both languages ship together.

The `base: '/hiperion/'` setting keeps links and assets working on Pages. For a differently named fork, also update favicon paths and test expectations.

## Verify before publishing

```sh
npm --prefix docs/site ci
npm --prefix docs/site exec -- playwright install chromium
npm --prefix docs/site test
```

Use `npm --prefix docs/site run preview` and open `http://127.0.0.1:4175/hiperion/` to inspect the output. If deployment fails, inspect **Documentation Pages** in Actions. Revert incorrect content and let the workflow republish.

References: [VitePress deployment](https://vitepress.dev/guide/deploy), [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
