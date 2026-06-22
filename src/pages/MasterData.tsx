import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getMasterData, saveMasterData } from '@/data/mockData';
import type { MasterDataRecord, MasterDataType, MasterDataStatus } from '@/types';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Database,
  AlertTriangle,
  FileSearch,
  FileWarning,
  X,
} from 'lucide-react';

// ==================== 常量 ====================

const ITEMS_PER_PAGE = 10;

const TYPE_BADGE_CLASS: Record<MasterDataType, string> = {
  '客户': 'bg-blue-50 text-blue-700',
  '供应商': 'bg-green-50 text-green-700',
  '部门': 'bg-purple-50 text-purple-700',
  '员工': 'bg-orange-50 text-orange-700',
  '项目': 'bg-cyan-50 text-cyan-700',
  '费用科目': 'bg-slate-100 text-slate-600',
  '银行账户': 'bg-yellow-50 text-yellow-700',
  '合同类别': 'bg-pink-50 text-pink-700',
};

const STATUS_BADGE_CLASS: Record<MasterDataStatus, string> = {
  '正常': 'bg-green-50 text-green-700',
  '需完善': 'bg-orange-50 text-orange-700',
  '异常': 'bg-red-50 text-red-700',
};

const ALL_TYPES: ('all' | MasterDataType)[] = [
  'all', '客户', '供应商', '部门', '员工', '项目', '费用科目', '银行账户', '合同类别',
];

const ALL_STATUSES: ('all' | MasterDataStatus)[] = ['all', '正常', '需完善', '异常'];

const STATUS_LABELS: Record<string, string> = {
  all: '全部状态',
  '正常': '正常',
  '需完善': '需完善',
  '异常': '异常',
};

const TYPE_LABELS: Record<string, string> = {
  all: '全部类型',
  '客户': '客户',
  '供应商': '供应商',
  '部门': '部门',
  '员工': '员工',
  '项目': '项目',
  '费用科目': '费用科目',
  '银行账户': '银行账户',
  '合同类别': '合同类别',
};

const FORMTYPE_OPTIONS: MasterDataType[] = ['客户', '供应商', '部门', '员工', '项目', '费用科目', '银行账户', '合同类别'];

// ==================== 生成扩展数据 ====================

const MANAGER_POOL = ['赵明', '王杰', '赵宁', '许丹', '张总', '李明', '陈芳', '刘洋', '孙丽', '周强'];

function generateExtendedMasterData(defaults: MasterDataRecord[]): MasterDataRecord[] {
  const records: MasterDataRecord[] = [...defaults];

  const extraConfigs: { type: MasterDataType; names: string[]; managers: string[]; remarks: string[] }[] = [
    {
      type: '客户',
      names: ['长江建设集团', '东方科技公司', '华中路桥工程', '西南建材公司', '北方钢构集团', '绿地园林公司', '远洋贸易集团', '瑞丰实业公司', '中建三局项目部', '天元装饰公司', '恒基路桥公司', '大华水利工程', '金茂混凝土公司', '申港建设集团'],
      managers: ['赵明', '王杰', '赵宁'],
      remarks: ['B级客户', '长期合作', '新客户', '', 'A级客户', '税号未填'],
    },
    {
      type: '供应商',
      names: ['建筑材料供应商C', '钢材贸易公司', '水泥建材集团', '管道设备公司', '电气设备供应商', '防水材料公司', '五金建材批发', '木材供应公司', '石材加工厂', '脚手架租赁公司', '涂料供应商', '保温材料公司'],
      managers: ['王杰', '赵明', '许丹'],
      remarks: ['长期供应商', '资质待审核', '', '合格供应商'],
    },
    {
      type: '部门',
      names: ['技术部', '采购部', '质量部', '安全部', '综合部', '法务部'],
      managers: ['张总', '赵明', '王杰', '许丹'],
      remarks: ['', '配备3人', '配备2人'],
    },
    {
      type: '员工',
      names: ['李明', '陈芳', '刘洋', '孙丽', '周强', '吴杰', '郑华', '王芳', '钱伟', '杨建', '黄丽', '马军', '宋涛', '何平', '罗杰'],
      managers: ['财务部', '销售部', '生产部', '市场部', '技术部', '行政部'],
      remarks: ['', '新入职', '试用期'],
    },
    {
      type: '项目',
      names: ['排水工程B', '绿化工程C', '桥梁加固工程', '市政维护项目', '水利改造工程', '建筑装修项目C', '设备维保项目', '旧城改造项目', '道路交通项目', '环境治理项目', '污水处理工程', '供热管网工程'],
      managers: ['赵明', '王杰', '赵宁'],
      remarks: ['重点项目', '施工中', '已开工', '', '待开工'],
    },
    {
      type: '费用科目',
      names: ['办公费', '差旅费', '招待费', '培训费', '折旧费', '维修费', '水电费', '保险费', '审计费', '咨询费', '租金', '物业费'],
      managers: ['财务部', '行政部'],
      remarks: ['', '月度固定费用', '季度费用'],
    },
    {
      type: '银行账户',
      names: ['建设银行一般户', '工商银行基本户', '农业银行专户', '交通银行保证金户', '招商银行理财户', '浦发银行贷款户'],
      managers: ['赵宁', '张总'],
      remarks: ['主要收付款账户', '专项资金账户', '', '保证金账户'],
    },
    {
      type: '合同类别',
      names: ['销售合同', '采购合同', '劳务合同', '租赁合同', '咨询合同', '运输合同', '承揽合同', '保修合同', '合作协议', '代理合同'],
      managers: ['赵明', '王杰', '赵宁', '许丹'],
      remarks: ['', '标准模板', '自定义条款'],
    },
  ];

  let nextCode = defaults.length + 1;

  for (const config of extraConfigs) {
    for (let i = 0; i < config.names.length; i++) {
      const name = config.names[i];
      const statuses: MasterDataStatus[] = ['正常', '正常', '正常', '正常', '需完善', '正常', '正常', '正常', '异常', '正常'];
      const status = statuses[i % statuses.length];
      const code = `MD-${String(nextCode).padStart(3, '0')}`;
      records.push({
        id: `md-${nextCode}`,
        code,
        type: config.type,
        name,
        manager: config.managers[i % config.managers.length],
        status: name.includes('异常') ? '异常' : status,
        remark: config.remarks[i % config.remarks.length] || '',
      });
      nextCode++;
    }
  }

  return records;
}

