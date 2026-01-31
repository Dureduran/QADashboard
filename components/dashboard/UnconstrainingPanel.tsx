
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ArrowUpRight, Filter, DollarSign, Check } from 'lucide-react';
import { RouteSelector } from './RouteSelector';
import { cn } from '../../lib/utils';
import { ModuleExplanation } from './ModuleExplanation';

export const UnconstrainingPanel = () => {
  const [selectedRoute, setSelectedRoute] = useState('DOH-LOS');
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);

  // Mock data for unconstraining
  const data = [
      { price: '100', bookings: 80, latent: 95, denial: 15 },
      { price: '120', bookings: 70, latent: 75, denial: 5 },
      { price: '140', bookings: 60, latent: 62, denial: 2 },
      { price: '160', bookings: 45, latent: 45, denial: 0 },
      { price: '180', bookings: 30, latent: 30, denial: 0 },
  ];

  const handleOptimize = () => {
      setOptimizing(true);
      setTimeout(() => {
          setOptimizing(false);
          setOptimized(true);
          setTimeout(() => setOptimized(false), 3000);
      }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <h2 className="text-2xl font-bold text-slate-100">Real-Time Demand Unconstraining & Pricing</h2>
             <RouteSelector selectedRoute={selectedRoute} onSelect={setSelectedRoute} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <Card className="bg-slate-900 border-slate-800 lg:col-span-2 h-[500px]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-amber-500" />
                            Latent Demand Analysis ({selectedRoute})
                        </CardTitle>
                    </div>
                    <p className="text-xs text-slate-500">Estimating passengers lost to capacity constraints or price friction (Spill Analysis).</p>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="price" label={{ value: 'Fare Class ($)', position: 'insideBottom', offset: -10, fill: '#64748b' }} stroke="#64748b" tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                            <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} 
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="bookings" name="Constrained (Actual Bookings)" fill="#3b82f6" stackId="a" radius={[0,0,4,4]} />
                            <Bar dataKey="denial" name="Est. Latent Demand (Spill)" fill="#f59e0b" stackId="a" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Sidebar Stats */}
            <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                         <CardTitle className="text-base text-slate-200">Opportunity Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-950 rounded border border-slate-800">
                                <div className="text-sm font-medium text-slate-400 mb-1">Total Revenue Spill</div>
                                <div className="text-2xl font-bold text-amber-500">
                                    $4,250
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Daily estimate based on search logs</div>
                            </div>
                            
                            <div className="p-4 bg-slate-950 rounded border border-slate-800">
                                <div className="text-sm font-medium text-slate-400 mb-1">Recapture Potential</div>
                                <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                                    85% <ArrowUpRight className="w-5 h-5" />
                                </div>
                                <div className="text-xs text-slate-500 mt-1">If capacity increased by 10 seats</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-slate-900 border-slate-800 flex-1">
                    <CardHeader>
                         <CardTitle className="text-base text-slate-200">Pricing Action</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-300 mb-4">
                            Latent demand exceeds capacity in lower fare buckets ($100-$120) for {selectedRoute}. Recommendation is to close lower buckets early to force upsell.
                        </p>
                        <button 
                            onClick={handleOptimize}
                            disabled={optimizing || optimized}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 text-white py-2 rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20",
                                optimized 
                                    ? "bg-emerald-700" 
                                    : "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98]"
                            )}
                        >
                            {optimizing ? (
                                <span className="animate-pulse flex items-center gap-2">Optimizing...</span>
                            ) : optimized ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Optimization Complete
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-4 h-4" />
                                    Optimize Fare Ladder
                                </>
                            )}
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>

        <ModuleExplanation 
            title="Technical Logic: Unconstraining & Pricing Optimization"
            description="Estimates true 'latent demand' (demand if capacity were unlimited) to identify revenue spill and optimize fare class availability."
            question="How much revenue are we losing due to capacity limits or suboptimal pricing, and where is the latent demand?"
            data={[
                "Search Logs (Look-to-Book ratios)",
                "Regrets/Denials Data (Failed booking attempts)",
                "Competitor Capacity & Schedule",
                "Historical yield per seat"
            ]}
            model={[
                "Expectation-Maximization (EM): Reconstructs the 'tail' of the demand distribution that was cut off when classes closed.",
                "Look-to-Book Ratio Analysis: Correlates search engine volume (GDS queries) with actual bookings to detect demand rejection.",
                "Fare Ladder Optimization: Determines the exact 'Bid Price' threshold where accepting a low-fare passenger displaces a high-fare one."
            ]}
            scenario={{
                problem: "DOH-LOS Economy is sold out. Analysts think demand is satisfied. Actually, 50 people tried to book but found no availability.",
                action: "Unconstraining algo calculates 'True Demand' was 120% of capacity. It identifies willingness-to-pay is higher than current max fare.",
                uplift: "Recommends opening a new 'Premium Economy' fare tier or upgauging aircraft. Captures $8,000 in spill revenue next flight."
            }}
        />
    </div>
  )
}
