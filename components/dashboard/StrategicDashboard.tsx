import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    BarChart, Bar, Legend, Cell, ComposedChart, Area, ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { ArrowUp, ArrowDown, Target, TrendingUp, Users, AlertCircle, DollarSign, ShieldAlert, Activity, Check, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { ChartTooltip as Tooltip } from './ChartTooltip';

const ROUTES = ['DOH-SFO', 'DOH-JFK', 'DOH-LOS', 'DOH-PVG', 'DOH-ZAG'];

const averageElasticity = (points: { x: number; y: number }[] = []) => {
    const positive = points.filter(point => point.x < 0 && point.y > 0);
    if (!positive.length) return -1.1;
    const avg = positive.reduce((sum, point) => sum + Math.abs(point.y / point.x), 0) / positive.length;
    return -Math.round(avg * 10) / 10;
};

const getBestScenario = <T extends { value: number }>(items: T[] = []) => {
    if (!items.length) return null;
    return items.reduce((best, item) => item.value > best.value ? item : best, items[0]);
};

const getSimulationScenario = (
    route: string,
    uplift: number,
    kpi?: { loadFactor: number; targetLoadFactor: number; rask: number; yield: number },
    elasticity: { x: number; y: number }[] = [],
    overbooking: { name: string; value: number }[] = []
) => {
    const loadGap = kpi ? kpi.targetLoadFactor - kpi.loadFactor : 0;
    const elasticityScore = averageElasticity(elasticity);
    const bestOverbooking = getBestScenario(overbooking);
    const aggressive = uplift > 10;
    const simulatedLoadFactor = kpi ? Math.min(99, Math.round(kpi.loadFactor * (1 + uplift / 100))) : 0;
    const simulatedRask = kpi ? Math.round((kpi.rask * (1 + uplift * 0.004)) * 10) / 10 : 0;
    const simulatedYield = kpi ? Math.round((kpi.yield * (1 - uplift * 0.002)) * 10) / 10 : 0;
    const revenueDelta = Math.round((uplift * 0.8) * 12500);

    if (route === 'DOH-LOS') {
        return {
            label: 'Forecast Demand Uplift Scenario',
            action: aggressive ? 'Apply with no-show guardrail' : 'Safe with overbooking controls',
            detail: `High-yield route with softer demand. Pair uplift with ${bestOverbooking?.name || '+4 Seats'} overbooking control and avoid broad discounting.`,
            elasticityLabel: `${elasticityScore} (Moderate)`,
            revenueDelta,
            simulatedLoadFactor,
            simulatedRask,
            simulatedYield,
        };
    }

    if (loadGap >= 10) {
        return {
            label: 'Forecast Demand Uplift Scenario',
            action: aggressive ? 'Monitor yield dilution' : 'Safe demand stimulation',
            detail: `Route is ${loadGap} pts below target. Use the scenario to test demand stimulation before restricting inventory.`,
            elasticityLabel: `${elasticityScore} (High)`,
            revenueDelta,
            simulatedLoadFactor,
            simulatedRask,
            simulatedYield,
        };
    }

    if (loadGap > 0) {
        return {
            label: 'Forecast Demand Uplift Scenario',
            action: aggressive ? 'Monitor for spill' : 'Safe selective protection',
            detail: 'If simulated PLF reaches the target band, review only the lowest bucket first.',
            elasticityLabel: `${elasticityScore} (Balanced)`,
            revenueDelta,
            simulatedLoadFactor,
            simulatedRask,
            simulatedYield,
        };
    }

    return {
        label: 'Forecast Demand Uplift Scenario',
        action: aggressive ? 'Protect yield before adding demand' : 'Safe to implement',
        detail: 'Route is at or above target, so extra demand should trigger fare-class protection review.',
        elasticityLabel: `${elasticityScore} (Low)`,
        revenueDelta,
        simulatedLoadFactor,
        simulatedRask,
        simulatedYield,
    };
};

export const StrategicDashboard = () => {
    const [selectedRoute, setSelectedRoute] = useState('DOH-SFO');
    const [upliftScenario, setUpliftScenario] = useState(0); // 0% to 15%
    const [isApplying, setIsApplying] = useState(false);
    const [simulationActive, setSimulationActive] = useState(false);
    const toast = useToast();

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

    const scenario = getSimulationScenario(selectedRoute, upliftScenario, kpi, elasticity, overbooking);
    const displayedLoadFactor = simulationActive && scenario.simulatedLoadFactor ? scenario.simulatedLoadFactor : kpi?.loadFactor;
    const displayedRask = simulationActive && scenario.simulatedRask ? scenario.simulatedRask : kpi?.rask;
    const displayedYield = simulationActive && scenario.simulatedYield ? scenario.simulatedYield : kpi?.yield;
    const displayedRaskTrend = simulationActive ? Math.round(((scenario.simulatedRask - (kpi?.rask || 0)) / (kpi?.rask || 1)) * 1000) / 10 : kpi?.raskTrend;
    const displayedYieldTrend = simulationActive ? Math.round(((scenario.simulatedYield - (kpi?.yield || 0)) / (kpi?.yield || 1)) * 1000) / 10 : kpi?.yieldTrend;
    const displayedElasticity = averageElasticity(elasticity || []);

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
            toast.success(`Scenario applied to ${selectedRoute}: PLF, RASK, yield, booking pace, and profit waterfall updated.`);
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
    const simulatedWaterfall = waterfall && simulationActive && upliftScenario > 0
        ? waterfall.flatMap(item => {
            if (item.name !== 'Net Profit') return [item];
            return [
                { name: 'Simulation Uplift', value: scenario.revenueDelta, type: 'increase' as const },
                { ...item, value: item.value + scenario.revenueDelta },
            ];
        })
        : waterfall;

    const processedWaterfall = simulatedWaterfall?.map((item, index, arr) => {
        let start = 0;
        if (item.type === 'total') {
            start = 0;
        } else {
            // Calculate start based on previous total
            // This is a simplified logic for demo visualization
            let prevSum = 0;
            for (let i = 0; i < index; i++) {
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2">
                <div>
                    <h2 className="text-lg font-semibold text-slate-200">
                        Route Performance
                    </h2>
                    <p className="text-[11px] text-slate-500">Tracking volatility and growth across strategic ODs</p>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-2 md:pb-0">
                    {ROUTES.map(r => (
                        <button
                            key={r}
                            onClick={() => { setSelectedRoute(r); setSimulationActive(false); setUpliftScenario(0); }}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                selectedRoute === r
                                    ? "bg-slate-800 text-slate-50 border-b-2 border-primary"
                                    : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                            )}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* LOAD FACTOR */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-900/70 border-slate-700/40 shadow-lg shadow-slate-950/50">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Load Factor (PLF)</p>
                                <div className="text-4xl font-bold text-slate-50 mt-1 tracking-tight">
                                    {displayedLoadFactor !== undefined ? `${displayedLoadFactor}%` : <Skeleton className="h-10 w-20 inline-block" />}
                                </div>
                                {simulationActive && <div className="mt-1 text-[10px] font-semibold text-emerald-400">Simulated from {kpi?.loadFactor}%</div>}
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-600">Target</div>
                                <div className="text-sm font-semibold text-emerald-400">{kpi?.targetLoadFactor}%</div>
                            </div>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden relative">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000",
                                    displayedLoadFactor && displayedLoadFactor < 75 ? "bg-red-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${displayedLoadFactor}%` }}
                            />
                            {/* Target Marker */}
                            <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: `${kpi?.targetLoadFactor}%` }} />
                        </div>
                        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                            {displayedLoadFactor && displayedLoadFactor < 75 ? <AlertCircle className="w-3 h-3 text-red-500" /> : null}
                            {simulationActive
                                ? `Scenario ${displayedLoadFactor && kpi?.targetLoadFactor && displayedLoadFactor >= kpi.targetLoadFactor ? 'reaches target band' : 'still needs demand capture'}`
                                : displayedLoadFactor && displayedLoadFactor < 75 ? "Capacity spoilage risk detected" : "Utilization healthy"}
                        </div>
                    </CardContent>
                </Card>

                {/* RASK */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-900/70 border-slate-700/40 shadow-lg shadow-slate-950/50">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">RASK (Rev/ASK)</p>
                                <div className="text-4xl font-bold text-slate-50 mt-1 tracking-tight">
                                    {displayedRask !== undefined ? `${displayedRask}¢` : <Skeleton className="h-10 w-20 inline-block" />}
                                </div>
                                {simulationActive && <div className="mt-1 text-[10px] font-semibold text-emerald-400">Scenario-adjusted</div>}
                            </div>
                            <div className={cn("flex items-center px-2 py-1 rounded text-xs font-bold", displayedRaskTrend && displayedRaskTrend > 0 ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400")}>
                                {displayedRaskTrend && displayedRaskTrend > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                {Math.abs(displayedRaskTrend || 0)}%
                            </div>
                        </div>
                        <div className="h-12 mt-4">
                            {/* Simulated Mini Trend */}
                            <div className="w-full h-full flex items-end">
                                <ResponsiveContainer width="100%" height={50}>
                                    <LineChart data={bookingCurve?.slice(0, 10) || []}>
                                        <Line type="monotone" dataKey="actual" stroke={displayedRaskTrend && displayedRaskTrend > 0 ? "#10b981" : "#ef4444"} strokeWidth={2} dot={false} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Unit revenue performance vs prev week</p>
                    </CardContent>
                </Card>

                {/* YIELD */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-900/70 border-slate-700/40 shadow-lg shadow-slate-950/50">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Yield</p>
                                <div className="text-4xl font-bold text-slate-50 mt-1 tracking-tight">
                                    {displayedYield !== undefined ? `${displayedYield}¢` : <Skeleton className="h-10 w-20 inline-block" />}
                                </div>
                                {simulationActive && <div className="mt-1 text-[10px] font-semibold text-amber-400">Includes stimulation mix</div>}
                            </div>
                            <div className={cn("flex items-center px-2 py-1 rounded text-xs font-bold", displayedYieldTrend && displayedYieldTrend > 0 ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400")}>
                                {displayedYieldTrend && displayedYieldTrend > 0 ? "+" : ""}{displayedYieldTrend}%
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:h-[380px]">
                {/* DEMAND FORECAST */}
                <Card className="bg-slate-900/80 border-slate-800/50 flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Booking Pace</CardTitle>
                        <p className="text-[10px] text-slate-500">Cumulative bookings vs Forecast & Last Year</p>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={processedBookingCurve || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="daysOut" label={{ value: 'Days Out', position: 'insideBottomRight', offset: -5, fontSize: 10 }} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Area type="monotone" dataKey="actual" name="Actual (2026)" fill="url(#colorActual)" stroke="#8b0050" strokeWidth={3} isAnimationActive={false} />
                                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                                <Line type="monotone" dataKey="ly" name="Last Year" stroke="#64748b" strokeWidth={2} dot={false} isAnimationActive={false} />
                                {simulationActive && (
                                    <Line
                                        type="monotone"
                                        dataKey="simulated"
                                        name={`Simulated (+${upliftScenario}%)`}
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="3 3"
                                        dot={false}
                                        animationDuration={0}
                                        isAnimationActive={false}
                                    />
                                )}
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b0050" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b0050" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* COMPETITOR INTELLIGENCE */}
                <Card className="bg-slate-900/80 border-slate-800/50 flex flex-col">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium text-slate-300">Competitor Tracker</CardTitle>
                            <p className="text-[10px] text-slate-500">Lowest available Y-Class fare</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center text-xs text-slate-400 gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div>QR</div>
                            <div className="flex items-center text-xs text-slate-400 gap-1"><div className="w-2 h-2 bg-red-400 rounded-full"></div>Comp</div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={competitors || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                <Line type="step" dataKey="ourPrice" name="Qatar Airways" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
                                <Line type="monotone" dataKey="compPrice" name="Primary Competitor" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                                <Line type="monotone" dataKey="marketAverage" name="Market Avg" stroke="#64748b" strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 4. SIMULATION & PROFITABILITY (BOTTOM SECTION) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:h-[340px]">
                {/* SIMULATION CONTROLS */}
                <Card className="bg-slate-900/80 border-slate-800/50 lg:col-span-1 flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">
                            Revenue Simulator
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm text-slate-300">
                                <span>{scenario.label}</span>
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
                                + {formatCurrency(scenario.revenueDelta)}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                Based on current price elasticity of {scenario.elasticityLabel}.
                                <br />Recommended action: {scenario.action}.
                                <br />{scenario.detail}
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
                                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processing Model...</span>
                            ) : simulationActive ? (
                                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Simulation Active</span>
                            ) : (
                                "Apply Simulation to Forecast"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* PROFITABILITY WATERFALL */}
                <Card className="bg-slate-900/80 border-slate-800/50 lg:col-span-2 flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Profitability Breakdown</CardTitle>
                        <p className="text-[10px] text-slate-500">Net profit drivers</p>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={processedWaterfall || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                                <Bar dataKey="start" stackId="a" fill="transparent" isAnimationActive={false} />
                                <Bar dataKey="end" stackId="a" isAnimationActive={false}>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:h-[340px]">
                {/* VISUAL E: Price Elasticity */}
                <Card className="bg-slate-900/80 border-slate-800/50 flex flex-col">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-slate-300">
                                Price Elasticity
                            </CardTitle>
                            <div className="text-[10px] bg-slate-800/50 px-2 py-0.5 rounded text-slate-500">Ed = {displayedElasticity}</div>
                        </div>
                        <p className="text-[10px] text-slate-500">Revenue sensitivity to price changes</p>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height={250}>
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" dataKey="x" name="Price Change" unit="%" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis type="number" dataKey="y" name="Rev Uplift" unit="%" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                <ReferenceLine y={0} stroke="#475569" />
                                <ReferenceLine x={0} stroke="#475569" />
                                <Scatter name="Scenarios" data={elasticity || []} fill="#8884d8" isAnimationActive={false}>
                                    {elasticity?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.y > 0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* VISUAL F: Overbooking Risk */}
                <Card className="bg-slate-900/80 border-slate-800/50 flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">
                            Overbooking Optimization
                        </CardTitle>
                        <p className="text-[10px] text-slate-500">Net result of capacity adjustments</p>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={overbooking || []} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <ReferenceLine y={0} stroke="#475569" />
                                <Bar dataKey="value" isAnimationActive={false}>
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
