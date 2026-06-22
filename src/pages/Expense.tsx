import React, { useEffect, useState, useMemo } from 'react';
import { getExpenses, saveExpenses } from '@/data/mockData';
import PageContainer from '@/components/layout/PageContainer';
import { formatMoney } from '@/utils/format';
import { syncExpenseToPayableAndBudget } from '@/services/businessSync';
import type { ExpenseRecord, ExpenseType, PaymentStatus, ReceiptStatus } from '@/types';
import {
  TrendingDown,
  DollarSign,
  AlertTriangle,
  PieChart,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

// ==================== 辅助函数 ====================

function getPaymentStatusTag(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    已付款: 'tag-green',
    部分付款: 'tag-orange',
    未付款: 'tag-red',
  };
  return map[status] || 'tag-gray';
}

function getReceiptStatusTag(status: ReceiptStatus) {
  const map: Record<ReceiptStatus, string> = {
    已收票: 'tag-green',
    部分收票: 'tag-orange',
    未收票: 'tag-gray',
  };
  return map[status] || 'tag-gray';
}

const EXPENSE_TYPES: ExpenseType[] = [
  '材料采购',
  '劳务费用',
  '工资薪酬',
  '机械费用',
  '分包费用',
  '管理费用',
  '税费支出',
  '日常报销',
  '市场费用',
  '其他支出',
];

const PAYMENT_STATUSES: PaymentStatus[] = ['未付款', '部分付款', '已付款'];
const RECEIPT_STATUSES: ReceiptStatus[] = ['未收票', '部分收票', '已收票'];
const DEPARTMENTS = ['公司整体', '财务部', '行政部', '销售部', '生产部', '市场部'];

const PAGE_SIZE = 10;

