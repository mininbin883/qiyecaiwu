import type {
  IncomeRecord, ExpenseRecord, ReceivableRecord, PayableRecord,
  ContractRecord, BudgetRecord, ApprovalRecord, CashflowForecast,
  RiskWarning, MasterDataRecord, Role, AlertRule, AuditLog,
  NavItem
} from '@/types';
import { saveCollection } from '@/services/api';

// ==================== 导航菜单 ====================
export const navItems: NavItem[] = [
  { key: 'dashboard', label: '经营总览', icon: 'LayoutDashboard' },
  { key: 'income', label: '收入管理', icon: 'TrendingUp' },
  { key: 'expense', label: '支出管理', icon: 'TrendingDown' },
  { key: 'receivables', label: '应收账款', icon: 'FileText' },
  { key: 'payables', label: '应付账款', icon: 'FileCheck' },
  { key: 'contracts', label: '合同管理', icon: 'FileSignature' },
  { key: 'budget', label: '预算管理', icon: 'PieChart' },
  { key: 'approval', label: '审批中心', icon: 'CheckSquare' },
  { key: 'cashflow', label: '现金流预测', icon: 'BarChart3' },
  { key: 'risk', label: '风险预警', icon: 'AlertTriangle' },
  { key: 'ai-analysis', label: 'AI 财务分析', icon: 'Brain' },
  { key: 'master-data', label: '基础资料', icon: 'Database' },
  { key: 'settings', label: '系统设置', icon: 'Settings' },
];

// ==================== 收入数据 ====================
const defaultIncomes: IncomeRecord[] = [
  { id: 'inc-1', code: 'INC-2026-001', customer: '华东城建集团', type: '销售收入', contractCode: 'HT-2026-018', project: '市政道路项目A', amount: 66.5, collected: 66.5, invoiceStatus: '已开票', collectionStatus: '已回款', manager: '赵明', remark: '已全额回款' },
  { id: 'inc-2', code: 'INC-2026-002', customer: '华林贸易公司', type: '工程收入', contractCode: 'HT-2026-019', project: '排水工程B', amount: 64.8, collected: 12.4, invoiceStatus: '部分开票', collectionStatus: '部分回款', manager: '王杰', remark: '剩余52.4万待回款' },
  { id: 'inc-3', code: 'INC-2026-003', customer: '南方医药连锁', type: '服务收入', contractCode: 'HT-2026-020', project: '设备维保项目', amount: 42.8, collected: 0, invoiceStatus: '未开票', collectionStatus: '未回款', manager: '赵明', remark: '客户经营困难' },
  { id: 'inc-4', code: 'INC-2026-004', customer: '北方商贸', type: '销售收入', contractCode: 'HT-2026-021', project: '建材供应项目', amount: 28.7, collected: 28.7, invoiceStatus: '已开票', collectionStatus: '已回款', manager: '王杰', remark: '' },
  { id: 'inc-5', code: 'INC-2026-005', customer: '久银商贸公司', type: '工程收入', contractCode: 'HT-2026-022', project: '桥梁加固工程', amount: 42.8, collected: 0, invoiceStatus: '未开票', collectionStatus: '未回款', manager: '赵明', remark: '合同刚签署' },
  { id: 'inc-6', code: 'INC-2026-006', customer: '华东城建集团', type: '服务收入', contractCode: 'HT-2026-018', project: '市政道路项目A', amount: 18.4, collected: 0, invoiceStatus: '未开票', collectionStatus: '未回款', manager: '王杰', remark: '增量服务费' },
  { id: 'inc-7', code: 'INC-2026-007', customer: '北京建材市场', type: '销售收入', contractCode: 'HT-2026-023', project: '材料贸易项目', amount: 35.2, collected: 20.0, invoiceStatus: '部分开票', collectionStatus: '部分回款', manager: '赵宁', remark: '' },
  { id: 'inc-8', code: 'INC-2026-008', customer: '南方医药分店', type: '服务收入', contractCode: 'HT-2026-024', project: '装修维护项目', amount: 17.8, collected: 0, invoiceStatus: '未开票', collectionStatus: '未回款', manager: '赵明', remark: '待验收后回款' },
  { id: 'inc-9', code: 'INC-2026-009', customer: '华林贸易公司', type: '销售收入', contractCode: 'HT-2026-019', project: '排水工程B', amount: 22.6, collected: 22.6, invoiceStatus: '已开票', collectionStatus: '已回款', manager: '王杰', remark: '' },
  { id: 'inc-10', code: 'INC-2026-010', customer: '北方商贸', type: '其他收入', contractCode: 'HT-2026-021', project: '建材供应项目', amount: 8.4, collected: 8.4, invoiceStatus: '已开票', collectionStatus: '已回款', manager: '赵宁', remark: '材料溢价部分' },
  { id: 'inc-11', code: 'INC-2026-011', customer: '华东城建集团', type: '工程收入', contractCode: 'HT-2026-025', project: '绿化工程项目', amount: 56.2, collected: 30.0, invoiceStatus: '部分开票', collectionStatus: '部分回款', manager: '赵明', remark: '' },
  { id: 'inc-12', code: 'INC-2026-012', customer: '久银商贸公司', type: '销售收入', contractCode: 'HT-2026-022', project: '桥梁加固工程', amount: 19.5, collected: 19.5, invoiceStatus: '已开票', collectionStatus: '已回款', manager: '王杰', remark: '' },
  { id: 'inc-13', code: 'INC-2026-013', customer: '北京建材市场', type: '工程收入', contractCode: 'HT-2026-023', project: '材料贸易项目', amount: 44.1, collected: 0, invoiceStatus: '未开票', collectionStatus: '未回款', manager: '赵宁', remark: '工期延误' },
  { id: 'inc-14', code: 'INC-2026-014', customer: '南方医药连锁', type: '服务收入', contractCode: 'HT-2026-020', project: '设备维保项目', amount: 12.3, collected: 0, invoiceStatus: '未开票', collectionStatus: '未回款', manager: '赵明', remark: '' },
  { id: 'inc-15', code: 'INC-2026-015', customer: '华林贸易公司', type: '其他收入', contractCode: 'HT-2026-019', project: '排水工程B', amount: 5.6, collected: 0, invoiceStatus: '未开票', collectionStatus: '未回款', manager: '赵宁', remark: '变更增加费用' },
  { id: 'inc-16', code: 'INC-2026-016', customer: '北方商贸', type: '销售收入', contractCode: 'HT-2026-021', project: '建材供应项目', amount: 31.7, collected: 31.7, invoiceStatus: '已开票', collectionStatus: '已回款', manager: '王杰', remark: '' },
  { id: 'inc-17', code: 'INC-2026-017', customer: '南方医药分店', type: '工程收入', contractCode: 'HT-2026-024', project: '装修维护项目', amount: 26.4, collected: 0, invoiceStatus: '未开票', collectionStatus: '未回款', manager: '赵明', remark: '' },
  { id: 'inc-18', code: 'INC-2026-018', customer: '华东城建集团', type: '销售收入', contractCode: 'HT-2026-025', project: '绿化工程项目', amount: 15.8, collected: 15.8, invoiceStatus: '已开票', collectionStatus: '已回款', manager: '赵宁', remark: '' },
  { id: 'inc-19', code: 'INC-2026-019', customer: '北京建材市场', type: '服务收入', contractCode: 'HT-2026-023', project: '材料贸易项目', amount: 9.2, collected: 0, invoiceStatus: '未开票', collectionStatus: '未回款', manager: '王杰', remark: '' },
  { id: 'inc-20', code: 'INC-2026-020', customer: '久银商贸公司', type: '工程收入', contractCode: 'HT-2026-022', project: '桥梁加固工程', amount: 38.5, collected: 20.0, invoiceStatus: '部分开票', collectionStatus: '部分回款', manager: '赵明', remark: '' },
];

