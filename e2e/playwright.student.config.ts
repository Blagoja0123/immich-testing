import { defineConfig, devices } from '@playwright/test';
import { cpus } from 'node:os';

export const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

// A second, standalone Playwright config (separate from ./playwright.config.ts)
// for the mocked-network student test suite under src/project/. It
// deliberately does NOT share the main config's webServer, which boots the
// full docker-compose stack for every project (web/ui/maintenance) — these
// tests need none of that. The Immich web app is fully client-side rendered
// (`ssr = false` in web/src/routes/+layout.ts), so plain `vite dev` is
// enough: every /api/** call is intercepted and faked in src/project/mocks/.
export default defineConfig({
  testDir: './src/project/specs',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Capped well below cpu count: every worker is a full Chromium instance
  // hitting the SAME single-process `vite dev` server, which becomes the
  // bottleneck long before CPU does — a high worker count here just produces
  // flaky timeouts.
  workers: process.env.CI ? 2 : Math.min(4, cpus().length),
  reporter: 'html',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'project',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm --dir ../web dev',
    cwd: import.meta.dirname,
    url: baseURL,
    stdout: 'pipe',
    stderr: 'pipe',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
