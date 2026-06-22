import { describe, expect, it } from 'vitest';
import {
  calcBudgetUsageRate,
  calcCashBalance,
  calcCollectionRate,
  calcGrossMargin,
  calcMonthProfit,
  calcPaymentRate,
  calcSafeDays,
  calcUncollected,
  calcUnpaid,
} from './calculations';
import type { BudgetRecord, ExpenseRecord, IncomeRecord, PayableRecord, ReceivableRecord } from '@/types';

describe('financial calculations', () => {
  it('calculates monthly profit and gross margin', () => {
    const incomes = [
      { amount: 100 },
      { amount: 50 },
    ] as IncomeRecord[];
    const expenses = [
      { amount: 40 },
      { amount: 10 },
    ] as ExpenseRecord[];

    expect(calcMonthProfit(incomes, expenses)).toBe(100);
    expect(calcGrossMargin(incomes, expenses)).toBeCloseTo(66.666, 2);
  });

  it('calculates receivable and payable balances', () => {
    expect(calcUncollected({ amount: 80, collected: 30 } as ReceivableRecord)).toBe(50);
    expect(calcUnpaid({ amount: 70, paid: 20 } as PayableRecord)).toBe(50);
  });

  it('calculates rates with zero guards', () => {
    expect(calcCollectionRate({ amount: 0, collected: 0 } as ReceivableRecord)).toBe(0);
    expect(calcPaymentRate({ amount: 100, paid: 25 } as PayableRecord)).toBe(25);
    expect(calcBudgetUsageRate({ budgetAmount: 200, usedAmount: 150 } as BudgetRecord)).toBe(75);
  });

  it('calculates cash balance and safe days', () => {
    expect(calcCashBalance(100, 50, 70)).toBe(80);
    expect(calcSafeDays(486.8, 12.8)).toBe(38);
    expect(calcSafeDays(100, 0)).toBe(999);
  });
});

