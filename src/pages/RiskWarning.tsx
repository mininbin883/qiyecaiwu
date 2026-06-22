import React, { useState, useMemo, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getRisks, saveRisks } from '@/data/mockData';
import { formatMoney } from '@/utils/format';
import { getRiskBadgeClass, getRiskLabel, getRiskColorClass } from '@/utils/riskRules';
import type { RiskWarning as RiskWarningType, RiskLevel, ProcessStatus } from '@/types';

type FilterValue = 'all' | RiskLevel | ProcessStatus;

const ITEMS_PER_PAGE = 8;

const STATUS_LABEL: Record<ProcessStatus, string> = {
  pending: '未处理',
  processing: '处理中',
  done: '已处理',
  ignored: '已忽略',
};

const STATUS_STYLE: Record<ProcessStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-orange-100 text-orange-600',
  done: 'bg-green-100 text-green-600',
  ignored: 'bg-gray-100 text-gray-400 line-through',
};

const FILTER_TABS: { key: FilterValue; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'high', label: '高风险' },
  { key: 'medium', label: '中风险' },
  { key: 'low', label: '低风险' },
  { key: 'pending', label: '未处理' },
  { key: 'processing', label: '处理中' },
  { key: 'done', label: '已处理' },
  { key: 'ignored', label: '已忽略' },
];

export default function RiskWarningPage() {
  const [risks, setRisks] = useState<RiskWarningType[]>(() => getRisks());
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const persistRisks = useCallback((updated: RiskWarningType[]) => {
    setRisks(updated);
    saveRisks(updated);
  }, []);

  const updateStatus = useCallback(
    (id: string, newStatus: ProcessStatus, actionLabel: string) => {
      if (!window.confirm(`确认将此项${actionLabel}？`)) return;
      const updated = risks.map((r) =>
        r.id === id ? { ...r, status: newStatus } : r
      );
      persistRisks(updated);
    },
    [risks, persistRisks]
  );

  // Metrics
  const metrics = useMemo(() => {
    const totalAmount = risks.reduce((sum, r) => sum + r.amount, 0);
    const highRisks = risks.filter((r) => r.level === 'high');
    const highAmount = highRisks.reduce((sum, r) => sum + r.amount, 0);
    const highCount = highRisks.length;
    const pendingHighCount = highRisks.filter((r) => r.status === 'pending').length;
    return { totalAmount, highAmount, highCount, pendingHighCount };
  }, [risks]);

  // Filter + search
  const filteredRisks = useMemo(() => {
    let result = risks;

    if (filter !== 'all') {
      const isLevel = (['high', 'medium', 'low'] as string[]).includes(filter);
      if (isLevel) {
        result = result.filter((r) => r.level === filter);
      } else {
        result = result.filter((r) => r.status === filter);
      }
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.item.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.manager.toLowerCase().includes(q) ||
          r.evaluation.toLowerCase().includes(q)
      );
    }

    return result;
  }, [risks, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedRisks = filteredRisks.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStatusAlertClass = (status: ProcessStatus): string => {
    switch (status) {
      case 'pending': return '';
      case 'processing': return 'bg-orange-50 border-l-4 border-orange-400';
      case 'done': return 'bg-green-50 border-l-4 border-green-400';
      case 'ignored': return 'bg-gray-50 border-l-4 border-gray-300';
    }
  };

  const renderActions = (risk: RiskWarningType) => {
    if (risk.status === 'pending') {
      return (
        <div className="flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); updateStatus(risk.id, 'processing', '标记为处理中'); }}
            className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
          >
            标记处理中
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); updateStatus(risk.id, 'ignored', '标记为已忽略'); }}
            className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            忽略
          </button>
        </div>
      );
    }
    if (risk.status === 'processing') {
      return (
        <div className="flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); updateStatus(risk.id, 'done', '标记为已处理'); }}
            className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
          >
            标记已处理
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); updateStatus(risk.id, 'ignored', '标记为已忽略'); }}
            className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            忽略
          </button>
        </div>
      );
    }
    if (risk.status === 'done') {
      return <span className="text-xs text-green-600 font-medium">已完成</span>;
    }
    if (risk.status === 'ignored') {
      return <span className="text-xs text-gray-400 line-through">已忽略</span>;
    }
    return null;
  };

  return (
    <PageContainer title="风险预警" subtitle="实时监控企业经营风险，及时预警并处理">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="text-sm text-slate-500 mb-1">风险总金额</div>
          <div className="text-2xl font-bold text-slate-900">{formatMoney(metrics.totalAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">{risks.length}条风险事项</div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4 shadow-sm bg-red-50/30">
          <div className="text-sm text-red-600 mb-1">影响金额</div>
          <div className="text-2xl font-bold text-red-700">{formatMoney(metrics.highAmount)}</div>
          <div className="text-xs text-red-400 mt-1">其中高风险{formatMoney(metrics.highAmount)}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="text-sm text-slate-500 mb-1">经营提示</div>
          <div className="text-2xl font-bold text-orange-600">
            {metrics.highCount > 0 ? '需关注' : '正常'}
          </div>
          <div className="text-xs text-slate-400 mt-1">{metrics.pendingHighCount}个高风险事项待处理</div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4 shadow-sm bg-red-50/30">
          <div className="text-sm text-red-600 mb-1">高风险事项数量</div>
          <div className="text-2xl font-bold text-red-700">{metrics.highCount} 条</div>
          <div className="text-xs text-red-400 mt-1">需立即处理</div>
        </div>
      </div>

      {/* Search + Filter Tabs */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-4">
        <div className="p-4 border-b border-slate-100">
          <input
            type="text"
            placeholder="搜索风险事项、部门、负责人..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="px-4 py-2 flex flex-wrap gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">风险事项</th>
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">等级</th>
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap text-right">风险金额</th>
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">关联部门</th>
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">负责人</th>
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">评估说明</th>
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">建议动作</th>
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">处理状态</th>
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">截止日期</th>
                <th className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRisks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    暂无匹配的风险事项
                  </td>
                </tr>
              ) : (
                pagedRisks.map((risk) => {
                  const isHigh = risk.level === 'high';
                  const isExpanded = expandedId === risk.id;
                  return (
                    <React.Fragment key={risk.id}>
                      <tr
                        onClick={() => toggleExpand(risk.id)}
                        className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                          isHigh ? 'bg-red-50/40' : ''
                        } ${getStatusAlertClass(risk.status)}`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {risk.item}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeClass(risk.level)}`}>
                            {getRiskLabel(risk.level)}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap font-mono ${isHigh ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
                          {formatMoney(risk.amount)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{risk.department}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{risk.manager}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                          {risk.evaluation}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                          {risk.suggestion}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[risk.status]}`}>
                            {STATUS_LABEL[risk.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">
                          {risk.deadline}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {renderActions(risk)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className={isHigh ? 'bg-red-50/30' : 'bg-slate-50'}>
                          <td colSpan={10} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h4 className="font-semibold text-slate-700 mb-1">详细评估</h4>
                                <p className="text-slate-600 leading-relaxed">{risk.evaluation}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-700 mb-1">建议动作</h4>
                                <p className="text-slate-600 leading-relaxed">{risk.suggestion}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-500">
              共 {filteredRisks.length} 条，第 {safePage}/{totalPages} 页
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                    p === safePage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
