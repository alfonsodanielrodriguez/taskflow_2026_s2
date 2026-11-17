import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5173', timezoneId: process.env.TZ ?? 'America/Montevideo', trace: 'on', browserName: 'chromium' },
  webServer: [
    { command: 'node tests/e2e/prepare.cjs && npm --prefix server exec -- prisma migrate deploy --schema server/prisma/schema.prisma && npm --prefix server run dev', url: 'http://127.0.0.1:3000/api/health', env: { DATABASE_URL: 'file:./e2e.db', TZ: process.env.TZ ?? 'America/Montevideo' }, reuseExistingServer: false, timeout: 120000 },
    { command: 'npm --prefix client run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: false },
  ],
});