// ==================== 支出数据 ====================
const defaultExpenses: ExpenseRecord[] = [
  { id: 'exp-1', code: 'EXP-2026-001', supplier: '企业内部', type: '工资薪酬', department: '公司整体', amount: 38.4, paid: 0, paymentStatus: '未付款', receiptStatus: '未收票', plannedPayDate: '2026-06-08', manager: '赵宁', remark: '本月工资' },
  { id: 'exp-2', code: 'EXP-2026-002', supplier: '办公用品公司', type: '日常报销', department: '行政部', amount: 12.6, paid: 12.6, paymentStatus: '已付款', receiptStatus: '已收票', plannedPayDate: '2026-06-05', manager: '许丹', remark: '' },
  { id: 'exp-3', code: 'EXP-2026-003', supplier: '建筑材料供应商A', type: '材料采购', department: '生产部', amount: 26.8, paid: 0, paymentStatus: '未付款', receiptStatus: '未收票', plannedPayDate: '2026-06-20', manager: '王杰', remark: '项目材料费' },
  { id: 'exp-4', code: 'EXP-2026-004', supplier: '物流服务公司', type: '管理费用', department: '销售部', amount: 11.2, paid: 0, paymentStatus: '未付款', receiptStatus: '已收票', plannedPayDate: '2026-06-15', manager: '赵明', remark: '运输服务费' },
  { id: 'exp-5', code: 'EXP-2026-005', supplier: '市场推广公司', type: '市场费用', department: '市场部', amount: 26.8, paid: 0, paymentStatus: '未付款', receiptStatus: '未收票', plannedPayDate: '2026-06-25', manager: '许丹', remark: '季度推广费用' },
  { id: 'exp-6', code: 'EXP-2026-006', supplier: '机械设备公司', type: '机械费用', department: '生产部', amount: 18.4, paid: 10.0, paymentStatus: '部分付款', receiptStatus: '部分收票', plannedPayDate: '2026-06-18', manager: '王杰', remark: '设备租赁费' },
  { id: 'exp-7', code: 'EXP-2026-007', supplier: '分包商B', type: '分包费用', department: '生产部', amount: 32.6, paid: 20.0, paymentStatus: '部分付款', receiptStatus: '部分收票', plannedPayDate: '2026-06-22', manager: '赵明', remark: '工程分包' },
  { id: 'exp-8', code: 'EXP-2026-008', supplier: '税务局', type: '税费支出', department: '财务部', amount: 14.2, paid: 14.2, paymentStatus: '已付款', receiptStatus: '已收票', plannedPayDate: '2026-06-10', manager: '赵宁', remark: '本月税金' },
  { id: 'exp-9', code: 'EXP-2026-009', supplier: '行政供应商', type: '管理费用', department: '行政部', amount: 8.7, paid: 8.7, paymentStatus: '已付款', receiptStatus: '已收票', plannedPayDate: '2026-06-03', manager: '许丹', remark: '办公场地管理费' },
  { id: 'exp-10', code: 'EXP-2026-010', supplier: '建筑材料供应商B', type: '材料采购', department: '生产部', amount: 22.4, paid: 0, paymentStatus: '未付款', receiptStatus: '未收票', plannedPayDate: '2026-06-28', manager: '王杰', remark: '' },
  { id: 'exp-11', code: 'EXP-2026-011', supplier: '劳务公司', type: '劳务费用', department: '生产部', amount: 19.3, paid: 19.3, paymentStatus: '已付款', receiptStatus: '已收票', plannedPayDate: '2026-06-12', manager: '赵明', remark: '临时劳务' },
  { id: 'exp-12', code: 'EXP-2026-012', supplier: '企业内部', type: '日常报销', department: '销售部', amount: 6.5, paid: 6.5, paymentStatus: '已付款', receiptStatus: '已收票', plannedPayDate: '2026-06-07', manager: '赵明', remark: '差旅报销' },
  { id: 'exp-13', code: 'EXP-2026-013', supplier: 'IT服务商', type: '管理费用', department: '行政部', amount: 5.8, paid: 0, paymentStatus: '未付款', receiptStatus: '已收票', plannedPayDate: '2026-06-30', manager: '许丹', remark: '系统维护费' },
  { id: 'exp-14', code: 'EXP-2026-014', supplier: '市场活动公司', type: '市场费用', department: '市场部', amount: 19.3, paid: 10.0, paymentStatus: '部分付款', receiptStatus: '已收票', plannedPayDate: '2026-06-20', manager: '许丹', remark: '展会费用' },
  { id: 'exp-15', code: 'EXP-2026-015', supplier: '物流服务公司', type: '管理费用', department: '销售部', amount: 4.2, paid: 4.2, paymentStatus: '已付款', receiptStatus: '已收票', plannedPayDate: '2026-06-06', manager: '赵明', remark: '' },
  { id: 'exp-16', code: 'EXP-2026-016', supplier: '建筑材料供应商A', type: '材料采购', department: '生产部', amount: 15.6, paid: 0, paymentStatus: '未付款', receiptStatus: '未收票', plannedPayDate: '2026-07-05', manager: '王杰', remark: '' },
  { id: 'exp-17', code: 'EXP-2026-017', supplier: '企业内部', type: '工资薪酬', department: '公司整体', amount: 3.2, paid: 3.2, paymentStatus: '已付款', receiptStatus: '已收票', plannedPayDate: '2026-06-01', manager: '赵宁', remark: '加班补贴' },
  { id: 'exp-18', code: 'EXP-2026-018', supplier: '办公用品公司', type: '日常报销', department: '财务部', amount: 1.8, paid: 1.8, paymentStatus: '已付款', receiptStatus: '已收票', plannedPayDate: '2026-06-04', manager: '赵宁', remark: '' },
  { id: 'exp-19', code: 'EXP-2026-019', supplier: '咨询顾问公司', type: '管理费用', department: '财务部', amount: 8.5, paid: 0, paymentStatus: '未付款', receiptStatus: '已收票', plannedPayDate: '2026-07-01', manager: '赵宁', remark: '财税顾问费' },
  { id: 'exp-20', code: 'EXP-2026-020', supplier: '市场推广公司', type: '市场费用', department: '市场部', amount: 7.2, paid: 0, paymentStatus: '未付款', receiptStatus: '未收票', plannedPayDate: '2026-06-28', manager: '许丹', remark: '线上推广' },
];

