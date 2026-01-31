
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/mockData';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area 
} from 'recharts';
import { Calendar, Info, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RouteSelector } from './RouteSelector';
import { ModuleExplanation } from './ModuleExplanation';

const HeatmapCell = ({ value }: { value: number }) => {
    // Red to Green gradient simulation
    let bgClass = "bg-red-500";
    if (value > 80) bgClass = "bg-emerald-500";
    else if (value > 60) bgClass = "bg-emerald-400";
    else if (value > 40) bgClass = "bg-amber-400";
    else if (value > 20) bgClass = "bg-orange-400";
    
    return (
        <div 
            className={cn("h-6 w-full rounded-sm transition-all hover:opacity-80 cursor-pointer", bgClass)} 
            title={`Demand: ${value}%`}
        />
    );
};

export const DynamicPricingPanel = () => {
  const [selectedRoute, setSelectedRoute] = useState('DOH-SFO');
  const [applied, setApplied] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ['pricingData', selectedRoute],
    queryFn: api.getPricingData,
  });

  const handleApply = () => {
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  if (isLoading) return <Card className="h-full min-h-[400px] bg-slate-900 animate-pulse border-slate-800" />;

  return (
    <div className="space-y-6">
    <Card className="bg-slate-900 border-slate-800 flex flex-col h-full min-h-[450px]">
      <CardHeader className="pb-2 border-b border-slate-800/50 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                1. DYNAMIC PRICING & DEMAND FORECASTING <span className="text-slate-500 font-normal hidden sm:inline">({selectedRoute})</span>
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                <RouteSelector selectedRoute={selectedRoute} onSelect={setSelectedRoute} size="sm" />
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded px-2 py-1 h-[26px]">
                    <span className="text-[10px] text-slate-400">Date</span>
                    <span className="text-[10px] font-semibold text-slate-200">28, Jan 2026</span>
                    <Calendar className="w-3 h-3 text-slate-400" />
                </div>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 flex flex-col gap-4 min-h-0">
        {/* Top Chart Section - Takes available space */}
        <div className="flex-1 min-h-[160px] w-full relative border-b border-slate-800/50 pb-2">
             <div className="absolute top-0 right-0 flex items-center gap-4 text-[10px] z-10 bg-slate-900/80 px-2 rounded">
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div>Historical</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div>Forecast</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300 border border-dashed border-slate-500"></div>Optimal</div>
             </div>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.forecast} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="historical" stroke="#94a3b8" strokeWidth={2} dot={{r:3}} />
                    <Line type="monotone" dataKey="forecast" stroke="#be185d" strokeWidth={2} dot={{r:3}} />
                    <Line type="monotone" dataKey="optimal" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={2} dot={{r:3}} />
                </LineChart>
             </ResponsiveContainer>
        </div>

        {/* Bottom Heatmap Section - Fixed size at bottom */}
        <div className="flex flex-col gap-2 shrink-0">
            <div className="text-xs font-semibold text-slate-300 flex justify-between">
                <span>Price Sensitivity Matrix ({selectedRoute})</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Heatmap Grid */}
                <div className="flex-1 bg-slate-950/50 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                    <div className="min-w-[300px] grid grid-cols-[70px_1fr] gap-2">
                        {/* Headers */}
                        <div className="text-[10px] text-slate-500 flex flex-col justify-end pb-1">Segment</div>
                        <div className="grid grid-cols-8 gap-1 text-center">
                            {[10, 20, 30, 40, 50, 60, 70, 80].map(p => (
                                <div key={p} className="text-[10px] text-slate-500">{p}</div>
                            ))}
                        </div>

                        {/* Rows */}
                        {data?.matrix.map((row: any) => (
                            <React.Fragment key={row.segment}>
                                <div className="text-[10px] text-slate-400 font-medium flex items-center">{row.segment}</div>
                                <div className="grid grid-cols-8 gap-1">
                                    {row.values.map((val: number, i: number) => (
                                        <HeatmapCell key={i} value={val} />
                                    ))}
                                </div>
                            </React.Fragment>
                        ))}
                         <div className="col-start-2 text-center text-[10px] text-slate-500 pt-1">Price (USD)</div>
                    </div>
                </div>

                {/* Recommendation Box */}
                <div className="w-full sm:w-48 bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex flex-col justify-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Recommended Action</div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                        Increase 'J' class availability for {selectedRoute} on NOV 15 due to high corporate demand forecast (+18%).
                    </p>
                    <div className="mt-2 flex justify-end">
                         <button 
                            onClick={handleApply}
                            disabled={applied}
                            className={cn(
                                "text-[10px] px-2 py-1 rounded border transition-colors flex items-center gap-1",
                                applied 
                                    ? "bg-emerald-600 text-white border-emerald-600" 
                                    : "bg-emerald-900/40 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60"
                            )}
                        >
                             {applied ? (
                                <>
                                    <Check className="w-3 h-3" />
                                    Applied
                                </>
                             ) : "Apply"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>

    <ModuleExplanation 
        title="Technical Logic: Demand Forecasting"
        description="Uses hybrid time-series modeling to predict booking curves and identify revenue opportunities."
        question="How will demand evolve for this route, and what is the optimal pricing strategy to maximize revenue?"
        data={[
            "Historical Bookings (2-year lookback)",
            "Seasonality Indices (Holidays, Events)",
            "Competitor Fares (Real-time)",
            "Macro-economic indicators (GDP, Fuel)"
        ]}
        model={[
            "LSTM Recurrent Neural Networks: Captures non-linear dependencies in booking sequences (e.g., how a spike today affects bookings 3 days later).",
            "Prophet Decomposition: Isolates holiday effects (Eid, Christmas) and seasonal trends from underlying growth.",
            "Real-Time Elasticity Scoring: Dynamically adjusts price sensitivity parameters based on current competitive fare position."
        ]}
        scenario={{
            problem: "Historical data shows DOH-SFO usually slows down in Nov, so standard system kept fares low. However, a major tech conference was just announced.",
            action: "AI detects a sudden anomaly in search velocity (+400%) and booking pickup. It overrides the historical seasonal dip prediction.",
            uplift: "Forces early closure of lowest 3 fare buckets. Captures $300 extra per seat on 50 seats = $15,000 incremental revenue."
        }}
    />
    </div>
  );
};
