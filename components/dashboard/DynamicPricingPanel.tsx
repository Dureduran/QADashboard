import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useQuery } from '@tanstack/react-query';
import {
    api,
    MOCK_ELASTICITY,
    MOCK_NOSHOW_BY_ROUTE,
    MOCK_OVERBOOKING,
    MOCK_ROUTE_KPIS,
} from '../../services/mockData';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { Calendar, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RouteSelector } from './RouteSelector';
import { ModuleExplanation } from './ModuleExplanation';
import { useToast } from '../ui/Toast';
import { ChartTooltip as Tooltip } from './ChartTooltip';

const HeatmapCell: React.FC<{ value: number }> = ({ value }) => {
    // Red to Green gradient simulation
    let bgClass = "bg-red-500";
    if (value > 80) bgClass = "bg-emerald-500";
    else if (value > 60) bgClass = "bg-emerald-400";
    else if (value > 40) bgClass = "bg-amber-400";
    else if (value > 20) bgClass = "bg-orange-400";

    return (
        <div
            className={cn("h-6 w-full rounded-sm transition-all hover:opacity-80 cursor-default", bgClass)}
            title={`Demand: ${value}% — View only`}
            aria-label={`Demand level: ${value}%`}
        />
    );
};

const MONTH_INDEX: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
};

const getForecastSortKey = (point: { month: string; periodStart?: string }, index: number) => {
    if (point.periodStart) {
        const parsedDate = new Date(point.periodStart);
        if (!Number.isNaN(parsedDate.getTime())) return parsedDate.getTime();
    }

    const monthMatch = point.month.match(/([A-Za-z]+)\s*(\d{4})?/);
    if (!monthMatch) return Number.MAX_SAFE_INTEGER + index;

    const monthIndex = MONTH_INDEX[monthMatch[1].toLowerCase()];
    if (monthIndex === undefined) return Number.MAX_SAFE_INTEGER + index;

    const year = monthMatch[2] ? Number(monthMatch[2]) : 2026;
    return year * 12 + monthIndex;
};

const getBestElasticityMove = (route: string) => {
    const curve = MOCK_ELASTICITY[route] || MOCK_ELASTICITY.DEFAULT;
    return curve.reduce((best, point) => point.y > best.y ? point : best, curve[0]);
};

const getBestOverbookingMove = (route: string) => {
    const curve = MOCK_OVERBOOKING[route] || MOCK_OVERBOOKING.DEFAULT;
    return curve.reduce((best, point) => point.value > best.value ? point : best, curve[0]);
};

const getRouteForecastRecommendation = (route: string) => {
    const kpi = MOCK_ROUTE_KPIS[route] || MOCK_ROUTE_KPIS['DOH-SFO'];
    const elasticity = getBestElasticityMove(route);
    const overbooking = getBestOverbookingMove(route);
    const highNoShowRisk = (MOCK_NOSHOW_BY_ROUTE[route] || MOCK_NOSHOW_BY_ROUTE.DEFAULT).risk.find(item => item.name === 'High Risk')?.value || 0;
    const loadGap = kpi.targetLoadFactor - kpi.loadFactor;
    const priceMove = `${elasticity.x > 0 ? '+' : ''}${elasticity.x}%`;
    const revenueMove = `${elasticity.y > 0 ? '+' : ''}${elasticity.y}%`;

    if (route === 'DOH-LOS') {
        return {
            tone: 'amber',
            title: 'Controlled demand capture',
            action: 'Keep K/L/M open, avoid broad discounting, and use no-show/overbooking controls.',
            reason: `${kpi.loadFactor}% LF is ${loadGap} pts below ${kpi.targetLoadFactor}% target, but yield is high at ${kpi.yield}c and no-show risk is ${highNoShowRisk}%.`,
            visualSignal: `Best overbooking point: ${overbooking.name} ($${overbooking.value.toLocaleString()}).`,
            toast: `Applied LOS plan: open low buckets, protect yield, monitor no-show risk.`,
        };
    }

    if (loadGap >= 10) {
        return {
            tone: 'sky',
            title: 'Stimulate demand',
            action: 'Keep low buckets open and test tactical price stimulation before any closure.',
            reason: `${kpi.loadFactor}% LF is ${loadGap} pts below ${kpi.targetLoadFactor}% target; elasticity visual favors ${priceMove} price for ${revenueMove} revenue response.`,
            visualSignal: `Use forecast/heatmap demand pockets; review once load gap falls below 5 pts.`,
            toast: `Applied ${route} stimulation plan: keep low buckets open and review tactical pricing.`,
        };
    }

    if (loadGap > 0 && loadGap <= 5) {
        return {
            tone: 'emerald',
            title: 'Selective protection',
            action: 'Do not blanket-close K/L/M; protect only the lowest bucket if pickup beats forecast.',
            reason: `${kpi.loadFactor}% LF is near the ${kpi.targetLoadFactor}% target, with RASK ${kpi.raskTrend > 0 ? '+' : ''}${kpi.raskTrend}% and yield ${kpi.yieldTrend > 0 ? '+' : ''}${kpi.yieldTrend}%.`,
            visualSignal: `Overbooking visual peaks at ${overbooking.name}; keep analyst review before filing restrictions.`,
            toast: `Applied ${route} selective plan: monitor pickup before protecting the lowest bucket.`,
        };
    }

    return {
        tone: 'emerald',
        title: 'Protect fare integrity',
        action: 'Review closing the lowest discount bucket, but keep corporate and high-yield availability protected.',
        reason: `${kpi.loadFactor}% LF is at/above ${kpi.targetLoadFactor}% target and supports selective protection.`,
        visualSignal: `Elasticity visual favors ${priceMove} price for ${revenueMove} revenue response.`,
        toast: `Applied ${route} protection plan: selective low-bucket review.`,
    };
};

