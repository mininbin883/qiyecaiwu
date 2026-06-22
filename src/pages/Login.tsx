import React, { useState } from 'react';
import { BarChart3, Lock, User } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export default function Login() {
  const { user, login, loading, error } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await login(username, password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">财务经营决策系统</h1>
            <p className="text-sm text-slate-500">上海鑫业市政有限公司 · 经营驾驶舱</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">账号</span>
            <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
              <User size={18} className="text-slate-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full outline-none text-sm"
                placeholder="admin"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">密码</span>
            <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
              <Lock size={18} className="text-slate-400" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full outline-none text-sm"
                placeholder="admin123"
              />
            </div>
          </label>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? '登录中...' : '登录系统'}
          </button>
        </form>

        <div className="mt-6 text-xs text-slate-400 leading-5">
          默认账号：admin / admin123；老板账号：boss / boss123；财务负责人：finance / finance123。
        </div>
      </div>
    </div>
  );
}