// ==================== 应收账款 ====================
const defaultReceivables: ReceivableRecord[] = [
  { id: 'rec-1', customer: '华东城建集团', amount: 64.8, collected: 12.4, dueDate: '2026-06-10', overdueDays: 11, manager: '赵明', dunningStatus: '已提醒', riskLevel: 'normal', followUp: '已电话沟通，预计6月25日前回款', remark: 'A级客户' },
  { id: 'rec-2', customer: '南方医药连锁', amount: 37.8, collected: 0, dueDate: '2026-05-06', overdueDays: 36, manager: '赵明', dunningStatus: '高风险', riskLevel: 'high', followUp: '多次催收未果，客户经营困难', remark: '需启动专项催收' },
  { id: 'rec-3', customer: '久银商贸公司', amount: 42.8, collected: 0, dueDate: '2026-06-25', overdueDays: 0, manager: '赵明', dunningStatus: '跟进中', riskLevel: 'medium', followUp: '新签合同，尚未到回款期', remark: '' },
  { id: 'rec-4', customer: '南方医药分店', amount: 17.8, collected: 0, dueDate: '2026-05-20', overdueDays: 22, manager: '王杰', dunningStatus: '已提醒', riskLevel: 'medium', followUp: '已发催款函', remark: '总店关联客户' },
  { id: 'rec-5', customer: '北京建材市场', amount: 44.1, collected: 0, dueDate: '2026-06-30', overdueDays: 0, manager: '赵宁', dunningStatus: '未催收', riskLevel: 'normal', followUp: '', remark: '长期合作客户' },
  { id: 'rec-6', customer: '华林贸易公司', amount: 52.4, collected: 0, dueDate: '2026-06-15', overdueDays: 6, manager: '王杰', dunningStatus: '已提醒', riskLevel: 'normal', followUp: '已发送对账单', remark: '' },
  { id: 'rec-7', customer: '南方医药连锁', amount: 12.3, collected: 0, dueDate: '2026-07-10', overdueDays: 0, manager: '赵明', dunningStatus: '未催收', riskLevel: 'high', followUp: '', remark: '关联高风险客户' },
  { id: 'rec-8', customer: '华东城建集团', amount: 26.2, collected: 0, dueDate: '2026-07-01', overdueDays: 0, manager: '赵明', dunningStatus: '未催收', riskLevel: 'normal', followUp: '', remark: '增量部分' },
  { id: 'rec-9', customer: '久银商贸公司', amount: 18.5, collected: 0, dueDate: '2026-07-15', overdueDays: 0, manager: '王杰', dunningStatus: '未催收', riskLevel: 'medium', followUp: '', remark: '' },
  { id: 'rec-10', customer: '南方医药分店', amount: 26.4, collected: 0, dueDate: '2026-06-28', overdueDays: 0, manager: '赵明', dunningStatus: '未催收', riskLevel: 'medium', followUp: '', remark: '' },
];

