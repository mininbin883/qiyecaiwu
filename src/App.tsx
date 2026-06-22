import React, { Suspense, lazy, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import type { PageKey } from '@/types';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import DataBootstrap from '@/auth/DataBootstrap';
import Login from '@/pages/Login';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Income = lazy(() => import('@/pages/Income'));
const Expense = lazy(() => import('@/pages/Expense'));
const Receivables = lazy(() => import('@/pages/Receivables'));
const Payables = lazy(() => import('@/pages/Payables'));
const Contracts = lazy(() => import('@/pages/Contracts'));
const Budget = lazy(() => import('@/pages/Budget'));
const ApprovalCenter = lazy(() => import('@/pages/ApprovalCenter'));
const CashflowForecast = lazy(() => import('@/pages/CashflowForecast'));
const RiskWarning = lazy(() => import('@/pages/RiskWarning'));
const AiFinanceAnalysis = lazy(() => import('@/pages/AiFinanceAnalysis'));
const MasterData = lazy(() => import('@/pages/MasterData'));
const SystemSettings = lazy(() => import('@/pages/SystemSettings'));

const PAGE_PATHS: Record<PageKey, string> = {
  dashboard: '/',
  income: '/income',
  expense: '/expense',
  receivables: '/receivables',
  payables: '/payables',
  contracts: '/contracts',
  budget: '/budget',
  approval: '/approval',
  cashflow: '/cashflow',
  risk: '/risk',
  'ai-analysis': '/ai-analysis',
  'master-data': '/master-data',
  settings: '/settings',
};

function pageFromPath(pathname: string): PageKey {
  const found = Object.entries(PAGE_PATHS).find(([, path]) => path === pathname);
  return (found?.[0] as PageKey | undefined) ?? 'dashboard';
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = useMemo(() => pageFromPath(location.pathname), [location.pathname]);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const navigateToPage = (page: PageKey) => {
    navigate(PAGE_PATHS[page]);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateToPage}
        collapsed={collapsed}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? 'ml-[68px]' : 'ml-[220px]'
        }`}
      >
        <Topbar
          currentPage={currentPage}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<div className="p-6 text-slate-500">正在加载页面...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/income" element={<Income />} />
              <Route path="/expense" element={<Expense />} />
              <Route path="/receivables" element={<Receivables />} />
              <Route path="/payables" element={<Payables />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/approval" element={<ApprovalCenter />} />
              <Route path="/cashflow" element={<CashflowForecast />} />
              <Route path="/risk" element={<RiskWarning />} />
              <Route path="/ai-analysis" element={<AiFinanceAnalysis />} />
              <Route path="/master-data" element={<MasterData />} />
              <Route path="/settings" element={<SystemSettings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const basename = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, '') || undefined;
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <DataBootstrap>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </DataBootstrap>
      </AuthProvider>
    </BrowserRouter>
  );
}
