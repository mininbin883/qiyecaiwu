import React, { useEffect, useState, useMemo } from 'react';
import { getContracts, saveContracts } from '@/data/mockData';
import PageContainer from '@/components/layout/PageContainer';
import { formatMoney } from '@/utils/format';
import type { ContractRecord, ContractType, ContractStatus, ContractRisk } from '@/types';
import {
  FileSignature,
  DollarSign,
  AlertTriangle,
  ClipboardCheck,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

// ==================== 标签映射 ====================

function getTypeTag(type: ContractType) {
  const map: Record<ContractType, string> = {
    '销售合同': 'tag-green',
    '采购合同': 'tag-blue',
    '服务合同': 'tag-purple',
    '分包合同': 'tag-orange',
    '租赁合同': 'tag-gray',
    '其他合同': 'tag-gray',
  };
  return map[type] || 'tag-gray';
}

function getStatusTag(status: ContractStatus) {
  const map: Record<ContractStatus, string> = {
    '草稿': 'tag-gray',
    '审批中': 'tag-orange',
    '执行中': 'tag-blue',
    '已完成': 'tag-green',
    '已终止': 'tag-red',
  };
  return map[status] || 'tag-gray';
}

function getRiskTag(risk: ContractRisk) {
  const map: Record<ContractRisk, string> = {
    '正常': 'tag-green',
    '需关注': 'tag-orange',
    '回款风险': 'tag-red',
    '履约风险': 'tag-red',
    '即将到期': 'tag-yellow',
  };
  return map[risk] || 'tag-gray';
}

const CONTRACT_TYPES: ContractType[] = [
  '销售合同', '采购合同', '服务合同', '分包合同', '租赁合同', '其他合同',
];
const CONTRACT_STATUSES: ContractStatus[] = [
  '草稿', '审批中', '执行中', '已完成', '已终止',
];
const CONTRACT_RISKS: ContractRisk[] = [
  '正常', '需关注', '回款风险', '履约风险', '即将到期',
];

const PAGE_SIZE = 8;

export default function ContractsPage() {
  // ---- 数据状态 ----
  const [records, setRecords] = useState<ContractRecord[]>(() => getContracts());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('全部');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [riskFilter, setRiskFilter] = useState<string>('全部');
  const [page, setPage] = useState(1);

  // ---- 弹窗状态 ----
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editRecord, setEditRecord] = useState<ContractRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<ContractRecord | null>(null);

  // ---- 表单状态 ----
  const emptyForm = {
    code: '',
    party: '',
    type: '销售合同' as ContractType,
    amount: 0,
    signDate: '',
    status: '草稿' as ContractStatus,
    project: '',
    settled: 0,
    riskStatus: '正常' as ContractRisk,
    remark: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ---- 计算汇总 ----
  const totalAmount = useMemo(
    () => records.reduce((sum, r) => sum + r.amount, 0),
    [records]
  );
  const totalSettled = useMemo(
    () => records.reduce((sum, r) => sum + r.settled, 0),
    [records]
  );
  const totalUnsettled = totalAmount - totalSettled;
  const riskContracts = useMemo(
    () => records.filter((r) => r.riskStatus !== '正常'),
    [records]
  );
  const executingContracts = useMemo(
    () => records.filter((r) => r.status === '执行中'),
    [records]
  );
  const pendingApproval = useMemo(
    () => records.filter((r) => r.status === '审批中'),
    [records]
  );

  // ---- 过滤 ----
  const filtered = useMemo(() => {
    let result = records;

    if (search) {
      const kw = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(kw) ||
          r.party.toLowerCase().includes(kw) ||
          r.project.toLowerCase().includes(kw)
      );
    }

    if (typeFilter !== '全部') {
      result = result.filter((r) => r.type === typeFilter);
    }
    if (statusFilter !== '全部') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (riskFilter !== '全部') {
      result = result.filter((r) => r.riskStatus === riskFilter);
    }

    return result;
  }, [records, search, typeFilter, statusFilter, riskFilter]);

  // ---- 分页 ----
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // 搜索/过滤后重置页码
  useMemo(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, riskFilter]);

  useEffect(() => {
    const openAdd = (event: Event) => {
      const pageName = (event as CustomEvent<{ page: string }>).detail?.page;
      if (pageName === 'contracts') {
        setForm(emptyForm);
        setShowAdd(true);
      }
    };
    window.addEventListener('fms:open-add', openAdd);
    return () => window.removeEventListener('fms:open-add', openAdd);
  }, []);

  // ---- 持久化 ----
  const persist = (data: ContractRecord[]) => {
    setRecords(data);
    saveContracts(data);
  };

  // ---- 操作 ----
  const handleAdd = () => {
    const newId = `ctr-${Date.now()}`;
    const codeNum = records.length + 1;
    const newRecord: ContractRecord = {
      id: newId,
      code: form.code || `HT-2026-${String(codeNum + 25).padStart(3, '0')}`,
      party: form.party,
      type: form.type,
      amount: form.amount,
      signDate: form.signDate,
      status: form.status,
      project: form.project,
      settled: form.settled,
      riskStatus: form.riskStatus,
      remark: form.remark,
    };
    const updated = [...records, newRecord];
    persist(updated);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleEdit = () => {
    if (!editRecord) return;
    const updated = records.map((r) =>
      r.id === editRecord.id
        ? {
            ...r,
            code: form.code,
            party: form.party,
            type: form.type,
            amount: form.amount,
            signDate: form.signDate,
            status: form.status,
            project: form.project,
            settled: form.settled,
            riskStatus: form.riskStatus,
            remark: form.remark,
          }
        : r
    );
    persist(updated);
    setShowEdit(false);
    setEditRecord(null);
    setForm(emptyForm);
  };

  const handleDelete = () => {
    if (!deleteRecord) return;
    const updated = records.filter((r) => r.id !== deleteRecord.id);
    persist(updated);
    setShowDelete(false);
    setDeleteRecord(null);
  };

  const openEditModal = (record: ContractRecord) => {
    setEditRecord(record);
    setForm({
      code: record.code,
      party: record.party,
      type: record.type,
      amount: record.amount,
      signDate: record.signDate,
      status: record.status,
      project: record.project,
      settled: record.settled,
      riskStatus: record.riskStatus,
      remark: record.remark,
    });
    setShowEdit(true);
  };

  const openDeleteModal = (record: ContractRecord) => {
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

  // ---- 合同类型分布统计 ----
  const typeDistribution = useMemo(() => {
    const map = new Map<ContractType, { count: number; total: number }>();
    records.forEach((r) => {
      const existing = map.get(r.type);
      if (existing) {
        existing.count++;
        existing.total += r.amount;
      } else {
        map.set(r.type, { count: 1, total: r.amount });
      }
    });
    return Array.from(map.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      total: data.total,
    }));
  }, [records]);

  // ---- Form field styles ----
  const inputCls =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const selectCls = inputCls;
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  const renderFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>合同编号</label>
        <input
          className={inputCls}
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="HT-2026-XXX"
        />
      </div>
      <div>
        <label className={labelCls}>客户/供应商</label>
        <input
          className={inputCls}
          value={form.party}
          onChange={(e) => setForm({ ...form, party: e.target.value })}
          placeholder="对方名称"
        />
      </div>
      <div>
        <label className={labelCls}>合同类型</label>
        <select
          className={selectCls}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as ContractType })}
        >
          {CONTRACT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
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
        <label className={labelCls}>签约日</label>
        <input
          className={inputCls}
          type="date"
          value={form.signDate}
          onChange={(e) => setForm({ ...form, signDate: e.target.value })}
        />
      </div>
      <div>
        <label className={labelCls}>执行状态</label>
        <select
          className={selectCls}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as ContractStatus })}
        >
          {CONTRACT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
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
        <label className={labelCls}>已收/已付（万）</label>
        <input
          className={inputCls}
          type="number"
          step="0.1"
          value={form.settled || ''}
          onChange={(e) => setForm({ ...form, settled: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>
      <div>
        <label className={labelCls}>风险状态</label>
        <select
          className={selectCls}
          value={form.riskStatus}
          onChange={(e) => setForm({ ...form, riskStatus: e.target.value as ContractRisk })}
        >
          {CONTRACT_RISKS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
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

  // ---- 过滤标签按钮 ----
  const renderFilterButtons = (
    label: string,
    options: string[],
    value: string,
    onChange: (v: string) => void
  ) => (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500 whitespace-nowrap">{label}:</span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            value === opt
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <PageContainer title="合同管理" subtitle="合同列表、执行状态、收付款进度及风险状态管理。">
      {/* ==================== 指标卡片 ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">合同总额</p>
              <p className="metric-value mt-1">{formatMoney(totalAmount)}</p>
              <p className="metric-sub">{records.length}个合同</p>
            </div>
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <FileSignature className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">待收/待付金额</p>
              <p className="metric-value mt-1">{formatMoney(totalUnsettled)}</p>
              <p className="metric-sub">含未收+未付</p>
            </div>
            <div className="bg-amber-100 p-2.5 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">经营提示</p>
              <p className="metric-value mt-1 text-amber-600">
                {riskContracts.length > 0 ? '需关注' : '正常'}
              </p>
              <p className="metric-sub text-amber-600">
                {riskContracts.length > 0 ? `${riskContracts.length}个风险合同` : '无风险'}
              </p>
            </div>
            <div className="bg-amber-100 p-2.5 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">执行中合同数量</p>
              <p className="metric-value mt-1">{executingContracts.length} 个</p>
              <p className="metric-sub">
                还有{pendingApproval.length}个待审批
              </p>
            </div>
            <div className="bg-green-100 p-2.5 rounded-lg">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 搜索 + 过滤 + 新增按钮 ==================== */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            {/* 搜索框 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="搜索合同编号、客户/供应商、项目..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
              新增合同
            </button>
          </div>

          {/* 过滤行 */}
          <div className="flex flex-wrap items-center gap-4">
            {renderFilterButtons('类型', [
              '全部', ...CONTRACT_TYPES,
            ], typeFilter, setTypeFilter)}
            {renderFilterButtons('状态', [
              '全部', ...CONTRACT_STATUSES,
            ], statusFilter, setStatusFilter)}
            {renderFilterButtons('风险', [
              '全部', ...CONTRACT_RISKS,
            ], riskFilter, setRiskFilter)}
          </div>
        </div>
      </div>

      {/* ==================== 数据表格 ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>合同编号</th>
                <th>客户/供应商</th>
                <th>类型</th>
                <th>金额(万)</th>
                <th>签约日</th>
                <th>执行状态</th>
                <th>项目</th>
                <th>已收/已付(万)</th>
                <th>未收/未付(万)</th>
                <th>风险状态</th>
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
                pagedData.map((record, idx) => {
                  const unsettled = record.amount - record.settled;
                  return (
                    <tr
                      key={record.id}
                      className={idx % 2 === 1 ? 'bg-slate-50/50' : ''}
                    >
                      <td className="font-medium text-slate-800">{record.code}</td>
                      <td>{record.party}</td>
                      <td>
                        <span className={getTypeTag(record.type)}>
                          {record.type}
                        </span>
                      </td>
                      <td className="font-medium">{formatMoney(record.amount)}</td>
                      <td className="text-slate-500">{record.signDate}</td>
                      <td>
                        <span className={getStatusTag(record.status)}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.project}</td>
                      <td className="text-green-600 font-medium">{formatMoney(record.settled)}</td>
                      <td className="text-red-500 font-medium">{formatMoney(unsettled)}</td>
                      <td>
                        <span className={getRiskTag(record.riskStatus)}>
                          {record.riskStatus}
                        </span>
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

      {/* ==================== 合同类型分布汇总 ==================== */}
      <div className="mt-6 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">合同类型分布</h3>
        <div className="flex flex-wrap gap-3">
          {typeDistribution.map((item) => (
            <div
              key={item.type}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100"
            >
              <span className={getTypeTag(item.type)}>{item.type}</span>
              <span className="text-sm font-medium text-slate-700">
                {item.count} 个
              </span>
              <span className="text-xs text-slate-400">
                {formatMoney(item.total)}
              </span>
            </div>
          ))}
          {typeDistribution.length === 0 && (
            <p className="text-sm text-slate-400">暂无数据</p>
          )}
        </div>
      </div>

      {/* ==================== 新增合同弹窗 ==================== */}
      {showAdd && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">新增合同</h3>
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

      {/* ==================== 编辑合同弹窗 ==================== */}
      {showEdit && editRecord && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">编辑合同</h3>
              <button
                onClick={closeModals}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-500">
              合同编号: <span className="font-medium text-slate-700">{editRecord.code}</span>
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
                确定要删除该合同记录吗？
              </p>
              <p className="text-sm font-medium text-slate-700 mb-6">
                {deleteRecord.code} - {deleteRecord.party}
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