export const DynamicPricingPanel = () => {
    const [selectedRoute, setSelectedRoute] = useState('DOH-SFO');
    const [applied, setApplied] = useState(false);
    const toast = useToast();

    const { data: pricingData, isLoading } = useQuery({
        queryKey: ['pricingData', selectedRoute],
        queryFn: () => api.getPricingData(selectedRoute),
    });

    const data = pricingData || { forecast: [], matrix: [] };
    const forecastSeries = [...(data.forecast || [])].sort((a, b) => {
        return getForecastSortKey(a, 0) - getForecastSortKey(b, 0);
    });
    const routeRecommendation = getRouteForecastRecommendation(selectedRoute);
    const accentClass = routeRecommendation.tone === 'sky'
        ? 'bg-sky-500'
        : routeRecommendation.tone === 'amber'
            ? 'bg-amber-500'
            : 'bg-emerald-500';
    const buttonClass = routeRecommendation.tone === 'sky'
        ? 'bg-sky-900/40 text-sky-300 border-sky-800 hover:bg-sky-900/60'
        : routeRecommendation.tone === 'amber'
            ? 'bg-amber-900/40 text-amber-300 border-amber-800 hover:bg-amber-900/60'
            : 'bg-emerald-900/40 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60';

    const handleApply = () => {
        setApplied(true);
        toast.success(routeRecommendation.toast);
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
                                <span className="text-[10px] font-semibold text-slate-200">28 Jan 2026</span>
                                <Calendar className="w-3 h-3 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-4 flex flex-col gap-4 min-h-0">
                    {/* Top Chart Section - Fixed explicit height for ResponsiveContainer */}
                    <div className="h-[220px] w-full relative border-b border-slate-800/50 pb-2">
                        <div className="absolute top-0 right-0 flex items-center gap-4 text-[10px] z-10 bg-slate-900/80 px-2 rounded">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div>Historical</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div>Forecast</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300 border border-dashed border-slate-500"></div>Optimal</div>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecastSeries} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                                />
                                <Line type="monotone" dataKey="historical" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="forecast" stroke="#be185d" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="optimal" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={2} dot={{ r: 3 }} />
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
                            <div className="w-full sm:w-64 bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex flex-col justify-center relative overflow-hidden shrink-0">
                                <div className={cn("absolute top-0 left-0 w-1 h-full", accentClass)}></div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Recommended Action</div>
                                <div className="text-xs font-semibold text-slate-100">{routeRecommendation.title}</div>
                                <p className="mt-1 text-xs text-slate-200 leading-relaxed">{routeRecommendation.action}</p>
                                <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">{routeRecommendation.reason}</p>
                                <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">{routeRecommendation.visualSignal}</p>
                                <div className="mt-2 flex justify-end">
                                    <button
                                        onClick={handleApply}
                                        disabled={applied}
                                        className={cn(
                                            "text-[10px] px-2 py-1 rounded border transition-colors flex items-center gap-1",
                                            applied
                                                ? "bg-emerald-600 text-white border-emerald-600"
                                                : buttonClass
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
