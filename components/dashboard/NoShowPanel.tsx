
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/mockData';
import {
    PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { Calendar } from 'lucide-react';
import { RouteSelector } from './RouteSelector';
import { ModuleExplanation } from './ModuleExplanation';
import { formatCurrency } from '../../lib/utils';
import { ChartTooltip as Tooltip } from './ChartTooltip';

// Simple SVG Gauge Component
const Gauge = ({ seats, value, riskLabel }: { seats: number; value: number; riskLabel: string }) => {
    const radius = 40;
    const circumference = radius * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center pt-2 h-full">
            <svg width="100" height="60" viewBox="0 0 120 70" className="overflow-visible">
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                <path
                    d="M 10 60 A 50 50 0 0 1 110 60"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference * 2}
                    strokeDashoffset={circumference + offset}
                    className="transition-all duration-1000 ease-out"
                />
                {/* Needle */}
                <line x1="60" y1="60" x2="60" y2="20" stroke="#f8fafc" strokeWidth="3" transform={`rotate(${(value / 100) * 180 - 90} 60 60)`} className="transition-all duration-700" />
                <circle cx="60" cy="60" r="4" fill="#f8fafc" />
            </svg>
            <div className="text-center -mt-4">
                <div className="text-lg font-bold text-slate-100">{seats} Seats</div>
                <div className="text-[10px] text-emerald-400 font-medium">({riskLabel})</div>
            </div>
        </div>
    );
}

