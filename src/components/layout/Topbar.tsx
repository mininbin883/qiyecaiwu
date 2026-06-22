import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, Download, ChevronDown, Menu, FileSpreadsheet, LogOut, RefreshCw } from 'lucide-react';
import type { PageKey } from '@/types';
import { useAuth } from '@/auth/AuthContext';
import {
  getAlertRules,
  getApprovals,
  getBudgets,
  getCashflow,
  getContracts,
  getExpenses,
  getIncomes,
  getMasterData,
  getPayables,
  getReceivables,
  getRisks,
} from '@/data/mockData';
import { downloadCsv } from '@/utils/exportCsv';
import { importWorkbookToPage } from '@/services/importer';

interface TopbarProps {
  currentPage: PageKey;
  collapsed: boolean;
  onToggleSidebar: () => void;
}

const pageTitles: Record<PageKey, string> = {
  dashboard: '经营总览',
  income: '收入管理',
  expense: '支出管理',
  receivables: '应收账款',
  payables: '应付账款',
  contracts: '合同管理',
  budget: '预算管理',
  approval: '审批中心',
  cashflow: '现金流预测',
  risk: '风险预警',
  'ai-analysis': 'AI 财务分析',
  'master-data': '基础资料',
  settings: '系统设置',
};

const managementPages: PageKey[] = ['income', 'expense', 'contracts', 'budget', 'approval', 'master-data'];
const analysisPages: PageKey[] = ['dashboard', 'cashflow', 'risk', 'ai-analysis'];

const exportDataByPage: Partial<Record<PageKey, () => object[]>> = {
  income: getIncomes,
  expense: getExpenses,
  receivables: getReceivables,
  payables: getPayables,
  contracts: getContracts,
  budget: getBudgets,
  approval: getApprovals,
  cashflow: getCashflow,
  risk: getRisks,
  'master-data': getMasterData,
  settings: getAlertRules,
};

export default function Topbar({ currentPage, collapsed, onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const title = pageTitles[currentPage] || '';
  const isManagement = managementPages.includes(currentPage);
  const isAnalysis = analysisPages.includes(currentPage);
  const { user, logout, hasPermission, bootstrap } = useAuth();
  const canWrite = hasPermission('manage_finance')
    || hasPermission('edit_income')
    || hasPermission('edit_expense')
    || hasPermission('edit_contract')
    || hasPermission('edit_master')
    || hasPermission('approve');
  const canExport = hasPermission('export') || hasPermission('view_all');

  const handleOpenAdd = () => {
    window.dispatchEvent(new CustomEvent('fms:open-add', { detail: { page: currentPage } }));
  };

  const handleImport = () => {
    window.alert('导入功能已预留接口。下一步会接 Excel/CSV 上传解析并写入后端。');
  };

  const handleImportWorkbook = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const count = await importWorkbookToPage(currentPage, file);
      await bootstrap();
      window.dispatchEvent(new CustomEvent('fms:data-imported', { detail: { page: currentPage } }));
      window.alert(`成功导入 ${count} 条数据`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '导入失败，请检查 Excel 模板');
    } finally {
      event.target.value = '';
    }
  };

  const handleExport = () => {
    const getter = exportDataByPage[currentPage];
    if (!getter) {
      window.alert('当前页面暂无导出数据');
      return;
    }
    downloadCsv(`${pageTitles[currentPage]}-${new Date().toISOString().slice(0, 10)}.csv`, getter());
  };

  const handleRefresh = async () => {
    await bootstrap();
    window.alert('已从后端刷新最新数据');
  };

  const handleGenerateAnalysis = () => {
    navigate('/ai-analysis');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleImportFile}
      />
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title={collapsed ? '展开菜单' : '收起菜单'}
        >
          <Menu size={20} className="text-slate-500" />
        </button>
        <div>
          <div className="text-sm font-semibold text-slate-800">
            上海鑫业市政有限公司 · 经营驾驶舱
          </div>
          <div className="text-xs text-slate-400">{title}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <span>2026年6月</span>
          <ChevronDown size={14} />
        </button>

        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="搜索">
          <Search size={18} className="text-slate-400" />
        </button>

        <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors" title="通知">
          <Bell size={18} className="text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {isManagement && canWrite && (
          <div className="flex items-center gap-2">
            <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-1.5 text-xs" title="新增">
              <span>+</span> 新增
            </button>
            <button onClick={handleImportWorkbook} className="btn-secondary flex items-center gap-1.5 text-xs" title="导入">
              <FileSpreadsheet size={14} /> 导入
            </button>
            <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-xs" title="导出">
              <Download size={14} /> 导出
            </button>
          </div>
        )}

        {isAnalysis && canExport && (
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-primary flex items-center gap-1.5 text-xs" title="导出报告">
              <Download size={14} /> 导出报告
            </button>
            <button onClick={handleGenerateAnalysis} className="btn-secondary flex items-center gap-1.5 text-xs" title="生成分析">
              生成分析
            </button>
            <button onClick={handleRefresh} className="btn-secondary flex items-center gap-1.5 text-xs" title="刷新数据">
              <RefreshCw size={14} /> 刷新数据
            </button>
          </div>
        )}

        {(currentPage === 'receivables' || currentPage === 'payables') && canExport && (
          <button onClick={handleExport} className="btn-primary flex items-center gap-1.5 text-xs" title="导出清单">
            <Download size={14} /> {currentPage === 'receivables' ? '导出催收清单' : '导出付款计划'}
          </button>
        )}

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-slate-700">{user?.displayName ?? '未登录'}</div>
            <div className="text-xs text-slate-400">{user?.roleKey ?? '-'}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut size={16} className="text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
