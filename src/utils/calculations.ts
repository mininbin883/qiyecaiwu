import type { IncomeRecord, ExpenseRecord, ReceivableRecord, PayableRecord, BudgetRecord, CashflowForecast } from '@/types';
import { getIncomes, getExpenses, getReceivables, getPayables, getBudgets, getCashflow } from '@/data/mockData';

// 1. 本月利润 = 本月收入 - 本月支出
export function calcMonthProfit(incomes: IncomeRecord[], expenses: ExpenseRecord[]): number {
  const totalIncome = incomes.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenses.reduce((sum, r) => sum + r.amount, 0);
  return totalIncome - totalExpense;
}

// 2. 未收金额 = 应收金额 - 已收金额
export function calcUncollected(receivable: ReceivableRecord): number {
  return receivable.amount - receivable.collected;
}

// 3. 未付金额 = 应付金额 - 已付金额
export function calcUnpaid(payable: PayableRecord): number {
  return payable.amount - payable.paid;
}

// 4. 回款完成率
export function calcCollectionRate(receivable: ReceivableRecord): number {
  if (receivable.amount === 0) return 0;
  return (receivable.collected / receivable.amount) * 100;
}

// 5. 付款完成率
export function calcPaymentRate(payable: PayableRecord): number {
  if (payable.amount === 0) return 0;
  return (payable.paid / payable.amount) * 100;
}

// 6. 预算使用率
export function calcBudgetUsageRate(budget: BudgetRecord): number {
  if (budget.budgetAmount === 0) return 0;
  return (budget.usedAmount / budget.budgetAmount) * 100;
}

// 7. 现金余额 = 当前可用资金 + 预计流入 - 预计流出
export function calcCashBalance(currentBalance: number, inflow: number, outflow: number): number {
  return currentBalance + inflow - outflow;
}

// 8. 资金安全天数 = 当前可用资金 / 日均支出金额
export function calcSafeDays(currentBalance: number, dailyExpense: number): number {
  if (dailyExpense <= 0) return 999;
  return Math.floor(currentBalance / dailyExpense);
}

// 9. 毛利率 = 本月利润 / 本月收入 × 100%
export function calcGrossMargin(incomes: IncomeRecord[], expenses: ExpenseRecord[]): number {
  const totalIncome = incomes.reduce((sum, r) => sum + r.amount, 0);
  if (totalIncome === 0) return 0;
  const profit = calcMonthProfit(incomes, expenses);
  return (profit / totalIncome) * 100;
}

// 10. 费用率 = 本月支出 / 本月收入 × 100%
export function calcExpenseRatio(incomes: IncomeRecord[], expenses: ExpenseRecord[]): number {
  const totalIncome = incomes.reduce((sum, r) => sum + r.amount, 0);
  if (totalIncome === 0) return 0;
  const totalExpense = expenses.reduce((sum, r) => sum + r.amount, 0);
  return (totalExpense / totalIncome) * 100;
}

// 获取总应收
export function getTotalReceivables(): number {
  return getReceivables().reduce((sum, r) => sum + r.amount, 0);
}

// 获取总应付
export function getTotalPayables(): number {
  return getPayables().reduce((sum, r) => sum + r.amount, 0);
}

// 获取本月收入总和
export function getTotalIncome(): number {
  return getIncomes().reduce((sum, r) => sum + r.amount, 0);
}

// 获取本月支出总和
export function getTotalExpense(): number {
  return getExpenses().reduce((sum, r) => sum + r.amount, 0);
}

// 获取逾期应收
export function getOverdueReceivables(): ReceivableRecord[] {
  return getReceivables().filter(r => r.overdueDays > 0);
}

// 获取逾期应收总额
export function getOverdueTotal(): number {
  return getOverdueReceivables().reduce((sum, r) => sum + r.amount, 0);
}

// 获取30天内应付
export function getPayable30Days(): number {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return getPayables()
    .filter(p => {
      const dueDate = new Date(p.dueDate);
      return dueDate <= thirtyDaysLater && p.status !== '已付款';
    })
    .reduce((sum, p) => sum + (p.amount - p.paid), 0);
}

// 获取资金安全天数
export function getSafeDaysCalc(): number {
  const balance = 486.8; // 当前可用资金
  const dailyExpense = 12.8; // 日均支出
  return calcSafeDays(balance, dailyExpense);
}

// 获取超预算部门数量
export function getOverBudgetDeptCount(): number {
  return getBudgets().filter(b => calcBudgetUsageRate(b) >= 100).length;
}

// 获取高风险应收数量
export function getHighRiskReceivableCount(): number {
  return getReceivables().filter(r => r.riskLevel === 'high').length;
}

// 获取高风险事项数量
export function getHighRiskCount(): number {
  const risks = [
    { level: 'high' as const },
    { level: 'high' as const },
    { level: 'medium' as const },
  ];
  return risks.filter(r => r.level === 'high').length;
}
