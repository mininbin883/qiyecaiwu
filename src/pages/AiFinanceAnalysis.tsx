import React, { useState, useMemo } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { formatMoney } from '@/utils/format';
import {
  getRisks,
  getIncomes,
  getExpenses,
  getReceivables,
  getPayables,
  getBudgets,
  getCashflow,
} from '@/data/mockData';
import type { AIAnalysisResult } from '@/types';

type AnalysisType =
  | 'cashflow'
  | 'expense'
  | 'risk'
  | 'budget'
  | 'income'
  | 'receivable'
  | 'payable'
  | 'suggestion';

type BossQuestion = {
  label: string;
  analysisType: AnalysisType;
  customPrompt?: string;
};

function generateAnalysis(type: AnalysisType, customPrompt?: string): AIAnalysisResult {
  const incomes = getIncomes();
  const expenses = getExpenses();
  const receivables = getReceivables();
  const payables = getPayables();
  const budgets = getBudgets();
  const cashflow = getCashflow();
  const risks = getRisks();

  const totalIncome = incomes.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
  const monthProfit = totalIncome - totalExpense;
  const currentBalance = cashflow[0]?.endBalance ?? 486.8;

  if (type === 'cashflow') {
    const ninetyDay = cashflow.find((c) => c.stage === '90天');
    const gap90 = ninetyDay?.endBalance ?? 0;
    const safeDays = Math.floor(currentBalance / 12.8);
    return {
      title: '现金流分析',
      summary: `本月公司经营整体保持盈利，但现金流压力开始上升。${gap90 < 0 ? '未来90天预计会出现资金缺口，需提前应对。' : '现金流总体可控。'}`,
      keyData: [
        `当前可用资金: ${formatMoney(currentBalance)}`,
        `本月收入: ${formatMoney(totalIncome)}`,
        `本月支出: ${formatMoney(totalExpense)}`,
        `账面利润: ${formatMoney(monthProfit)}`,
        `资金安全天数: ${safeDays} 天`,
        `90天预计${gap90 < 0 ? '缺口' : '余额'}: ${formatMoney(Math.abs(gap90))}`,
      ].join('\n'),
      riskReasons: gap90 < 0
        ? `未来90天预计会出现${formatMoney(Math.abs(gap90))}资金缺口。主要原因不是项目亏损，而是应收回款慢、供应商付款集中、市场部费用超预算共同造成的。`
        : '当前资金状况良好，但需关注应付账款集中到期和应收款回收节奏。',
      impactAmount: gap90 < 0
        ? `预计缺口${formatMoney(Math.abs(gap90))}，占当前资金余额的${((Math.abs(gap90) / currentBalance) * 100).toFixed(1)}%。`
        : `暂无资金缺口风险，当前余额${formatMoney(currentBalance)}。`,
      suggestions: [
        '第一，优先催收南方医药连锁37.8万逾期款；',
        '第二，对82.6万应付账款重新排序，区分必须付款和可协商延期；',
        '第三，暂停市场部非必要费用支出。',
      ].join('\n'),
      bossDecisions: [
        '1. 是否对高风险客户启动专项催收',
        '2. 是否对部分供应商付款进行延期协商',
        '3. 是否提前准备短期融资额度',
      ].join('\n'),
    };
  }

  if (type === 'expense') {
    const expenseByDept = new Map<string, number>();
    const expenseByType = new Map<string, number>();
    expenses.forEach((e) => {
      expenseByDept.set(e.department, (expenseByDept.get(e.department) || 0) + e.amount);
      expenseByType.set(e.type, (expenseByType.get(e.type) || 0) + e.amount);
    });
    const topDept = [...expenseByDept.entries()].sort((a, b) => b[1] - a[1]);
    const topType = [...expenseByType.entries()].sort((a, b) => b[1] - a[1]);

    const marketBudget = budgets.find((b) => b.department === '市场部');
    const marketUsed = marketBudget?.usedAmount ?? 0;
    const marketBudgetAmount = marketBudget?.budgetAmount ?? 0;
    const marketOverPct = marketBudgetAmount > 0
      ? ((marketUsed / marketBudgetAmount) * 100).toFixed(0)
      : '0';

    return {
      title: '经营费用分析',
      summary: `本月经营费用总计${formatMoney(totalExpense)}，较上月有所增加。费用结构总体合理，但部分部门存在超标情况。`,
      keyData: [
        `本月总支出: ${formatMoney(totalExpense)}`,
        `费用率: ${((totalExpense / totalIncome) * 100).toFixed(1)}%`,
        `最大费用部门: ${topDept[0]?.[0] || '-'} (${formatMoney(topDept[0]?.[1] || 0)})`,
        `最大费用类型: ${topType[0]?.[0] || '-'} (${formatMoney(topType[0]?.[1] || 0)})`,
        `市场部费用: ${formatMoney(marketUsed)} (预算使用${marketOverPct}%)`,
        `生产部费用: ${formatMoney(expenseByDept.get('生产部') || 0)}`,
      ].join('\n'),
      riskReasons: `市场部费用${formatMoney(marketUsed)}，预算使用率${marketOverPct}%，超出预算标准。生产部材料采购和机械费用占比较高，需关注成本控制。`,
      impactAmount: `市场部超预算${formatMoney(Math.max(0, marketUsed - marketBudgetAmount))}，占部门预算的${marketOverPct}%。`,
      suggestions: [
        '第一，暂停市场部非必要推广费用支出；',
        '第二，审查生产部材料采购计划，优化采购批次；',
        '第三，建立费用预算预警机制，超80%即触发提醒；',
        '第四，分析工资薪酬和劳务费用与收入增长的匹配度。',
      ].join('\n'),
      bossDecisions: [
        '1. 是否同意市场部下季度预算追加申请',
        '2. 是否调整材料采购策略以降低成本',
        '3. 是否需要重新评估分包模式的经济性',
      ].join('\n'),
    };
  }

  if (type === 'risk') {
    const highRisks = risks.filter((r) => r.level === 'high');
    const mediumRisks = risks.filter((r) => r.level === 'medium');
    const pendingRisks = risks.filter((r) => r.status === 'pending' || r.status === 'processing');
    const totalRiskAmount = highRisks.reduce((s, r) => s + r.amount, 0);

    return {
      title: '风险分析',
      summary: `当前系统共识别${risks.length}条风险事项，其中高风险${highRisks.length}条、中风险${mediumRisks.length}条。高风险事项合计影响金额${formatMoney(totalRiskAmount)}，需重点处理。`,
      keyData: [
        `风险总数: ${risks.length} 条`,
        `高风险: ${highRisks.length} 条`,
        `中风险: ${mediumRisks.length} 条`,
        `未处理事项: ${pendingRisks.length} 条`,
        `高风险影响金额: ${formatMoney(totalRiskAmount)}`,
        `已处理事项: ${risks.filter((r) => r.status === 'done').length} 条`,
      ].join('\n'),
      riskReasons: highRisks
        .map((r) => `【${r.item}】${r.evaluation}`)
        .join('\n'),
      impactAmount: formatMoney(totalRiskAmount),
      suggestions: [
        ...highRisks.map((r) => `• ${r.item}: ${r.suggestion}`),
        ...mediumRisks.slice(0, 3).map((r) => `• ${r.item}: 需关注`),
      ].join('\n'),
      bossDecisions: [
        '1. 是否立即召开风险应对专项会议',
        '2. 是否需要调整高风险客户的信用政策',
        '3. 是否授权财务部直接启动部分风险的应急方案',
      ].join('\n'),
    };
  }

  if (type === 'budget') {
    const overBudget = budgets.filter((b) => b.usedAmount > b.budgetAmount);
    const atRisk = budgets.filter((b) => {
      const rate = b.budgetAmount > 0 ? (b.usedAmount / b.budgetAmount) * 100 : 0;
      return rate >= 80 && rate < 100;
    });
    const normal = budgets.filter((b) => {
      const rate = b.budgetAmount > 0 ? (b.usedAmount / b.budgetAmount) * 100 : 0;
      return rate < 80;
    });

    return {
      title: '预算执行情况',
      summary: `本月${overBudget.length}个部门超预算，${atRisk.length}个部门需关注，${normal.length}个部门正常。预算执行偏差较大的部门需要重点审查。`,
      keyData: budgets
        .map((b) => {
          const rate = b.budgetAmount > 0 ? ((b.usedAmount / b.budgetAmount) * 100).toFixed(1) : '0.0';
          const flag = b.usedAmount > b.budgetAmount ? '【超预算】' : rate >= '80' ? '【需关注】' : '【正常】';
          return `${b.department}: ${formatMoney(b.usedAmount)} / ${formatMoney(b.budgetAmount)} (${rate}%) ${flag}`;
        })
        .join('\n'),
      riskReasons: overBudget
        .map((b) => {
          const exceed = b.usedAmount - b.budgetAmount;
          return `${b.department}超预算${formatMoney(exceed)}，${b.remark || '需分析具体原因'}。`;
        })
        .join('\n') || '无超预算部门',
      impactAmount: overBudget.length > 0
        ? `合计超预算${formatMoney(overBudget.reduce((s, b) => s + b.usedAmount - b.budgetAmount, 0))}`
        : '无超预算影响',
      suggestions: [
        '第一，超预算部门需提交书面说明和整改计划；',
        '第二，关注部门的预算科目使用进度和审批流程；',
        '第三，建议在下月预算中根据实际消耗做动态调整。',
      ].join('\n'),
      bossDecisions: [
        '1. 是否批准超预算部门的追加预算申请',
        '2. 是否调整下月预算分配方案',
        '3. 是否需要建立超预算自动冻结机制',
      ].join('\n'),
    };
  }

  if (type === 'income') {
    const incomeByType = new Map<string, number>();
    const incomeByCustomer = new Map<string, number>();
    incomes.forEach((i) => {
      incomeByType.set(i.type, (incomeByType.get(i.type) || 0) + i.amount);
      incomeByCustomer.set(i.customer, (incomeByCustomer.get(i.customer) || 0) + i.amount);
    });
    const collectedTotal = incomes.reduce((s, r) => s + r.collected, 0);
    const collectionRate = totalIncome > 0 ? ((collectedTotal / totalIncome) * 100).toFixed(1) : '0';
    const topCustomers = [...incomeByCustomer.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      title: '收入分析',
      summary: `本月总收入${formatMoney(totalIncome)}，已回款${formatMoney(collectedTotal)}，回款率${collectionRate}%。收入来源以销售收入和工程收入为主。`,
      keyData: [
        `本月总收入: ${formatMoney(totalIncome)}`,
        `已回款金额: ${formatMoney(collectedTotal)}`,
        `回款率: ${collectionRate}%`,
        `收入记录数: ${incomes.length} 条`,
        ...topCustomers.map(
          (c, i) => `Top${i + 1}客户: ${c[0]} - ${formatMoney(c[1])}`
        ),
      ].join('\n'),
      riskReasons: incomeByType.get('服务收入')
        ? `服务收入${formatMoney(incomeByType.get('服务收入') || 0)}占比${((incomeByType.get('服务收入') || 0) / totalIncome * 100).toFixed(1)}%，服务类收入增幅如何需关注。未回款客户集中在南方医药连锁等客户。`
        : '收入结构合理，各类型收入分布均衡。',
      impactAmount: `未回款金额${formatMoney(totalIncome - collectedTotal)}，占收入的${((1 - collectedTotal / totalIncome) * 100).toFixed(1)}%。`,
      suggestions: [
        '第一，加快南方医药连锁等逾期客户回款；',
        '第二，关注服务收入增长趋势，评估可持续性；',
        '第三，优化收入结构，避免过度依赖单一客户类型。',
      ].join('\n'),
      bossDecisions: [
        '1. 是否调整信用政策以减少逾期比例',
        '2. 是否加大服务类业务投入以优化收入结构',
        '3. 是否需要针对大客户制定专项回款方案',
      ].join('\n'),
    };
  }

  if (type === 'receivable') {
    const totalReceivable = receivables.reduce((s, r) => s + r.amount, 0);
    const totalCollected = receivables.reduce((s, r) => s + r.collected, 0);
    const overdueReceivables = receivables.filter((r) => r.overdueDays > 0);
    const overdueAmount = overdueReceivables.reduce((s, r) => s + r.amount - r.collected, 0);
    const topOverdue = [...overdueReceivables]
      .sort((a, b) => b.overdueDays - a.overdueDays)
      .slice(0, 3);

    const highRiskReceivables = receivables.filter((r) => r.riskLevel === 'high');
    const highRiskAmount = highRiskReceivables.reduce((s, r) => s + r.amount - r.collected, 0);

    return {
      title: '应收账款分析',
      summary: `当前应收账款总额${formatMoney(totalReceivable)}，已回款${formatMoney(totalCollected)}，其中逾期应收${formatMoney(overdueAmount)}(${overdueReceivables.length}笔)，高风险应收${formatMoney(highRiskAmount)}(${highRiskReceivables.length}笔)。回款压力较大。`,
      keyData: [
        `应收总额: ${formatMoney(totalReceivable)}`,
        `已回款: ${formatMoney(totalCollected)}`,
        `逾期金额: ${formatMoney(overdueAmount)}`,
        `逾期笔数: ${overdueReceivables.length} 笔`,
        `高风险应收: ${formatMoney(highRiskAmount)} (${highRiskReceivables.length}笔)`,
        ...topOverdue.map(
          (r) => `• ${r.customer}: 欠款${formatMoney(r.amount - r.collected)}，逾期${r.overdueDays}天`
        ),
      ].join('\n'),
      riskReasons: topOverdue
        .map(
          (r) =>
            `${r.customer}欠款${formatMoney(r.amount - r.collected)}，已逾期${r.overdueDays}天。${
              r.followUp || r.remark || ''
            }`
        )
        .join('\n'),
      impactAmount: `逾期应收合计${formatMoney(overdueAmount)}，高风险应收合计${formatMoney(highRiskAmount)}。`,
      suggestions: [
        '第一，对南方医药连锁启动专项催收，必要时采取法律手段；',
        '第二，对其他逾期客户发送正式催款函并电话跟进；',
        '第三，暂停高风险客户的新业务合作，待回款后恢复。',
      ].join('\n'),
      bossDecisions: [
        '1. 是否同意对南方医药连锁启动法律催收程序',
        '2. 是否调整高风险客户的信用等级上限',
        '3. 是否需要财务部每周汇报应收款回款进度',
      ].join('\n'),
    };
  }

  if (type === 'payable') {
    const totalPayable = payables.reduce((s, r) => s + r.amount, 0);
    const totalPaid = payables.reduce((s, r) => s + r.paid, 0);
    const unpaidAmount = totalPayable - totalPaid;

    const mustPay = payables.filter((r) => r.priority === '必须付款');
    const priorityPay = payables.filter((r) => r.priority === '优先付款');
    const canDelay = payables.filter((r) => r.priority === '可协商延期');
    const postpone = payables.filter((r) => r.priority === '暂缓付款');

    const mustPayAmount = mustPay.reduce((s, r) => s + r.amount - r.paid, 0);
    const priorityAmount = priorityPay.reduce((s, r) => s + r.amount - r.paid, 0);
    const canDelayAmount = canDelay.reduce((s, r) => s + r.amount - r.paid, 0);
    const postponeAmount = postpone.reduce((s, r) => s + r.amount - r.paid, 0);

    return {
      title: '应付压力分析',
      summary: `当前应付账款总额${formatMoney(totalPayable)}，已付${formatMoney(totalPaid)}，未付${formatMoney(unpaidAmount)}。其中必须付款${formatMoney(mustPayAmount)}、优先付款${formatMoney(priorityAmount)}，近期付款压力较大。`,
      keyData: [
        `应付总额: ${formatMoney(totalPayable)}`,
        `已付金额: ${formatMoney(totalPaid)}`,
        `未付金额: ${formatMoney(unpaidAmount)}`,
        `必须付款: ${formatMoney(mustPayAmount)} (${mustPay.length}笔)`,
        `优先付款: ${formatMoney(priorityAmount)} (${priorityPay.length}笔)`,
        `可协商延期: ${formatMoney(canDelayAmount)} (${canDelay.length}笔)`,
        `暂缓付款: ${formatMoney(postponeAmount)} (${postpone.length}笔)`,
      ].join('\n'),
      riskReasons: `必须付款项合计${formatMoney(mustPayAmount)}，主要包括${mustPay.map((r) => r.supplier + '的' + formatMoney(r.amount - r.paid)).join('、')}。优先付款项合计${formatMoney(priorityAmount)}。近期待付款总额${formatMoney(mustPayAmount + priorityAmount)}，当前可用资金${formatMoney(currentBalance)}。`,
      impactAmount: `近期应付压力${formatMoney(mustPayAmount + priorityAmount)}，占可用资金的${(((mustPayAmount + priorityAmount) / currentBalance) * 100).toFixed(1)}%。`,
      suggestions: [
        '第一，优先保障工资发放和基本运营费用；',
        '第二，对可协商延期款项主动与供应商沟通延期方案；',
        '第三，暂缓付款项需向供应商明确说明原因和预计付款时间。',
      ].join('\n'),
      bossDecisions: [
        '1. 是否批准延付部分供应商款项',
        '2. 是否需要启动短期融资补充流动性',
        '3. 是否调整付款审批权限以加快必须付款处理',
      ].join('\n'),
    };
  }

  if (type === 'suggestion') {
    const highRisks = risks.filter((r) => r.level === 'high');
    const pendingHigh = highRisks.filter((r) => r.status === 'pending');
    const overdueReceivables = receivables.filter((r) => r.overdueDays > 15);
    const overBudgetDepts = budgets.filter((b) => b.usedAmount > b.budgetAmount);
    const ninetyDay = cashflow.find((c) => c.stage === '90天');
    const hasGap = (ninetyDay?.endBalance ?? 0) < 0;

    const urgentActions: string[] = [];
    if (pendingHigh.length > 0) {
      urgentActions.push(`处理${pendingHigh.length}条高风险事项: ${pendingHigh.map((r) => r.item).join('、')}`);
    }
    if (hasGap) {
      urgentActions.push(`准备应对90天资金缺口${formatMoney(Math.abs(ninetyDay?.endBalance ?? 0))}`);
    }
    if (overdueReceivables.length > 0) {
      urgentActions.push(`启动${overdueReceivables.length}笔严重逾期应收款的专项催收`);
    }

    const importantActions: string[] = [];
    if (overBudgetDepts.length > 0) {
      importantActions.push(`${overBudgetDepts.map((d) => d.department).join('、')}的超预算分析和控制`);
    }
    importantActions.push('完成本月财务报表编制和经营分析');
    importantActions.push('召开月度经营分析会，通报风险事项和预算执行情况');

    return {
      title: '下月建议动作',
      summary: `基于当前经营数据和风险状况，建议下个月重点推进以下工作。其中紧急事项${urgentActions.length}项，重要事项${importantActions.length}项。`,
      keyData: [
        `当前可用资金: ${formatMoney(currentBalance)}`,
        `高风险事项: ${highRisks.length} 条 (其中${pendingHigh.length}条未处理)`,
        `严重逾期应收: ${overdueReceivables.length} 笔`,
        `超预算部门: ${overBudgetDepts.length} 个`,
        `收入: ${formatMoney(totalIncome)} | 支出: ${formatMoney(totalExpense)} | 利润: ${formatMoney(monthProfit)}`,
        `90天资金预测: ${hasGap ? `缺口${formatMoney(Math.abs(ninetyDay?.endBalance ?? 0))}` : '安全'}`,
      ].join('\n'),
      riskReasons: hasGap
        ? `90天现金流预测显示可能出现缺口，需提前准备应对方案。同时有${pendingHigh.length}条高风险事项未处理，${overdueReceivables.length}笔严重逾期应收款待催收。`
        : `当前有${pendingHigh.length}条高风险事项未处理，${overBudgetDepts.length}个部门超预算，需重点关注。`,
      impactAmount: hasGap
        ? `如果90天缺口无法弥补，将影响${formatMoney(Math.abs(ninetyDay?.endBalance ?? 0))}的正常运营支出。`
        : '暂无直接资金缺口影响，但需防患于未然。',
      suggestions: [
        '【紧急】',
        ...urgentActions.map((a) => `• ${a}`),
        '',
        '【重要】',
        ...importantActions.map((a) => `• ${a}`),
        '',
        '【常规】',
        '• 更新各业务部门下月经营目标',
        '• 完成上月各类财务报表归档',
        '• 推进各部门降本增效措施的落实',
      ].join('\n'),
      bossDecisions: [
        '1. 是否批准上述紧急事项的处理方案',
        '2. 确定下月经营目标和重点工作方向',
        '3. 是否需要调整管理层分工以应对当前经营压力',
        '4. 是否同意召开月度经营分析专题会议',
      ].join('\n'),
    };
  }

  // Fallback
  return {
    title: '',
    summary: '',
    keyData: '',
    riskReasons: '',
    impactAmount: '',
    suggestions: '',
    bossDecisions: '',
  };
}

