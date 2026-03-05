import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Plus } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { TransactionCard } from '@/components/shared/TransactionCard';
import { BudgetProgressCard } from '@/components/shared/BudgetProgressCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import type { DashboardData, BudgetGoal } from '@/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899', '#f97316'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [budgets, setBudgets] = useState<BudgetGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('=== Dashboard Loading ===' );
    console.log('Token present:', !!token);
    console.log('Token value:', token?.substring(0, 20) + '...');
    
    Promise.all([
      api.get('/dashboard').catch((err) => {
        console.error('Dashboard API error:', err.response?.status, err.response?.data || err.message);
        setError(`Dashboard: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
        return null;
      }),
      api.get('/api/budgets').catch((err) => {
        console.error('Budgets API error:', err.response?.status, err.response?.data || err.message);
        return null;
      }),
    ]).then(([dashRes, budgetRes]) => {
      console.log('Dashboard response:', dashRes?.data);
      console.log('Budgets response:', budgetRes?.data);
      if (dashRes) setData(dashRes.data);
      if (budgetRes) setBudgets(budgetRes.data || []);
    }).catch((err) => {
      console.error('Promise.all error:', err);
      setError(err.message);
      toast.error('Failed to load dashboard');
    })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 rounded-lg border border-destructive">
        <h2 className="text-lg font-bold text-destructive mb-2">Error Loading Dashboard</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <p className="text-xs text-muted-foreground">Check browser console (F12) for details</p>
      </div>
    );
  }

  // Merge data with defaults to handle missing fields
  const dashboard = {
    totalIncome: data?.totalIncome ?? 0,
    totalExpense: data?.totalExpense ?? 0,
    balance: data?.balance ?? 0,
    recentExpenses: data?.recentExpenses ?? [],
    recentIncomes: data?.recentIncomes ?? [],
    categoryBreakdown: data?.categoryBreakdown ?? {},
  };
  const savingsRate = dashboard.totalIncome > 0 ? Math.round((dashboard.balance / dashboard.totalIncome) * 100) : 0;

  const categoryLabels = Object.keys(dashboard.categoryBreakdown || {});
  const categoryValues = Object.values(dashboard.categoryBreakdown || {});

  const doughnutData = {
    labels: categoryLabels,
    datasets: [{
      data: categoryValues,
      backgroundColor: CHART_COLORS.slice(0, categoryLabels.length),
      borderWidth: 0,
    }],
  };

  const alertBudgets = budgets.filter((b) => b.isOverBudget || b.isNearLimit);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={dashboard.totalIncome} icon={ArrowUpRight} variant="income" />
        <StatCard title="Total Expense" value={dashboard.totalExpense} icon={ArrowDownRight} variant="expense" />
        <StatCard title="Balance" value={dashboard.balance} icon={Wallet} variant="balance" />
        <StatCard title="Savings Rate" value={savingsRate} icon={TrendingUp} variant="savings" isCurrency={false} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link to="/expenses">
          <Button className="gap-2"><Plus className="w-4 h-4" /> Add Expense</Button>
        </Link>
        <Link to="/incomes">
          <Button variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Add Income</Button>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[...(dashboard.recentExpenses || []).slice(0, 3).map((e) => ({ ...e, _type: 'EXPENSE' as const })),
              ...(dashboard.recentIncomes || []).slice(0, 3).map((i) => ({ ...i, _type: 'INCOME' as const }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((t) => (
              <TransactionCard
                key={`${t._type}-${t.id}`}
                icon={t.icon}
                name={t.name}
                category={t.categoryName}
                amount={t.amount}
                date={t.date}
                type={t._type}
              />
            ))}
            {(dashboard.recentExpenses?.length || 0) === 0 && (dashboard.recentIncomes?.length || 0) === 0 && (
              <EmptyState title="No transactions" description="Add your first expense or income to get started." />
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLabels.length > 0 ? (
              <div className="w-full max-w-xs mx-auto">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    cutout: '65%',
                    plugins: {
                      legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } },
                    },
                  }}
                />
              </div>
            ) : (
              <EmptyState title="No data" description="Start adding transactions to see your category breakdown." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts */}
      {alertBudgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">⚠️ Budget Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alertBudgets.map((b) => (
                <BudgetProgressCard key={b.id} {...b} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
