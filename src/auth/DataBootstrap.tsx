import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function DataBootstrap({ children }: { children: React.ReactNode }) {
  const { bootstrap, bootstrapped, loading, user } = useAuth();

  useEffect(() => {
    if (!bootstrapped && !loading) {
      void bootstrap();
    }
  }, [bootstrap, bootstrapped, loading]);

  if (loading || (user && !bootstrapped)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        正在加载经营数据...
      </div>
    );
  }

  return <>{children}</>;
}

