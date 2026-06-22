import type { RiskLevel, BudgetStatus } from '@/types';
import { calcBudgetUsageRate } from './calculations';
import type { BudgetRecord } from '@/types';

/**
 * 根据现金流期末余额判断风险等级
 */
export function getCashflowRiskLevel(endBalance: number, stage: string): RiskLevel {
  if (endBalance < 0) return 'high';
  if (stage === '7天' && endBalance < 100) return 'medium';
  if (stage === '30天' && endBalance < 150) return 'medium';
  if (stage === '60天' && endBalance < 200) return 'medium';
  if (stage === '90天' && endBalance < 50) return 'medium';
  return 'normal';
}

/**
 * 根据逾期天数判断应收风险等级
 */
export function getReceivableRiskLevel(overdueDays: number): RiskLevel {
  if (overdueDays > 30) return 'high';
  if (overdueDays >= 15) return 'medium';
  if (overdueDays > 0) return 'low';
  return 'normal';
}

/**
 * 判断预算状态
 */
export function getBudgetStatus(record: BudgetRecord): BudgetStatus {
  const rate = calcBudgetUsageRate(record);
  if (rate >= 100) return '超预算';
  if (rate >= 80) return '需关注';
  return '正常';
}

/**
 * 根据付款到期日判断是否即将到期
 */
export function isPaymentDueSoon(dueDate: string, days: number = 7): boolean {
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

/**
 * 获取风险等级对应的颜色类
 */
export function getRiskColorClass(level: RiskLevel): string {
  switch (level) {
    case 'high': return 'text-red-600 bg-red-50';
    case 'medium': return 'text-orange-600 bg-orange-50';
    case 'low': return 'text-blue-600 bg-blue-50';
    case 'normal': return 'text-green-600 bg-green-50';
  }
}

/**
 * 获取风险等级对应的徽章颜色
 */
export function getRiskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case 'high': return 'bg-red-100 text-red-700';
    case 'medium': return 'bg-orange-100 text-orange-700';
    case 'low': return 'bg-blue-100 text-blue-700';
    case 'normal': return 'bg-green-100 text-green-700';
  }
}

/**
 * 获取风险等级标签
 */
export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'high': return '高风险';
    case 'medium': return '中风险';
    case 'low': return '低风险';
    case 'normal': return '正常';
  }
}

/**
 * 获取预算状态对应的颜色类
 */
export function getBudgetStatusColor(status: BudgetStatus): string {
  switch (status) {
    case '超预算': return 'bg-red-100 text-red-700';
    case '需关注': return 'bg-orange-100 text-orange-700';
    case '正常': return 'bg-green-100 text-green-700';
  }
}

/**
 * 获取进度条颜色
 */
export function getProgressBarColor(rate: number): string {
  if (rate >= 100) return 'bg-red-500';
  if (rate >= 80) return 'bg-orange-500';
  return 'bg-blue-500';
}
