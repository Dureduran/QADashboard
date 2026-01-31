
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, ComposedChart, Area, ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { ArrowUp, ArrowDown, Target, TrendingUp, Users, AlertCircle, DollarSign, ShieldAlert, Activity, Check } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';

const ROUTES = ['DOH-SFO', 'DOH-JFK', 'DOH-LOS', 'DOH-PVG', 'DOH-ZAG'];

export const StrategicDashboard = () => {
  const [selectedRoute, setSelectedRoute] = useState('DOH-SFO');
  const [upliftScenario, setUpliftScenario] = useState(0); // 0% to 15%
  const [isApplying, setIsApplying] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);

  const { data: kpi } = useQuery({
    queryKey: ['routeKPI', selectedRoute],
    queryFn: () => api.getRouteKPIs(selectedRoute)
  });

  const { data: bookingCurve } = useQuery({
    queryKey: ['bookingCurve', selectedRoute],
    queryFn: () => api.getBookingCurve(selectedRoute)
  });

  const { data: competitors } = useQuery({
    queryKey: ['competitors', selectedRoute],
    queryFn: () => api.getCompetitorData(selectedRoute)
  });

  const { data: waterfall } = useQuery({
      queryKey: ['waterfall', selectedRoute],
      queryFn: () => api.getWaterfallData(selectedRoute)
  });

  const { data: elasticity } = useQuery({
      queryKey: ['elasticity', selectedRoute],
      queryFn: () => api.getElasticityData(selectedRoute)
  });

  const { data: overbooking } = useQuery({
      queryKey: ['overbooking', selectedRoute],
      queryFn: () => api.getOverbookingData(selectedRoute)
  });

  // Handle Simulation
  const handleApplySimulation = () => {
    if (upliftScenario === 0) {
        setSimulationActive(false);
        return;
    }
    setIsApplying(true);
    // Simulate API processing time
    setTimeout(() => {
        setIsApplying(false);
        setSimulationActive(true);
    }, 800);
  };

  const handleScenarioChange = (val: number) => {
      setUpliftScenario(val);
      if (simulationActive) setSimulationActive(false); // Reset chart if value changes
  };

  // Process Booking Curve Data to include Simulation
  const processedBookingCurve = bookingCurve?.map(point => ({
      ...point,
      simulated: simulationActive 
        ? Math.floor(point.forecast * (1 + upliftScenario / 100)) 
        : null
  }));

  // Waterfall Chart Data Preparation (for floating bars)
  const processedWaterfall = waterfall?.map((item, index, arr) => {
      let start = 0;
      if (item.type === 'total') {
          start = 0;
      } else {
          // Calculate start based on previous total
          // This is a simplified logic for demo visualization
          let prevSum = 0;
          for(let i=0; i<index; i++) {
              if (arr[i].type !== 'total') prevSum += arr[i].value;
              else prevSum = arr[i].value; // Reset at subtotal
          }
          start = prevSum;
      }
      return { ...item, start: item.type === 'total' ? 0 : start, end: item.value };
  });

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ROUTE SELECTOR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="text-primary" />
                  High-Potential Route Monitor
              </h2>
              <p className="text-xs text-slate-500">Tracking volatility and growth across top 5 strategic ODs.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {ROUTES.map(r => (
                  <button
                    key={r}
                    onClick={() => { setSelectedRoute(r); setSimulationActive(false); setUpliftScenario(0); }}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        selectedRoute === r 
                            ? "bg-primary text-white shadow-lg shadow-primary/25 ring-1 ring-primary/50" 
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    )}
                  >
                      {r}
                  </button>
              ))}
          </div>
      </div>

      {/* 2. BASELINE KPIs (GAUGES & SPARKLINES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LOAD FACTOR */}
          <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Load Factor (PLF)</p>
                          <div className="text-3xl font-bold text-slate-50 mt-1">{kpi?.loadFactor}%</div>
                      </div>
                      <div className="text-right">
                          <div className="text-xs text-slate-500">Target</div>
                          <div className="text-sm font-semibold text-emerald-400">{kpi?.targetLoadFactor}%</div>
                      </div>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden relative">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", 
                            kpi?.loadFactor && kpi.loadFactor < 75 ? "bg-red-500" : "bg-emerald-500"
                        )} 
                        style={{ width: `${kpi?.loadFactor}%` }} 
                      />
                      {/* Target Marker */}
                      <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: `${kpi?.targetLoadFactor}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                      {kpi?.loadFactor && kpi.loadFactor < 75 ? <AlertCircle className="w-3 h-3 text-red-500"/> : null}
                      {kpi?.loadFactor && kpi.loadFactor < 75 ? "Capacity spoilage risk detected" : "Utilization healthy"}
                  </div>
              </CardContent>
          </Card>

          {/* RASK */}
          <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">RASK (Rev/ASK)</p>
                          <div className="text-3xl font-bold text-slate-50 mt-1">{kpi?.rask}¢</div>
                      </div>
                      <div className={cn("flex items-center px-2 py-1 rounded text-xs font-bold", kpi?.raskTrend && kpi.raskTrend > 0 ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400")}>
                          {kpi?.raskTrend && kpi.raskTrend > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                          {Math.abs(kpi?.raskTrend || 0)}%
                      </div>
                  </div>
                  <div className="h-12 mt-4">
                      {/* Simulated Mini Trend */}
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={bookingCurve?.slice(0, 10)}>
                              <Line type="monotone" dataKey="actual" stroke={kpi?.raskTrend && kpi.raskTrend > 0 ? "#10b981" : "#ef4444"} strokeWidth={2} dot={false} />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Unit revenue performance vs prev week</p>
              </CardContent>
          </Card>

           {/* YIELD */}
           <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Yield</p>
                          <div className="text-3xl font-bold text-slate-50 mt-1">{kpi?.yield}¢</div>
                      </div>
                      <div className={cn("flex items-center px-2 py-1 rounded text-xs font-bold", kpi?.yieldTrend && kpi.yieldTrend > 0 ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400")}>
                           {kpi?.yieldTrend && kpi.yieldTrend > 0 ? "+" : ""}{kpi?.yieldTrend}%
                      </div>
                  </div>
                  <div className="mt-4 flex gap-1">
                       <div className="flex-1 bg-slate-800 h-8 rounded flex flex-col justify-center items-center">
                           <span className="text-[10px] text-slate-500">Biz</span>
                           <span className="text-xs font-bold text-slate-200">$4.2k</span>
                       </div>
                       <div className="flex-1 bg-slate-800 h-8 rounded flex flex-col justify-center items-center">
                           <span className="text-[10px] text-slate-500">Eco</span>
                           <span className="text-xs font-bold text-slate-200">$850</span>
                       </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Avg fare per PAX/KM</p>
              </CardContent>
          </Card>
      </div>

      {/* 3. DEMAND & COMPETITION (SPLIT VIEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
          {/* DEMAND FORECAST */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col">
              <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-200">Booking Pace (Days Out)</CardTitle>
                  <p className="text-xs text-slate-500">Cumulative bookings vs Forecast & Last Year (LY)</p>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={processedBookingCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="daysOut" label={{ value: 'Days Out', position: 'insideBottomRight', offset: -5, fontSize: 10 }} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Area type="monotone" dataKey="actual" name="Actual (2026)" fill="url(#colorActual)" stroke="#8b0050" strokeWidth={3} />
                          <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          <Line type="monotone" dataKey="ly" name="Last Year" stroke="#64748b" strokeWidth={2} dot={false} />
                          {simulationActive && (
                             <Line 
                                type="monotone" 
                                dataKey="simulated" 
                                name={`Simulated (+${upliftScenario}%)`} 
                                stroke="#10b981" 
                                strokeWidth={2} 
                                strokeDasharray="3 3" 
                                dot={false} 
                                animationDuration={1000}
                             />
                          )}
                          <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b0050" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b0050" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                      </ComposedChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* COMPETITOR INTELLIGENCE */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-200">Competitor Price Tracker</CardTitle>
                    <p className="text-xs text-slate-500">Lowest available fare (Y-Class) vs Market</p>
                  </div>
                  <div className="flex gap-2">
                      <div className="flex items-center text-xs text-slate-400 gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div>QR</div>
                      <div className="flex items-center text-xs text-slate-400 gap-1"><div className="w-2 h-2 bg-red-400 rounded-full"></div>Comp</div>
                  </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={competitors} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Line type="step" dataKey="ourPrice" name="Qatar Airways" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                          <Line type="monotone" dataKey="compPrice" name="Primary Competitor" stroke="#ef4444" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="marketAverage" name="Market Avg" stroke="#64748b" strokeDasharray="3 3" dot={false} />
                      </LineChart>
                   </ResponsiveContainer>
              </CardContent>
          </Card>
      </div>

      {/* 4. SIMULATION & PROFITABILITY (BOTTOM SECTION) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[350px]">
          {/* SIMULATION CONTROLS */}
          <Card className="bg-slate-900 border-slate-800 lg:col-span-1 flex flex-col">
              <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-500" />
                      Revenue Uplift Simulator
                  </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="space-y-4">
                      <div className="flex justify-between text-sm text-slate-300">
                          <span>Price/Capacity Adjustment</span>
                          <span className="font-bold text-amber-400">+{upliftScenario}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="15" 
                        step="1"
                        value={upliftScenario}
                        onChange={(e) => handleScenarioChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                          <span>0% (Baseline)</span>
                          <span>15% (Aggressive)</span>
                      </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Projected Revenue Delta</div>
                      <div className="text-2xl font-bold text-emerald-400">
                         + {formatCurrency((upliftScenario * 0.8) * 12500)}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                          Based on current price elasticity of {selectedRoute === 'DOH-LOS' ? '-0.8 (Low)' : '-1.5 (High)'}.
                          <br/>Recommended action: {upliftScenario > 10 ? "Monitor for spill." : "Safe to implement."}
                      </p>
                  </div>
                  
                  <Button 
                    onClick={handleApplySimulation}
                    disabled={isApplying || upliftScenario === 0}
                    className={cn(
                        "w-full text-white transition-all",
                        simulationActive ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-600 hover:bg-amber-500"
                    )}
                  >
                      {isApplying ? (
                          <span className="flex items-center gap-2">Processing Model...</span>
                      ) : simulationActive ? (
                          <span className="flex items-center gap-2"><Check className="w-4 h-4"/> Simulation Active</span>
                      ) : (
                          "Apply Simulation to Forecast"
                      )}
                  </Button>
              </CardContent>
          </Card>

          {/* PROFITABILITY WATERFALL */}
          <Card className="bg-slate-900 border-slate-800 lg:col-span-2 flex flex-col">
              <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-200">Route Profitability Decomposition</CardTitle>
                  <p className="text-xs text-slate-500">Understanding net profit drivers</p>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedWaterfall} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl">
                                            <p className="text-xs text-slate-300 mb-1">{data.name}</p>
                                            <p className={cn("text-sm font-bold", data.type === 'decrease' ? "text-red-400" : "text-emerald-400")}>
                                                {formatCurrency(data.value)}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                          />
                          <Bar dataKey="start" stackId="a" fill="transparent" />
                          <Bar dataKey="end" stackId="a">
                                {processedWaterfall?.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={
                                            entry.type === 'increase' ? '#10b981' : 
                                            entry.type === 'decrease' ? '#ef4444' : 
                                            '#3b82f6' // Total/Net
                                        } 
                                    />
                                ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
      </div>

       {/* 5. ADVANCED OPTIMIZATION (ELASTICITY & OVERBOOKING) */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[350px]">
          {/* VISUAL E: Price Elasticity */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col">
              <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Price Elasticity Analysis
                     </CardTitle>
                     <div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">Ed = -1.2</div>
                  </div>
                  <p className="text-xs text-slate-500">Revenue uplift sensitivity to price changes</p>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" dataKey="x" name="Price Change" unit="%" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis type="number" dataKey="y" name="Rev Uplift" unit="%" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <ReferenceLine y={0} stroke="#475569" />
                        <ReferenceLine x={0} stroke="#475569" />
                        <Scatter name="Scenarios" data={elasticity} fill="#8884d8">
                            {elasticity?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.y > 0 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Scatter>
                      </ScatterChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* VISUAL F: Overbooking Risk */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col">
              <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      Overbooking Risk Optimization
                  </CardTitle>
                  <p className="text-xs text-slate-500">Net financial result of capacity adjustments</p>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overbooking} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          />
                          <ReferenceLine y={0} stroke="#475569" />
                          <Bar dataKey="value">
                             {overbooking?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#ef4444'} />
                             ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
       </div>
    </div>
  );
};
