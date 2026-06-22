import React, { useEffect, useMemo, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import {
  monthlyTrends,
  getReceivables,
  getPayables,
  getBudgets,
  getCashflow,
} from '@/data/mockData';
import { formatMoney } from '@/utils/format';
import { fetchDashboardSummary } from '@/services/api';
import {
  getTotalReceivables,
  getOverdueReceivables,
  getOverdueTotal,
  getPayable30Days,
  getSafeDaysCalc,
  calcBudgetUsageRate,
} from '@/utils/calculations';
import {
  getRiskBadgeClass,
  getRiskLabel,
  getBudgetStatus,
  getBudgetStatusColor,
  getProgressBarColor,
} from '@/utils/riskRules';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ReceivableRecord, PayableRecord, BudgetRecord, CashflowForecast } from '@/types';

interface DashboardSummary {
  incomeTotal: number;
  expenseTotal: number;
  profit: number;
  receivableTotal: number;
  payableTotal: number;
}

// ==================== Recharts 自定义 Tooltip ====================

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-semibold text-slate-800">
            {formatMoney(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ==================== 主组件 ====================

export default function Dashboard() {
  // ---- 数据获取 ----
  const receivables = useMemo(() => getReceivables(), []);
  const payables = useMemo(() => getPayables(), []);
  const budgets = useMemo(() => getBudgets(), []);
  const cashflow = useMemo(() => getCashflow(), []);

  const overdueReceivables = useMemo(
    () => getOverdueReceivables(),
    []
  );
  const totalReceivables = useMemo(() => getTotalReceivables(), []);
  const overdueTotal = useMemo(() => getOverdueTotal(), []);
  const payable30Days = useMemo(() => getPayable30Days(), []);
  const safeDays = useMemo(() => getSafeDaysCalc(), []);

  // 本月待付款（到期日期在本月）
  const payablesThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return payables.filter((p) => {
      const due = new Date(p.dueDate);
      return (
        due.getMonth() === currentMonth &&
        due.getFullYear() === currentYear &&
        p.status !== '已付款'
      );
    });
  }, [payables]);

  // 上月数据（for 5月 comparison）
  const lastMonthData = monthlyTrends[4]; // 5月
  const currentMonthData = monthlyTrends[5]; // 6月
  const balanceChange = 42.3; // 较上月余额变化

  // ---- 卡片数据 ----
  const metricCards = [
    {
      title: '当前账户余额',
      value: formatMoney(486.8),
      sub: `较上月 +${formatMoney(balanceChange)}`,
      icon: DollarSign,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trend: 'up' as const,
    },
    {
      title: '本月收入',
      value: formatMoney(312.6),
      sub: '环比 +18.4%',
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      trend: 'up' as const,
    },
    {
      title: '本月支出',
      value: formatMoney(227.9),
      sub: '费用率 31.6%',
      icon: TrendingDown,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      trend: 'down' as const,
    },
    {
      title: '本月利润',
      value: formatMoney(84.7),
      sub: '毛利率 27.1%',
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trend: 'down' as const,
    },
    {
      title: '资金安全天数',
      value: `${safeDays} 天`,
      sub: '资金安全',
      icon: Shield,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      trend: 'neutral' as const,
    },
    {
      title: '应收账款金额',
      value: formatMoney(totalReceivables),
      sub: `逾期 ${formatMoney(overdueTotal)}  需重点催收`,
      icon: Clock,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      trend: 'warning' as const,
    },
    {
      title: '应付30天金额',
      value: formatMoney(payable30Days),
      sub: '需关注付款',
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      trend: 'warning' as const,
    },
  ];

  // ---- 部门预算数据（用于 BarChart） ----
  const budgetChartData = useMemo(
    () =>
      budgets.map((b: BudgetRecord) => ({
        department: b.department,
        budget: b.budgetAmount,
        used: b.usedAmount,
        rate: calcBudgetUsageRate(b),
        status: getBudgetStatus(b),
      })),
    [budgets]
  );

  // ---- 现金流图表数据 ----
  const cashflowChartData = useMemo(
    () =>
      cashflow.map((c: CashflowForecast) => ({
        stage: c.stage,
        endBalance: c.endBalance,
        riskLevel: c.riskLevel,
      })),
    [cashflow]
  );

  // ---- 格式化函数 ----
  const yAxisTickFormatter = (value: number) => `${value}万`;
  const barColor = (rate: number) =>
    rate >= 100 ? '#ef4444' : '#3b82f6';

  return (
    <PageContainer title="经营总览" subtitle="企业核心经营指标一览">
      {/* ==================== 指标卡片 ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.slice(0, 4).map((card, idx) => (
          <div key={idx} className="card-metric animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="metric-label">{card.title}</p>
                <p className="metric-value mt-1">{card.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {card.trend === 'up' && (
                    <ArrowUp className="w-3 h-3 text-green-500" />
                  )}
                  {card.trend === 'down' && (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  )}
                  <span
                    className={`metric-sub ${
                      card.trend === 'up'
                        ? 'text-green-600'
                        : card.trend === 'down'
                          ? 'text-red-500'
                          : card.trend === 'warning'
                            ? 'text-amber-600'
                            : 'text-slate-400'
                    }`}
                  >
                    {card.sub}
                  </span>
                </div>
              </div>
              <div className={`${card.iconBg} p-2.5 rounded-lg flex-shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metricCards.slice(4).map((card, idx) => (
          <div key={idx} className="card-metric animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="metric-label">{card.title}</p>
                <p className="metric-value mt-1">{card.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={`metric-sub ${
                      card.trend === 'warning'
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {card.sub}
                  </span>
                </div>
              </div>
              <div className={`${card.iconBg} p-2.5 rounded-lg flex-shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== 图表区域 ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 左列：收入支出利润趋势 + 部门费用排行 */}
        <div className="flex flex-col gap-6">
          {/* 收入支出利润趋势图 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              收入支出利润趋势
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={yAxisTickFormatter}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="收入"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="支出"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="利润"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 部门费用排行 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              部门费用排行
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={budgetChartData}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={yAxisTickFormatter}
                />
                <YAxis
                  type="category"
                  dataKey="department"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
                        <p className="font-semibold text-slate-700 mb-1">
                          {label}
                        </p>
                        <p className="text-slate-500">
                          已使用: {formatMoney(data.used)}
                        </p>
                        <p className="text-slate-500">
                          预算: {formatMoney(data.budget)}
                        </p>
                        <p
                          className={`font-semibold ${
                            data.rate >= 100
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`}
                        >
                          使用率: {data.rate.toFixed(1)}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="used" name="已使用" radius={[0, 6, 6, 0]}>
                  {budgetChartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={barColor(entry.rate)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* 图例 */}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500" />
                预算正常
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-500" />
                超预算
              </div>
            </div>
          </div>
        </div>

        {/* 右列：未来90天现金余额变化 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            未来90天现金余额变化
          </h3>
          <ResponsiveContainer width="100%" height={596}>
            <AreaChart data={cashflowChartData}>
              <defs>
                <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={yAxisTickFormatter}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload || !payload.length) return null;
                  const val = payload[0]?.value;
                  const isNegative = val < 0;
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-700 mb-1">
                        {label}
                      </p>
                      <p
                        className={`font-semibold ${
                          isNegative ? 'text-red-600' : 'text-blue-600'
                        }`}
                      >
                        期末余额: {formatMoney(val)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isNegative ? '资金缺口预警' : '资金正常'}
                      </p>
                    </div>
                  );
                }}
              />
              {/* 正值区域 */}
              <Area
                type="monotone"
                dataKey="endBalance"
                name="期末余额"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#cashflowGradient)"
                dot={{
                  r: 5,
                  fill: '#3b82f6',
                  strokeWidth: 2,
                  stroke: '#fff',
                }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {/* 资金缺口风险线标注 */}
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 rounded-full" />
              期末余额趋势
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              90天后预计缺口 {formatMoney(44.8)}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 下方三栏面板 ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 逾期收款提醒 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              逾期收款提醒
            </h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {overdueReceivables.length} 笔
            </span>
          </div>
          <div className="space-y-3">
            {overdueReceivables
              .filter((r) => r.overdueDays > 0)
              .sort((a, b) => b.overdueDays - a.overdueDays)
              .map((item: ReceivableRecord) => {
                const riskBadge = getRiskBadgeClass(item.riskLevel);
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {item.customer}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${riskBadge}`}
                        >
                          {getRiskLabel(item.riskLevel)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                          应收 {formatMoney(item.amount)}
                        </span>
                        <span className="text-red-500 font-medium">
                          逾期 {item.overdueDays} 天
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                );
              })}
            {overdueReceivables.filter((r) => r.overdueDays > 0).length ===
              0 && (
              <p className="text-sm text-slate-400 text-center py-6">
                暂无逾期收款
              </p>
            )}
          </div>
        </div>

        {/* 本月待付款 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              本月待付款
            </h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {payablesThisMonth.length} 笔
            </span>
          </div>
          <div className="space-y-3">
            {payablesThisMonth.map((item: PayableRecord) => {
              const isMustPay = item.priority === '必须付款';
              const isUrgent = item.priority === '优先付款';
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {item.supplier === '企业内部'
                          ? item.remark || '企业内部'
                          : item.supplier}
                      </p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          isMustPay
                            ? 'bg-red-100 text-red-700'
                            : isUrgent
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {formatMoney(item.amount - item.paid)}
                      </span>
                      <span>
                        {item.dueDate.replace(/-/g, '月').replace(/^(\d+)月/, '$1年')}日到期
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-0.5" />
                </div>
              );
            })}
            {payablesThisMonth.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">
                本月无待付款项
              </p>
            )}
          </div>
        </div>

        {/* 高风险事项 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              高风险事项
            </h3>
            <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded-full">
              4 项
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  90天现金流可能出现缺口
                </p>
                <p className="text-xs text-red-600 font-semibold mt-0.5">
                  {formatMoney(44.8)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  南方医药连锁应收款逾期
                </p>
                <p className="text-xs text-red-600 font-semibold mt-0.5">
                  {formatMoney(37.8)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  本月工资待付
                </p>
                <p className="text-xs text-orange-600 font-semibold mt-0.5">
                  {formatMoney(38.4)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  供应商付款集中到期
                </p>
                <p className="text-xs text-orange-600 font-semibold mt-0.5">
                  {formatMoney(82.6)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