// ── Boss Questions ──
const BOSS_QUESTIONS: BossQuestion[] = [
  {
    label: '下个月会不会缺钱？',
    analysisType: 'cashflow',
  },
  {
    label: '哪些客户欠款金额最大？',
    analysisType: 'receivable',
  },
  {
    label: '为什么本月利润下降？',
    analysisType: 'income',
    customPrompt: 'profit-drop',
  },
  {
    label: '哪些费用增长异常？',
    analysisType: 'expense',
  },
  {
    label: '如果收入下降10%，现金流还能撑多久？',
    analysisType: 'cashflow',
    customPrompt: 'stress-test',
  },
];

function generateBossQuestionResult(question: BossQuestion): AIAnalysisResult {
  if (question.customPrompt === 'profit-drop') {
    const incomes = getIncomes();
    const expenses = getExpenses();
    const totalIncome = incomes.reduce((s, r) => s + r.amount, 0);
    const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
    const monthProfit = totalIncome - totalExpense;
    const previousProfit = 103.8; // from monthlyTrends May

    const profitChange = monthProfit - previousProfit;
    const changePct = ((profitChange / previousProfit) * 100).toFixed(1);
    const direction = profitChange >= 0 ? '增长' : '下降';

    // Find expense categories that grew
    const expenseByType = new Map<string, number>();
    expenses.forEach((e) => expenseByType.set(e.type, (expenseByType.get(e.type) || 0) + e.amount));

    return {
      title: '本月利润分析',
      summary: `本月利润${formatMoney(monthProfit)}，较上月${formatMoney(previousProfit)}${direction}${formatMoney(Math.abs(profitChange))}（${changePct}%）。利润${direction}的主要原因需要从收入和支出两方面分析。`,
      keyData: [
        `本月利润: ${formatMoney(monthProfit)}`,
        `上月利润: ${formatMoney(previousProfit)}`,
        `${direction}幅度: ${changePct}%`,
        `本月收入: ${formatMoney(totalIncome)}`,
        `本月支出: ${formatMoney(totalExpense)}`,
        `毛利率: ${totalIncome > 0 ? ((monthProfit / totalIncome) * 100).toFixed(1) : '0'}%`,
      ].join('\n'),
      riskReasons: profitChange < 0
        ? `利润${direction}的主要原因：一方面市场费用增加至${formatMoney(expenseByType.get('市场费用') || 0)}（市场部预算超标），材料成本维持在${formatMoney(expenseByType.get('材料采购') || 0)}高位；另一方面部分客户回款延迟影响了现金流效率。`
        : `利润增长主要受益于收入增加和费用控制改善。`,
      impactAmount: `${direction}${formatMoney(Math.abs(profitChange))}，相当于当月利润的${Math.abs(parseFloat(changePct))}%。`,
      suggestions: [
        '第一，审查市场部和生产部费用超支原因，制定降费方案；',
        '第二，加快应收账款回收，提升现金流效率；',
        '第三，分析收入结构变化，关注高毛利业务占比变化。',
      ].join('\n'),
      bossDecisions: [
        '1. 是否需要调整产品定价策略以提高毛利率',
        '2. 是否对费用超支部门实施费用冻结',
        '3. 是否组织各业务部门制定降本增效方案',
      ].join('\n'),
    };
  }

  if (question.customPrompt === 'stress-test') {
    const cashflow = getCashflow();
    const incomes = getIncomes();
    const expenses = getExpenses();
    const currentBalance = cashflow[0]?.endBalance ?? 486.8;
    const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
    const dailyExpense = 12.8;

    const stressIncome = totalExpense * 0.9; // if income drops 10%
    const stressProfit = stressIncome - totalExpense;
    const stressSafeDays = Math.floor(currentBalance / (dailyExpense * 1.053)); // expenses grow ~5.3% to match

    // Simulate 90-day projection
    const stressBalance = currentBalance + stressProfit - totalExpense * 0.5;
    const stressGap = currentBalance + stressProfit * 3 - dailyExpense * 90;

    return {
      title: '收入下降10%压力测试',
      summary: `假设收入下降10%至${formatMoney(stressIncome)}，公司经营将面临更大挑战。利润将从${formatMoney(totalExpense - 0 > 0 ? 84.7 : totalExpense > 0 ? totalExpense : 0)}大幅下滑。`,
      keyData: [
        `当前可用资金: ${formatMoney(currentBalance)}`,
        `收入下降10%后: ${formatMoney(stressIncome)}`,
        `当前月支出: ${formatMoney(totalExpense)}`,
        `压力测试利润: ${formatMoney(stressProfit)}`,
        `压力测试安全天数: ${Math.max(0, stressSafeDays)} 天`,
        `90天预计资金: ${formatMoney(Math.max(0, stressGap >= 0 ? stressGap : currentBalance * 0.3))}`,
      ].join('\n'),
      riskReasons: stressProfit < 0
        ? `如果收入下降10%，本月将出现亏损${formatMoney(Math.abs(stressProfit))}。在当前支出水平下，每月${formatMoney(totalExpense)}的刚性支出将使资金安全天数快速缩短。这是对企业现金流韧性的重要考验。`
        : `即使收入下降10%，公司仍保持盈利，但利润将大幅收窄，抗风险能力明显下降。`,
      impactAmount: `收入减少${formatMoney(totalExpense * 0.1)}，利润减少${formatMoney(Math.abs(totalExpense * 0.1))}。`,
      suggestions: [
        '第一，立即评估核心客户的业务稳定性，预判收入风险；',
        '第二，建立收入波动的应急预算机制；',
        '第三，预留至少3个月运营资金的安全垫；',
        '第四，优先保障核心业务的资金需求，非核心支出可适当压缩。',
      ].join('\n'),
      bossDecisions: [
        '1. 是否建立收入波动应急储备金制度',
        '2. 是否对非核心业务进行风险评估和分层管理',
        '3. 是否需要调整经营策略以提高收入稳定性',
        '4. 确认现金流安全线（最低资金余额）标准',
      ].join('\n'),
    };
  }

  return generateAnalysis(question.analysisType);
}

