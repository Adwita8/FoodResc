import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('Authentication & Security Standards', () => {
  it('hashes passwords securely using bcrypt with appropriate salt rounds', async () => {
    const rawPassword = 'Password@123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const matches = await bcrypt.compare(rawPassword, hash);
    expect(matches).toBe(true);

    const invalidMatch = await bcrypt.compare('WrongPassword', hash);
    expect(invalidMatch).toBe(false);
  });

  it('generates reproducible cryptographic SHA-256 OTP hashes for physical handover', async () => {
    const crypto = await import('crypto');
    const otp = '482910';
    const hash1 = crypto.createHash('sha256').update(otp).digest('hex');
    const hash2 = crypto.createHash('sha256').update(otp).digest('hex');

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });
});
