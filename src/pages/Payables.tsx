import React, { useState, useMemo } from 'react';
import { getPayables, savePayables } from '@/data/mockData';
import PageContainer from '@/components/layout/PageContainer';
import { formatMoney } from '@/utils/format';
import { isPaymentDueSoon } from '@/utils/riskRules';
import type { PayableRecord, PayPriority, PayableStatus } from '@/types';
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

// ==================== 辅助函数 ====================

function getPriorityTag(priority: PayPriority) {
  const map: Record<PayPriority, string> = {
    必须付款: 'tag-red',
    优先付款: 'tag-orange',
    可协商延期: 'tag-blue',
    暂缓付款: 'tag-gray',
  };
  return map[priority] || 'tag-gray';
}

function getPayableStatusTag(status: PayableStatus) {
  const map: Record<PayableStatus, string> = {
    未付款: 'tag-orange',
    部分付款: 'tag-blue',
    已付款: 'tag-green',
    已逾期: 'tag-red',
  };
  return map[status] || 'tag-gray';
}

const PRIORITIES: PayPriority[] = ['必须付款', '优先付款', '可协商延期', '暂缓付款'];
const PAYABLE_STATUSES: PayableStatus[] = ['未付款', '部分付款', '已付款', '已逾期'];

const PRIORITY_FILTERS = [
  { label: '全部', value: '全部' },
  { label: '必须付款', value: '必须付款' },
  { label: '优先付款', value: '优先付款' },
  { label: '可协商延期', value: '可协商延期' },
  { label: '暂缓付款', value: '暂缓付款' },
];

const STATUS_FILTERS = [
  { label: '全部', value: '全部' },
  { label: '未付款', value: '未付款' },
  { label: '部分付款', value: '部分付款' },
  { label: '已付款', value: '已付款' },
  { label: '已逾期', value: '已逾期' },
];

const PAGE_SIZE = 10;

