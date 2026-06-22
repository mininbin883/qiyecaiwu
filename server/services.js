import {
  appendAuditLog,
  getCollection,
  recordBudgetUsage,
  setCollection,
  upsertCollectionRecord,
} from './db.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days) {
  return new Date(Date.now() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

function sample(collectionName) {
  return (getCollection(collectionName) ?? [])[0];
}

function upsertById(items, item) {
  const index = items.findIndex((current) => current.id === item.id);
  if (index === -1) return [...items, item];
  return items.map((current) => (current.id === item.id ? item : current));
}

export function syncIncomeToReceivable(income, user) {
  const unpaid = Math.max(0, Number(income.amount) - Number(income.collected));
  const id = `rec-from-${income.id}`;
  const receivables = getCollection('receivables') ?? [];

  if (unpaid <= 0) {
    setCollection('receivables', receivables.filter((item) => item.id !== id));
    return null;
  }

  const existing = receivables.find((item) => item.id === id);
  const fallback = existing ?? sample('receivables') ?? {};
  const item = {
    id,
    customer: income.customer,
    amount: income.amount,
    collected: income.collected,
    dueDate: existing?.dueDate ?? addDays(30),
    overdueDays: existing?.overdueDays ?? 0,
    manager: income.manager,
    dunningStatus: fallback.dunningStatus ?? '未催收',
    riskLevel: fallback.riskLevel ?? 'normal',
    followUp: existing?.followUp ?? `由收入 ${income.code} 自动生成`,
    remark: income.remark || income.project || `收入 ${income.code}`,
  };
  upsertCollectionRecord('receivables', item);
  appendAuditLog(user, '自动同步应收', 'receivables', `收入 ${income.code} 同步应收 ${income.amount}`);
  return item;
}

export function syncExpenseToPayableAndBudget(expense, user) {
  const payable = syncExpenseToPayable(expense, user);
  const budget = consumeBudgetForExpense(expense, user);
  return { payable, budget };
}

function syncExpenseToPayable(expense, user) {
  const unpaid = Math.max(0, Number(expense.amount) - Number(expense.paid));
  const id = `pay-from-${expense.id}`;
  const payables = getCollection('payables') ?? [];

  if (unpaid <= 0) {
    setCollection('payables', payables.filter((item) => item.id !== id));
    return null;
  }

  const existing = payables.find((item) => item.id === id);
  const fallback = existing ?? sample('payables') ?? {};
  const item = {
    id,
    supplier: expense.supplier,
    amount: expense.amount,
    paid: expense.paid,
    dueDate: expense.plannedPayDate || today(),
    priority: fallback.priority ?? (expense.amount >= 20 ? '优先付款' : '可协商延期'),
    status: expense.paymentStatus,
    suggestion: existing?.suggestion ?? (expense.amount >= 20 ? '金额较大，优先复核付款计划' : '按正常付款计划跟进'),
    manager: expense.manager,
    remark: expense.remark || `由支出 ${expense.code} 自动生成`,
  };
  upsertCollectionRecord('payables', item);
  appendAuditLog(user, '自动同步应付', 'payables', `支出 ${expense.code} 同步应付 ${expense.amount}`);
  return item;
}

function consumeBudgetForExpense(expense, user) {
  const budgets = getCollection('budgets') ?? [];
  let budget = budgets.find((item) => item.department === expense.department);

  if (!budget) {
    budget = {
      id: `bud-from-${expense.id}`,
      department: expense.department,
      budgetAmount: Math.max(Number(expense.amount), 10),
      usedAmount: 0,
      manager: expense.manager,
      remark: '由支出自动生成预算桶',
    };
  }

  const recorded = recordBudgetUsage({
    budgetId: budget.id,
    sourceType: 'expense',
    sourceId: expense.id,
    amount: Number(expense.amount),
  });
  if (!recorded) return budget;

  const updated = {
    ...budget,
    usedAmount: Number((Number(budget.usedAmount) + Number(expense.amount)).toFixed(2)),
  };
  setCollection('budgets', upsertById(budgets, updated));
  appendAuditLog(user, '自动占用预算', 'budgets', `支出 ${expense.code} 占用 ${expense.department} 预算 ${expense.amount}`);
  return updated;
}

export function applyApprovalSideEffects(approval, user) {
  if (approval.status !== 'approved') return null;
  const typeText = String(approval.type);
  const shouldCreateExpense = typeText.includes('付款') || typeText.includes('报销') || typeText.includes('费用');
  if (!shouldCreateExpense || Number(approval.amount) <= 0) return null;

  const fallback = sample('expenses');
  if (!fallback) return null;

  const expense = {
    id: `exp-from-approval-${approval.id}`,
    code: `EXP-APV-${approval.code}`,
    supplier: approval.applicant,
    type: fallback.type,
    department: approval.department,
    amount: approval.amount,
    paid: 0,
    paymentStatus: fallback.paymentStatus,
    receiptStatus: fallback.receiptStatus,
    plannedPayDate: today(),
    manager: approval.approver,
    remark: `审批 ${approval.code} 通过后自动生成`,
  };

  upsertCollectionRecord('expenses', expense);
  appendAuditLog(user, '审批生成支出', 'expenses', `审批 ${approval.code} 自动生成支出 ${expense.code}`);
  syncExpenseToPayableAndBudget(expense, user);
  return expense;
}

export function applyCollectionSideEffects(name, data, user) {
  if (name === 'incomes') data.forEach((item) => syncIncomeToReceivable(item, user));
  if (name === 'expenses') data.forEach((item) => syncExpenseToPayableAndBudget(item, user));
  if (name === 'approvals') data.filter((item) => item.status === 'approved').forEach((item) => applyApprovalSideEffects(item, user));
}

export function getDashboardSummary() {
  const incomes = getCollection('incomes') ?? [];
  const expenses = getCollection('expenses') ?? [];
  const receivables = getCollection('receivables') ?? [];
  const payables = getCollection('payables') ?? [];
  const budgets = getCollection('budgets') ?? [];
  const risks = getCollection('risks') ?? [];

  const incomeTotal = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const receivableTotal = receivables.reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0) - Number(item.collected || 0)), 0);
  const payableTotal = payables.reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0) - Number(item.paid || 0)), 0);
  const overBudgetCount = budgets.filter((item) => Number(item.usedAmount || 0) > Number(item.budgetAmount || 0)).length;
  const highRiskCount = risks.filter((item) => item.level === 'high' || item.riskLevel === 'high').length;

  return {
    incomeTotal,
    expenseTotal,
    profit: Number((incomeTotal - expenseTotal).toFixed(2)),
    receivableTotal: Number(receivableTotal.toFixed(2)),
    payableTotal: Number(payableTotal.toFixed(2)),
    overBudgetCount,
    highRiskCount,
  };
}

