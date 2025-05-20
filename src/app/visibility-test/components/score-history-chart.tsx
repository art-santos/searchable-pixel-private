'use client'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Point { date: string; score: number }
export function ScoreHistoryChart({ data }: { data: Point[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#333333" opacity={0.4} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#666666', fontSize: 11, fontFamily: 'ui-monospace' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#666666', fontSize: 11, fontFamily: 'ui-monospace' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid #333333' }}
            labelClassName="font-geist-mono"
          />
          <Line type="monotone" dataKey="score" stroke="#fff" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
