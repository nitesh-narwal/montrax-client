import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/incomes': 'Incomes',
  '/categories': 'Categories',
  '/budgets': 'Budget Goals',
  '/recurring': 'Recurring',
  '/analytics': 'Analytics',
  '/insights': 'AI Insights',
  '/bank-import': 'Bank Import',
  '/subscription': 'Subscription',
  '/profile': 'Profile',
};

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, subscription, setSubscription } = useStore();
  const location = useLocation();

  // Fetch subscription data on mount if not already loaded
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!token) return;

      // Only fetch if subscription is not already loaded
      if (!subscription) {
        try {
          const res = await api.get('/api/subscription/current');
          if (res.data) {
            setSubscription(res.data);
          }
        } catch (err) {
          console.error('Failed to fetch subscription:', err);
        }
      }
    };

    fetchSubscription();
  }, [token, subscription, setSubscription]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
