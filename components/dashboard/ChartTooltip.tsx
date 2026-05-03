import React from 'react';
import { Tooltip, type TooltipProps } from 'recharts';

export function ChartTooltip<TValue extends number | string, TName extends number | string>(
  props: TooltipProps<TValue, TName>
) {
  const defaultContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="qa-recharts-tooltip rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-xs text-slate-50 shadow-xl shadow-slate-950/40">
        {label !== undefined && label !== null && (
          <div className="mb-1 font-semibold text-slate-50">{label}</div>
        )}
        <div className="space-y-1">
          {payload.map((item: any, index: number) => (
            <div key={`${item.dataKey || item.name || 'series'}-${index}`} className="flex items-center justify-between gap-4 text-slate-50">
              <span className="flex items-center gap-1.5 text-slate-50">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.stroke || '#94a3b8' }} />
                {item.name || item.dataKey}
              </span>
              <span className="font-semibold text-slate-50">
                {item.value}{item.unit || ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Tooltip
      {...props}
      content={props.content || defaultContent}
      wrapperStyle={{ outline: 'none', pointerEvents: 'none', ...props.wrapperStyle }}
    />
  );
}
