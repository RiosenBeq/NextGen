'use client'

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from "@/lib/utils";

interface PerformanceComparisonProps {
  data: any[];
}

export default function PerformanceComparison({ data }: PerformanceComparisonProps) {
  // Assuming data structure: [{ month: 'Mart', 'Bursa Zafer Plaza': 205, 'Mavibahçe': 263 }, ...]
  
  const locations = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'month') : [];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip 
            cursor={{ fill: '#F1F5F9' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              fontWeight: '600'
            }}
          />
          <Legend 
            verticalAlign="top" 
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          {locations.map((loc, index) => (
            <Bar 
              key={loc} 
              dataKey={loc} 
              fill={index === 0 ? '#2563EB' : '#F59E0B'} 
              radius={[4, 4, 0, 0]} 
              barSize={24}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