// ==================== 应付账款 ====================
const defaultPayables: PayableRecord[] = [
  { id: 'pay-1', supplier: '企业内部', amount: 38.4, paid: 0, dueDate: '2026-06-08', priority: '必须付款', status: '已逾期', suggestion: '优先安排付款', manager: '赵宁', remark: '本月工资' },
  { id: 'pay-2', supplier: '建筑材料供应商A', amount: 26.8, paid: 0, dueDate: '2026-06-20', priority: '可协商延期', status: '未付款', suggestion: '可协商延期15天', manager: '王杰', remark: '项目材料费' },
  { id: 'pay-3', supplier: '物流服务公司', amount: 17.4, paid: 0, dueDate: '2026-06-15', priority: '优先付款', status: '未付款', suggestion: '优先安排付款', manager: '赵明', remark: '运输服务费' },
  { id: 'pay-4', supplier: '市场推广公司', amount: 26.8, paid: 0, dueDate: '2026-06-25', priority: '暂缓付款', status: '未付款', suggestion: '预算已超标，建议暂缓', manager: '许丹', remark: '季度推广费' },
  { id: 'pay-5', supplier: '机械设备公司', amount: 8.4, paid: 10.0, dueDate: '2026-06-18', priority: '可协商延期', status: '部分付款', suggestion: '余额可协商', manager: '王杰', remark: '设备租赁费余额' },
  { id: 'pay-6', supplier: '分包商B', amount: 12.6, paid: 20.0, dueDate: '2026-06-22', priority: '优先付款', status: '部分付款', suggestion: '工程进度需要，优先安排', manager: '赵明', remark: '' },
  { id: 'pay-7', supplier: '建筑材料供应商B', amount: 22.4, paid: 0, dueDate: '2026-06-28', priority: '可协商延期', status: '未付款', suggestion: '可延至下月', manager: '王杰', remark: '' },
  { id: 'pay-8', supplier: 'IT服务商', amount: 5.8, paid: 0, dueDate: '2026-06-30', priority: '可协商延期', status: '未付款', suggestion: '金额较小，可延后', manager: '许丹', remark: '' },
  { id: 'pay-9', supplier: '市场活动公司', amount: 9.3, paid: 10.0, dueDate: '2026-06-20', priority: '暂缓付款', status: '部分付款', suggestion: '预算超标，建议暂缓', manager: '许丹', remark: '' },
  { id: 'pay-10', supplier: '咨询顾问公司', amount: 8.5, paid: 0, dueDate: '2026-07-01', priority: '可协商延期', status: '未付款', suggestion: '可延至下月', manager: '赵宁', remark: '' },
];

