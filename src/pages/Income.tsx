import React, { useEffect, useState, useMemo } from 'react';
import { getIncomes, saveIncomes } from '@/data/mockData';
import PageContainer from '@/components/layout/PageContainer';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatMoney } from '@/utils/format';
import { validateMoney, validateNotGreater, validateRequired } from '@/utils/validation';
import { syncIncomeToReceivable } from '@/services/businessSync';
import type { IncomeRecord, IncomeType, InvoiceStatus, CollectionStatus } from '@/types';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileText,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

// ==================== 辅助函数 ====================

function getInvoiceStatusTag(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, string> = {
    已开票: 'tag-green',
    部分开票: 'tag-orange',
    未开票: 'tag-gray',
  };
  return map[status] || 'tag-gray';
}

function getCollectionStatusTag(status: CollectionStatus) {
  const map: Record<CollectionStatus, string> = {
    已回款: 'tag-green',
    部分回款: 'tag-orange',
    未回款: 'tag-red',
  };
  return map[status] || 'tag-gray';
}

const INCOME_TYPES: IncomeType[] = ['销售收入', '工程收入', '服务收入', '其他收入'];
const INVOICE_STATUSES: InvoiceStatus[] = ['未开票', '部分开票', '已开票'];
const COLLECTION_STATUSES: CollectionStatus[] = ['未回款', '部分回款', '已回款'];

const PAGE_SIZE = 10;

