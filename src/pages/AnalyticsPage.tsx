import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/shared/StatCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity, Flame, Trophy, CalendarRange, Download, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/constants';
import type { AnalyticsData } from '@/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { downloadBlob } from '@/lib/download';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Filler,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899'];

const todayStr = () => new Date().toISOString().split('T')[0];
const monthAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};
const toDateStr = (d: Date) => d.toISOString().split('T')[0];

/** Mirrors AnalyticsService's date-range logic per period, so the downloaded report matches what's on screen. */
function getRangeForPeriod(period: string, customStart: string, customEnd: string): { startDate: string; endDate: string } {
  const today = new Date();
  switch (period) {
    case 'weekly': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: toDateStr(start), endDate: toDateStr(today) };
    }
    case 'monthly': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: toDateStr(start), endDate: toDateStr(today) };
    }
    case '6months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      return { startDate: toDateStr(start), endDate: toDateStr(today) };
    }
    case 'yearly': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: toDateStr(start), endDate: toDateStr(today) };
    }
    default:
      return { startDate: customStart, endDate: customEnd };
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [customStart, setCustomStart] = useState(monthAgoStr());
  const [customEnd, setCustomEnd] = useState(todayStr());
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [downloading, setDownloading] = useState(false);

  const endpointMap: Record<string, string> = {
    weekly: '/api/analytics/weekly',
    monthly: '/api/analytics/monthly',
    '6months': '/api/analytics/6months',
    yearly: '/api/analytics/yearly',
  };

  const fetchData = async (p: string) => {
    setLoading(true);
    try {
      const res = p === 'custom'
        ? await api.get('/api/analytics/custom', { params: { startDate: customStart, endDate: customEnd } })
        : await api.get(endpointMap[p]);
      setData(res.data);
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to load analytics')); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (period !== 'custom') fetchData(period);
  }, [period]);

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) { toast.error('Pick a start and end date'); return; }
    if (new Date(customStart) > new Date(customEnd)) { toast.error('Start date must be before end date'); return; }
    const days = (new Date(customEnd).getTime() - new Date(customStart).getTime()) / 86400000;
    if (days > 365) { toast.error('Range can be at most 365 days'); return; }
    fetchData('custom');
  };

  const handleDownloadReport = async () => {
    const { startDate, endDate } = getRangeForPeriod(period, customStart, customEnd);
    setDownloading(true);
    try {
      const res = await api.get('/api/reports/export', {
        params: { format: reportFormat, startDate, endDate },
        responseType: 'blob',
      });
      const extension = reportFormat === 'pdf' ? 'pdf' : 'xlsx';
      downloadBlob(res.data, `report-${startDate}-to-${endDate}.${extension}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to download report'));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-display font-bold text-foreground">Analytics</h2>
        <div className="flex items-center gap-2">
          <Select value={reportFormat} onValueChange={(v) => setReportFormat(v as 'pdf' | 'excel')}>
            <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={downloading} className="gap-2">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Report
          </Button>
        </div>
      </div>

      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="weekly">Week</TabsTrigger>
          <TabsTrigger value="monthly">Month</TabsTrigger>
          <TabsTrigger value="6months">6 Months</TabsTrigger>
          <TabsTrigger value="yearly">Year</TabsTrigger>
          <TabsTrigger value="custom" className="gap-1"><CalendarRange className="w-3.5 h-3.5" />Custom</TabsTrigger>
        </TabsList>

        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-3 mt-4 p-4 bg-card rounded-xl border border-border">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-40" />
            </div>
            <Button onClick={handleApplyCustomRange}>Apply</Button>
          </div>
        )}
      </Tabs>

      {!data ? (
        <EmptyState title="No analytics data" description="Start adding transactions to see analytics." />
      ) : (
        <AnalyticsBody data={data} />
      )}
    </div>
  );
}

function AnalyticsBody({ data }: { data: AnalyticsData }) {
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={data.totalIncome} icon={ArrowUpRight} variant="income" />
        <StatCard title="Total Expense" value={data.totalExpense} icon={ArrowDownRight} variant="expense" />
        <StatCard title="Net Savings" value={data.netSavings} icon={TrendingUp} variant="balance" />
        <StatCard title="Savings Rate" value={data.savingsRate} icon={Activity} variant="savings" isCurrency={false} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Avg Daily Spending</p>
              <p className="text-sm font-semibold text-foreground truncate">{formatCurrency(data.averageDailySpending)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-expense/10 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-expense" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Highest Spending Day</p>
              <p className="text-sm font-semibold text-foreground truncate">{formatCurrency(data.highestSpendingDay)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Top Category</p>
              <p className="text-sm font-semibold text-foreground truncate">{data.topSpendingCategory || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display">Spending Trend</CardTitle></CardHeader>
          <CardContent>
            {data.dailySpending.length > 0 ? (
              <Line data={spendingLineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : <p className="text-center text-muted-foreground py-8">No data for this range</p>}
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
    </>
  );
}
