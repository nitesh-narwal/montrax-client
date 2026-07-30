import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Receipt, Wallet, Tags, Target, RefreshCw,
  BarChart3, Brain, Building2, Crown, User, Shield, Plus, LogOut, PiggyBank,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/incomes', label: 'Incomes', icon: Wallet },
  { path: '/categories', label: 'Categories', icon: Tags },
  { path: '/budgets', label: 'Budgets', icon: Target },
  { path: '/savings-goals', label: 'Savings Goals', icon: PiggyBank },
  { path: '/recurring', label: 'Recurring', icon: RefreshCw },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/insights', label: 'AI Insights', icon: Brain },
  { path: '/bank-import', label: 'Bank Import', icon: Building2 },
  { path: '/subscription', label: 'Subscription', icon: Crown },
  { path: '/profile', label: 'Profile', icon: User },
];

const quickActions = [
  { path: '/expenses?new=1', label: 'Add Expense', icon: Plus },
  { path: '/incomes?new=1', label: 'Add Income', icon: Plus },
  { path: '/budgets?new=1', label: 'Add Budget', icon: Plus },
  { path: '/savings-goals?new=1', label: 'Add Savings Goal', icon: Plus },
  { path: '/recurring?new=1', label: 'Add Recurring Transaction', icon: Plus },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const isAdmin = user?.role === 'ADMIN';

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, or type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem key={item.path} onSelect={() => go(item.path)}>
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          {navItems.map((item) => (
            <CommandItem key={item.path} onSelect={() => go(item.path)}>
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </CommandItem>
          ))}
          {isAdmin && (
            <CommandItem onSelect={() => go('/admin')}>
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </CommandItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => { onOpenChange(false); logout(); navigate('/login'); }}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
