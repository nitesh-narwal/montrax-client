import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '@/store/useStore';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
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
  const [loading, setLoading] = useState(true);
  const { token, subscription, setSubscription, setSubscriptionLoaded } = useStore();
  const location = useLocation();

  // Always fetch subscription data on mount to ensure it's current
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/subscription/current');
        if (res.data) {
          setSubscription(res.data);
        } else {
          // If no subscription found, set to null but mark as loaded
          setSubscription(null);
        }
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
        // Set subscription to null and mark as loaded on error
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    // Always fetch fresh subscription data when dashboard loads
    setLoading(true);
    fetchSubscription();
  }, [token, setSubscription, setSubscriptionLoaded]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while subscription is being fetched (only for premium-gated pages)
  const premiumPages = ['/insights', '/bank-import'];
  const isPremiumPage = premiumPages.includes(location.pathname);

  if (isPremiumPage && loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
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
