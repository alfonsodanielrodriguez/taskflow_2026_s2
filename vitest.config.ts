import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['contract-tests/**/*.test.ts'],
    // Los consumidores escriben el mismo Pact y usan fetch/localStorage globales.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