// ==================== 主组件 ====================

export default function MasterData() {
  const [records, setRecords] = useState<MasterDataRecord[]>(() => {
    const stored = getMasterData();
    if (stored.length < 50) {
      const extended = generateExtendedMasterData(stored);
      saveMasterData(extended);
      return extended;
    }
    return stored;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MasterDataType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MasterDataStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalRecord, setModalRecord] = useState<MasterDataRecord | null>(null);
  const [formType, setFormType] = useState<MasterDataType>('客户');
  const [formName, setFormName] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formRemark, setFormRemark] = useState('');

  // 删除确认
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---- 指标卡片数据 ----
  const metricCards = useMemo(() => {
    const normalCount = records.filter((r) => r.status === '正常').length;
    const abnormalCount = records.filter((r) => r.status === '异常').length;
    const incompleteCount = records.filter((r) => r.status === '需完善').length;
    const completeness = records.length > 0
      ? Math.round((normalCount / records.length) * 100)
      : 0;

    return [
      {
        title: '基础资料数量',
        value: `${records.length} 条`,
        sub: `数据完整度${completeness}%`,
        icon: Database,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        title: '异常资料数量',
        value: `${abnormalCount} 条`,
        sub: '待修正',
        icon: AlertTriangle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
      },
      {
        title: '经营提示',
        value: abnormalCount > 0 || incompleteCount > 0 ? '需关注' : '正常',
        sub: incompleteCount > 0 ? `${incompleteCount}条待完善` : '无异常',
        icon: FileSearch,
        iconBg: incompleteCount > 0 ? 'bg-amber-100' : 'bg-green-100',
        iconColor: incompleteCount > 0 ? 'text-amber-600' : 'text-green-600',
      },
      {
        title: '待完善档案数量',
        value: `${incompleteCount} 条`,
        sub: '需补充信息',
        icon: FileWarning,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
      },
    ];
  }, [records]);

  // ---- 筛选 ----
  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q)
      );
    }
    return result;
  }, [records, typeFilter, statusFilter, searchQuery]);

  // ---- 分页 ----
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  // 筛选条件改变时重置页码
  const resetPagination = useCallback(() => setCurrentPage(1), []);

  const handleTypeChange = useCallback(
    (v: 'all' | MasterDataType) => {
      setTypeFilter(v);
      resetPagination();
    },
    [resetPagination]
  );

  const handleStatusChange = useCallback(
    (v: 'all' | MasterDataStatus) => {
      setStatusFilter(v);
      resetPagination();
    },
    [resetPagination]
  );

  const handleSearchChange = useCallback(
    (v: string) => {
      setSearchQuery(v);
      resetPagination();
    },
    [resetPagination]
  );

  // ---- CRUD 操作 ----

  const autoGenerateCode = useCallback((): string => {
    const maxNum = records.reduce((max, r) => {
      const match = r.code.match(/MD-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return `MD-${String(maxNum + 1).padStart(3, '0')}`;
  }, [records]);

  const openAddModal = useCallback(() => {
    setModalMode('add');
    setModalRecord(null);
    setFormType('客户');
    setFormName('');
    setFormManager('');
    setFormRemark('');
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const openAdd = (event: Event) => {
      const pageName = (event as CustomEvent<{ page: string }>).detail?.page;
      if (pageName === 'master-data') {
        openAddModal();
      }
    };
    window.addEventListener('fms:open-add', openAdd);
    return () => window.removeEventListener('fms:open-add', openAdd);
  }, [openAddModal]);

  const openEditModal = useCallback((record: MasterDataRecord) => {
    setModalMode('edit');
    setModalRecord(record);
    setFormType(record.type);
    setFormName(record.name);
    setFormManager(record.manager);
    setFormRemark(record.remark);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalRecord(null);
  }, []);

  const saveRecord = useCallback(() => {
    if (!formName.trim() || !formManager.trim()) return;

    if (modalMode === 'add') {
      const newRecord: MasterDataRecord = {
        id: `md-${Date.now()}`,
        code: autoGenerateCode(),
        type: formType,
        name: formName.trim(),
        manager: formManager.trim(),
        status: '正常',
        remark: formRemark.trim(),
      };
      const updated = [newRecord, ...records];
      setRecords(updated);
      saveMasterData(updated);
    } else if (modalMode === 'edit' && modalRecord) {
      const updated = records.map((r) =>
        r.id === modalRecord.id
          ? {
              ...r,
              type: formType,
              name: formName.trim(),
              manager: formManager.trim(),
              remark: formRemark.trim(),
            }
          : r
      );
      setRecords(updated);
      saveMasterData(updated);
    }
    closeModal();
  }, [modalMode, modalRecord, formType, formName, formManager, formRemark, records, autoGenerateCode, closeModal]);

  const deleteRecord = useCallback(
    (id: string) => {
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      saveMasterData(updated);
      setDeleteConfirmId(null);
    },
    [records]
  );

  // ==================== 渲染 ====================

  return (
    <PageContainer title="基础资料" subtitle="客户、供应商、部门等基础档案管理">
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
              placeholder="搜索名称/编号..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {/* 类型筛选下拉框 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">类型:</span>
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value as MasterDataType | 'all')}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
            >
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* 状态筛选按钮 */}
          <div className="flex items-center gap-2">
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

          {/* 新增按钮 */}
          <div className="flex-shrink-0 lg:ml-auto">
            <button onClick={openAddModal} className="btn-primary inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              新增资料
            </button>
          </div>
        </div>
      </div>

      {/* ==================== 数据表格 ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>类型</th>
                <th>名称</th>
                <th>负责人</th>
                <th>状态</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                pagedRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="font-mono text-xs text-blue-600">{record.code}</td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE_CLASS[record.type]}`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="font-medium">{record.name}</td>
                    <td>{record.manager}</td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASS[record.status]}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 max-w-[120px] truncate">{record.remark || '-'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(record)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(record.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
          共 {filteredRecords.length} 条，每页 {ITEMS_PER_PAGE} 条
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

      {/* ==================== 新增/编辑弹窗 ==================== */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {modalMode === 'add' ? '新增基础资料' : '编辑基础资料'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 类型 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as MasterDataType)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                >
                  {FORMTYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* 名称 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入名称"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              {/* 负责人 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  负责人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formManager}
                  onChange={(e) => setFormManager(e.target.value)}
                  placeholder="请输入负责人"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
                <textarea
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  rows={3}
                  placeholder="请输入备注信息（可选）"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                />
              </div>

              {/* 自动生成编号提示 */}
              {modalMode === 'add' && (
                <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2.5">
                  编号将自动生成（格式：{autoGenerateCode()}）
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={closeModal} className="btn-secondary">
                取消
              </button>
              <button
                onClick={saveRecord}
                disabled={!formName.trim() || !formManager.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalMode === 'add' ? '新增' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 删除确认弹窗 ==================== */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">确认删除</h3>
              <p className="text-sm text-slate-500 mb-6">
                确定要删除该基础资料吗？此操作不可撤销。
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={() => deleteRecord(deleteConfirmId)}
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
