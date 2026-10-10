import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  outputDir: '../../test-results/docs',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4175/hiperion/',
    reuseExistingServer: false,
  },
});
