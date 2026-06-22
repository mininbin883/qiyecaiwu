// ==================== 基础枚举 ====================
export type PageKey =
  | 'dashboard'
  | 'income'
  | 'expense'
  | 'receivables'
  | 'payables'
  | 'contracts'
  | 'budget'
  | 'approval'
  | 'cashflow'
  | 'risk'
  | 'ai-analysis'
  | 'master-data'
  | 'settings';

export type RiskLevel = 'high' | 'medium' | 'low' | 'normal';
export type ProcessStatus = 'pending' | 'processing' | 'done' | 'ignored';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'need_more';

// ==================== 收入管理 ====================
export type IncomeType = '销售收入' | '工程收入' | '服务收入' | '其他收入';
export type InvoiceStatus = '未开票' | '部分开票' | '已开票';
export type CollectionStatus = '未回款' | '部分回款' | '已回款';

export interface IncomeRecord {
  id: string;
  code: string;
  customer: string;
  type: IncomeType;
  contractCode: string;
  project: string;
  amount: number;
  collected: number;
  invoiceStatus: InvoiceStatus;
  collectionStatus: CollectionStatus;
  manager: string;
  remark: string;
}

// ==================== 支出管理 ====================
export type ExpenseType = '材料采购' | '劳务费用' | '工资薪酬' | '机械费用' | '分包费用' | '管理费用' | '税费支出' | '日常报销' | '市场费用' | '其他支出';
export type PaymentStatus = '未付款' | '部分付款' | '已付款';
export type ReceiptStatus = '未收票' | '部分收票' | '已收票';

export interface ExpenseRecord {
  id: string;
  code: string;
  supplier: string;
  type: ExpenseType;
  department: string;
  amount: number;
  paid: number;
  paymentStatus: PaymentStatus;
  receiptStatus: ReceiptStatus;
  plannedPayDate: string;
  manager: string;
  remark: string;
}

// ==================== 应收账款 ====================
export type DunningStatus = '未催收' | '已提醒' | '跟进中' | '已回款' | '高风险';

export interface ReceivableRecord {
  id: string;
  customer: string;
  amount: number;
  collected: number;
  dueDate: string;
  overdueDays: number;
  manager: string;
  dunningStatus: DunningStatus;
  riskLevel: RiskLevel;
  followUp: string;
  remark: string;
}

// ==================== 应付账款 ====================
export type PayPriority = '必须付款' | '优先付款' | '可协商延期' | '暂缓付款';
export type PayableStatus = '未付款' | '部分付款' | '已付款' | '已逾期';

export interface PayableRecord {
  id: string;
  supplier: string;
  amount: number;
  paid: number;
  dueDate: string;
  priority: PayPriority;
  status: PayableStatus;
  suggestion: string;
  manager: string;
  remark: string;
}

// ==================== 合同管理 ====================
export type ContractType = '销售合同' | '采购合同' | '服务合同' | '分包合同' | '租赁合同' | '其他合同';
export type ContractStatus = '草稿' | '审批中' | '执行中' | '已完成' | '已终止';
export type ContractRisk = '正常' | '需关注' | '回款风险' | '履约风险' | '即将到期';

export interface ContractRecord {
  id: string;
  code: string;
  party: string;
  type: ContractType;
  amount: number;
  signDate: string;
  status: ContractStatus;
  project: string;
  settled: number;
  riskStatus: ContractRisk;
  remark: string;
}

// ==================== 预算管理 ====================
export type BudgetStatus = '正常' | '需关注' | '超预算';

export interface BudgetRecord {
  id: string;
  department: string;
  budgetAmount: number;
  usedAmount: number;
  manager: string;
  remark: string;
}

// ==================== 审批中心 ====================
export type ApprovalType = '付款申请' | '报销申请' | '合同审批' | '费用申请' | '开票申请' | '借款申请';

export interface ApprovalRecord {
  id: string;
  code: string;
  type: ApprovalType;
  applicant: string;
  department: string;
  amount: number;
  submitTime: string;
  currentNode: string;
  status: ApprovalStatus;
  approver: string;
}

// ==================== 现金流预测 ====================
export type CashflowRisk = '正常' | '关注' | '中风险' | '高风险';

export interface CashflowForecast {
  stage: string;
  startBalance: number;
  expectedInflow: number;
  expectedOutflow: number;
  endBalance: number;
  riskLevel: CashflowRisk;
  suggestion: string;
}

// ==================== 风险预警 ====================
export interface RiskWarning {
  id: string;
  item: string;
  level: RiskLevel;
  amount: number;
  department: string;
  manager: string;
  evaluation: string;
  suggestion: string;
  status: ProcessStatus;
  deadline: string;
}

// ==================== 基础资料 ====================
export type MasterDataType = '客户' | '供应商' | '部门' | '员工' | '项目' | '费用科目' | '银行账户' | '合同类别';
export type MasterDataStatus = '正常' | '需完善' | '异常';

export interface MasterDataRecord {
  id: string;
  code: string;
  type: MasterDataType;
  name: string;
  manager: string;
  status: MasterDataStatus;
  remark: string;
}

// ==================== 系统设置 ====================
export type RoleKey = 'super_admin' | 'boss' | 'finance_head' | 'accountant' | 'cashier' | 'dept_head' | 'approver' | 'employee';

export interface Role {
  key: RoleKey;
  name: string;
  permissions: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  type: string;
  threshold: string;
  enabled: boolean;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  time: string;
  detail: string;
}

// ==================== AI 分析 ====================
export interface AIAnalysisResult {
  title: string;
  summary: string;
  keyData: string;
  riskReasons: string;
  impactAmount: string;
  suggestions: string;
  bossDecisions: string;
}

// ==================== 导航菜单 ====================
export interface NavItem {
  key: PageKey;
  label: string;
  icon: string;
}

// ==================== 核心指标 ====================
export interface DashboardMetrics {
  currentBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthProfit: number;
  safeDays: number;
  receivableAmount: number;
  payable30Days: number;
}
