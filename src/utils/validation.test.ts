import { describe, expect, it } from 'vitest';
import { validateMoney, validateNotGreater, validateRequired } from './validation';

describe('validation helpers', () => {
  it('validates required strings', () => {
    expect(validateRequired('', '客户').valid).toBe(false);
    expect(validateRequired('华东城建集团', '客户').valid).toBe(true);
  });

  it('validates non-negative money', () => {
    expect(validateMoney(-1, '金额').valid).toBe(false);
    expect(validateMoney(0, '金额').valid).toBe(true);
  });

  it('validates amount consistency', () => {
    expect(validateNotGreater(120, 100, '已收金额', '收入金额').valid).toBe(false);
    expect(validateNotGreater(80, 100, '已收金额', '收入金额').valid).toBe(true);
  });
});

