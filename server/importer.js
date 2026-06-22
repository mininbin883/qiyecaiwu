import XLSX from 'xlsx';
import { getCollection } from './db.js';

const aliases = {
  customer: ['customer', '客户', '客户名称', '往来单位'],
  supplier: ['supplier', '供应商', '供应商名称', '付款对象', '收款方'],
  type: ['type', '类型', '类别', '业务类型'],
  contractCode: ['contractCode', '合同编号', '合同号'],
  project: ['project', '项目', '项目名称'],
  amount: ['amount', '金额', '收入金额', '支出金额', '合同金额', '预算金额'],
  collected: ['collected', '已收', '已收金额', '回款金额'],
  paid: ['paid', '已付', '已付金额', '付款金额'],
  invoiceStatus: ['invoiceStatus', '开票状态'],
  collectionStatus: ['collectionStatus', '回款状态', '收款状态'],
  paymentStatus: ['paymentStatus', '付款状态'],
  receiptStatus: ['receiptStatus', '收票状态', '发票状态'],
  plannedPayDate: ['plannedPayDate', '计划付款日', '计划付款日期', '付款日期'],
  manager: ['manager', '负责人', '经办人'],
  remark: ['remark', '备注', '说明'],
  department: ['department', '部门'],
  budgetAmount: ['budgetAmount', '预算金额'],
  usedAmount: ['usedAmount', '已用金额', '使用金额'],
  party: ['party', '合同相对方', '客户/供应商', '对方单位'],
  name: ['name', '名称'],
  party: ['party', '合同相对方', '客户/供应商', '对方单位'],
  signDate: ['signDate', '签订日期', '签约日期'],
  status: ['status', '状态'],
  settled: ['settled', '已结算', '已结算金额'],
  riskStatus: ['riskStatus', '风险状态'],
};

function cell(row, key) {
  for (const name of aliases[key] ?? [key]) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function money(row, key, fallback = 0) {
  const value = Number(cell(row, key).replace(/,/g, ''));
  return Number.isFinite(value) ? value : fallback;
}

function dateCell(row, key, fallback = '') {
  const value = cell(row, key);
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toISOString().slice(0, 10);
}

function code(prefix, currentLength, index) {
  return `${prefix}-2026-${String(currentLength + index + 1).padStart(3, '0')}`;
}

function rowsFromBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
}

export function parseImport(moduleName, buffer) {
  const rows = rowsFromBuffer(buffer);
  const current = getCollection(moduleName) ?? [];
  const sample = current[0] ?? {};

  if (moduleName === 'incomes') {
    return rows.map((row, index) => ({
      id: `inc-import-${Date.now()}-${index}`,
      code: code('INC', current.length, index),
      customer: cell(row, 'customer'),
      type: cell(row, 'type') || sample.type,
      contractCode: cell(row, 'contractCode') || `IMP-${Date.now()}-${index + 1}`,
      project: cell(row, 'project'),
      amount: money(row, 'amount'),
      collected: money(row, 'collected'),
      invoiceStatus: cell(row, 'invoiceStatus') || sample.invoiceStatus,
      collectionStatus: cell(row, 'collectionStatus') || sample.collectionStatus,
      manager: cell(row, 'manager') || sample.manager || '',
      remark: cell(row, 'remark'),
    })).filter((item) => item.customer && item.amount > 0);
  }

  if (moduleName === 'expenses') {
    return rows.map((row, index) => ({
      id: `exp-import-${Date.now()}-${index}`,
      code: code('EXP', current.length, index),
      supplier: cell(row, 'supplier'),
      type: cell(row, 'type') || sample.type,
      department: cell(row, 'department') || sample.department,
      amount: money(row, 'amount'),
      paid: money(row, 'paid'),
      paymentStatus: cell(row, 'paymentStatus') || sample.paymentStatus,
      receiptStatus: cell(row, 'receiptStatus') || sample.receiptStatus,
      plannedPayDate: dateCell(row, 'plannedPayDate', sample.plannedPayDate),
      manager: cell(row, 'manager') || sample.manager || '',
      remark: cell(row, 'remark'),
    })).filter((item) => item.supplier && item.amount > 0);
  }

  if (moduleName === 'budgets') {
    return rows.map((row, index) => ({
      id: `bud-import-${Date.now()}-${index}`,
      department: cell(row, 'department'),
      budgetAmount: money(row, 'budgetAmount', money(row, 'amount')),
      usedAmount: money(row, 'usedAmount'),
      manager: cell(row, 'manager') || sample.manager || '',
      remark: cell(row, 'remark'),
    })).filter((item) => item.department && item.budgetAmount > 0);
  }

  if (moduleName === 'contracts') {
    return rows.map((row, index) => ({
      id: `ctr-import-${Date.now()}-${index}`,
      code: cell(row, 'contractCode') || `HT-IMP-${String(current.length + index + 1).padStart(3, '0')}`,
      party: cell(row, 'party') || cell(row, 'customer') || cell(row, 'supplier'),
      type: cell(row, 'type') || sample.type,
      amount: money(row, 'amount'),
      signDate: dateCell(row, 'signDate', new Date().toISOString().slice(0, 10)),
      status: cell(row, 'status') || sample.status,
      project: cell(row, 'project'),
      settled: money(row, 'settled'),
      riskStatus: cell(row, 'riskStatus') || sample.riskStatus,
      remark: cell(row, 'remark'),
    })).filter((item) => item.party && item.amount > 0);
  }

  if (moduleName === 'masterData') {
    return rows.map((row, index) => ({
      id: `md-import-${Date.now()}-${index}`,
      code: `MD-IMP-${String(current.length + index + 1).padStart(3, '0')}`,
      type: cell(row, 'type') || sample.type,
      name: cell(row, 'name'),
      manager: cell(row, 'manager') || sample.manager || '',
      status: cell(row, 'status') || sample.status,
      remark: cell(row, 'remark'),
    })).filter((item) => item.name);
  }

  throw new Error('当前模块暂不支持导入');
}
