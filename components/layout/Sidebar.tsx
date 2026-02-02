
import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Zap,
  UserX,
  LineChart,
} from 'lucide-react';

import { cn } from '../../lib/utils';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar = ({ currentView, onNavigate }: SidebarProps) => {
  const mainItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
  ];

  const aiModules = [
    { name: 'Demand Forecasting', icon: LineChart },
    { name: 'No-Show Predictor', icon: UserX },
    { name: 'Pricing Optimizer', icon: Zap },
    { name: 'RM Assistant', icon: BrainCircuit },
  ];

  return (
    <div className="hidden h-screen w-56 flex-col border-r border-slate-800/40 bg-slate-950/95 md:flex fixed left-0 top-0 z-40">
      <div className="flex h-14 items-center px-5 border-b border-slate-800/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary/80 flex items-center justify-center text-white text-[10px] font-semibold">QA</div>
          <span className="text-slate-400 font-medium text-sm">Revenue Management</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-5">
        <nav className="space-y-1 px-3">
          <div className="mb-2 px-3 text-[10px] font-medium text-slate-600 uppercase tracking-wide">
            Overview
          </div>
          {mainItems.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                currentView === item.name
                  ? "bg-slate-800/60 text-slate-100 border-l-2 border-primary"
                  : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0 opacity-70" />
              <span className="leading-tight truncate">{item.name}</span>
            </button>
          ))}

          <div className="mt-6 px-3">
            <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wide mb-2">Analytics</div>
            {aiModules.map((item) => (
              <button
                key={item.name}
                onClick={() => onNavigate(item.name)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-0.5",
                  currentView === item.name
                    ? "bg-slate-800/60 text-slate-100 border-l-2 border-primary"
                    : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                )}
              >
                <item.icon className={cn("h-4 w-4 opacity-60", item.name === 'RM Assistant' ? "text-indigo-400/70" : "")} />
                <span className="text-[13px]">{item.name}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};