export const NoShowPanel = () => {
    const [selectedRoute, setSelectedRoute] = useState('DOH-JFK');
    const [activeRisk, setActiveRisk] = useState<{ name: string; value: number } | null>(null);

    const { data: noShowData, isLoading } = useQuery({
        queryKey: ['noShowData', selectedRoute],
        queryFn: () => api.getNoShowData(selectedRoute),
    });

    const data = noShowData || { risk: [], scatter: [] };
    const highRisk = data.risk.find(item => item.name === 'High Risk')?.value || 0;
    const mediumRisk = data.risk.find(item => item.name === 'Medium Risk')?.value || 0;
    const optimalSeats = Math.max(2, Math.round((highRisk * 0.22) + (mediumRisk * 0.08)));
    const gaugeValue = Math.min(85, Math.max(12, optimalSeats * 2.5));
    const riskLabel = optimalSeats <= 10 ? 'Low Risk' : optimalSeats <= 16 ? 'Managed Risk' : 'Review Required';
    const projectedRevenueGain = optimalSeats * 1250;

    if (isLoading) return <Card className="h-full min-h-[400px] bg-slate-900 animate-pulse border-slate-800" />;

    return (
        <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 flex flex-col h-full min-h-[450px]">
                <CardHeader className="pb-2 border-b border-slate-800/50 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                            2. NO-SHOW PREDICTION & OPTIMIZER <span className="text-slate-500 font-normal hidden sm:inline">({selectedRoute})</span>
                        </CardTitle>

                        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                            <RouteSelector selectedRoute={selectedRoute} onSelect={setSelectedRoute} size="sm" />
                            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded px-2 py-1 h-[26px]">
                                <span className="text-[10px] text-slate-400">Date</span>
                                <span className="text-[10px] font-semibold text-slate-200">20 Jan 2026</span>
                                <Calendar className="w-3 h-3 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {/* 2x2 Grid Layout for Content */}
                <CardContent className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 grid-rows-2 gap-4 min-h-0">

                    {/* Top Left: Pie Chart */}
                    <div className="flex flex-col items-center justify-center min-h-0">
                        <div className="text-xs font-semibold text-slate-300 mb-1 w-full text-center">Passenger Risk Profile</div>
                        <p className="text-[10px] text-slate-500 text-center mb-1 max-w-xs">
                            Share of PNRs grouped by predicted no-show probability from passenger, ticket, and route history.
                        </p>
                        <div
                            className="qa-risk-chart flex-1 w-full min-h-[100px] relative"
                            onMouseEnter={() => {
                                const mediumRisk = data.risk.find(item => item.name === 'Medium Risk') || data.risk[0];
                                if (mediumRisk) setActiveRisk({ name: mediumRisk.name, value: mediumRisk.value });
                            }}
                            onMouseLeave={() => setActiveRisk(null)}
                        >
                            <ResponsiveContainer width="100%" height={120}>
                                <PieChart>
                                    <Pie
                                        data={data?.risk || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={25}
                                        outerRadius={45}
                                        paddingAngle={2}
                                        dataKey="value"
                                        isAnimationActive={false}
                                        onMouseEnter={(entry: any) => setActiveRisk({ name: entry.name, value: entry.value })}
                                        onMouseLeave={() => setActiveRisk(null)}
                                    >
                                        {data?.risk.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                stroke="none"
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {activeRisk && (
                                <div className="qa-chart-tooltip pointer-events-none absolute right-6 top-8 rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-50 shadow-xl shadow-slate-950/40">
                                    {activeRisk.name}: {activeRisk.value}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center gap-3 mt-1">
                            {data?.risk.map((item: any) => (
                                <div key={item.name} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-[9px] text-slate-400 whitespace-nowrap">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Right: Scatter Plot */}
                    <div className="flex flex-col min-h-0">
                        <div className="text-xs font-semibold text-slate-300 mb-1 pl-2">Ticket Value vs Risk</div>
                        <p className="text-[10px] text-slate-500 mb-1 pl-2">
                            Each dot is a passenger or PNR: x-axis is no-show risk, y-axis is fare value.
                        </p>
                        <div className="flex-1 w-full min-h-[100px]">
                            <ResponsiveContainer width="100%" height={120}>
                                <ScatterChart margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                    <XAxis type="number" dataKey="x" name="Prob" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 1]} />
                                    <YAxis type="number" dataKey="y" name="Value" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                                    <Scatter name="Passengers" data={data?.scatter || []} fill="#8884d8" isAnimationActive={false}>
                                        {data?.scatter.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.7} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bottom Left: Gauge */}
                    <div className="flex flex-col items-center justify-center min-h-0 border-t sm:border-t-0 sm:border-r border-slate-800/50 pt-2 sm:pt-0">
                        <div className="text-xs font-semibold text-slate-300 mb-1">Optimal Overbooking Limit</div>
                        <p className="text-[10px] text-slate-500 text-center max-w-xs mb-1">
                            Extra seats allowed where expected fare gain still exceeds denied-boarding risk.
                        </p>
                        <div className="flex-1 w-full flex items-center justify-center">
                            <Gauge seats={optimalSeats} value={gaugeValue} riskLabel={riskLabel} />
                        </div>
                    </div>

                    {/* Bottom Right: Revenue Card */}
                    <div className="flex flex-col justify-center min-h-0 pt-2 sm:pt-0">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center h-full">
                            <div className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wide">Projected Revenue Gain</div>
                            <div className="text-2xl lg:text-3xl font-bold text-slate-100">{formatCurrency(projectedRevenueGain)}</div>
                            <p className="text-[10px] text-slate-500 text-center max-w-xs mt-1">
                                Calculated as optimized extra seats x average fare, net of expected disruption cost.
                            </p>
                            <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 bg-emerald-950/30 px-2 py-1 rounded">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Optimized for max yield
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ModuleExplanation
                title="Technical Logic: No-Show & Cancellation Prediction"
                description="Predicts individual passenger behavior to optimize overbooking capacity safely."
                question="How many passengers are likely to not show up, and how aggressively can we overbook without incurring denied boarding costs?"
                data={[
                    "Passenger Profiles (Loyalty tier, family status)",
                    "Ticket Class (Refundability, Advance purchase)",
                    "Historical No-Show Rates by Route/Time",
                    "Inbound connection tightness"
                ]}
                model={[
                    "XGBoost Classifier: Scores every PNR (Passenger Name Record) on probability of show (0.0 to 1.0) based on 40+ features.",
                    "Monte Carlo Aggregation: Simulates the flight departure 10,000 times to determine the probability of denied boarding > 0.",
                    "Cost-Benefit Optimizer: Solves for the Overbooking Limit that maximizes Expected Revenue minus Expected Compensation Cost."
                ]}
                scenario={{
                    problem: "DOH-JFK flight is physically full (354/354 booked). Standard rule stops selling. Historical no-show rate is 5% (~18 empty seats).",
                    action: "Model analyzes passenger list: 20 are low-loyalty connecting pax with tight inbound connections (high miss risk). Predicts 22 no-shows.",
                    uplift: "System authorizes overbooking to 370 (+16 seats). Flight departs with 354/354. Revenue gain: 16 seats * $1,200 = $19,200."
                }}
            />
        </div>
    );
};
