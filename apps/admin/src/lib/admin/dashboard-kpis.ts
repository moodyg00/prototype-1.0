import 'server-only';

import { addDays, format, startOfDay, subDays } from 'date-fns';

import { getFinanceKpis } from '@/src/lib/accounting/finance-kpis';
import type { AdminDashboardKpis, DashboardKpiGroup, DashboardMetric } from '@/src/lib/admin/dashboard-kpi-types';
import { prisma } from '@/src/lib/prisma';

const ACTIVE_WORK_ORDER_STATUSES = ['new', 'scheduled', 'in_progress', 'rework'] as const;
const OPEN_ESTIMATE_STATUSES = ['draft', 'sent', 'viewed'] as const;
const PIPELINE_ESTIMATE_STATUSES = ['sent', 'viewed'] as const;
const ACTIVE_LEAD_STATUSES = ['new', 'contacted', 'quoted'] as const;

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function formatCurrency(value: number | string): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${(Number(value) * (Number(value) <= 1 ? 100 : 1)).toFixed(1)}%`;
}

function isoDate(value: Date): string {
  return format(value, 'yyyy-MM-dd');
}

async function getOperationsKpis(now: Date): Promise<DashboardMetric[]> {
  const today = startOfDay(now);
  const weekAhead = addDays(today, 7);
  const todayIso = isoDate(today);
  const weekAheadIso = isoDate(weekAhead);

  const [
    activeWorkOrders,
    startingToday,
    scheduledVisits,
    openEstimates,
    awaitingSignoff,
    invoiceReadyWork,
  ] = await Promise.all([
    prisma.workOrder.count({
      where: { status: { in: [...ACTIVE_WORK_ORDER_STATUSES] } },
    }),
    prisma.workOrder.count({
      where: {
        status: { in: [...ACTIVE_WORK_ORDER_STATUSES] },
        scheduledDate: today,
      },
    }),
    prisma.workOrder.count({
      where: {
        status: { in: ['scheduled', 'in_progress'] },
        scheduledDate: { gte: today, lte: weekAhead },
      },
    }),
    prisma.estimate.count({
      where: { status: { in: [...OPEN_ESTIMATE_STATUSES] } },
    }),
    prisma.estimate.count({
      where: { status: { in: ['sent', 'viewed'] } },
    }),
    prisma.workOrder.count({
      where: {
        status: 'completed',
        invoiceId: null,
      },
    }),
  ]);

  return [
    {
      label: 'Active work orders',
      value: formatCount(activeWorkOrders),
      note: `${formatCount(startingToday)} scheduled today`,
    },
    {
      label: 'Scheduled visits',
      value: formatCount(scheduledVisits),
      note: `${todayIso} through ${weekAheadIso}`,
    },
    {
      label: 'Open estimates',
      value: formatCount(openEstimates),
      note: 'Draft, sent, or viewed',
    },
    {
      label: 'Invoice-ready work',
      value: formatCount(invoiceReadyWork),
      note: `${formatCount(awaitingSignoff)} awaiting signoff`,
    },
  ];
}

async function getSalesKpis(now: Date): Promise<DashboardMetric[]> {
  const weekAgo = subDays(now, 7);

  const [
    organizations,
    organizationsActiveThisWeek,
    activeLeads,
    leadsNewThisWeek,
    pipelineLeadValue,
    pipelineEstimateValue,
    openProposals,
    proposalsNearDecision,
  ] = await Promise.all([
    prisma.organization.count({ where: { status: 'active' } }),
    prisma.organization.count({
      where: {
        status: 'active',
        OR: [
          { lastContactedAt: { gte: weekAgo } },
          { updatedAt: { gte: weekAgo } },
        ],
      },
    }),
    prisma.lead.count({ where: { status: { in: [...ACTIVE_LEAD_STATUSES] } } }),
    prisma.lead.count({
      where: {
        status: 'new',
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.lead.aggregate({
      where: { status: { in: [...ACTIVE_LEAD_STATUSES] } },
      _sum: { expectedValue: true },
    }),
    prisma.estimate.aggregate({
      where: { status: { in: [...PIPELINE_ESTIMATE_STATUSES] } },
      _sum: { totalAmount: true },
    }),
    prisma.estimate.count({
      where: { status: { in: [...PIPELINE_ESTIMATE_STATUSES] } },
    }),
    prisma.estimate.count({
      where: {
        status: 'viewed',
        validUntil: { gte: now },
      },
    }),
  ]);

  const pipelineTotal =
    Number(pipelineLeadValue._sum.expectedValue ?? 0) +
    Number(pipelineEstimateValue._sum.totalAmount ?? 0);

  return [
    {
      label: 'Organizations',
      value: formatCount(organizations),
      note: `${formatCount(organizationsActiveThisWeek)} active this week`,
    },
    {
      label: 'Active leads',
      value: formatCount(activeLeads),
      note: `${formatCount(leadsNewThisWeek)} new this week`,
    },
    {
      label: 'Pipeline value',
      value: formatCurrency(pipelineTotal),
      note: 'Open leads + sent/viewed estimates',
    },
    {
      label: 'Open proposals',
      value: formatCount(openProposals),
      note: `${formatCount(proposalsNearDecision)} viewed & still valid`,
    },
  ];
}

async function getMarketingKpis(now: Date): Promise<DashboardMetric[]> {
  const today = startOfDay(now);
  const twoWeeksAgo = subDays(now, 14);
  const tomorrow = addDays(today, 1);

  const [
    adsRunning,
    campaignsLive,
    campaignsStartingSoon,
    recentSocialPosts,
    topPerformance,
    spendToday,
  ] = await Promise.all([
    prisma.ad.count({ where: { status: 'active' } }),
    prisma.adCampaign.count({ where: { status: 'active' } }),
    prisma.adCampaign.count({
      where: {
        status: { in: ['active', 'paused'] },
        startDate: { gte: today, lte: tomorrow },
      },
    }),
    prisma.socialMediaContent.count({
      where: {
        OR: [
          { status: 'posted', updatedAt: { gte: twoWeeksAgo } },
          { createdAt: { gte: twoWeeksAgo } },
        ],
      },
    }),
    prisma.campaignPerformance.findFirst({
      where: { date: { gte: subDays(now, 30) }, ctr: { not: null } },
      orderBy: [{ ctr: 'desc' }],
      select: { ctr: true, campaign: { select: { name: true, platform: true } } },
    }),
    prisma.campaignPerformance.aggregate({
      where: { date: today },
      _sum: { cost: true },
    }),
  ]);

  const highSpendAds = Number(spendToday._sum.cost ?? 0) > 0
    ? await prisma.campaignPerformance.count({
        where: { date: today, cost: { gt: 0 } },
      })
    : 0;

  const topCtrLabel = topPerformance?.campaign
    ? `${topPerformance.campaign.platform ?? 'Campaign'} · ${topPerformance.campaign.name}`
    : 'No recent performance data';

  return [
    {
      label: 'Ads running',
      value: formatCount(adsRunning),
      note:
        highSpendAds > 0
          ? `${formatCount(highSpendAds)} with spend today`
          : 'No ad spend recorded today',
    },
    {
      label: 'Campaigns live',
      value: formatCount(campaignsLive),
      note:
        campaignsStartingSoon > 0
          ? `${formatCount(campaignsStartingSoon)} starting tomorrow`
          : 'None launching tomorrow',
    },
    {
      label: 'Recent social posts',
      value: formatCount(recentSocialPosts),
      note: 'Last 14 days',
    },
    {
      label: 'Top channel CTR',
      value: formatPercent(topPerformance?.ctr ? Number(topPerformance.ctr) : null),
      note: topCtrLabel,
    },
  ];
}

async function getSystemsKpis(now: Date): Promise<DashboardMetric[]> {
  const dayAgo = subDays(now, 1);
  const startOfTodayDate = startOfDay(now);

  const [
    apiIntegrations,
    integrationsNeedAttention,
    adminUsers,
    usersActiveToday,
    recentLogEvents,
    savedCredentials,
  ] = await Promise.all([
    prisma.integration.count({ where: { type: 'api', status: 'active' } }),
    prisma.integration.count({
      where: {
        OR: [
          { status: { in: ['inactive', 'error'] } },
          {
            type: 'api',
            status: 'active',
            authType: { in: ['api_key', 'bearer', 'basic'] },
            apiKey: null,
          },
        ],
      },
    }),
    prisma.user.count({ where: { isActive: true, userType: 'human' } }),
    prisma.user.count({
      where: {
        isActive: true,
        userType: 'human',
        lastLoginAt: { gte: startOfTodayDate },
      },
    }),
    prisma.changeLog.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.credential.count({ where: { isActive: true } }),
  ]);

  return [
    {
      label: 'API integrations',
      value: formatCount(apiIntegrations),
      note:
        integrationsNeedAttention > 0
          ? `${formatCount(integrationsNeedAttention)} need attention`
          : 'All configured integrations healthy',
    },
    {
      label: 'Saved credentials',
      value: formatCount(savedCredentials),
      note: 'Stored login credentials',
    },
    {
      label: 'Admin users',
      value: formatCount(adminUsers),
      note: `${formatCount(usersActiveToday)} active today`,
    },
    {
      label: 'Recent log events',
      value: formatCount(recentLogEvents),
      note: 'Last 24 hours',
    },
  ];
}

function buildFinanceGroup(financeKpis: Awaited<ReturnType<typeof getFinanceKpis>>): DashboardKpiGroup {
  return {
    name: 'Finance',
    color: '#b45309',
    description: 'Cash, expense totals, and owner equity from posted ledger activity.',
    metrics: [
      {
        label: 'Cash position',
        value: formatCurrency(financeKpis.cashPosition),
        note: 'Combined bank balances (1000)',
      },
      {
        label: 'Expenses (MTD)',
        value: formatCurrency(financeKpis.totalExpenses),
        note: financeKpis.periodLabel,
      },
      {
        label: 'Operating expenses (MTD)',
        value: formatCurrency(financeKpis.operatingExpenses),
        note: 'Excludes COGS',
      },
      {
        label: 'COGS (MTD)',
        value: formatCurrency(financeKpis.cogs),
        note: 'Cost of goods sold',
      },
      {
        label: 'Owner capital — Grant',
        value: formatCurrency(financeKpis.ownerCapitalGrant),
        note: 'Account 3010',
      },
      {
        label: 'Owner capital — John',
        value: formatCurrency(financeKpis.ownerCapitalJohn),
        note: 'Account 3020',
      },
    ],
  };
}

export async function getAdminDashboardKpis(): Promise<AdminDashboardKpis> {
  const now = new Date();

  const [operations, sales, financeKpis, marketing, systems] = await Promise.all([
    getOperationsKpis(now),
    getSalesKpis(now),
    getFinanceKpis(),
    getMarketingKpis(now),
    getSystemsKpis(now),
  ]);

  return {
    groups: [
      {
        name: 'Operations',
        color: '#2563eb',
        description: 'Open work, schedule pressure, and delivery readiness.',
        metrics: operations,
      },
      {
        name: 'Sales',
        color: '#0f766e',
        description: 'Pipeline visibility across leads, orgs, and contact motion.',
        metrics: sales,
      },
      buildFinanceGroup(financeKpis),
      {
        name: 'Marketing',
        color: '#be185d',
        description: 'Current promotion health, delivery cadence, and campaign status.',
        metrics: marketing,
      },
      {
        name: 'Systems',
        color: '#7c3aed',
        description: 'Admin health, integration posture, and reference counts.',
        metrics: systems,
      },
    ],
  };
}
