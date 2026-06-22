import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const money = z.number().finite().nonnegative();

const collectionSchemas = {
  incomes: z.object({
    id: nonEmpty,
    code: nonEmpty,
    customer: nonEmpty,
    type: nonEmpty,
    contractCode: z.string(),
    project: z.string(),
    amount: money,
    collected: money,
    invoiceStatus: nonEmpty,
    collectionStatus: nonEmpty,
    manager: z.string(),
    remark: z.string(),
  }).refine((v) => v.collected <= v.amount, '已回款不能大于收入金额'),

  expenses: z.object({
    id: nonEmpty,
    code: nonEmpty,
    supplier: nonEmpty,
    type: nonEmpty,
    department: nonEmpty,
    amount: money,
    paid: money,
    paymentStatus: nonEmpty,
    receiptStatus: nonEmpty,
    plannedPayDate: nonEmpty,
    manager: z.string(),
    remark: z.string(),
  }).refine((v) => v.paid <= v.amount, '已付款不能大于支出金额'),

  receivables: z.object({
    id: nonEmpty,
    customer: nonEmpty,
    amount: money,
    collected: money,
    dueDate: nonEmpty,
    overdueDays: z.number().int().nonnegative(),
    manager: z.string(),
    dunningStatus: nonEmpty,
    riskLevel: z.enum(['high', 'medium', 'low', 'normal']),
    followUp: z.string(),
    remark: z.string(),
  }).refine((v) => v.collected <= v.amount, '已收金额不能大于应收金额'),

  payables: z.object({
    id: nonEmpty,
    supplier: nonEmpty,
    amount: money,
    paid: money,
    dueDate: nonEmpty,
    priority: nonEmpty,
    status: nonEmpty,
    suggestion: z.string(),
    manager: z.string(),
    remark: z.string(),
  }).refine((v) => v.paid <= v.amount, '已付金额不能大于应付金额'),

  budgets: z.object({
    id: nonEmpty,
    department: nonEmpty,
    budgetAmount: z.number().finite().positive(),
    usedAmount: money,
    manager: z.string(),
    remark: z.string(),
  }),
};

export function validateCollection(name, data) {
  if (!Array.isArray(data)) {
    return { ok: false, message: '集合数据必须是数组' };
  }

  const schema = collectionSchemas[name];
  if (!schema) return { ok: true, data };

  const parsed = z.array(schema).safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? '数据校验失败',
    };
  }
  return { ok: true, data: parsed.data };
}

