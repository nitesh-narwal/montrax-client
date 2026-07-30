import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Trash2, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BudgetProgressCardProps {
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentageUsed: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  isRecurring?: boolean;
  alertThreshold?: number;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function BudgetProgressCard({
  categoryName, budgetAmount, spentAmount, percentageUsed,
  isOverBudget, isNearLimit, isRecurring, alertThreshold, onDelete, onEdit
}: BudgetProgressCardProps) {
  const getColor = () => {
    if (isOverBudget) return 'bg-expense';
    if (isNearLimit) return 'bg-warning';
    if (percentageUsed > 60) return 'bg-warning';
    return 'bg-income';
  };

  const getStatus = () => {
    if (isOverBudget) return { icon: '🔴', label: 'Over Budget' };
    if (isNearLimit) return { icon: '⚠️', label: 'Near Limit' };
    return { icon: '✅', label: 'On Track' };
  };

  const status = getStatus();

  return (
    <div className="bg-card rounded-xl p-5 border border-border card-hover">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>{status.icon}</span>
          <h3 className="font-semibold text-foreground">{categoryName}</h3>
          {isRecurring && (
            <span title="Repeats monthly"><RefreshCw className="w-3 h-3 text-muted-foreground" /></span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium mr-1',
            isOverBudget ? 'bg-expense/10 text-expense' :
            isNearLimit ? 'bg-warning/10 text-warning' :
            'bg-income/10 text-income'
          )}>
            {status.label}
          </span>
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-expense" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">
            {formatCurrency(spentAmount)} / {formatCurrency(budgetAmount)}
          </span>
          <span className="font-semibold text-foreground">{Math.round(percentageUsed)}%</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getColor())}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Remaining: {formatCurrency(Math.max(budgetAmount - spentAmount, 0))}
        {alertThreshold != null && <> · Alerts at {alertThreshold}%</>}
      </p>
    </div>
  );
}
