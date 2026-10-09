interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  icon?: React.ReactNode;
}

function KPICard({ title, value, unit, trend, icon }: KPICardProps) {
  return (
    <div className="bg-[#1a1a22] border border-[#2a2a32] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#a0a0b0] text-sm font-medium">{title}</h3>
        {icon && <div className="text-[#3b82f6]">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {unit && <span className="text-[#a0a0b0]">{unit}</span>}
      </div>

      {trend !== undefined && (
        <div className={`text-sm mt-2 ${trend > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

interface DashboardStatsProps {
  stats: {
    activeCampaigns: number;
    analyzedIps: number;
    blockedIps: number;
    avgRiskScore: number;
  };
}

export default function KPICards({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <KPICard title="Campanhas Ativas" value={stats.activeCampaigns} />
      <KPICard title="IPs Analisados" value={stats.analyzedIps} />
      <KPICard title="IPs Bloqueados" value={stats.blockedIps} />
      <KPICard title="Risk Score Médio" value={stats.avgRiskScore} unit="/" />
    </div>
  );
}
