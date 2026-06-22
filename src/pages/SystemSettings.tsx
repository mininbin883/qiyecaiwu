import React, { useState, useMemo, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getRoles, saveRoles, getAlertRules, saveAlertRules, getAuditLogs, saveAuditLogs } from '@/data/mockData';
import { formatDateTime } from '@/utils/format';
import type { Role, AlertRule, AuditLog } from '@/types';
import {
  Shield,
  Bell,
  FileSearch,
  Building2,
  ClipboardCheck,
  Download,
  X,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
} from 'lucide-react';

// ==================== 权限说明映射 ====================

const PERMISSION_LABELS: Record<string, string> = {
  all: '全部权限',
  view_all: '查看所有数据',
  export: '导出报表',
  approve_final: '最终审批',
  manage_finance: '财务管理',
  approve: '审批权限',
  view_finance: '查看财务数据',
  edit_income: '编辑收入',
  edit_expense: '编辑支出',
  edit_contract: '编辑合同',
  edit_master: '编辑基础资料',
  record_payment: '记录付款',
  record_receipt: '记录收款',
  view_dept: '查看部门数据',
  approve_dept: '部门审批',
  view_approval: '查看审批',
  submit_request: '提交申请',
  view_own: '查看个人数据',
};

function getPermissionSummary(permissions: string[]): string {
  if (permissions.includes('all')) return '全部权限（超级管理员）';
  return permissions.map((p) => PERMISSION_LABELS[p] || p).join('、');
}

// ==================== 审计日志分页 ====================

const AUDIT_ITEMS_PER_PAGE = 5;

// ==================== 公司资料默认值 ====================

interface CompanyFormData {
  name: string;
  taxId: string;
  address: string;
  contact: string;
  phone: string;
  bankAccount: string;
}

const DEFAULT_COMPANY_INFO: CompanyFormData = {
  name: '上海鑫业市政有限公司',
  taxId: '91310000XXXXXXXX',
  address: '上海市浦东新区XX路XX号',
  contact: '张总',
  phone: '021-XXXXXXXX',
  bankAccount: '中国银行上海分行 XXXXXX',
};