export function getCashflowForecast() {
  const receivables = getCollection('receivables') ?? [];
  const payables = getCollection('payables') ?? [];
  const expectedInflow = receivables.reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0) - Number(item.collected || 0)), 0);
  const expectedOutflow = payables.reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0) - Number(item.paid || 0)), 0);
  const startBalance = 486.8;
  return [{
    stage: '实时预测',
    startBalance,
    expectedInflow: Number(expectedInflow.toFixed(2)),
    expectedOutflow: Number(expectedOutflow.toFixed(2)),
    endBalance: Number((startBalance + expectedInflow - expectedOutflow).toFixed(2)),
    riskLevel: expectedOutflow > expectedInflow + startBalance ? '高风险' : '正常',
    suggestion: expectedOutflow > expectedInflow ? '关注集中付款和应收回款节奏' : '现金流处于可控区间',
  }];
}

export function getRiskSummary() {
  const budgets = getCollection('budgets') ?? [];
  const receivables = getCollection('receivables') ?? [];
  const payables = getCollection('payables') ?? [];
  return {
    overBudgetDepartments: budgets.filter((item) => Number(item.usedAmount || 0) > Number(item.budgetAmount || 0)),
    overdueReceivables: receivables.filter((item) => Number(item.overdueDays || 0) > 0),
    unpaidPayables: payables.filter((item) => Math.max(0, Number(item.amount || 0) - Number(item.paid || 0)) > 0),
  };
}
