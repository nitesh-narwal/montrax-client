import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity } from 'lucide-react';
import api from '@/lib/api';
import type { AnalyticsData } from '@/types';
import { toast } from 'sonner';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Filler,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  const endpointMap: Record<string, string> = {
    weekly: '/api/analytics/weekly',
    monthly: '/api/analytics/monthly',
    '6months': '/api/analytics/6months',
    yearly: '/api/analytics/yearly',
  };

  const fetchData = async (p: string) => {
    setLoading(true);
    try {
      const res = await api.get(endpointMap[p]);
      setData(res.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(period); }, [period]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState title="No analytics data" description="Start adding transactions to see analytics." />;

  const catLabels = Object.keys(data.categoryBreakdown);
  const catValues = Object.values(data.categoryBreakdown);

  const doughnutData = {
    labels: catLabels,
    datasets: [{ data: catValues, backgroundColor: CHART_COLORS.slice(0, catLabels.length), borderWidth: 0 }],
  };

  const spendingLineData = {
    labels: data.dailySpending.map((d) => d.date.slice(5)),
    datasets: [{
      label: 'Spending',
      data: data.dailySpending.map((d) => d.amount),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const barData = {
    labels: data.monthlyTrends.map((m) => m.month),
    datasets: [
      { label: 'Income', data: data.monthlyTrends.map((m) => m.income), backgroundColor: '#22c55e' },
      { label: 'Expense', data: data.monthlyTrends.map((m) => m.expense), backgroundColor: '#ef4444' },
    ],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Analytics</h2>

      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="weekly">Week</TabsTrigger>
          <TabsTrigger value="monthly">Month</TabsTrigger>
          <TabsTrigger value="6months">6 Months</TabsTrigger>
          <TabsTrigger value="yearly">Year</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={data.totalIncome} icon={ArrowUpRight} variant="income" />
        <StatCard title="Total Expense" value={data.totalExpense} icon={ArrowDownRight} variant="expense" />
        <StatCard title="Net Savings" value={data.netSavings} icon={TrendingUp} variant="balance" />
        <StatCard title="Savings Rate" value={data.savingsRate} icon={Activity} variant="savings" isCurrency={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display">Spending Trend</CardTitle></CardHeader>
          <CardContent>
            <Line data={spendingLineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display">Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            {catLabels.length > 0 ? (
              <div className="max-w-xs mx-auto">
                <Doughnut data={doughnutData} options={{ responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } } }} />
              </div>
            ) : <p className="text-center text-muted-foreground">No data</p>}
          </CardContent>
        </Card>
      </div>

      {data.monthlyTrends.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display">Income vs Expense</CardTitle></CardHeader>
          <CardContent>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } } }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
