
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Lightbulb, Zap } from 'lucide-react';

interface ModuleExplanationProps {
    title: string;
    description: string;
    question: string;
    data: string[];
    model: string[];
    scenario?: {
        problem: string;
        action: string;
        uplift: string;
    };
}

export const ModuleExplanation = ({ title, description, question, data, model, scenario }: ModuleExplanationProps) => {
  return (
    <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
        <h3 className="text-lg font-bold text-slate-100 border-l-4 border-primary pl-3">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             {/* Business Question */}
            <Card className="bg-slate-900 border-slate-800 md:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-emerald-400 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Business Question Solved
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-200 text-base italic leading-relaxed">"{question}"</p>
                </CardContent>
            </Card>

            {/* Data Required */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-xs font-bold uppercase tracking-wider">Data Ingestion</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {data.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <Badge variant="outline" className="mt-0.5 shrink-0 bg-slate-950 text-[10px] text-slate-500 border-slate-700 h-5 px-1.5">Input</Badge>
                                <span className="text-slate-400 text-xs">{item}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Analytical Model */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-slate-300 text-xs font-bold uppercase tracking-wider">Calculation / ML Model</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {model.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <Badge variant="outline" className="mt-0.5 shrink-0 bg-indigo-950/30 text-[10px] text-indigo-400 border-indigo-900/50 h-5 px-1.5">Logic</Badge>
                                <span className="text-slate-400 text-xs font-mono">{item}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Scenario / Uplift Card */}
            {scenario && (
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 md:col-span-2 overflow-hidden relative mt-2">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-100 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            Strategic Revenue Application
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 pt-4">
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wide">The Problem</div>
                            <p className="text-slate-300 text-xs leading-relaxed">{scenario.problem}</p>
                        </div>
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">The Action</div>
                            <p className="text-slate-300 text-xs leading-relaxed">{scenario.action}</p>
                        </div>
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Revenue Uplift</div>
                            <div className="text-slate-200 text-xs font-medium leading-relaxed bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
                                {scenario.uplift}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
};