// ==================== 合同数据 ====================
const defaultContracts: ContractRecord[] = [
  { id: 'ctr-1', code: 'HT-2026-018', party: '华东城建集团', type: '销售合同', amount: 120.0, signDate: '2026-01-15', status: '执行中', project: '市政道路项目A', settled: 84.9, riskStatus: '正常', remark: '' },
  { id: 'ctr-2', code: 'HT-2026-019', party: '华林贸易公司', type: '销售合同', amount: 87.4, signDate: '2026-02-20', status: '执行中', project: '排水工程B', settled: 35.0, riskStatus: '正常', remark: '' },
  { id: 'ctr-3', code: 'HT-2026-020', party: '南方医药连锁', type: '服务合同', amount: 55.1, signDate: '2026-03-10', status: '执行中', project: '设备维保项目', settled: 0, riskStatus: '回款风险', remark: '客户经营困难' },
  { id: 'ctr-4', code: 'HT-2026-021', party: '北方商贸', type: '销售合同', amount: 68.8, signDate: '2026-04-05', status: '已完成', project: '建材供应项目', settled: 68.8, riskStatus: '正常', remark: '' },
  { id: 'ctr-5', code: 'HT-2026-022', party: '久银商贸公司', type: '销售合同', amount: 101.1, signDate: '2026-05-12', status: '执行中', project: '桥梁加固工程', settled: 39.5, riskStatus: '正常', remark: '' },
  { id: 'ctr-6', code: 'HT-2026-023', party: '北京建材市场', type: '采购合同', amount: 95.0, signDate: '2026-04-20', status: '执行中', project: '材料贸易项目', settled: 42.0, riskStatus: '需关注', remark: '工期延误' },
  { id: 'ctr-7', code: 'HT-2026-024', party: '南方医药分店', type: '服务合同', amount: 44.2, signDate: '2026-06-01', status: '审批中', project: '装修维护项目', settled: 0, riskStatus: '履约风险', remark: '待验收' },
  { id: 'ctr-8', code: 'HT-2026-025', party: '华东城建集团', type: '销售合同', amount: 72.0, signDate: '2026-05-25', status: '执行中', project: '绿化工程项目', settled: 45.8, riskStatus: '正常', remark: '' },
];

// ==================== 预算数据 ====================
const defaultBudgets: BudgetRecord[] = [
  { id: 'bud-1', department: '销售部', budgetAmount: 68.0, usedAmount: 61.2, manager: '赵明', remark: '含差旅和招待费' },
  { id: 'bud-2', department: '生产部', budgetAmount: 92.0, usedAmount: 96.8, manager: '王杰', remark: '含材料、机械、分包费用' },
  { id: 'bud-3', department: '行政部', budgetAmount: 54.0, usedAmount: 41.5, manager: '许丹', remark: '含办公、IT维护' },
  { id: 'bud-4', department: '市场部', budgetAmount: 38.0, usedAmount: 46.1, manager: '许丹', remark: '含推广、展会费用' },
  { id: 'bud-5', department: '财务部', budgetAmount: 21.0, usedAmount: 17.2, manager: '赵宁', remark: '含顾问、审计费用' },
];

// ==================== 审批数据 ====================
const defaultApprovals: ApprovalRecord[] = [
  { id: 'apv-1', code: 'APV-001', type: '付款申请', applicant: '赵宁', department: '财务部', amount: 38.4, submitTime: '2026-06-05 09:30', currentNode: 'CFO审批', status: 'pending', approver: '张总' },
  { id: 'apv-2', code: 'APV-002', type: '报销申请', applicant: '许丹', department: '市场部', amount: 26.8, submitTime: '2026-06-12 14:20', currentNode: '部门负责人审批', status: 'pending', approver: '赵明' },
  { id: 'apv-3', code: 'APV-003', type: '合同审批', applicant: '赵宁', department: '财务部', amount: 12.9, submitTime: '2026-06-03 10:00', currentNode: '已完成', status: 'approved', approver: '张总' },
  { id: 'apv-4', code: 'APV-004', type: '借款申请', applicant: '张三', department: '销售部', amount: 6.5, submitTime: '2026-06-15 16:45', currentNode: '财务负责人审批', status: 'need_more', approver: '赵宁' },
  { id: 'apv-5', code: 'APV-005', type: '费用申请', applicant: '王杰', department: '生产部', amount: 22.4, submitTime: '2026-06-18 08:30', currentNode: '部门负责人审批', status: 'pending', approver: '王杰' },
  { id: 'apv-6', code: 'APV-006', type: '付款申请', applicant: '赵明', department: '销售部', amount: 8.4, submitTime: '2026-06-10 11:15', currentNode: '已完成', status: 'approved', approver: '张总' },
  { id: 'apv-7', code: 'APV-007', type: '报销申请', applicant: '赵宁', department: '财务部', amount: 1.8, submitTime: '2026-06-08 09:00', currentNode: '已完成', status: 'approved', approver: '赵宁' },
  { id: 'apv-8', code: 'APV-008', type: '开票申请', applicant: '王杰', department: '生产部', amount: 15.6, submitTime: '2026-06-16 13:40', currentNode: '财务负责人审批', status: 'pending', approver: '赵宁' },
];

