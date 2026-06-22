import React from 'react';
import { navItems } from '@/data/mockData';
import type { PageKey, NavItem } from '@/types';
import {
  LayoutDashboard, TrendingUp, TrendingDown, FileText, FileCheck,
  FileSignature, PieChart, CheckSquare, BarChart3, AlertTriangle,
  Brain, Database, Settings
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  TrendingUp: <TrendingUp size={20} />,
  TrendingDown: <TrendingDown size={20} />,
  FileText: <FileText size={20} />,
  FileCheck: <FileCheck size={20} />,
  FileSignature: <FileSignature size={20} />,
  PieChart: <PieChart size={20} />,
  CheckSquare: <CheckSquare size={20} />,
  BarChart3: <BarChart3 size={20} />,
  AlertTriangle: <AlertTriangle size={20} />,
  Brain: <Brain size={20} />,
  Database: <Database size={20} />,
  Settings: <Settings size={20} />,
};

interface SidebarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
}

export default function Sidebar({ currentPage, onNavigate, collapsed }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#0f172a] text-white flex flex-col z-30 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      {/* Logo 区域 */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <BarChart3 size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-semibold whitespace-nowrap">财务经营决策系统</div>
            <div className="text-[10px] text-slate-400 whitespace-nowrap">Enterprise Finance Cockpit</div>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item: NavItem) => {
          const isActive = currentPage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 text-sm ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{iconMap[item.icon]}</span>
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* 底部 */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10 text-xs text-slate-500">
          <div>© 2026 财务经营系统 v1.0</div>
        </div>
      )}
    </aside>
  );
}
