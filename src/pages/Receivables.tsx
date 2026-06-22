import React, { useState, useMemo } from 'react';
import { getReceivables, saveReceivables } from '@/data/mockData';
import PageContainer from '@/components/layout/PageContainer';
import { formatMoney } from '@/utils/format';
import { getRiskBadgeClass, getRiskLabel } from '@/utils/riskRules';
import type { ReceivableRecord, DunningStatus, RiskLevel } from '@/types';
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

// ==================== 辅助函数 ====================

function getDunningStatusTag(status: DunningStatus) {
  const map: Record<DunningStatus, string> = {
    未催收: 'tag-gray',
    已提醒: 'tag-blue',
    跟进中: 'tag-orange',
    已回款: 'tag-green',
    高风险: 'tag-red',
  };
  return map[status] || 'tag-gray';
}

const DUNNING_STATUSES: DunningStatus[] = ['未催收', '已提醒', '跟进中', '已回款', '高风险'];
const RISK_LEVELS: RiskLevel[] = ['normal', 'low', 'medium', 'high'];

const RISK_FILTERS = [
  { label: '全部', value: '全部' },
  { label: '正常', value: 'normal' },
  { label: '关注', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' },
];

const OVERDUE_FILTERS = [
  { label: '全部', value: '全部' },
  { label: '未逾期', value: '未逾期' },
  { label: '逾期1-30天', value: '1-30' },
  { label: '逾期30天+', value: '30+' },
];

const PAGE_SIZE = 10;

export default function ReceivablesPage() {
  // ---- 数据状态 ----
  const [records, setRecords] = useState<ReceivableRecord[]>(() => getReceivables());
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('全部');
  const [overdueFilter, setOverdueFilter] = useState('全部');
  const [page, setPage] = useState(1);

  // ---- 弹窗状态 ----
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editRecord, setEditRecord] = useState<ReceivableRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<ReceivableRecord | null>(null);

  // ---- 表单状态 ----
  const [form, setForm] = useState({
    dunningStatus: '未催收' as DunningStatus,
    riskLevel: 'normal' as RiskLevel,
    followUp: '',
    manager: '',
  });

  // ---- 汇总指标 ----
  const totalAmount = useMemo(() => records.reduce((sum, r) => sum + r.amount, 0), [records]);
  const totalOverdue = useMemo(
    () => records.filter((r) => r.overdueDays > 0).reduce((sum, r) => sum + (r.amount - r.collected), 0),
    [records]
  );
  const overdueRate = totalAmount > 0 ? (totalOverdue / totalAmount) * 100 : 0;
  const highRiskCount = useMemo(
    () => records.filter((r) => r.riskLevel === 'high').length,
    [records]
  );

  // ---- 过滤 ----
  const filtered = useMemo(() => {
    let result = records;

    if (search) {
      const kw = search.toLowerCase();
      result = result.filter((r) => r.customer.toLowerCase().includes(kw));
    }

    if (riskFilter !== '全部') {
      result = result.filter((r) => r.riskLevel === riskFilter);
    }

    if (overdueFilter !== '全部') {
      if (overdueFilter === '未逾期') {
        result = result.filter((r) => r.overdueDays <= 0);
      } else if (overdueFilter === '1-30') {
        result = result.filter((r) => r.overdueDays > 0 && r.overdueDays <= 30);
      } else if (overdueFilter === '30+') {
        result = result.filter((r) => r.overdueDays > 30);
      }
    }

    return result;
  }, [records, search, riskFilter, overdueFilter]);

  // 过滤后重置页码
  useMemo(() => {
    setPage(1);
  }, [search, riskFilter, overdueFilter]);

  // ---- 分页 ----
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---- 账龄区间 ----
  const agingBuckets = useMemo(() => {
    const now = new Date();
    const buckets = [
      { label: '未到期', min: -Infinity, max: 0, count: 0, amount: 0 },
      { label: '0-30天', min: 0, max: 30, count: 0, amount: 0 },
      { label: '31-60天', min: 31, max: 60, count: 0, amount: 0 },
      { label: '61-90天', min: 61, max: 90, count: 0, amount: 0 },
      { label: '90天以上', min: 91, max: Infinity, count: 0, amount: 0 },
    ];

    records.forEach((r) => {
      const uncollected = r.amount - r.collected;
      if (uncollected <= 0) return;

      const dueDate = new Date(r.dueDate);
      const diffDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      for (const bucket of buckets) {
        if (diffDays >= bucket.min && diffDays <= bucket.max) {
          bucket.count += 1;
          bucket.amount += uncollected;
          break;
        }
      }
    });

    return buckets.filter((b) => b.count > 0);
  }, [records]);

  // ---- 持久化 ----
  const persist = (data: ReceivableRecord[]) => {
    setRecords(data);
    saveReceivables(data);
  };

  // ---- 编辑 ----
  const handleEdit = () => {
    if (!editRecord) return;
    const updated = records.map((r) =>
      r.id === editRecord.id
        ? {
            ...r,
            dunningStatus: form.dunningStatus,
            riskLevel: form.riskLevel,
            followUp: form.followUp,
            manager: form.manager,
          }
        : r
    );
    persist(updated);
    setShowEdit(false);
    setEditRecord(null);
    window.alert('修改成功');
  };

  const openEditModal = (record: ReceivableRecord) => {
    setEditRecord(record);
    setForm({
      dunningStatus: record.dunningStatus,
      riskLevel: record.riskLevel,
      followUp: record.followUp,
      manager: record.manager,
    });
    setShowEdit(true);
  };

  // ---- 删除 ----
  const handleDelete = () => {
    if (!deleteRecord) return;
    const updated = records.filter((r) => r.id !== deleteRecord.id);
    persist(updated);
    setShowDelete(false);
    setDeleteRecord(null);
    window.alert('删除成功');
  };

  const openDeleteModal = (record: ReceivableRecord) => {
    setDeleteRecord(record);
    setShowDelete(true);
  };

  const closeModals = () => {
    setShowEdit(false);
    setShowDelete(false);
    setEditRecord(null);
    setDeleteRecord(null);
  };

  // ---- 表单通用样式 ----
  const inputCls =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const selectCls = inputCls;
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <PageContainer title="应收账款" subtitle="客户应收款项、催收状态、风险等级及账龄分析。">
      {/* ==================== 指标卡片 ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">应收总额</p>
              <p className="metric-value mt-1">{formatMoney(totalAmount)}</p>
              <p className="metric-sub text-red-500">较上月 +18.5 万</p>
            </div>
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">逾期金额</p>
              <p className="metric-value mt-1 text-red-600">{formatMoney(totalOverdue)}</p>
              <p className="metric-sub text-red-500">逾期率 {overdueRate.toFixed(1)}%</p>
            </div>
            <div className="bg-red-100 p-2.5 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">经营提示</p>
              <p className="metric-value mt-1 text-amber-600">需关注</p>
              <p className="metric-sub text-amber-600">{highRiskCount}个高风险客户</p>
            </div>
            <div className="bg-amber-100 p-2.5 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">高风险客户数量</p>
              <p className="metric-value mt-1 text-red-600">{highRiskCount} 个</p>
              <p className="metric-sub text-red-500">需专项催收</p>
            </div>
            <div className="bg-red-100 p-2.5 rounded-lg">
              <Users className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 账龄区间 ==================== */}
      {agingBuckets.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">账龄区间</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {agingBuckets.map((bucket) => (
              <div key={bucket.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{bucket.label}</p>
                <p className="text-lg font-bold text-slate-800">{bucket.count} 笔</p>
                <p className="text-sm font-medium text-slate-600">{formatMoney(bucket.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 搜索 + 过滤 ==================== */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col gap-4">
          {/* 搜索框 */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="搜索客户名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 风险等级过滤 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 whitespace-nowrap">风险等级:</span>
            {RISK_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setRiskFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  riskFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 逾期过滤 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 whitespace-nowrap">逾期状态:</span>
            {OVERDUE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setOverdueFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  overdueFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== 数据表格 ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>客户</th>
                <th>应收金额</th>
                <th>已收金额</th>
                <th>未收金额</th>
                <th>到期日</th>
                <th>逾期天数</th>
                <th>负责人</th>
                <th>催收状态</th>
                <th>风险等级</th>
                <th>跟进记录</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center text-slate-400 py-12">
                    暂无数据
                  </td>
                </tr>
              ) : (
                pagedData.map((record) => {
                  const uncollected = record.amount - record.collected;
                  return (
                    <tr key={record.id}>
                      <td className="font-medium text-slate-800">{record.customer}</td>
                      <td className="font-medium">{formatMoney(record.amount)}</td>
                      <td className="text-green-600 font-medium">{formatMoney(record.collected)}</td>
                      <td className="text-red-500 font-medium">{formatMoney(uncollected)}</td>
                      <td className="text-slate-600">{record.dueDate}</td>
                      <td>
                        {record.overdueDays > 0 ? (
                          <span className="text-red-500 font-medium">{record.overdueDays} 天</span>
                        ) : (
                          <span className="text-green-600">-</span>
                        )}
                      </td>
                      <td>{record.manager}</td>
                      <td>
                        <span className={getDunningStatusTag(record.dunningStatus)}>
                          {record.dunningStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeClass(record.riskLevel)}`}>
                          {getRiskLabel(record.riskLevel)}
                        </span>
                      </td>
                      <td className="text-slate-500 max-w-[150px] truncate" title={record.followUp}>
                        {record.followUp || '-'}
                      </td>
                      <td className="text-slate-500 max-w-[120px] truncate" title={record.remark}>
                        {record.remark || '-'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(record)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="编辑"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(record)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              共 {filtered.length} 条记录，第 {page}/{totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== 编辑弹窗 ==================== */}
      {showEdit && editRecord && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">编辑应收账款</h3>
              <button
                onClick={closeModals}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-500">
              客户: <span className="font-medium text-slate-700">{editRecord.customer}</span>
              <span className="mx-3">|</span>
              应收: <span className="font-medium text-slate-700">{formatMoney(editRecord.amount)}</span>
              <span className="mx-3">|</span>
              逾期: <span className="font-medium text-red-500">{editRecord.overdueDays}天</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>催收状态</label>
                <select
                  className={selectCls}
                  value={form.dunningStatus}
                  onChange={(e) => setForm({ ...form, dunningStatus: e.target.value as DunningStatus })}
                >
                  {DUNNING_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>风险等级</label>
                <select
                  className={selectCls}
                  value={form.riskLevel}
                  onChange={(e) => setForm({ ...form, riskLevel: e.target.value as RiskLevel })}
                >
                  {RISK_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {getRiskLabel(level)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>负责人</label>
                <input
                  className={inputCls}
                  value={form.manager}
                  onChange={(e) => setForm({ ...form, manager: e.target.value })}
                  placeholder="负责人"
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>跟进记录</label>
                <textarea
                  className={inputCls}
                  value={form.followUp}
                  onChange={(e) => setForm({ ...form, followUp: e.target.value })}
                  placeholder="跟进记录"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={closeModals} className="btn-secondary">
                取消
              </button>
              <button onClick={handleEdit} className="btn-primary">
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 删除确认弹窗 ==================== */}
      {showDelete && deleteRecord && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">确认删除</h3>
              <p className="text-sm text-slate-500 mb-1">确定要删除该应收账款记录吗？</p>
              <p className="text-sm font-medium text-slate-700 mb-6">
                {deleteRecord.customer} - {formatMoney(deleteRecord.amount)}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={closeModals} className="btn-secondary">
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
