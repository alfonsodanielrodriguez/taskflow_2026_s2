import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/accessibility',
  fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: 'security/results/accessibility.json' }]],
  use: { headless: true },
});
