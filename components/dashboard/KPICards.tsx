import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/mockData';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export const KPICards = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['kpis'],
    queryFn: api.getKPIs,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-900 border-slate-800">
             <CardContent className="p-6">
                <div className="h-4 w-24 bg-slate-800 rounded animate-pulse mb-4"></div>
                <div className="h-8 w-16 bg-slate-800 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-slate-800 rounded animate-pulse"></div>
             </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) return <div className="text-red-500">Failed to load KPIs</div>;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {data?.map((kpi) => (
        <Card key={kpi.label} className="bg-slate-900 border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-slate-400">{kpi.label}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-50">{kpi.value}</span>
              <span className={cn(
                "flex items-center text-sm font-medium",
                kpi.trendDirection === 'up' ? "text-emerald-400" : 
                kpi.trendDirection === 'down' ? "text-red-400" : "text-slate-400"
              )}>
                {kpi.trendDirection === 'up' && <ArrowUp className="mr-1 h-3 w-3" />}
                {kpi.trendDirection === 'down' && <ArrowDown className="mr-1 h-3 w-3" />}
                {kpi.trendDirection === 'neutral' && <Minus className="mr-1 h-3 w-3" />}
                {Math.abs(kpi.trend)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
