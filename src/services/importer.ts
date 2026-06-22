import { uploadImport } from '@/services/api';
import type { PageKey } from '@/types';

const moduleByPage: Partial<Record<PageKey, string>> = {
  income: 'income',
  expense: 'expense',
  contracts: 'contracts',
  budget: 'budget',
  'master-data': 'master-data',
};

export async function importWorkbookToPage(page: PageKey, file: File): Promise<number> {
  const moduleName = moduleByPage[page];
  if (!moduleName) throw new Error('当前页面暂不支持 Excel 导入');
  const result = await uploadImport(moduleName, file);
  return result.count;
}