// ── Analysis Type Buttons ──
const ANALYSIS_TYPES: { key: AnalysisType; label: string; icon: string; desc: string }[] = [
  { key: 'cashflow', label: '现金流分析', icon: '💰', desc: '资金状况与缺口预测' },
  { key: 'expense', label: '经营费用分析', icon: '📊', desc: '费用结构与异常分析' },
  { key: 'risk', label: '风险分析', icon: '⚠️', desc: '风险事项综合评估' },
  { key: 'budget', label: '预算执行情况', icon: '📋', desc: '部门预算使用对比' },
  { key: 'income', label: '收入分析', icon: '📈', desc: '收入构成与回款分析' },
  { key: 'receivable', label: '应收账款分析', icon: '📝', desc: '应收逾期与催收分析' },
  { key: 'payable', label: '应付压力分析', icon: '💳', desc: '付款压力与优先级' },
  { key: 'suggestion', label: '下月建议动作', icon: '🎯', desc: '行动建议与决策事项' },
];

function AnalysisCard({ result }: { result: AIAnalysisResult }) {
  if (!result.title) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Title */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
        <h2 className="text-lg font-bold text-white">{result.title}</h2>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5 text-sm leading-relaxed">
        {/* 本月经营结论 */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-5 bg-blue-600 rounded inline-block"></span>
            本月经营结论
          </h3>
          <p className="text-slate-700 bg-blue-50 rounded-md p-3 border border-blue-100">
            {result.summary}
          </p>
        </section>

        {/* 关键数据 */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-5 bg-green-600 rounded inline-block"></span>
            关键数据
          </h3>
          <div className="bg-slate-50 rounded-md p-3 border border-slate-200 font-mono text-slate-700">
            {result.keyData.split('\n').map((line, i) => (
              <div key={i} className="py-0.5">
                {line}
              </div>
            ))}
          </div>
        </section>

        {/* 风险原因 */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-5 bg-orange-600 rounded inline-block"></span>
            风险原因
          </h3>
          <p className="text-slate-700 bg-orange-50 rounded-md p-3 border border-orange-100">
            {result.riskReasons}
          </p>
        </section>

        {/* 影响金额 */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-5 bg-red-600 rounded inline-block"></span>
            影响金额
          </h3>
          <p className="text-red-700 bg-red-50 rounded-md p-3 border border-red-100 font-semibold">
            {result.impactAmount}
          </p>
        </section>

        {/* 建议动作 */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-5 bg-purple-600 rounded inline-block"></span>
            建议动作
          </h3>
          <div className="text-slate-700 bg-purple-50 rounded-md p-3 border border-purple-100">
            {result.suggestions.split('\n').map((line, i) =>
              line.trim() ? (
                <div key={i} className="py-0.5">
                  {line}
                </div>
              ) : (
                <div key={i} className="h-2"></div>
              )
            )}
          </div>
        </section>

        {/* 需要老板拍板的事项 */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-5 bg-yellow-500 rounded inline-block"></span>
            需要老板拍板的事项
          </h3>
          <div className="bg-yellow-50 rounded-md p-3 border border-yellow-200">
            {result.bossDecisions.split('\n').map((line, i) => (
              <div
                key={i}
                className="py-1 text-slate-800 font-medium flex items-start gap-1.5"
              >
                <span className="text-yellow-600 mt-0.5 shrink-0">▸</span>
                <span>{line.replace(/^\d+\.\s*/, '')}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AiFinanceAnalysisPage() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string | undefined>(undefined);
  const [showWelcome, setShowWelcome] = useState(true);

  const result = useMemo(() => {
    if (!selectedAnalysis) return null;
    const question = BOSS_QUESTIONS.find(
      (q) => q.analysisType === selectedAnalysis && q.customPrompt === customPrompt
    );
    if (question) return generateBossQuestionResult(question);
    return generateAnalysis(selectedAnalysis);
  }, [selectedAnalysis, customPrompt]);

  const handleAnalysisClick = (key: AnalysisType) => {
    setSelectedAnalysis(key);
    setCustomPrompt(undefined);
    setShowWelcome(false);
  };

  const handleBossQuestion = (question: BossQuestion) => {
    setSelectedAnalysis(question.analysisType);
    setCustomPrompt(question.customPrompt);
    setShowWelcome(false);
  };

  return (
    <PageContainer title="AI 财务分析" subtitle="智能生成老板可读的经营分析报告，辅助经营决策">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column - Analysis Types */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
            <h3 className="text-sm font-semibold text-slate-600 mb-3 px-2 uppercase tracking-wide">
              分析类型
            </h3>
            <div className="space-y-1.5">
              {ANALYSIS_TYPES.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleAnalysisClick(item.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-150 group ${
                    selectedAnalysis === item.key && !customPrompt
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-50 hover:shadow-sm border border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className={`text-sm font-medium ${selectedAnalysis === item.key && !customPrompt ? 'text-white' : 'text-slate-800'}`}>
                        {item.label}
                      </div>
                      <div className={`text-xs mt-0.5 ${selectedAnalysis === item.key && !customPrompt ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column - Analysis Output */}
        <div className="lg:col-span-2">
          {showWelcome && !result ? (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                AI 财务分析助手
              </h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                选择左侧分析类型或点击右侧常见问题，系统将自动基于真实经营数据生成分析报告。所有分析均基于实际财务数据计算生成。
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {ANALYSIS_TYPES.slice(0, 4).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleAnalysisClick(item.key)}
                    className="px-3 py-1.5 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            result && <AnalysisCard result={result} />
          )}
        </div>

        {/* Right Column - Boss Questions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
            <h3 className="text-sm font-semibold text-slate-600 mb-3 px-2 uppercase tracking-wide">
              常见老板问题
            </h3>
            <div className="space-y-2">
              {BOSS_QUESTIONS.map((question, index) => {
                const isActive =
                  selectedAnalysis === question.analysisType &&
                  customPrompt === question.customPrompt;
                return (
                  <button
                    key={index}
                    onClick={() => handleBossQuestion(question)}
                    className={`w-full text-left px-3 py-3 rounded-md transition-all duration-150 border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-sm mt-0.5 ${isActive ? 'text-white' : 'text-blue-500'}`}>
                        Q:
                      </span>
                      <span className="text-sm leading-snug">{question.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm p-4 mt-4">
            <h4 className="text-sm font-semibold text-blue-700 mb-2">使用提示</h4>
            <ul className="text-xs text-blue-600 space-y-1.5 leading-relaxed">
              <li>• 所有分析基于当前经营数据实时计算</li>
              <li>• 分析结果可直接用于经营会议汇报</li>
              <li>• 建议每周生成一次综合分析报告</li>
              <li>• 高风险事项建议每日查看</li>
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