export default function PayablesPage() {
  // ---- 数据状态 ----
  const [records, setRecords] = useState<PayableRecord[]>(() => getPayables());
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [page, setPage] = useState(1);

  // ---- 弹窗状态 ----
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editRecord, setEditRecord] = useState<PayableRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<PayableRecord | null>(null);

  // ---- 表单状态 ----
  const [form, setForm] = useState({
    priority: '必须付款' as PayPriority,
    status: '未付款' as PayableStatus,
    suggestion: '',
    manager: '',
  });

  // ---- 汇总指标 ----
  const totalAmount = useMemo(() => records.reduce((sum, r) => sum + r.amount, 0), [records]);
  const unpaidAmount = useMemo(
    () => records.reduce((sum, r) => sum + Math.max(0, r.amount - r.paid), 0),
    [records]
  );
  const dueSoonAmount = useMemo(
    () =>
      records
        .filter((r) => isPaymentDueSoon(r.dueDate, 7))
        .reduce((sum, r) => sum + Math.max(0, r.amount - r.paid), 0),
    [records]
  );
  const highPriorityCount = useMemo(
    () => records.filter((r) => r.priority === '必须付款' || r.priority === '优先付款').length,
    [records]
  );

  // ---- 过滤 ----
  const filtered = useMemo(() => {
    let result = records;

    if (search) {
      const kw = search.toLowerCase();
      result = result.filter((r) => r.supplier.toLowerCase().includes(kw));
    }

    if (priorityFilter !== '全部') {
      result = result.filter((r) => r.priority === priorityFilter);
    }

    if (statusFilter !== '全部') {
      result = result.filter((r) => r.status === statusFilter);
    }

    return result;
  }, [records, search, priorityFilter, statusFilter]);

  // 过滤后重置页码
  useMemo(() => {
    setPage(1);
  }, [search, priorityFilter, statusFilter]);

  // ---- 分页 ----
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---- 持久化 ----
  const persist = (data: PayableRecord[]) => {
    setRecords(data);
    savePayables(data);
  };

  // ---- 编辑 ----
  const handleEdit = () => {
    if (!editRecord) return;
    const updated = records.map((r) =>
      r.id === editRecord.id
        ? {
            ...r,
            priority: form.priority,
            status: form.status,
            suggestion: form.suggestion,
            manager: form.manager,
          }
        : r
    );
    persist(updated);
    setShowEdit(false);
    setEditRecord(null);
    window.alert('修改成功');
  };

  const openEditModal = (record: PayableRecord) => {
    setEditRecord(record);
    setForm({
      priority: record.priority,
      status: record.status,
      suggestion: record.suggestion,
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

  const openDeleteModal = (record: PayableRecord) => {
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
    <PageContainer title="应付账款" subtitle="供应商应付、付款优先级、付款状态及到期预警。">
      {/* ==================== 指标卡片 ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">应付总额</p>
              <p className="metric-value mt-1">{formatMoney(totalAmount)}</p>
              <p className="metric-sub text-red-500">较上月 +12.3 万</p>
            </div>
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">月内待付</p>
              <p className="metric-value mt-1 text-amber-600">{formatMoney(dueSoonAmount)}</p>
              <p className="metric-sub text-amber-600">7天内到期</p>
            </div>
            <div className="bg-amber-100 p-2.5 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">经营提示</p>
              <p className="metric-value mt-1 text-amber-600">需关注</p>
              <p className="metric-sub text-amber-600">工资必须付款</p>
            </div>
            <div className="bg-amber-100 p-2.5 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">高优先级付款数量</p>
              <p className="metric-value mt-1 text-red-600">{highPriorityCount} 个</p>
              <p className="metric-sub text-red-500">必须+优先</p>
            </div>
            <div className="bg-red-100 p-2.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 搜索 + 过滤 ==================== */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col gap-4">
          {/* 搜索框 */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="搜索供应商名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 优先级过滤 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 whitespace-nowrap">优先级:</span>
            {PRIORITY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setPriorityFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  priorityFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 状态过滤 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 whitespace-nowrap">付款状态:</span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f.value
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
                <th>供应商</th>
                <th>应付金额</th>
                <th>已付金额</th>
                <th>未付金额</th>
                <th>到期日</th>
                <th>优先级</th>
                <th>付款状态</th>
                <th>付款建议</th>
                <th>负责人</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center text-slate-400 py-12">
                    暂无数据
                  </td>
                </tr>
              ) : (
                pagedData.map((record) => {
                  const unpaid = record.amount - record.paid;
                  const isDueSoon = isPaymentDueSoon(record.dueDate, 7);
                  return (
                    <tr
                      key={record.id}
                      className={isDueSoon ? 'border-l-4 border-l-red-400' : ''}
                    >
                      <td className="font-medium text-slate-800">{record.supplier}</td>
                      <td className="font-medium">{formatMoney(record.amount)}</td>
                      <td className="text-green-600 font-medium">{formatMoney(record.paid)}</td>
                      <td className="text-red-500 font-medium">{formatMoney(Math.max(0, unpaid))}</td>
                      <td className="text-slate-600">{record.dueDate}</td>
                      <td>
                        <span className={getPriorityTag(record.priority)}>
                          {record.priority}
                        </span>
                      </td>
                      <td>
                        <span className={getPayableStatusTag(record.status)}>
                          {record.status}
                        </span>
                      </td>
                      <td className="text-slate-500 max-w-[150px] truncate" title={record.suggestion}>
                        {record.suggestion || '-'}
                      </td>
                      <td>{record.manager}</td>
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
              <h3 className="text-lg font-semibold text-slate-800">编辑应付账款</h3>
              <button
                onClick={closeModals}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-500">
              供应商: <span className="font-medium text-slate-700">{editRecord.supplier}</span>
              <span className="mx-3">|</span>
              应付: <span className="font-medium text-slate-700">{formatMoney(editRecord.amount)}</span>
              <span className="mx-3">|</span>
              到期日: <span className="font-medium text-slate-700">{editRecord.dueDate}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>优先级</label>
                <select
                  className={selectCls}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as PayPriority })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>付款状态</label>
                <select
                  className={selectCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as PayableStatus })}
                >
                  {PAYABLE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
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
                <label className={labelCls}>付款建议</label>
                <textarea
                  className={inputCls}
                  value={form.suggestion}
                  onChange={(e) => setForm({ ...form, suggestion: e.target.value })}
                  placeholder="付款建议"
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
              <p className="text-sm text-slate-500 mb-1">确定要删除该应付账款记录吗？</p>
              <p className="text-sm font-medium text-slate-700 mb-6">
                {deleteRecord.supplier} - {formatMoney(deleteRecord.amount)}
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
