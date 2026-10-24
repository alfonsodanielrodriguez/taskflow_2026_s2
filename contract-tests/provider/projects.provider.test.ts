import { it } from 'vitest';

it('la API real cumple los contratos de TaskFlowWeb', async () => {
  process.env.DATABASE_URL = 'file:./taskflow_test.db';
  process.env.JWT_SECRET = 'test-secret';
  const { verifyProvider } = await import('./verify');
  await verifyProvider();
}, 30000);