// ==================== 现金流预测 ====================
const defaultCashflow: CashflowForecast[] = [
  { stage: '当前', startBalance: 486.8, expectedInflow: 0, expectedOutflow: 0, endBalance: 486.8, riskLevel: '正常', suggestion: '资金充裕' },
  { stage: '7天', startBalance: 486.8, expectedInflow: 46.5, expectedOutflow: 78.4, endBalance: 454.9, riskLevel: '正常', suggestion: '正常波动' },
  { stage: '30天', startBalance: 454.9, expectedInflow: 132.6, expectedOutflow: 221.8, endBalance: 365.7, riskLevel: '正常', suggestion: '关注大额支出' },
  { stage: '60天', startBalance: 365.7, expectedInflow: 116.8, expectedOutflow: 255.1, endBalance: 227.4, riskLevel: '关注', suggestion: '加快回款节奏' },
  { stage: '90天', startBalance: 227.4, expectedInflow: 164.4, expectedOutflow: 436.6, endBalance: -44.8, riskLevel: '高风险', suggestion: '需提前融资或压缩付款' },
];

// ==================== 风险预警 ====================
const defaultRisks: RiskWarning[] = [
  { id: 'risk-1', item: '90天资金缺口可能出现', level: 'high', amount: 44.8, department: '公司整体', manager: '张总', evaluation: '现金流预测显示90天后可能出现44.8万资金缺口，主要原因应收回款慢、供应商付款集中、市场部费用超预算', suggestion: '提前安排融资或压缩付款、优先催收高风险应收款', status: 'pending', deadline: '2026-07-15' },
  { id: 'risk-2', item: '南方医药连锁应收款逾期36天', level: 'high', amount: 37.8, department: '销售部', manager: '赵明', evaluation: '该客户累计欠款55.1万，其中37.8万已逾期36天，客户经营困难，回款不确定性高', suggestion: '启动专项催收、考虑法律手段、同步暂停新业务', status: 'processing', deadline: '2026-06-30' },
  { id: 'risk-3', item: '供应商付款将在3天内集中到期', level: 'medium', amount: 82.6, department: '采购部', manager: '王杰', evaluation: '6月8日工资38.4万必须付款，另有3笔供应商付款合计44.2万将在15天内到期', suggestion: '重新排序付款优先级，协商部分供应商延期付款', status: 'pending', deadline: '2026-06-08' },
  { id: 'risk-4', item: '市场部预算使用率超过120%', level: 'medium', amount: 14.4, department: '市场部', manager: '许丹', evaluation: '市场部月度预算38万，已使用46.1万，超出预算8.1万，主要原因是展会费用和线上推广费用超支', suggestion: '暂停非必要市场支出、重新调整预算方案', status: 'pending', deadline: '2026-06-25' },
  { id: 'risk-5', item: '本月利润环比下降18.4%', level: 'low', amount: 11.3, department: '公司整体', manager: '张总', evaluation: '本月利润84.7万较上月103.8万下降18.4%，主要原因是市场费用增加和材料成本上升', suggestion: '分析收入下降及费用增长原因，关注毛利率变化', status: 'pending', deadline: '2026-07-05' },
  { id: 'risk-6', item: '生产部预算超支', level: 'medium', amount: 4.8, department: '生产部', manager: '王杰', evaluation: '生产部月度预算92万，已使用96.8万，超预算5%，主要超支在材料采购和机械费用', suggestion: '审查材料采购计划，优化机械使用效率', status: 'pending', deadline: '2026-06-28' },
  { id: 'risk-7', item: '南方医药分店应收款需关注', level: 'medium', amount: 26.4, department: '销售部', manager: '赵明', evaluation: '南方医药分店合同金额44.2万，已完工未收款26.4万，关联总店高风险客户', suggestion: '加快验收流程，同步启动催收', status: 'pending', deadline: '2026-07-01' },
  { id: 'risk-8', item: '北京建材市场工期延误', level: 'low', amount: 44.1, department: '生产部', manager: '王杰', evaluation: '北京建材市场材料贸易项目工期延误，影响回款44.1万', suggestion: '加快工期推进，明确回款节点', status: 'processing', deadline: '2026-07-10' },
  { id: 'risk-9', item: '咨询顾问费下月到期', level: 'low', amount: 8.5, department: '财务部', manager: '赵宁', evaluation: '财税顾问费8.5万将于7月1日到期，金额不大但需提前安排', suggestion: '确认顾问服务内容，按计划付款', status: 'done', deadline: '2026-07-01' },
  { id: 'risk-10', item: '市场推广费已超预算', level: 'medium', amount: 26.8, department: '市场部', manager: '许丹', evaluation: '季度推广费用26.8万已申请但未付款，而市场部预算已超标，如付款将进一步加剧预算超标', suggestion: '建议暂缓付款，待预算调整后再行支付', status: 'pending', deadline: '2026-06-25' },
];