function loadCompanyInfo(): CompanyFormData {
  try {
    const stored = localStorage.getItem('fms_companyInfo');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_COMPANY_INFO;
}

function saveCompanyInfo(data: CompanyFormData) {
  localStorage.setItem('fms_companyInfo', JSON.stringify(data));
}

// ==================== 数据规则默认值 ====================

interface DataRuleItem {
  id: number;
  rule: string;
  enabled: boolean;
}

const DEFAULT_DATA_RULES: DataRuleItem[] = [
  { id: 1, rule: '收入金额必须为正数', enabled: true },
  { id: 2, rule: '支出金额不能超过预算', enabled: true },
  { id: 3, rule: '合同金额必须与收付款一致', enabled: true },
  { id: 4, rule: '应收应付必须有对应合同', enabled: true },
];

function loadDataRules(): DataRuleItem[] {
  try {
    const stored = localStorage.getItem('fms_dataRules');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_DATA_RULES;
}

function saveDataRules(data: DataRuleItem[]) {
  localStorage.setItem('fms_dataRules', JSON.stringify(data));
}

// ==================== 导入模板配置 ====================

const IMPORT_TEMPLATES = [
  { id: 1, name: '收入导入模板' },
  { id: 2, name: '支出导入模板' },
  { id: 3, name: '合同导入模板' },
  { id: 4, name: '应收导入模板' },
  { id: 5, name: '应付导入模板' },
  { id: 6, name: '基础资料导入模板' },
];

// ==================== 角色权限弹窗内容组件 ====================

const ALL_PERMISSION_KEYS = [
  'view_all', 'manage_finance', 'edit_income', 'edit_expense',
  'edit_contract', 'edit_master', 'record_payment', 'record_receipt',
  'view_dept', 'approve_dept', 'view_approval', 'approve',
  'approve_final', 'export', 'submit_request', 'view_own',
];

function RoleEditModal({
  role,
  onClose,
  onSave,
}: {
  role: Role;
  onClose: () => void;
  onSave: (updated: Role) => void;
}) {
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set(role.permissions));

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave({ ...role, permissions: Array.from(selectedPerms) });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            编辑角色权限 - {role.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {ALL_PERMISSION_KEYS.map((key) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedPerms.has(key)
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPerms.has(key)}
                onChange={() => togglePerm(key)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">
                  {PERMISSION_LABELS[key] || key}
                </p>
                <p className="text-xs text-slate-400">{key}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">取消</button>
          <button onClick={handleSave} className="btn-primary">保存</button>
        </div>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export default function SystemSettings() {
  // 角色权限
  const [roles, setRoles] = useState<Role[]>(() => getRoles());
  const [enabledRoles, setEnabledRoles] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('fms_enabledRoles');
      if (stored) return new Set(JSON.parse(stored));
    } catch { /* ignore */ }
    return new Set(roles.map((r) => r.key));
  });
  const [roleEditTarget, setRoleEditTarget] = useState<Role | null>(null);

  // 预警规则
  const [alertRules, setAlertRules] = useState<AlertRule[]>(() => getAlertRules());

  // 审计日志
  const [auditLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);

  // 公司资料
  const [companyInfo, setCompanyInfo] = useState<CompanyFormData>(() => loadCompanyInfo());
  const [companySaved, setCompanySaved] = useState(false);

  // 数据规则
  const [dataRules, setDataRules] = useState<DataRuleItem[]>(() => loadDataRules());

  // ---- 角色操作 ----
  const toggleRoleEnabled = useCallback(
    (key: string) => {
      setEnabledRoles((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        localStorage.setItem('fms_enabledRoles', JSON.stringify(Array.from(next)));
        return next;
      });
    },
    []
  );

  const handleSaveRole = useCallback(
    (updatedRole: Role) => {
      const newRoles = roles.map((r) =>
        r.key === updatedRole.key ? updatedRole : r
      );
      setRoles(newRoles);
      saveRoles(newRoles);
    },
    [roles]
  );

  // ---- 预警规则操作 ----
  const toggleAlertRule = useCallback(
    (id: string) => {
      const updated = alertRules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      setAlertRules(updated);
      saveAlertRules(updated);
    },
    [alertRules]
  );

  // ---- 审计日志筛选和分页 ----
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter(
      (log) =>
        log.user.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  const auditTotalPages = Math.max(1, Math.ceil(filteredAuditLogs.length / AUDIT_ITEMS_PER_PAGE));
  const pagedAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_ITEMS_PER_PAGE;
    return filteredAuditLogs.slice(start, start + AUDIT_ITEMS_PER_PAGE);
  }, [filteredAuditLogs, auditPage]);

  const handleAuditSearch = useCallback((v: string) => {
    setAuditSearch(v);
    setAuditPage(1);
  }, []);

  // ---- 公司资料操作 ----
  const handleCompanyFieldChange = useCallback(
    (field: keyof CompanyFormData, value: string) => {
      setCompanyInfo((prev) => ({ ...prev, [field]: value }));
      setCompanySaved(false);
    },
    []
  );

  const handleSaveCompanyInfo = useCallback(() => {
    saveCompanyInfo(companyInfo);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2000);
  }, [companyInfo]);

  // ---- 数据规则操作 ----
  const toggleDataRule = useCallback(
    (id: number) => {
      const updated = dataRules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      setDataRules(updated);
      saveDataRules(updated);
    },
    [dataRules]
  );

  // ---- 导入模板下载 ----
  const handleDownload = useCallback((templateName: string) => {
    const content = `=== ${templateName}模板 ===\n\n字段1\t字段2\t字段3\n示例数据1\t示例数据2\t示例数据3\n`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${templateName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // ==================== 渲染 ====================

  return (
    <PageContainer title="系统设置" subtitle="角色权限、预警规则、审计日志等系统配置">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==================== 卡片1: 角色权限 ==================== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Shield size={18} className="text-indigo-500" />
            角色权限
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>角色名称</th>
                  <th>权限说明</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.key}>
                    <td className="font-medium">{role.name}</td>
                    <td className="text-xs text-slate-500 max-w-[200px] truncate">
                      {getPermissionSummary(role.permissions)}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleRoleEnabled(role.key)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                          enabledRoles.has(role.key) ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            enabledRoles.has(role.key) ? 'translate-x-[18px]' : 'translate-x-[4px]'
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-xs text-slate-500">
                        {enabledRoles.has(role.key) ? '启用' : '停用'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setRoleEditTarget(role)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        编辑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================== 卡片2: 预警规则 ==================== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Bell size={18} className="text-amber-500" />
            预警规则
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>规则名称</th>
                  <th>类型</th>
                  <th>触发条件</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {alertRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="font-medium">{rule.name}</td>
                    <td>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {rule.type}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">{rule.threshold}</td>
                    <td>
                      <button
                        onClick={() => toggleAlertRule(rule.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                          rule.enabled ? 'bg-green-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            rule.enabled ? 'translate-x-[18px]' : 'translate-x-[4px]'
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-xs text-slate-500">
                        {rule.enabled ? '已启用' : '已停用'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================== 卡片3: 审计记录 ==================== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileSearch size={18} className="text-slate-500" />
            审计记录
          </h3>

          {/* 搜索 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索用户/模块..."
              value={auditSearch}
              onChange={(e) => handleAuditSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>操作</th>
                  <th>模块</th>
                  <th>时间</th>
                  <th>详情</th>
                </tr>
              </thead>
              <tbody>
                {pagedAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      暂无审计记录
                    </td>
                  </tr>
                ) : (
                  pagedAuditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="font-medium">{log.user}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="text-xs">{log.module}</td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.time)}
                      </td>
                      <td className="text-xs text-slate-500 max-w-[150px] truncate">
                        {log.detail}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              共 {filteredAuditLogs.length} 条，每页 {AUDIT_ITEMS_PER_PAGE} 条
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={auditPage <= 1}
                className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: auditTotalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setAuditPage(page)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    page === auditPage
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                disabled={auditPage >= auditTotalPages}
                className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ==================== 卡片4: 公司资料 ==================== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-blue-500" />
            公司资料
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">公司名称</label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => handleCompanyFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">税号</label>
                <input
                  type="text"
                  value={companyInfo.taxId}
                  onChange={(e) => handleCompanyFieldChange('taxId', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">联系人</label>
                <input
                  type="text"
                  value={companyInfo.contact}
                  onChange={(e) => handleCompanyFieldChange('contact', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">地址</label>
              <input
                type="text"
                value={companyInfo.address}
                onChange={(e) => handleCompanyFieldChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">联系电话</label>
                <input
                  type="text"
                  value={companyInfo.phone}
                  onChange={(e) => handleCompanyFieldChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">银行账户</label>
                <input
                  type="text"
                  value={companyInfo.bankAccount}
                  onChange={(e) => handleCompanyFieldChange('bankAccount', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveCompanyInfo}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                保存
              </button>
              {companySaved && (
                <span className="text-sm text-green-600 animate-fade-in">
                  保存成功
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ==================== 卡片5: 数据规则 ==================== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ClipboardCheck size={18} className="text-green-500" />
            数据规则
          </h3>

          <div className="space-y-2">
            {dataRules.map((rule) => (
              <label
                key={rule.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  rule.enabled
                    ? 'bg-green-50 border-green-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleDataRule(rule.id)}
                  className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      rule.enabled ? 'text-slate-700' : 'text-slate-400 line-through'
                    }`}
                  >
                    {rule.rule}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    rule.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {rule.enabled ? '已启用' : '已停用'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ==================== 卡片6: 导入配置 ==================== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Download size={18} className="text-purple-500" />
            导入配置
          </h3>

          <div className="space-y-2">
            {IMPORT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Download className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{template.name}</p>
                    <p className="text-xs text-slate-400">CSV 格式</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(template.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载模板
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== 角色权限编辑弹窗 ==================== */}
      {roleEditTarget && (
        <RoleEditModal
          role={roleEditTarget}
          onClose={() => setRoleEditTarget(null)}
          onSave={handleSaveRole}
        />
      )}
    </PageContainer>
  );
}
