import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/constants';
import type { BudgetGoal, RecurringTransaction } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  icon: typeof AlertTriangle;
  tone: 'destructive' | 'warning' | 'default';
  title: string;
  description: string;
  href: string;
}

const DUE_SOON_DAYS = 7;

function buildNotifications(budgets: BudgetGoal[], recurring: RecurringTransaction[]): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const b of budgets) {
    if (b.isOverBudget) {
      items.push({
        id: `budget-over-${b.id}`,
        icon: AlertTriangle,
        tone: 'destructive',
        title: `${b.categoryName} budget exceeded`,
        description: `Spent ${formatCurrency(b.spentAmount)} of ${formatCurrency(b.budgetAmount)}`,
        href: '/budgets',
      });
    } else if (b.isNearLimit) {
      items.push({
        id: `budget-near-${b.id}`,
        icon: AlertTriangle,
        tone: 'warning',
        title: `${b.categoryName} budget near limit`,
        description: `${Math.round(b.percentageUsed)}% used (alert at ${b.alertThreshold}%)`,
        href: '/budgets',
      });
    }
  }

  const now = Date.now();
  for (const r of recurring) {
    if (!r.isActive) continue;
    const daysUntil = Math.ceil((new Date(r.nextExecution).getTime() - now) / 86400000);
    if (daysUntil >= 0 && daysUntil <= DUE_SOON_DAYS) {
      items.push({
        id: `recurring-${r.id}`,
        icon: Clock,
        tone: 'default',
        title: `${r.name} due ${daysUntil === 0 ? 'today' : `in ${daysUntil}d`}`,
        description: `${r.type === 'EXPENSE' ? '-' : '+'}${formatCurrency(r.amount)} · ${r.frequency.toLowerCase()}`,
        href: '/recurring',
      });
    }
  }

  return items;
}

export function NotificationsMenu() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/budgets').catch(() => ({ data: [] })),
      api.get('/api/recurring').catch(() => ({ data: [] })),
    ]).then(([bRes, rRes]) => {
      setItems(buildNotifications(bRes.data || [], rRes.data || []));
      setLoaded(true);
    });
  }, []);

  const count = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-expense px-1 text-[10px] font-semibold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="font-display font-semibold text-sm text-foreground">Notifications</p>
          {count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
        </div>
        <ScrollArea className="max-h-80">
          {!loaded ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
              <PartyPopper className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">You're all caught up.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    item.tone === 'destructive' && 'bg-expense/10 text-expense',
                    item.tone === 'warning' && 'bg-warning/10 text-warning',
                    item.tone === 'default' && 'bg-primary/10 text-primary',
                  )}>
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
