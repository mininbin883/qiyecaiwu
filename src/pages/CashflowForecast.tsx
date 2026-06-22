import React, { useMemo, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { getCashflow } from '@/data/mockData';
import { formatMoney } from '@/utils/format';
import type { CashflowForecast, CashflowRisk } from '@/types';
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ==================== 自定义 Tooltip ====================

function CashflowTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((entry: any, idx: number) => {
        const isNegative = entry.value < 0;
        return (
          <div key={idx} className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-500">{entry.name}:</span>
            <span
              className={`font-semibold ${
                isNegative ? 'text-red-600' : 'text-slate-800'
              }`}
            >
              {formatMoney(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== 趋势指示组件 ====================

function TrendIndicator({ direction }: { direction: 'up' | 'down' | 'neutral' }) {
  if (direction === 'up') {
    return <ArrowUpRight className="w-3.5 h-3.5 text-green-500 inline ml-0.5" />;
  }
  if (direction === 'down') {
    return <ArrowDownRight className="w-3.5 h-3.5 text-red-500 inline ml-0.5" />;
  }
  return <Minus className="w-3.5 h-3.5 text-slate-400 inline ml-0.5" />;
}

// ==================== 风险徽章颜色 ====================

function getCashflowRiskTagClass(level: CashflowRisk): string {
  switch (level) {
    case '高风险': return 'tag-red';
    case '中风险': return 'tag-orange';
    case '关注': return 'tag-yellow';
    case '正常': return 'tag-green';
  }
}

// ==================== Q&A 数据 ====================

const Q_A_DATA = [
  {
    question: '下个月会不会缺钱？',
    answer:
      '根据当前预测，30天内资金充裕(余额365.7万)，暂无缺钱风险。但90天后预计出现44.8万缺口，需提前关注。',
  },
  {
    question: '哪一天会缺钱？',
    answer: '预计在90天后（约2026年9月）出现资金缺口。',
  },
  {
    question: '缺多少钱？',
    answer: '按目前预测，缺口约44.8万元。',
  },
  {
    question: '为什么缺钱？',
    answer:
      '主要原因：市场费用超预算(超额8.1万)、应收回款慢(逾期96.4万)、供应商付款集中(82.6万月内到期)。',
  },
  {
    question: '应该做什么？',
    answer:
      '1.优先催收南方医药连锁37.8万；2.协商供应商延期付款；3.控制市场部非必要支出。',
  },
];

// ==================== 主组件 ====================

export default function CashflowForecastPage() {
  const [cashflow, setCashflow] = useState<CashflowForecast[]>(() => getCashflow());
  const [expandedQA, setExpandedQA] = useState<number | null>(null);

  // ---- 图表数据 ----
  const chartData = useMemo(() => {
    return cashflow.map((c) => ({
      stage: c.stage,
      endBalance: c.endBalance,
      expectedInflow: c.expectedInflow,
      expectedOutflow: c.expectedOutflow,
      riskLevel: c.riskLevel,
    }));
  }, [cashflow]);

  // ---- 指标卡片 ----
  const currentBalance = cashflow[0]?.endBalance ?? 486.8;
  const day90Balance = cashflow[cashflow.length - 1]?.endBalance ?? -44.8;
  const gapAmount = day90Balance < 0 ? Math.abs(day90Balance) : 0;
  const dailyExpense = 12.8;
  const safeDays = Math.floor(currentBalance / dailyExpense);
  const hasGap = day90Balance < 0;

  const metricCards = useMemo(
    () => [
      {
        title: '当前可用资金',
        value: formatMoney(currentBalance),
        sub: '账户余额充足',
        icon: DollarSign,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        title: '90天预测缺口',
        value: hasGap ? formatMoney(-gapAmount) : '无缺口',
        sub: hasGap ? '需提前准备' : '资金充裕',
        icon: TrendingDown,
        iconBg: hasGap ? 'bg-red-100' : 'bg-green-100',
        iconColor: hasGap ? 'text-red-600' : 'text-green-600',
      },
      {
        title: '经营提示',
        value: hasGap ? '需关注' : '正常',
        sub: hasGap ? `90天后缺口${formatMoney(gapAmount)}` : '现金流健康',
        icon: AlertTriangle,
        iconBg: hasGap ? 'bg-amber-100' : 'bg-green-100',
        iconColor: hasGap ? 'text-amber-600' : 'text-green-600',
      },
      {
        title: '资金安全天数',
        value: `${safeDays} 天`,
        sub: `日均支出${formatMoney(dailyExpense)}`,
        icon: Shield,
        iconBg: safeDays > 60 ? 'bg-green-100' : 'bg-amber-100',
        iconColor: safeDays > 60 ? 'text-green-600' : 'text-amber-600',
      },
    ],
    [currentBalance, hasGap, gapAmount, safeDays]
  );

  // ---- Y轴格式化 ----
  const yAxisTickFormatter = (value: number) => `${value}万`;

  return (
    <PageContainer title="现金流预测" subtitle="未来90天现金流预测与资金安全分析">
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

      {/* ==================== 图表 + 右侧安全卡片 ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 图表 - 占2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            未来90天现金曲线
          </h3>
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                {/* 正值蓝色渐变 */}
                <linearGradient id="balanceGradientPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                {/* 负值红色渐变 */}
                <linearGradient id="balanceGradientNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
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
              <Tooltip content={<CashflowTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />

              {/* 现金余额 Area */}
              <Area
                type="monotone"
                dataKey="endBalance"
                name="现金余额"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#balanceGradientPositive)"
                dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />

              {/* 预计流入 Line */}
              <Line
                type="monotone"
                dataKey="expectedInflow"
                name="预计流入"
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
              />

              {/* 预计流出 Line */}
              <Line
                type="monotone"
                dataKey="expectedOutflow"
                name="预计流出"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
              />

              {/* 零线参考线 */}
              <ReferenceLine
                y={0}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                label={{
                  value: '资金缺口线',
                  position: 'right',
                  fontSize: 11,
                  fill: '#ef4444',
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* 图例补充说明 */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 rounded-full" />
              现金余额
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-500 rounded-full" />
              预计流入
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-orange-500 rounded-full" />
              预计流出
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-red-500 rounded-full" />
              资金缺口线
            </div>
          </div>
        </div>

        {/* 右侧：现金安全计算卡片 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            现金安全计算
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">当前可用资金</span>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-slate-700">
                  {formatMoney(currentBalance)}
                </span>
                <TrendIndicator direction="up" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">日均支出金额</span>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-slate-700">
                  {formatMoney(dailyExpense)}
                </span>
                <TrendIndicator direction="neutral" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">资金安全天数</span>
              <div className="flex items-center">
                <span
                  className={`text-sm font-semibold ${
                    safeDays > 60 ? 'text-green-600' : 'text-amber-600'
                  }`}
                >
                  {safeDays} 天
                </span>
                <TrendIndicator direction={safeDays > 60 ? 'up' : 'down'} />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">10天预计收入</span>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-green-600">
                  {formatMoney(132.6)}
                </span>
                <TrendIndicator direction="up" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">10天预计支出</span>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-red-600">
                  {formatMoney(223.3)}
                </span>
                <TrendIndicator direction="down" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">预计缺口日期</span>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-red-600">
                  90天后
                </span>
                <TrendIndicator direction="down" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">预计缺口金额</span>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-red-600">
                  {formatMoney(gapAmount)}
                </span>
                <TrendIndicator direction="down" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 现金流预测表格 ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">现金流预测明细</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>阶段</th>
                <th>期初余额</th>
                <th>预计流入</th>
                <th>预计流出</th>
                <th>期末余额</th>
                <th>风险等级</th>
                <th>建议动作</th>
              </tr>
            </thead>
            <tbody>
              {cashflow.map((item) => {
                const isEndNegative = item.endBalance < 0;
                const cashflowTag = getCashflowRiskTagClass(item.riskLevel);
                return (
                  <tr key={item.stage}>
                    <td className="font-medium text-slate-700">{item.stage}</td>
                    <td className="font-mono">{formatMoney(item.startBalance)}</td>
                    <td className="font-mono text-green-600">{formatMoney(item.expectedInflow)}</td>
                    <td className="font-mono text-orange-600">{formatMoney(item.expectedOutflow)}</td>
                    <td
                      className={`font-mono font-semibold ${
                        isEndNegative ? 'text-red-600' : 'text-slate-700'
                      }`}
                    >
                      {formatMoney(item.endBalance)}
                    </td>
                    <td>
                      <span className={cashflowTag}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td className="text-slate-600 max-w-[200px]">{item.suggestion}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== 老板问题回答卡片 ==================== */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          老板最关心的问题
        </h3>
        <div className="space-y-3">
          {Q_A_DATA.map((qa, idx) => {
            const isExpanded = expandedQA === idx;
            return (
              <div
                key={idx}
                className="border border-slate-100 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedQA(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {qa.question}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="bg-blue-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed">
                      {qa.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
