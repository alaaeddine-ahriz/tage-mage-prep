'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Test, FullTestWithSubtests } from '@/lib/types/database.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ProgressChartProps {
  tests: Test[]
  fullTests?: FullTestWithSubtests[]
  showFullTests?: boolean
}

export function ProgressChart({ tests, fullTests = [], showFullTests = false }: ProgressChartProps) {
  // Combine and sort all tests by date
  const allData = [
    ...tests.map((test) => ({
      date: new Date(test.date),
      score: test.score,
      maxScore: 15,
      label: test.subtest,
      type: test.type,
      isFullTest: false,
    })),
    ...(showFullTests ? fullTests.map((fullTest) => ({
      date: new Date(fullTest.date),
      score: fullTest.total_score,
      maxScore: 600,
      label: 'Test complet',
      type: fullTest.type,
      isFullTest: true,
    })) : [])
  ]
  .sort((a, b) => a.date.getTime() - b.date.getTime())
  .map((item) => ({
    date: format(item.date, 'dd MMM', { locale: fr }),
    // Normalize to percentage for comparison
    normalizedScore: (item.score / item.maxScore) * 100,
    actualScore: item.score,
    maxScore: item.maxScore,
    label: item.label,
    type: item.type,
    isFullTest: item.isFullTest,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={allData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis 
          dataKey="date" 
          className="text-xs text-muted-foreground"
        />
        <YAxis 
          domain={[0, 100]} 
          className="text-xs text-muted-foreground"
          label={{ value: '% réussite', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                  <p className="text-sm font-medium">{data.date}</p>
                  <p className="text-xs text-muted-foreground capitalize">{data.label}</p>
                  <p className="text-sm font-bold text-primary">
                    {data.actualScore}/{data.maxScore} ({data.normalizedScore.toFixed(0)}%)
                  </p>
                  <p className="text-xs text-muted-foreground">{data.type}</p>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="normalizedScore" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={{ fill: '#2563eb', r: 4 }}
          activeDot={{ r: 6 }}
          name="Score (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}


