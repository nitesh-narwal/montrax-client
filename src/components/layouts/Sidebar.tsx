import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Wallet, Tags, Target, RefreshCw,
  BarChart3, Brain, Building2, Crown, User, LogOut, IndianRupee
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/incomes', label: 'Incomes', icon: Wallet },
  { path: '/categories', label: 'Categories', icon: Tags },
  { path: '/budgets', label: 'Budgets', icon: Target },
  { path: '/recurring', label: 'Recurring', icon: RefreshCw },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/insights', label: 'AI Insights', icon: Brain },
  { path: '/bank-import', label: 'Bank Import', icon: Building2 },
];

const bottomItems = [
  { path: '/subscription', label: 'Subscription', icon: Crown },
  { path: '/profile', label: 'Profile', icon: User },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 gradient-sidebar flex flex-col transition-transform duration-300 md:translate-x-0 scrollbar-thin',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <IndianRupee className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold text-sidebar-accent-foreground">
            Montrax
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-expense w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
