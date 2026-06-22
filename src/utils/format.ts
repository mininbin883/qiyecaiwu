/**
 * 金额格式化 - 以万元为单位，保留1位小数
 */
export function formatMoney(amount: number): string {
  if (amount === 0) return '0 万';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${abs.toFixed(1)} 万`;
}

/**
 * 百分比格式化
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * 纯百分比（不带+号）
 */
export function formatPercentPlain(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * 格式化日期
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return dateStr;
}

/**
 * 获取当前月份字符串
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月`;
}
