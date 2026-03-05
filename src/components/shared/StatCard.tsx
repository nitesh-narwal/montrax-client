import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'income' | 'expense' | 'balance' | 'savings';
  trend?: string;
  isCurrency?: boolean;
}

const variantStyles = {
  income: 'gradient-income',
  expense: 'gradient-expense',
  balance: 'gradient-balance',
  savings: 'gradient-savings',
};

export function StatCard({ title, value, icon: Icon, variant, trend, isCurrency = true }: StatCardProps) {
  return (
    <div className={cn('rounded-xl p-5 text-primary-foreground card-hover', variantStyles[variant])}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium opacity-90">{title}</span>
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-display font-bold">
        {isCurrency ? formatCurrency(value) : `${value}%`}
      </div>
      {trend && (
        <p className="text-xs mt-1 opacity-80">{trend}</p>
      )}
    </div>
  );
}
