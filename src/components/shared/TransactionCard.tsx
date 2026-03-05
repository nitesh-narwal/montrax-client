import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
  icon: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  type: 'EXPENSE' | 'INCOME';
  onDelete?: () => void;
}

export function TransactionCard({ icon, name, category, amount, date, type, onDelete }: TransactionCardProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon || '💰'}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{category} · {formatDate(date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-sm font-bold',
            type === 'INCOME' ? 'text-income' : 'text-expense'
          )}
        >
          {type === 'INCOME' ? '+' : '-'}{formatCurrency(amount)}
        </span>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-expense"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
