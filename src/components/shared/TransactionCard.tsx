import { useState } from 'react';
import { Trash2, Paperclip, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Split } from '@/types';

interface TransactionCardProps {
  icon: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  type: 'EXPENSE' | 'INCOME';
  attachmentUrl?: string | null;
  tags?: string[];
  splits?: Split[];
  settlingSplitId?: number | null;
  onDelete?: () => void;
  onSettleSplit?: (splitId: number) => void;
}

export function TransactionCard({
  icon, name, category, amount, date, type, attachmentUrl, tags, splits, settlingSplitId, onDelete, onSettleSplit,
}: TransactionCardProps) {
  const [showSplits, setShowSplits] = useState(false);
  const hasSplits = splits && splits.length > 0;

  return (
    <div className="py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{icon || '💰'}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {category} · {formatDate(date)}
              {attachmentUrl && (
                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="View receipt">
                  <Paperclip className="w-3 h-3 text-primary" />
                </a>
              )}
            </p>
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">{t}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'text-sm font-bold',
              type === 'INCOME' ? 'text-income' : 'text-expense'
            )}
          >
            {type === 'INCOME' ? '+' : '-'}{formatCurrency(amount)}
          </span>
          {hasSplits && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setShowSplits((v) => !v)}
              title="Split details"
            >
              {showSplits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
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

      {hasSplits && showSplits && (
        <div className="mt-2 ml-11 space-y-1.5 border-l-2 border-border pl-3">
          {splits!.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <span className={cn('text-muted-foreground', s.isSettled && 'line-through')}>
                {s.participantName} · {formatCurrency(s.shareAmount)}
              </span>
              {s.isSettled ? (
                <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 h-4"><Check className="w-2.5 h-2.5" />Settled</Badge>
              ) : onSettleSplit ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-5 text-[10px] px-2"
                  disabled={settlingSplitId === s.id}
                  onClick={() => onSettleSplit(s.id)}
                >
                  {settlingSplitId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Settled'}
                </Button>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">Unsettled</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
