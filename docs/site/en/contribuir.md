# Contribute

<RepositoryCard />

Hyperion is independent and [MIT-licensed](https://github.com/0vas/hyperion/blob/main/LICENSE). Improvements must work without depending on a single AI provider.

## Prepare the project

For development, use Node.js 22.13 or newer:

```sh
git clone https://github.com/0vas/hiperion.git
cd hiperion
npm ci
npm run check
```

Define the expected behavior and a failing test first. Implement and verify the change. To use the app instead, see [your first workflow](./guia/primeros-pasos.md).

## Validate a contribution

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

Check both themes, keyboard navigation and narrow windows for visual changes. Keep shared protocol rules in `src/domain/`. Never commit `.hyperion/`, real responses, tokens or private traces. Use synthetic test data.

## Edit this site

```sh
npm --prefix docs/site ci
npm --prefix docs/site run dev
npm --prefix docs/site exec -- playwright install chromium
npm --prefix docs/site test
```

Spanish pages remain at `docs/site/`; English pages live under `en/` with matching paths so the language selector preserves the page. Translate navigation, search text and page content. Technical reference links may point to repository documents in their original language.

To add another language, create matching pages and register its locale and navigation in `.vitepress/config.mts`. Extend the page/link and accessibility tests. Keep limitations and installer versions consistent across translations.

Archify source and regeneration instructions live in [docs/architecture/archify](https://github.com/0vas/hyperion/tree/main/docs/architecture/archify). The viewer is generated from pinned source evidence. Brand assets live in `docs/site/public/brand/`.

VitePress is pinned in the lockfile. The site uses the version 2 preview and is checked separately from the application under the `/hyperion/` base path.

[Contribution rules](https://github.com/0vas/hyperion/blob/main/CONTRIBUTING.md) · [Security](https://github.com/0vas/hyperion/blob/main/SECURITY.md)
