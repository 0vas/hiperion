import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4318',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'tsx tests/e2e/start-server.ts',
    url: 'http://127.0.0.1:4318/api/health',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
