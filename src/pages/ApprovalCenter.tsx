import React, { useMemo, useState, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getApprovals } from '@/data/mockData';
import { formatMoney, formatDateTime } from '@/utils/format';
import { approveRecord, rejectRecord } from '@/services/api';
import { useAuth } from '@/auth/AuthContext';
import type { ApprovalRecord, ApprovalStatus, ApprovalType } from '@/types';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
  FileSearch,
  ShieldCheck,
  X,
} from 'lucide-react';

// ==================== 常量 ====================

const ITEMS_PER_PAGE = 8;

const STATUS_MAP: Record<ApprovalStatus, string> = {
  pending: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  need_more: '待补充',
};

const STATUS_TAG_CLASS: Record<ApprovalStatus, string> = {
  pending: 'tag-orange',
  approved: 'tag-green',
  rejected: 'tag-red',
  need_more: 'tag-gray',
};

const TYPE_BADGE_CLASS: Record<ApprovalType, string> = {
  '付款申请': 'tag-blue',
  '报销申请': 'tag-purple',
  '合同审批': 'tag-yellow',
  '费用申请': 'tag-orange',
  '开票申请': 'tag-green',
  '借款申请': 'tag-red',
};

const ALL_STATUSES: ('all' | ApprovalStatus)[] = ['all', 'pending', 'approved', 'rejected', 'need_more'];
const STATUS_LABELS: Record<string, string> = {
  all: '全部',
  pending: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  need_more: '待补充',
};

const ALL_TYPES: ApprovalType[] = ['付款申请', '报销申请', '合同审批', '费用申请', '开票申请', '借款申请'];

// ==================== 主组件 ====================

