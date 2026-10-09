import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsChartProps {
  data: Array<{
    date: string;
    analyzed: number;
    blocked: number;
  }>;
}

export default function StatsChart({ data }: StatsChartProps) {
  return (
    <div className="bg-[#1a1a22] border border-[#2a2a32] rounded-lg p-6 mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Análises Últimos 7 Dias</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" />
          <XAxis dataKey="date" stroke="#6a6a78" />
          <YAxis stroke="#6a6a78" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a22', border: '1px solid #2a2a32' }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend />
          <Line type="monotone" dataKey="analyzed" stroke="#3b82f6" strokeWidth={2} />
          <Line type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