// ==================== 基础资料 ====================
const defaultMasterData: MasterDataRecord[] = [
  { id: 'md-1', code: 'MD-001', type: '客户', name: '华东城建集团', manager: '赵明', status: '正常', remark: 'A级客户' },
  { id: 'md-2', code: 'MD-002', type: '客户', name: '南方医药连锁', manager: '王杰', status: '需完善', remark: '税号未填' },
  { id: 'md-3', code: 'MD-003', type: '供应商', name: '北京建材市场', manager: '赵宁', status: '正常', remark: '长期供应商' },
  { id: 'md-4', code: 'MD-004', type: '部门', name: '市场部', manager: '许丹', status: '正常', remark: '预算超标部门' },
  { id: 'md-5', code: 'MD-005', type: '费用科目', name: '市场运营费', manager: '财务部', status: '正常', remark: '' },
  { id: 'md-6', code: 'MD-006', type: '员工', name: '赵明', manager: '销售部', status: '正常', remark: '销售负责人' },
  { id: 'md-7', code: 'MD-007', type: '员工', name: '王杰', manager: '生产部', status: '正常', remark: '生产负责人' },
  { id: 'md-8', code: 'MD-008', type: '员工', name: '赵宁', manager: '财务部', status: '正常', remark: '财务负责人' },
  { id: 'md-9', code: 'MD-009', type: '员工', name: '许丹', manager: '市场部/行政部', status: '正常', remark: '市场及行政负责人' },
  { id: 'md-10', code: 'MD-010', type: '项目', name: '市政道路项目A', manager: '赵明', status: '正常', remark: '重点项目' },
  { id: 'md-11', code: 'MD-011', type: '客户', name: '华林贸易公司', manager: '王杰', status: '正常', remark: 'B级客户' },
  { id: 'md-12', code: 'MD-012', type: '客户', name: '北方商贸', manager: '赵宁', status: '正常', remark: 'A级客户' },
  { id: 'md-13', code: 'MD-013', type: '客户', name: '久银商贸公司', manager: '赵明', status: '正常', remark: '新客户' },
  { id: 'md-14', code: 'MD-014', type: '银行账户', name: '中国银行基本户', manager: '赵宁', status: '正常', remark: '主要收付款账户' },
  { id: 'md-15', code: 'MD-015', type: '供应商', name: '建筑材料供应商A', manager: '王杰', status: '需完善', remark: '资质证书待更新' },
];

// ==================== 角色权限 ====================
const defaultRoles: Role[] = [
  { key: 'super_admin', name: '超级管理员', permissions: ['all'] },
  { key: 'boss', name: '老板', permissions: ['view_all', 'export', 'approve_final'] },
  { key: 'finance_head', name: '财务负责人', permissions: ['view_all', 'manage_finance', 'approve', 'export'] },
  { key: 'accountant', name: '会计', permissions: ['view_finance', 'edit_income', 'edit_expense', 'edit_contract', 'edit_master'] },
  { key: 'cashier', name: '出纳', permissions: ['view_finance', 'record_payment', 'record_receipt'] },
  { key: 'dept_head', name: '部门负责人', permissions: ['view_dept', 'approve_dept'] },
  { key: 'approver', name: '审批人', permissions: ['view_approval', 'approve'] },
  { key: 'employee', name: '普通员工', permissions: ['submit_request', 'view_own'] },
];

// ==================== 预警规则 ====================
const defaultAlertRules: AlertRule[] = [
  { id: 'ar-1', name: '现金流预警', type: '现金流', threshold: '未来90天现金余额低于50万', enabled: true },
  { id: 'ar-2', name: '应收逾期预警', type: '应收账款', threshold: '逾期超过15天', enabled: true },
  { id: 'ar-3', name: '预算超标预警', type: '预算管理', threshold: '使用率超过90%', enabled: true },
  { id: 'ar-4', name: '应付到期预警', type: '应付账款', threshold: '7天内到期且金额超过10万', enabled: true },
  { id: 'ar-5', name: '合同到期预警', type: '合同管理', threshold: '30天内到期', enabled: true },
  { id: 'ar-6', name: '大额支出预警', type: '支出管理', threshold: '单笔超过20万', enabled: true },
];

// ==================== 审计日志 ====================
const defaultAuditLogs: AuditLog[] = [
  { id: 'log-1', user: '赵宁', action: '新增支出', module: '支出管理', time: '2026-06-20 09:30:00', detail: '新增工资薪酬支出38.4万' },
  { id: 'log-2', user: '赵明', action: '编辑收入', module: '收入管理', time: '2026-06-20 10:15:00', detail: '修改华东城建集团收入金额' },
  { id: 'log-3', user: '张总', action: '审批通过', module: '审批中心', time: '2026-06-19 14:20:00', detail: '审批通过合同HT-2026-025' },
  { id: 'log-4', user: '许丹', action: '提交审批', module: '审批中心', time: '2026-06-19 16:45:00', detail: '提交市场费用报销26.8万' },
  { id: 'log-5', user: '赵宁', action: '导出报告', module: '经营总览', time: '2026-06-19 17:00:00', detail: '导出6月经营月报' },
  { id: 'log-6', user: '王杰', action: '新增合同', module: '合同管理', time: '2026-06-18 11:30:00', detail: '新增合同HT-2026-024' },
  { id: 'log-7', user: '赵明', action: '催收记录', module: '应收账款', time: '2026-06-18 09:00:00', detail: '更新南方医药连锁催收记录' },
  { id: 'log-8', user: 'admin', action: '系统登录', module: '系统设置', time: '2026-06-21 08:00:00', detail: '管理员登录系统' },
];

