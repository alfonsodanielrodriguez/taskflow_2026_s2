import bcrypt from 'bcryptjs';
import { db } from '../src/lib/db';
import * as service from '../src/modules/auth/auth.service';

describe('Caracterización de la política de auth (d7c2320)', () => {
  afterEach(() => jest.restoreAllMocks());
  it('usa bcrypt con costo 10 al registrar y restablecer la contraseña', async () => {
    const email = 'policy-hash@test.com';
    await service.register({ email, password: 'Password1' });
    const before = await db.user.findUniqueOrThrow({ where: { email } });
    expect(bcrypt.getRounds(before.passwordHash)).toBe(10);
    const { token } = await service.forgotPassword({ email });
    await service.resetPassword({ token, newPassword: 'Password2' });
    const after = await db.user.findUniqueOrThrow({ where: { email } });
    expect(bcrypt.getRounds(after.passwordHash)).toBe(10);
    expect(await bcrypt.compare('Password2', after.passwordHash)).toBe(true);
  });
  it('bloquea al quinto fallo por 15 minutos y permite entrar al expirar', async () => {
    const email = 'policy-lock@test.com';
    await service.register({ email, password: 'Password1' });
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    for (let attempt = 1; attempt <= 5; attempt++) {
      await expect(service.login({ email, password: 'Wrongpass1' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
      const user = await db.user.findUniqueOrThrow({ where: { email } });
      expect(user.failedAttempts).toBe(attempt);
      expect(user.lockedUntil?.getTime() ?? null).toBe(attempt < 5 ? null : now + 15 * 60 * 1000);
    }
    jest.spyOn(Date, 'now').mockReturnValue(now + 15 * 60 * 1000 - 1);
    await expect(service.login({ email, password: 'Password1' })).rejects.toMatchObject({ message: expect.stringContaining('locked') });
    jest.spyOn(Date, 'now').mockReturnValue(now + 15 * 60 * 1000);
    await expect(service.login({ email, password: 'Password1' })).resolves.toHaveProperty('token');
  });
  it('genera tokens de 24 bytes hexadecimales con vigencia de una hora', async () => {
    const email = 'policy-token@test.com';
    await service.register({ email, password: 'Password1' });
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const { token } = await service.forgotPassword({ email });
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    const record = await db.passwordResetToken.findUniqueOrThrow({ where: { token } });
    expect(record.expiresAt.getTime()).toBe(now + 60 * 60 * 1000);
  });
});
