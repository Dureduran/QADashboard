
import React from 'react';
import { cn } from '../../lib/utils';

export const ROUTES = ['DOH-SFO', 'DOH-JFK', 'DOH-LOS', 'DOH-PVG', 'DOH-ZAG'];

interface RouteSelectorProps {
    selectedRoute: string;
    onSelect: (route: string) => void;
    className?: string;
    size?: 'sm' | 'md';
}

export const RouteSelector = ({ selectedRoute, onSelect, className, size = 'md' }: RouteSelectorProps) => {
    return (
        <div className={cn("flex gap-2 overflow-x-auto no-scrollbar", className)}>
            {ROUTES.map(r => (
                <button
                    key={r}
                    onClick={() => onSelect(r)}
                    className={cn(
                        "rounded-lg font-medium transition-all whitespace-nowrap border",
                        size === 'sm' ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
                        selectedRoute === r
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                    )}
                >
                    {r}
                </button>
            ))}
        </div>
    );
};
