import type { ApprovalRecord, ExpenseRecord, IncomeRecord } from '@/types';

// Business side effects now live in the backend service layer.
// These no-op shims keep older page calls compatible while API writes trigger
// receivable/payable/budget/approval synchronization on the server.
export function syncIncomeToReceivable(_income: IncomeRecord): void {}

export function syncExpenseToPayableAndBudget(_expense: ExpenseRecord): void {}

export function applyApprovalSideEffects(_approval: ApprovalRecord): void {}
