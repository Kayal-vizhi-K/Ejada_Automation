import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',

  // Parallelism: every test (not just every file) can run in its own worker.
  fullyParallel: true,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : isCI ? 4 : undefined,

  forbidOnly: isCI,
  retries: isCI ? 2 : 2,
  timeout: 30_000,
  expect: { timeout: 7_000 },

  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: true }],
    ['html', { open: 'never' }],
  ],

  use: {
    testIdAttribute: 'data-test', // SauceDemo uses data-test attributes
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'], baseURL: env.uiBaseUrl },
    },
    {
      name: 'ui-firefox',
      testDir: './tests/ui',
      use: { ...devices['Desktop Firefox'], baseURL: env.uiBaseUrl },
    },
    {
      // No browser needed: pure HTTP tests through Playwright's APIRequestContext
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.apiBaseUrl },
    },

    
  ],
});
