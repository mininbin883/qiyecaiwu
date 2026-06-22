import React, { useEffect, useState, useMemo } from 'react';
import { getBudgets, saveBudgets } from '@/data/mockData';
import PageContainer from '@/components/layout/PageContainer';
import { formatMoney, formatPercentPlain } from '@/utils/format';
import { calcBudgetUsageRate } from '@/utils/calculations';
import { getBudgetStatus, getBudgetStatusColor, getProgressBarColor } from '@/utils/riskRules';
import type { BudgetRecord, BudgetStatus } from '@/types';
import {
  PieChart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

// ==================== 标签映射 ====================

function getStatusTag(status: BudgetStatus) {
  const map: Record<BudgetStatus, string> = {
    '正常': 'tag-green',
    '需关注': 'tag-orange',
    '超预算': 'tag-red',
  };
  return map[status] || 'tag-gray';
}

const STATUS_FILTERS = ['全部', '正常', '需关注', '超预算'];

export default function BudgetPage() {
  // ---- 数据状态 ----
  const [records, setRecords] = useState<BudgetRecord[]>(() => getBudgets());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('全部');

  // ---- 弹窗状态 ----
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editRecord, setEditRecord] = useState<BudgetRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<BudgetRecord | null>(null);

  // ---- 表单状态 ----
  const emptyForm = {
    department: '',
    budgetAmount: 0,
    usedAmount: 0,
    manager: '',
    remark: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ---- 实时计算使用率 ----
  const formUsageRate = useMemo(() => {
    if (form.budgetAmount <= 0) return 0;
    return (form.usedAmount / form.budgetAmount) * 100;
  }, [form.budgetAmount, form.usedAmount]);

  const formUsageStatus = useMemo((): BudgetStatus => {
    if (formUsageRate >= 100) return '超预算';
    if (formUsageRate >= 80) return '需关注';
    return '正常';
  }, [formUsageRate]);

  // ---- 计算汇总 ----
  const totalBudget = useMemo(
    () => records.reduce((sum, r) => sum + r.budgetAmount, 0),
    [records]
  );
  const totalUsed = useMemo(
    () => records.reduce((sum, r) => sum + r.usedAmount, 0),
    [records]
  );
  const overallUsageRate = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;
  const overBudgetDepts = useMemo(
    () => records.filter((r) => calcBudgetUsageRate(r) >= 100),
    [records]
  );
  const warningDepts = useMemo(
    () => records.filter((r) => {
      const rate = calcBudgetUsageRate(r);
      return rate >= 80 && rate < 100;
    }),
    [records]
  );

  // ---- 过滤 ----
  const filtered = useMemo(() => {
    let result = records;

    if (search) {
      const kw = search.toLowerCase();
      result = result.filter((r) =>
        r.department.toLowerCase().includes(kw)
      );
    }

    if (statusFilter !== '全部') {
      result = result.filter((r) => getBudgetStatus(r) === statusFilter);
    }

    return result;
  }, [records, search, statusFilter]);

  useEffect(() => {
    const openAdd = (event: Event) => {
      const pageName = (event as CustomEvent<{ page: string }>).detail?.page;
      if (pageName === 'budget') {
        setForm(emptyForm);
        setShowAdd(true);
      }
    };
    window.addEventListener('fms:open-add', openAdd);
    return () => window.removeEventListener('fms:open-add', openAdd);
  }, []);

  // ---- 持久化 ----
  const persist = (data: BudgetRecord[]) => {
    setRecords(data);
    saveBudgets(data);
  };

  // ---- 操作 ----
  const handleAdd = () => {
    const newId = `bud-${Date.now()}`;
    const newRecord: BudgetRecord = {
      id: newId,
      department: form.department,
      budgetAmount: form.budgetAmount,
      usedAmount: form.usedAmount,
      manager: form.manager,
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
            department: form.department,
            budgetAmount: form.budgetAmount,
            usedAmount: form.usedAmount,
            manager: form.manager,
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

  const openEditModal = (record: BudgetRecord) => {
    setEditRecord(record);
    setForm({
      department: record.department,
      budgetAmount: record.budgetAmount,
      usedAmount: record.usedAmount,
      manager: record.manager,
      remark: record.remark,
    });
    setShowEdit(true);
  };

  const openDeleteModal = (record: BudgetRecord) => {
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

  // ---- Form field styles ----
  const inputCls =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const selectCls = inputCls;
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  const renderFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>部门</label>
        <input
          className={inputCls}
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          placeholder="部门名称"
        />
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
      <div>
        <label className={labelCls}>预算金额（万）</label>
        <input
          className={inputCls}
          type="number"
          step="0.1"
          value={form.budgetAmount || ''}
          onChange={(e) =>
            setForm({ ...form, budgetAmount: parseFloat(e.target.value) || 0 })
          }
          placeholder="0"
        />
      </div>
      <div>
        <label className={labelCls}>已使用金额（万）</label>
        <input
          className={inputCls}
          type="number"
          step="0.1"
          value={form.usedAmount || ''}
          onChange={(e) =>
            setForm({ ...form, usedAmount: parseFloat(e.target.value) || 0 })
          }
          placeholder="0"
        />
      </div>
      {/* 实时使用率预览 */}
      <div className="col-span-2">
        <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">预算使用率（实时计算）</span>
            <span
              className={`text-sm font-bold ${
                formUsageRate >= 100
                  ? 'text-red-600'
                  : formUsageRate >= 80
                    ? 'text-orange-600'
                    : 'text-green-600'
              }`}
            >
              {formUsageRate.toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${getProgressBarColor(formUsageRate)}`}
              style={{ width: `${Math.min(formUsageRate, 150)}%` }}
            />
          </div>
          {formUsageRate > 0 && (
            <p className="text-xs text-slate-400 mt-1.5">
              状态预测: <span className={getStatusTag(formUsageStatus)}>{formUsageStatus}</span>
            </p>
          )}
        </div>
      </div>
      <div className="col-span-2">
        <label className={labelCls}>备注</label>
        <textarea
          className={inputCls}
          value={form.remark}
          onChange={(e) => setForm({ ...form, remark: e.target.value })}
          placeholder="备注信息"
          rows={2}
        />
      </div>
    </div>
  );

  // ---- 渲染 ----
  return (
    <PageContainer title="预算管理" subtitle="各部门月度预算、使用进度及超支情况监控。">
      {/* ==================== 指标卡片 ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">月度预算</p>
              <p className="metric-value mt-1">{formatMoney(totalBudget)}</p>
              <p className="metric-sub">{records.length}个部门</p>
            </div>
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <PieChart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card-metric">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">已使用金额</p>
              <p className="metric-value mt-1">{formatMoney(totalUsed)}</p>
              <p className="metric-sub">
                使用率 {formatPercentPlain(overallUsageRate)}
              </p>
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
              <p className="metric-value mt-1 text-amber-600">
                {overBudgetDepts.length > 0 ? '需关注' : '正常'}
              </p>
              <p className="metric-sub text-amber-600">
                {overBudgetDepts.length > 0
                  ? `${overBudgetDepts.length}个部门超预算`
                  : '预算执行正常'}
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
              <p className="metric-label">超预算部门数量</p>
              <p className="metric-value mt-1">
                {overBudgetDepts.length} 个
              </p>
              <p className="metric-sub">
                {overBudgetDepts.length > 0
                  ? overBudgetDepts.map((d) => d.department).join(' + ')
                  : '无'}
              </p>
            </div>
            <div className="bg-red-100 p-2.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-600" />
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
              placeholder="搜索部门..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 状态过滤 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">状态:</span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f
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
            新增预算
          </button>
        </div>
      </div>

      {/* ==================== 数据表格 ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>部门</th>
                <th>预算金额(万)</th>
                <th>已使用金额(万)</th>
                <th>预算执行进度</th>
                <th>使用率(%)</th>
                <th>状态</th>
                <th>负责人</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-400 py-12">
                    暂无数据
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const rate = calcBudgetUsageRate(record);
                  const status = getBudgetStatus(record);
                  return (
                    <tr key={record.id}>
                      <td className="font-medium text-slate-800">{record.department}</td>
                      <td className="font-medium">{formatMoney(record.budgetAmount)}</td>
                      <td
                        className={`font-medium ${
                          rate >= 100 ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {formatMoney(record.usedAmount)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar w-24">
                            <div
                              className={`progress-fill ${getProgressBarColor(rate)}`}
                              style={{ width: `${Math.min(rate, 150)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {rate >= 100 ? '超支' : `${rate.toFixed(0)}%`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`text-sm font-semibold ${
                            rate >= 100
                              ? 'text-red-600'
                              : rate >= 80
                                ? 'text-orange-600'
                                : 'text-green-600'
                          }`}
                        >
                          {formatPercentPlain(rate)}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusTag(status)}>{status}</span>
                      </td>
                      <td>{record.manager}</td>
                      <td
                        className="text-slate-500 max-w-[150px] truncate"
                        title={record.remark}
                      >
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

        {/* 底部统计（无分页） */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            共 {filtered.length} 个部门
            {overBudgetDepts.length > 0 && (
              <span className="text-red-500 ml-2">
                （{overBudgetDepts.length} 个超预算）
              </span>
            )}
            {warningDepts.length > 0 && (
              <span className="text-orange-500 ml-1">
                （{warningDepts.length} 个需关注）
              </span>
            )}
          </span>
          <span className="text-xs text-slate-400">
            预算总额: {formatMoney(totalBudget)} | 已用: {formatMoney(totalUsed)}
          </span>
        </div>
      </div>

      {/* ==================== 新增预算弹窗 ==================== */}
      {showAdd && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">新增预算</h3>
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

      {/* ==================== 编辑预算弹窗 ==================== */}
      {showEdit && editRecord && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">编辑预算</h3>
              <button
                onClick={closeModals}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-500">
              部门: <span className="font-medium text-slate-700">{editRecord.department}</span>
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
                确定要删除该预算记录吗？
              </p>
              <p className="text-sm font-medium text-slate-700 mb-6">
                {deleteRecord.department} - {formatMoney(deleteRecord.budgetAmount)}
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