export default function ExpensePage() {
  // ---- 数据状态 ----
  const [records, setRecords] = useState<ExpenseRecord[]>(() => getExpenses());
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('全部');
  const [receiptFilter, setReceiptFilter] = useState<string>('全部');
  const [deptFilter, setDeptFilter] = useState<string>('全部');
  const [page, setPage] = useState(1);

  // ---- 弹窗状态 ----
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editRecord, setEditRecord] = useState<ExpenseRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<ExpenseRecord | null>(null);

  // ---- 表单状态 ----
  const emptyForm = {
    supplier: '',
    type: '材料采购' as ExpenseType,
    department: '生产部',
    amount: 0,
    paid: 0,
    paymentStatus: '未付款' as PaymentStatus,
    receiptStatus: '未收票' as ReceiptStatus,
    plannedPayDate: '',
    manager: '',
    remark: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ---- 计算汇总 ----
  const totalAmount = useMemo(() => records.reduce((sum, r) => sum + r.amount, 0), [records]);
  const totalPaid = useMemo(() => records.reduce((sum, r) => sum + r.paid, 0), [records]);
  const totalUnpaid = totalAmount - totalPaid;
  const paymentRate = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  // 待付金额 = 本月到期未付的(简化用未付金额中的工资薪酬部分展示)
  const salaryUnpaid = useMemo(
    () => records.filter((r) => r.type === '工资薪酬' && r.paymentStatus !== '已付款').reduce((sum, r) => sum + (r.amount - r.paid), 0),
    [records]
  );

  // ---- 过滤 ----
  const filtered = useMemo(() => {
    let result = records;

    if (search) {
      const kw = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.supplier.toLowerCase().includes(kw) ||
          r.code.toLowerCase().includes(kw) ||
          r.department.toLowerCase().includes(kw) ||
          (r.remark && r.remark.toLowerCase().includes(kw))
      );
    }

    if (paymentFilter !== '全部') {
      result = result.filter((r) => r.paymentStatus === paymentFilter);
    }

    if (receiptFilter !== '全部') {
      result = result.filter((r) => r.receiptStatus === receiptFilter);
    }

    if (deptFilter !== '全部') {
      result = result.filter((r) => r.department === deptFilter);
    }

    return result;
  }, [records, search, paymentFilter, receiptFilter, deptFilter]);

  // ---- 分页 ----
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useMemo(() => {
    setPage(1);
  }, [search, paymentFilter, receiptFilter, deptFilter]);

  useEffect(() => {
    const openAdd = (event: Event) => {
      const pageName = (event as CustomEvent<{ page: string }>).detail?.page;
      if (pageName === 'expense') {
        setForm(emptyForm);
        setShowAdd(true);
      }
    };
    const reloadImportedData = (event: Event) => {
      const pageName = (event as CustomEvent<{ page: string }>).detail?.page;
      if (pageName === 'expense') setRecords(getExpenses());
    };
    window.addEventListener('fms:open-add', openAdd);
    window.addEventListener('fms:data-imported', reloadImportedData);
    return () => {
      window.removeEventListener('fms:open-add', openAdd);
      window.removeEventListener('fms:data-imported', reloadImportedData);
    };
  }, []);

  // ---- 持久化 ----
  const persist = (data: ExpenseRecord[]) => {
    setRecords(data);
    saveExpenses(data);
  };

  // ---- 操作 ----
  const handleAdd = () => {
    const newId = `exp-${Date.now()}`;
    const codeNum = records.length + 1;
    const newRecord: ExpenseRecord = {
      id: newId,
      code: `EXP-2026-${String(codeNum).padStart(3, '0')}`,
      supplier: form.supplier,
      type: form.type,
      department: form.department,
      amount: form.amount,
      paid: form.paid,
      paymentStatus: form.paymentStatus,
      receiptStatus: form.receiptStatus,
      plannedPayDate: form.plannedPayDate,
      manager: form.manager,
      remark: form.remark,
    };
    const updated = [...records, newRecord];
    persist(updated);
    syncExpenseToPayableAndBudget(newRecord);
    setShowAdd(false);
    setForm(emptyForm);
    window.alert('新增支出成功');
  };

  const handleEdit = () => {
    if (!editRecord) return;
    const updated = records.map((r) =>
      r.id === editRecord.id
        ? {
            ...r,
            supplier: form.supplier,
            type: form.type,
            department: form.department,
            amount: form.amount,
            paid: form.paid,
            paymentStatus: form.paymentStatus,
            receiptStatus: form.receiptStatus,
            plannedPayDate: form.plannedPayDate,
            manager: form.manager,
            remark: form.remark,
          }
        : r
    );
    persist(updated);
    setShowEdit(false);
    setEditRecord(null);
    setForm(emptyForm);
    window.alert('修改支出成功');
  };

  const handleDelete = () => {
    if (!deleteRecord) return;
    const updated = records.filter((r) => r.id !== deleteRecord.id);
    persist(updated);
    setShowDelete(false);
    setDeleteRecord(null);
    window.alert('删除支出成功');
  };

  const openEditModal = (record: ExpenseRecord) => {
    setEditRecord(record);
    setForm({
      supplier: record.supplier,
      type: record.type,
      department: record.department,
      amount: record.amount,
      paid: record.paid,
      paymentStatus: record.paymentStatus,
      receiptStatus: record.receiptStatus,
      plannedPayDate: record.plannedPayDate,
      manager: record.manager,
      remark: record.remark,
    });
    setShowEdit(true);
  };

  const openDeleteModal = (record: ExpenseRecord) => {
    setDeleteRecord(record);
    setShowDelete(true);
  };

  const closeModals = () => {
    setShowAdd(false);
    setShowEdit(false);
    setShowDelete(false);
    setEditRecord(null);
    setDeleteRecord(null);
    setForm(emptyForm);
  };

  // ---- Form field component ----
  const inputCls =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const selectCls = inputCls;
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  const renderFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>供应商</label>
        <input
          className={inputCls}
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
          placeholder="供应商名称"
        />
      </div>
      <div>
        <label className={labelCls}>类型</label>
        <select
          className={selectCls}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as ExpenseType })}
        >
          {EXPENSE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>部门</label>
        <select
          className={selectCls}
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>计划付款日</label>
        <input
          className={inputCls}
          type="date"
          value={form.plannedPayDate}
          onChange={(e) => setForm({ ...form, plannedPayDate: e.target.value })}
        />
      </div>
      <div>
        <label className={labelCls}>金额（万）</label>
        <input
          className={inputCls}
          type="number"
          step="0.1"
          value={form.amount || ''}
          onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>
      <div>
        <label className={labelCls}>已付（万）</label>
        <input
          className={inputCls}
          type="number"
          step="0.1"
          value={form.paid || ''}
          onChange={(e) => setForm({ ...form, paid: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>
      <div>
        <label className={labelCls}>付款状态</label>
        <select
          className={selectCls}
          value={form.paymentStatus}
          onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>发票状态</label>
        <select
          className={selectCls}
          value={form.receiptStatus}
          onChange={(e) => setForm({ ...form, receiptStatus: e.target.value as ReceiptStatus })}
        >
          {RECEIPT_STATUSES.map((s) => (
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
        <label className={labelCls}>备注</label>
        <textarea
          className={inputCls}
          value={form.remark}
          onChange={(e) => setForm({ ...form, remark: e.target.value })}
          placeholder="备注信息"
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <PageContainer title="支出管理" subtitle="本月支出明细、供应商付款、发票状态及费用分布情况。">
      {/* ==================== 指标卡片 ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">本月支出</p>
              <p className="metric-value mt-1">{formatMoney(totalAmount)}</p>
              <p className="metric-sub">费用率 72.9%</p>
            </div>
            <div className="bg-orange-100 p-2.5 rounded-lg">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">待付金额</p>
              <p className="metric-value mt-1">{formatMoney(totalUnpaid)}</p>
              <p className="metric-sub">付款率 {paymentRate.toFixed(1)}%</p>
            </div>
            <div className="bg-red-100 p-2.5 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">经营提示</p>
              <p className="metric-value mt-1 text-amber-600">需关注</p>
              <p className="metric-sub text-amber-600">工资待付{formatMoney(salaryUnpaid)}</p>
            </div>
            <div className="bg-amber-100 p-2.5 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">本月费用率</p>
              <p className="metric-value mt-1">72.9%</p>
              <p className="metric-sub text-green-600">较上月 -1.5%</p>
            </div>
            <div className="bg-indigo-100 p-2.5 rounded-lg">
              <PieChart className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 搜索 + 过滤 + 新增按钮 ==================== */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="搜索供应商、支出编号、部门..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 部门过滤 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">部门:</span>
            <select
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="全部">全部</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* 付款状态过滤 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">付款:</span>
            {['全部', '未付款', '部分付款', '已付款'].map((f) => (
              <button
                key={f}
                onClick={() => setPaymentFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  paymentFilter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* 发票状态过滤 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">发票:</span>
            {['全部', '未收票', '部分收票', '已收票'].map((f) => (
              <button
                key={f}
                onClick={() => setReceiptFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  receiptFilter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* 新增按钮 */}
          <button
            onClick={() => {
              setForm(emptyForm);
              setShowAdd(true);
            }}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            <Plus className="w-4 h-4" />
            新增支出
          </button>
        </div>
      </div>

      {/* ==================== 数据表格 ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>支出编号</th>
                <th>供应商</th>
                <th>类型</th>
                <th>部门</th>
                <th>金额(万)</th>
                <th>已付(万)</th>
                <th>未付(万)</th>
                <th>付款状态</th>
                <th>发票状态</th>
                <th>计划付款日</th>
                <th>负责人</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center text-slate-400 py-12">
                    暂无数据
                  </td>
                </tr>
              ) : (
                pagedData.map((record, idx) => {
                  const unpaid = record.amount - record.paid;
                  return (
                    <tr
                      key={record.id}
                      className={idx % 2 === 1 ? 'bg-slate-50/50' : ''}
                    >
                      <td className="font-medium text-slate-800">{record.code}</td>
                      <td>{record.supplier}</td>
                      <td>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {record.type}
                        </span>
                      </td>
                      <td>{record.department}</td>
                      <td className="font-medium">{formatMoney(record.amount)}</td>
                      <td className="text-green-600 font-medium">{formatMoney(record.paid)}</td>
                      <td className="text-red-500 font-medium">{formatMoney(unpaid)}</td>
                      <td>
                        <span className={getPaymentStatusTag(record.paymentStatus)}>
                          {record.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className={getReceiptStatusTag(record.receiptStatus)}>
                          {record.receiptStatus}
                        </span>
                      </td>
                      <td className="text-slate-500">{record.plannedPayDate || '-'}</td>
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
      </div>

      {/* ==================== 新增支出弹窗 ==================== */}
      {showAdd && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">新增支出</h3>
              <button
                onClick={closeModals}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderFormFields()}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={closeModals} className="btn-secondary">
                取消
              </button>
              <button onClick={handleAdd} className="btn-primary">
                确认新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 编辑支出弹窗 ==================== */}
      {showEdit && editRecord && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">编辑支出</h3>
              <button
                onClick={closeModals}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-500">
              支出编号: <span className="font-medium text-slate-700">{editRecord.code}</span>
            </div>
            {renderFormFields()}
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
              <p className="text-sm text-slate-500 mb-1">
                确定要删除该支出记录吗？
              </p>
              <p className="text-sm font-medium text-slate-700 mb-6">
                {deleteRecord.code} - {deleteRecord.supplier}
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