export default function IncomePage() {
  // ---- 数据状态 ----
  const [records, setRecords] = useState<IncomeRecord[]>(() => getIncomes());
  const [search, setSearch] = useState('');
  const [collectionFilter, setCollectionFilter] = useState<string>('全部');
  const [invoiceFilter, setInvoiceFilter] = useState<string>('全部');
  const [page, setPage] = useState(1);

  // ---- 弹窗状态 ----
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editRecord, setEditRecord] = useState<IncomeRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<IncomeRecord | null>(null);

  // ---- 表单状态 ----
  const emptyForm = {
    customer: '',
    type: '销售收入' as IncomeType,
    contractCode: '',
    project: '',
    amount: 0,
    collected: 0,
    invoiceStatus: '未开票' as InvoiceStatus,
    collectionStatus: '未回款' as CollectionStatus,
    manager: '',
    remark: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ---- 计算汇总 ----
  const totalAmount = useMemo(() => records.reduce((sum, r) => sum + r.amount, 0), [records]);
  const totalCollected = useMemo(() => records.reduce((sum, r) => sum + r.collected, 0), [records]);
  const totalUncollected = totalAmount - totalCollected;
  const collectionRate = totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0;
  const invoicedAmount = useMemo(
    () => records.filter((r) => r.invoiceStatus === '已开票').reduce((sum, r) => sum + r.amount, 0),
    [records]
  );
  const invoiceRate = totalAmount > 0 ? (invoicedAmount / totalAmount) * 100 : 0;

  // ---- 过滤 ----
  const filtered = useMemo(() => {
    let result = records;

    if (search) {
      const kw = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.customer.toLowerCase().includes(kw) ||
          r.contractCode.toLowerCase().includes(kw) ||
          r.project.toLowerCase().includes(kw)
      );
    }

    if (collectionFilter !== '全部') {
      result = result.filter((r) => r.collectionStatus === collectionFilter);
    }

    if (invoiceFilter !== '全部') {
      result = result.filter((r) => r.invoiceStatus === invoiceFilter);
    }

    return result;
  }, [records, search, collectionFilter, invoiceFilter]);

  // ---- 分页 ----
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // 搜索/过滤后重置页码
  useEffect(() => {
    setPage(1);
  }, [search, collectionFilter, invoiceFilter]);

  useEffect(() => {
    const openAdd = (event: Event) => {
      const page = (event as CustomEvent<{ page: string }>).detail?.page;
      if (page === 'income') {
        setForm(emptyForm);
        setShowAdd(true);
      }
    };
    const reloadImportedData = (event: Event) => {
      const page = (event as CustomEvent<{ page: string }>).detail?.page;
      if (page === 'income') setRecords(getIncomes());
    };
    window.addEventListener('fms:open-add', openAdd);
    window.addEventListener('fms:data-imported', reloadImportedData);
    return () => {
      window.removeEventListener('fms:open-add', openAdd);
      window.removeEventListener('fms:data-imported', reloadImportedData);
    };
  }, []);

  // ---- 持久化 ----
  const persist = (data: IncomeRecord[]) => {
    setRecords(data);
    saveIncomes(data);
  };

  // ---- 操作 ----
  const validateForm = () => {
    const checks = [
      validateRequired(form.customer, '客户'),
      validateRequired(form.contractCode, '合同编号'),
      validateMoney(form.amount, '收入金额'),
      validateMoney(form.collected, '已收金额'),
      validateNotGreater(form.collected, form.amount, '已收金额', '收入金额'),
    ];
    const failed = checks.find((item) => !item.valid);
    if (failed?.message) {
      window.alert(failed.message);
      return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (!validateForm()) return;
    const newId = `inc-${Date.now()}`;
    const codeNum = records.length + 1;
    const newRecord: IncomeRecord = {
      id: newId,
      code: `INC-2026-${String(codeNum).padStart(3, '0')}`,
      customer: form.customer,
      type: form.type,
      contractCode: form.contractCode,
      project: form.project,
      amount: form.amount,
      collected: form.collected,
      invoiceStatus: form.invoiceStatus,
      collectionStatus: form.collectionStatus,
      manager: form.manager,
      remark: form.remark,
    };
    const updated = [...records, newRecord];
    persist(updated);
    syncIncomeToReceivable(newRecord);
    setShowAdd(false);
    setForm(emptyForm);
    window.alert('新增收入成功');
  };

  const handleEdit = () => {
    if (!editRecord) return;
    if (!validateForm()) return;
    const updated = records.map((r) =>
      r.id === editRecord.id
        ? {
            ...r,
            customer: form.customer,
            type: form.type,
            contractCode: form.contractCode,
            project: form.project,
            amount: form.amount,
            collected: form.collected,
            invoiceStatus: form.invoiceStatus,
            collectionStatus: form.collectionStatus,
            manager: form.manager,
            remark: form.remark,
          }
        : r
    );
    persist(updated);
    setShowEdit(false);
    setEditRecord(null);
    setForm(emptyForm);
    window.alert('修改收入成功');
  };

  const handleDelete = () => {
    if (!deleteRecord) return;
    const updated = records.filter((r) => r.id !== deleteRecord.id);
    persist(updated);
    setShowDelete(false);
    setDeleteRecord(null);
    window.alert('删除收入成功');
  };

  const openEditModal = (record: IncomeRecord) => {
    setEditRecord(record);
    setForm({
      customer: record.customer,
      type: record.type,
      contractCode: record.contractCode,
      project: record.project,
      amount: record.amount,
      collected: record.collected,
      invoiceStatus: record.invoiceStatus,
      collectionStatus: record.collectionStatus,
      manager: record.manager,
      remark: record.remark,
    });
    setShowEdit(true);
  };

  const openDeleteModal = (record: IncomeRecord) => {
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
        <label className={labelCls}>客户</label>
        <input
          className={inputCls}
          value={form.customer}
          onChange={(e) => setForm({ ...form, customer: e.target.value })}
          placeholder="客户名称"
        />
      </div>
      <div>
        <label className={labelCls}>类型</label>
        <select
          className={selectCls}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as IncomeType })}
        >
          {INCOME_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>合同</label>
        <input
          className={inputCls}
          value={form.contractCode}
          onChange={(e) => setForm({ ...form, contractCode: e.target.value })}
          placeholder="合同编号"
        />
      </div>
      <div>
        <label className={labelCls}>项目</label>
        <input
          className={inputCls}
          value={form.project}
          onChange={(e) => setForm({ ...form, project: e.target.value })}
          placeholder="项目名称"
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
        <label className={labelCls}>已收（万）</label>
        <input
          className={inputCls}
          type="number"
          step="0.1"
          value={form.collected || ''}
          onChange={(e) => setForm({ ...form, collected: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>
      <div>
        <label className={labelCls}>开票状态</label>
        <select
          className={selectCls}
          value={form.invoiceStatus}
          onChange={(e) => setForm({ ...form, invoiceStatus: e.target.value as InvoiceStatus })}
        >
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>回款状态</label>
        <select
          className={selectCls}
          value={form.collectionStatus}
          onChange={(e) => setForm({ ...form, collectionStatus: e.target.value as CollectionStatus })}
        >
          {COLLECTION_STATUSES.map((s) => (
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
    <PageContainer title="收入管理" subtitle="本月收入、客户回款、开票状态及合同关联情况。">
      {/* ==================== 指标卡片 ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">本月确认收入</p>
              <p className="metric-value mt-1">{formatMoney(totalAmount)}</p>
              <p className="metric-sub text-red-500">较上月 -28.6 万</p>
            </div>
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">本月已收款</p>
              <p className="metric-value mt-1">{formatMoney(totalCollected)}</p>
              <p className="metric-sub">回款率 {collectionRate.toFixed(1)}%</p>
            </div>
            <div className="bg-green-100 p-2.5 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">经营提示</p>
              <p className="metric-value mt-1 text-amber-600">需关注</p>
              <p className="metric-sub text-amber-600">部分客户回款慢</p>
            </div>
            <div className="bg-amber-100 p-2.5 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">本月开票金额</p>
              <p className="metric-value mt-1">{formatMoney(invoicedAmount)}</p>
              <p className="metric-sub">
                开票率 {invoiceRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-indigo-100 p-2.5 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
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
              placeholder="搜索客户、合同、项目..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 回款状态过滤 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">回款:</span>
            {['全部', '未回款', '部分回款', '已回款'].map((f) => (
              <button
                key={f}
                onClick={() => setCollectionFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  collectionFilter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* 开票状态过滤 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">开票:</span>
            {['全部', '未开票', '部分开票', '已开票'].map((f) => (
              <button
                key={f}
                onClick={() => setInvoiceFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  invoiceFilter === f
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
            新增收入
          </button>
        </div>
      </div>

      {/* ==================== 数据表格 ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>收入编号</th>
                <th>客户</th>
                <th>类型</th>
                <th>合同</th>
                <th>项目</th>
                <th>金额(万)</th>
                <th>已收(万)</th>
                <th>未收(万)</th>
                <th>开票状态</th>
                <th>回款状态</th>
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
                  const uncollected = record.amount - record.collected;
                  return (
                    <tr
                      key={record.id}
                      className={idx % 2 === 1 ? 'bg-slate-50/50' : ''}
                    >
                      <td className="font-medium text-slate-800">{record.code}</td>
                      <td>{record.customer}</td>
                      <td>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {record.type}
                        </span>
                      </td>
                      <td className="text-slate-500">{record.contractCode}</td>
                      <td>{record.project}</td>
                      <td className="font-medium">{formatMoney(record.amount)}</td>
                      <td className="text-green-600 font-medium">{formatMoney(record.collected)}</td>
                      <td className="text-red-500 font-medium">{formatMoney(uncollected)}</td>
                      <td>
                        <span className={getInvoiceStatusTag(record.invoiceStatus)}>
                          {record.invoiceStatus}
                        </span>
                      </td>
                      <td>
                        <span className={getCollectionStatusTag(record.collectionStatus)}>
                          {record.collectionStatus}
                        </span>
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

      {/* ==================== 新增收入弹窗 ==================== */}
      {showAdd && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">新增收入</h3>
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

      {/* ==================== 编辑收入弹窗 ==================== */}
      {showEdit && editRecord && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">编辑收入</h3>
              <button
                onClick={closeModals}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-500">
              收入编号: <span className="font-medium text-slate-700">{editRecord.code}</span>
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
        <ConfirmModal
          title="确认删除"
          danger
          description={`${deleteRecord.code} - ${deleteRecord.customer}`}
          onCancel={closeModals}
          onConfirm={handleDelete}
        />
      )}
    </PageContainer>
  );
}
