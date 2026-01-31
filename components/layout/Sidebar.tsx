
import React from 'react';
import { 
  LayoutDashboard, 
  BrainCircuit,
  BookOpen,
  PieChart,
  Activity,
  BarChart2,
  TrendingUp,
  ShieldAlert,
  SearchCheck,
  ClipboardCheck,
  Zap,
  UserX,
  LineChart,
  Database
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar = ({ currentView, onNavigate }: SidebarProps) => {
  const mainItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Rationale for Route Selection', icon: BookOpen },
    { name: 'Assumptions & Rules', icon: ClipboardCheck },
    { name: 'Data Sources & Schema', icon: Database },
  ];

  const techSpecItems = [
    { name: 'Load Factor & RASK Gauges', icon: Activity },
    { name: 'Booking Pace (S-Curve)', icon: TrendingUp },
    { name: 'Competitor Price Tracker', icon: BarChart2 },
    { name: 'Route Profitability Waterfall', icon: PieChart },
    { name: 'Price Elasticity Scatter', icon: Activity },
    { name: 'Overbooking Risk Histogram', icon: ShieldAlert },
    { name: 'RAG Faithfulness & Sources', icon: SearchCheck },
  ];

  const aiModules = [
      { name: 'Demand Forecasting', icon: LineChart },
      { name: 'No-Show Predictor', icon: UserX },
      { name: 'Pricing Optimizer', icon: Zap },
      { name: 'RM Assistant', icon: BrainCircuit },
  ];

  return (
    <div className="hidden h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 md:flex fixed left-0 top-0 z-50">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
           <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">V</div>
           <span className="text-slate-100">Velox</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-4">
          <div className="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Main
          </div>
          {mainItems.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                currentView === item.name
                  ? "bg-slate-800 text-primary-foreground"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="leading-tight truncate">{item.name}</span>
            </button>
          ))}
          
          <div className="mt-8 mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Visual Documentation
          </div>
          {techSpecItems.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                currentView === item.name
                  ? "bg-slate-800 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="leading-tight truncate">{item.name}</span>
            </button>
          ))}

          <div className="mt-8 px-3">
             <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">AI Modules</div>
             {aiModules.map((item) => (
                <button
                key={item.name}
                onClick={() => onNavigate(item.name)}
                className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-1",
                    currentView === item.name
                    ? "bg-slate-800 text-primary-foreground"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
                >
                <item.icon className={cn("h-5 w-5", item.name === 'RM Assistant' ? "text-indigo-400" : "text-slate-400")} />
                {item.name}
                </button>
             ))}
          </div>
        </nav>
      </div>
    </div>
  );
};
