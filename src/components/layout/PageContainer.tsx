import React from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function PageContainer({ title, subtitle, children }: PageContainerProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
