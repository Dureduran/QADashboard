import React from 'react';
import { Tooltip, type TooltipProps } from 'recharts';

const darkContentStyle: React.CSSProperties = {
  backgroundColor: '#020617',
  border: '1px solid #475569',
  borderRadius: 8,
  color: '#f8fafc',
  boxShadow: '0 12px 30px rgba(2, 6, 23, 0.45)',
  fontSize: 12,
};

const darkTextStyle: React.CSSProperties = {
  color: '#f8fafc',
};

const darkLabelStyle: React.CSSProperties = {
  ...darkTextStyle,
  fontWeight: 600,
  marginBottom: 4,
};

export function ChartTooltip<TValue extends number | string, TName extends number | string>(
  props: TooltipProps<TValue, TName>
) {
  return (
    <Tooltip
      {...props}
      contentStyle={{ ...darkContentStyle, ...props.contentStyle }}
      labelStyle={{ ...darkLabelStyle, ...props.labelStyle }}
      itemStyle={{ ...darkTextStyle, ...props.itemStyle }}
      wrapperStyle={{ outline: 'none', ...props.wrapperStyle }}
    />
  );
}