// ==================== 月度趋势数据 ====================
export const monthlyTrends = [
  { month: '1月', income: 285.4, expense: 198.6, profit: 86.8 },
  { month: '2月', income: 256.8, expense: 189.2, profit: 67.6 },
  { month: '3月', income: 312.4, expense: 221.5, profit: 90.9 },
  { month: '4月', income: 298.7, expense: 209.3, profit: 89.4 },
  { month: '5月', income: 341.2, expense: 237.4, profit: 103.8 },
  { month: '6月', income: 312.6, expense: 227.9, profit: 84.7 },
];

// ==================== API 数据缓存 ====================
const DEFAULT_COLLECTIONS = {
  incomes: defaultIncomes,
  expenses: defaultExpenses,
  receivables: defaultReceivables,
  payables: defaultPayables,
  contracts: defaultContracts,
  budgets: defaultBudgets,
  approvals: defaultApprovals,
  cashflow: defaultCashflow,
  risks: defaultRisks,
  masterData: defaultMasterData,
  roles: defaultRoles,
  alertRules: defaultAlertRules,
  auditLogs: defaultAuditLogs,
};

const collectionCache: Record<string, unknown[]> = { ...DEFAULT_COLLECTIONS };

export function initializeCollections(collections: Record<string, unknown[]>): void {
  Object.assign(collectionCache, collections);
}

function loadFromCache<T>(key: keyof typeof DEFAULT_COLLECTIONS): T[] {
  return (collectionCache[key] ?? DEFAULT_COLLECTIONS[key]) as T[];
}

function saveToApi<T>(key: keyof typeof DEFAULT_COLLECTIONS, data: T[]): void {
  collectionCache[key] = data as unknown[];
  void saveCollection(key, data).then((saved) => {
    collectionCache[key] = saved as unknown[];
  }).catch((error) => {
    window.alert(error instanceof Error ? error.message : '数据保存失败');
  });
}

// ==================== 数据访问层 ====================
export function getIncomes(): IncomeRecord[] {
  return loadFromCache('incomes');
}
export function saveIncomes(data: IncomeRecord[]): void {
  saveToApi('incomes', data);
}

export function getExpenses(): ExpenseRecord[] {
  return loadFromCache('expenses');
}
export function saveExpenses(data: ExpenseRecord[]): void {
  saveToApi('expenses', data);
}

export function getReceivables(): ReceivableRecord[] {
  return loadFromCache('receivables');
}
export function saveReceivables(data: ReceivableRecord[]): void {
  saveToApi('receivables', data);
}

export function getPayables(): PayableRecord[] {
  return loadFromCache('payables');
}
export function savePayables(data: PayableRecord[]): void {
  saveToApi('payables', data);
}

export function getContracts(): ContractRecord[] {
  return loadFromCache('contracts');
}
export function saveContracts(data: ContractRecord[]): void {
  saveToApi('contracts', data);
}

export function getBudgets(): BudgetRecord[] {
  return loadFromCache('budgets');
}
export function saveBudgets(data: BudgetRecord[]): void {
  saveToApi('budgets', data);
}

export function getApprovals(): ApprovalRecord[] {
  return loadFromCache('approvals');
}
export function saveApprovals(data: ApprovalRecord[]): void {
  saveToApi('approvals', data);
}

export function getCashflow(): CashflowForecast[] {
  return loadFromCache('cashflow');
}
export function saveCashflow(data: CashflowForecast[]): void {
  saveToApi('cashflow', data);
}

export function getRisks(): RiskWarning[] {
  return loadFromCache('risks');
}
export function saveRisks(data: RiskWarning[]): void {
  saveToApi('risks', data);
}

export function getMasterData(): MasterDataRecord[] {
  return loadFromCache('masterData');
}
export function saveMasterData(data: MasterDataRecord[]): void {
  saveToApi('masterData', data);
}

export function getRoles(): Role[] {
  return loadFromCache('roles');
}
export function saveRoles(data: Role[]): void {
  saveToApi('roles', data);
}

export function getAlertRules(): AlertRule[] {
  return loadFromCache('alertRules');
}
export function saveAlertRules(data: AlertRule[]): void {
  saveToApi('alertRules', data);
}

export function getAuditLogs(): AuditLog[] {
  return loadFromCache('auditLogs');
}
export function saveAuditLogs(data: AuditLog[]): void {
  saveToApi('auditLogs', data);
}
