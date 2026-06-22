import fs from 'node:fs';
import path from 'node:path';

const COLLECTION_EXPORTS = {
  incomes: 'defaultIncomes',
  expenses: 'defaultExpenses',
  receivables: 'defaultReceivables',
  payables: 'defaultPayables',
  contracts: 'defaultContracts',
  budgets: 'defaultBudgets',
  approvals: 'defaultApprovals',
  cashflow: 'defaultCashflow',
  risks: 'defaultRisks',
  masterData: 'defaultMasterData',
  roles: 'defaultRoles',
  alertRules: 'defaultAlertRules',
  auditLogs: 'defaultAuditLogs',
  monthlyTrends: 'monthlyTrends',
};

let cachedDefaults = null;

export function loadDefaultCollections() {
  if (cachedDefaults) return cachedDefaults;

  const filePath = path.resolve(process.cwd(), 'src/data/mockData.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const beforeStorage = source.split('// ==================== API 数据缓存')[0];
  const executable = beforeStorage
    .replace(/^import[\s\S]*?;\s*/gm, '')
    .replace(/export const/g, 'const')
    .replace(/export const monthlyTrends/g, 'const monthlyTrends')
    .replace(/const (\w+): [^=]+ =/g, 'const $1 =');

  const exportObject = Object.entries(COLLECTION_EXPORTS)
    .map(([key, value]) => `${JSON.stringify(key)}: ${value}`)
    .join(',');

  cachedDefaults = Function(`${executable}\nreturn {${exportObject}};`)();
  return cachedDefaults;
}
