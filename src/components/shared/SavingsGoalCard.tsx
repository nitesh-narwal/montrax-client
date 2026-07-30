import { formatCurrency, formatDate } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Trash2, Pencil, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SavingsGoalCardProps {
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  percentageProgress: number;
  targetDate: string | null;
  isCompleted: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onContribute?: () => void;
}

export function SavingsGoalCard({
  name, icon, targetAmount, currentAmount, percentageProgress,
  targetDate, isCompleted, onEdit, onDelete, onContribute,
}: SavingsGoalCardProps) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border card-hover">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon || '🎯'}</span>
          <h3 className="font-semibold text-foreground">{name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {isCompleted && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-income/10 text-income flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Reached
            </span>
          )}
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
            {formatCurrency(currentAmount)} / {formatCurrency(targetAmount)}
          </span>
          <span className="font-semibold text-foreground">{Math.round(percentageProgress)}%</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', isCompleted ? 'bg-income' : 'bg-primary')}
            style={{ width: `${Math.min(percentageProgress, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">
          {targetDate ? <>Target: {formatDate(targetDate)}</> : 'No target date'}
        </p>
        {onContribute && !isCompleted && (
          <Button variant="outline" size="sm" className="gap-1.5 h-7" onClick={onContribute}>
            <PlusCircle className="w-3.5 h-3.5" /> Add Money
          </Button>
        )}
      </div>
    </div>
  );
}
