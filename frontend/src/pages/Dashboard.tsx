import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import KPICards from '../components/Dashboard/KPICards';
import StatsChart from '../components/Dashboard/StatsChart';
import api from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Dashboard() {
  const [stats, setStats] = useState({ activeCampaigns: 0, analyzedIps: 0, blockedIps: 0, avgRiskScore: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, off } = useWebSocket();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/campaigns');
        const campaigns = response.data.data;

        setStats({
          activeCampaigns: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
          analyzedIps: Math.floor(Math.random() * 1000),
          blockedIps: Math.floor(Math.random() * 100),
          avgRiskScore: Math.floor(Math.random() * 100)
        });

        // Mock chart data
        setChartData(
          Array.from({ length: 7 }, (_, i) => ({
            date: `Day ${i + 1}`,
            analyzed: Math.floor(Math.random() * 500),
            blocked: Math.floor(Math.random() * 50)
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const handleStatsUpdate = (data: any) => {
      setStats(prev => ({ ...prev, ...data }));
    };

    on('campaign:stats:updated', handleStatsUpdate);

    return () => {
      off('campaign:stats:updated', handleStatsUpdate);
    };
  }, [on, off]);

  return (
    <MainLayout>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <>
          <KPICards stats={stats} />
          <StatsChart data={chartData} />
        </>
      )}
    </MainLayout>
  );
}
