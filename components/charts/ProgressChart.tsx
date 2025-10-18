'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Test } from '@/lib/types/database.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ProgressChartProps {
  tests: Test[]
}

export function ProgressChart({ tests }: ProgressChartProps) {
  // Sort tests by date ascending and format data
  const chartData = tests
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((test) => ({
      date: format(new Date(test.date), 'dd MMM', { locale: fr }),
      score: test.score,
      subtest: test.subtest,
      type: test.type,
    }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis 
          dataKey="date" 
          className="text-xs text-slate-600 dark:text-slate-400"
        />
        <YAxis 
          domain={[0, 15]} 
          className="text-xs text-slate-600 dark:text-slate-400"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={{ fill: '#2563eb', r: 4 }}
          activeDot={{ r: 6 }}
          name="Score"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}