export default function ApprovalCenter() {
  const { bootstrap } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(() => getApprovals());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApprovalStatus>('all');
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null);
  const [modalRecord, setModalRecord] = useState<ApprovalRecord | null>(null);
  const [modalReason, setModalReason] = useState('');

  // ---- 指标计算 ----
  const metricCards = useMemo(() => {
    const totalAmount = approvals.reduce((sum, r) => sum + r.amount, 0);
    const pendingRecords = approvals.filter((r) => r.status === 'pending');
    const pendingAmount = pendingRecords.reduce((sum, r) => sum + r.amount, 0);
    const pendingCount = pendingRecords.length;
    const hasSalaryPending = pendingRecords.some(
      (r) => r.type === '付款申请' && r.amount >= 30
    );

    return [
      {
        title: '审批总金额',
        value: formatMoney(totalAmount),
        sub: `${approvals.length}条审批记录`,
        icon: DollarSign,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        title: '待审批金额',
        value: formatMoney(pendingAmount),
        sub: `${pendingCount}条待处理`,
        icon: Clock,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
      },
      {
        title: '经营提示',
        value: hasSalaryPending ? '需关注' : '正常',
        sub: hasSalaryPending ? '工资审批待处理' : '暂无异常',
        icon: AlertTriangle,
        iconBg: hasSalaryPending ? 'bg-red-100' : 'bg-green-100',
        iconColor: hasSalaryPending ? 'text-red-600' : 'text-green-600',
      },
      {
        title: '待审批事项数量',
        value: `${pendingCount} 条`,
        sub: '需及时处理',
        icon: FileSearch,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
    ];
  }, [approvals]);

  // ---- 筛选 ----
  const filteredApprovals = useMemo(() => {
    let result = [...approvals];

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.applicant.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q)
      );
    }
    return result;
  }, [approvals, statusFilter, typeFilter, searchQuery]);

  // ---- 分页 ----
  const totalPages = Math.max(1, Math.ceil(filteredApprovals.length / ITEMS_PER_PAGE));
  const pagedApprovals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredApprovals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApprovals, currentPage]);

  // 筛选条件改变时重置页码
  const handleStatusChange = useCallback((v: 'all' | ApprovalStatus) => {
    setStatusFilter(v);
    setCurrentPage(1);
  }, []);
  const handleTypeChange = useCallback((v: ApprovalType | 'all') => {
    setTypeFilter(v);
    setCurrentPage(1);
  }, []);
  const handleSearchChange = useCallback((v: string) => {
    setSearchQuery(v);
    setCurrentPage(1);
  }, []);

  // ---- 审批操作 ----
  const openApproveModal = useCallback((record: ApprovalRecord) => {
    setModalRecord(record);
    setModalType('approve');
    setModalReason('');
    setModalOpen(true);
  }, []);

  const openRejectModal = useCallback((record: ApprovalRecord) => {
    setModalRecord(record);
    setModalType('reject');
    setModalReason('');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalRecord(null);
    setModalType(null);
    setModalReason('');
  }, []);

  const confirmAction = useCallback(async () => {
    if (!modalRecord || !modalType) return;

    const newStatus: ApprovalStatus = modalType === 'approve' ? 'approved' : 'rejected';
    const newCurrentNode = modalType === 'approve' ? '已完成' : '已驳回';

    const updated = approvals.map((r) =>
      r.id === modalRecord.id
        ? { ...r, status: newStatus, currentNode: newCurrentNode }
        : r
    );

    try {
      if (modalType === 'approve') {
        await approveRecord(modalRecord.id);
      } else {
        await rejectRecord(modalRecord.id);
      }
      await bootstrap();
      setApprovals(getApprovals());
      closeModal();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '审批操作失败');
    }
  }, [approvals, bootstrap, modalRecord, modalType, closeModal]);

  // ---- 渲染操作按钮 ----
  const renderActions = (record: ApprovalRecord) => {
    if (record.status === 'pending') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openApproveModal(record)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded text-xs font-medium transition-colors"
          >
            <CheckCircle className="w-3 h-3" />
            同意
          </button>
          <button
            onClick={() => openRejectModal(record)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium transition-colors"
          >
            <XCircle className="w-3 h-3" />
            驳回
          </button>
        </div>
      );
    }
    if (record.status === 'need_more') {
      return (
        <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs font-medium transition-colors">
          <FileText className="w-3 h-3" />
          补充
        </button>
      );
    }
    // approved / rejected
    return (
      <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded text-xs font-medium transition-colors">
        <FileText className="w-3 h-3" />
        查看详情
      </button>
    );
  };

  return (
    <PageContainer title="审批中心" subtitle="付款/报销/合同等审批事项管理">
      {/* ==================== 指标卡片 ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card-metric animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="metric-label">{card.title}</p>
                  <p className="metric-value mt-1">{card.value}</p>
                  <p className="metric-sub">{card.sub}</p>
                </div>
                <div className={`${card.iconBg} p-2.5 rounded-lg flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== 搜索和筛选栏 ==================== */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索编号/申请人/部门..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 mr-1">状态:</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* 类型筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">类型:</span>
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value as ApprovalType | 'all')}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              <option value="all">全部类型</option>
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==================== 审批表格 ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>审批编号</th>
                <th>类型</th>
                <th>申请人</th>
                <th>部门</th>
                <th>金额(万)</th>
                <th>提交时间</th>
                <th>当前节点</th>
                <th>状态</th>
                <th>审批人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedApprovals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    暂无审批记录
                  </td>
                </tr>
              ) : (
                pagedApprovals.map((record) => (
                  <tr key={record.id}>
                    <td className="font-mono text-xs text-blue-600">{record.code}</td>
                    <td>
                      <span className={TYPE_BADGE_CLASS[record.type]}>
                        {record.type}
                      </span>
                    </td>
                    <td className="font-medium">{record.applicant}</td>
                    <td>{record.department}</td>
                    <td className="font-mono font-semibold">{formatMoney(record.amount)}</td>
                    <td className="text-xs text-slate-500">{formatDateTime(record.submitTime)}</td>
                    <td>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          record.currentNode === '已完成'
                            ? 'bg-green-50 text-green-700'
                            : record.currentNode === '已驳回'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {record.currentNode}
                      </span>
                    </td>
                    <td>
                      <span className={STATUS_TAG_CLASS[record.status]}>
                        {STATUS_MAP[record.status]}
                      </span>
                    </td>
                    <td>{record.approver}</td>
                    <td>{renderActions(record)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== 分页 ==================== */}
      <div className="flex items-center justify-between px-1 mb-6">
        <span className="text-sm text-slate-500">
          共 {filteredApprovals.length} 条，每页 {ITEMS_PER_PAGE} 条
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================== 审批规则卡片 ==================== */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-800">审批规则</h3>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0 mt-0.5">1</span>
            <span>5000元以下：部门负责人审批</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0 mt-0.5">2</span>
            <span>5000-50000元：部门负责人 + 财务负责人审批</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0 mt-0.5">3</span>
            <span>50000元以上：部门负责人 + 财务负责人 + 老板审批</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex-shrink-0 mt-0.5">4</span>
            <span>合同审批必须经过财务负责人</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-semibold flex-shrink-0 mt-0.5">5</span>
            <span>付款申请超过10万必须老板审批</span>
          </div>
        </div>
      </div>

      {/* ==================== 审批弹窗 ==================== */}
      {modalOpen && modalRecord && modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* 头部 */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {modalType === 'approve' ? '审批通过确认' : '驳回审批确认'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 审批信息 */}
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">审批编号：</span>
                  <span className="text-slate-700 font-mono">{modalRecord.code}</span>
                </div>
                <div>
                  <span className="text-slate-500">类型：</span>
                  <span className={TYPE_BADGE_CLASS[modalRecord.type]}>{modalRecord.type}</span>
                </div>
                <div>
                  <span className="text-slate-500">申请人：</span>
                  <span className="text-slate-700">{modalRecord.applicant}</span>
                </div>
                <div>
                  <span className="text-slate-500">部门：</span>
                  <span className="text-slate-700">{modalRecord.department}</span>
                </div>
                <div>
                  <span className="text-slate-500">金额：</span>
                  <span className="text-slate-700 font-semibold">{formatMoney(modalRecord.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-500">当前节点：</span>
                  <span className="text-blue-600">{modalRecord.currentNode}</span>
                </div>
              </div>
            </div>

            {/* 审批意见 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {modalType === 'approve' ? '审批意见' : '驳回原因'}
              </label>
              <textarea
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                rows={3}
                placeholder={
                  modalType === 'approve'
                    ? '请输入审批意见（可选）...'
                    : '请输入驳回原因...'
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-3">
              <button onClick={closeModal} className="btn-secondary">
                取消
              </button>
              <button
                onClick={confirmAction}
                className={
                  modalType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                    : 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                }
              >
                {modalType === 'approve' ? '确认通过' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
