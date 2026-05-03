import React from 'react';
import { Tooltip, type TooltipProps } from 'recharts';

const CONTENT_STYLE: React.CSSProperties = {
  backgroundColor: '#0f172a',
  border: '1px solid #475569',
  borderRadius: '6px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
  fontSize: '12px',
  color: '#f8fafc',
  padding: '8px 12px',
};

const ITEM_STYLE: React.CSSProperties = {
  color: '#f8fafc',
  padding: '1px 0',
};

const LABEL_STYLE: React.CSSProperties = {
  color: '#94a3b8',
  fontWeight: 600,
  marginBottom: '4px',
};

export function ChartTooltip<TValue extends number | string, TName extends number | string>(
  props: TooltipProps<TValue, TName>
) {
  return (
    <Tooltip
      isAnimationActive={false}
      contentStyle={CONTENT_STYLE}
      itemStyle={ITEM_STYLE}
      labelStyle={LABEL_STYLE}
      wrapperStyle={{ outline: 'none', zIndex: 9999 }}
      {...props}
    />
  );
}
