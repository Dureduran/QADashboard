import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { ChartTooltip as Tooltip } from './ChartTooltip';

export const RevenueChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['chartData'],
    queryFn: api.getChartData,
  });

  if (isLoading) {
    return (
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <Card className="h-[400px] bg-slate-900 border-slate-800 animate-pulse" />
         <Card className="h-[400px] bg-slate-900 border-slate-800 animate-pulse" />
       </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-200">Revenue Forecast vs Actual (Daily)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Line type="monotone" dataKey="actual" name="Actual Rev" stroke="#8b0050" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#64748b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-200">Load Factor Performance by Route</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{fill: 'rgba(255,255,255,0.05)'}}
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                />
                <Bar dataKey="budget" name="Budget Capacity" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Booked Seats" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};
