import { defineConfig } from '@playwright/test';
import config from './playwright.config';
export default defineConfig({
  ...config,
  outputDir: 'test-results/webkit',
  use: { ...config.use, browserName: 'webkit' },
  grep: /ribbons retain|liquid current|compact decision|field hints|checklist numbers|SSE carries|boolean routes|revised future/,
});
