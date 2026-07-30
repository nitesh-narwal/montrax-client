import { Search, X, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TransactionFilters } from '@/hooks/useTransactionSearch';

interface TransactionFilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

export function TransactionFilterBar({ filters, onChange }: TransactionFilterBarProps) {
  const hasActiveFilters = !!(filters.keyword || filters.startDate || filters.endDate);

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 p-3 bg-card rounded-xl border border-border">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          className="pl-9"
        />
      </div>
      <Input
        type="date"
        value={filters.startDate}
        onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
        className="w-40"
        aria-label="Start date"
      />
      <span className="text-muted-foreground text-sm hidden sm:inline">to</span>
      <Input
        type="date"
        value={filters.endDate}
        onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
        className="w-40"
        aria-label="End date"
      />
      <Select value={filters.sortField} onValueChange={(v) => onChange({ ...filters, sortField: v as TransactionFilters['sortField'] })}>
        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date</SelectItem>
          <SelectItem value="amount">Amount</SelectItem>
          <SelectItem value="name">Name</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        onClick={() => onChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
      >
        <ArrowUpDown className="w-4 h-4" />
      </Button>
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1"
          onClick={() => onChange({ keyword: '', startDate: '', endDate: '', sortField: filters.sortField, sortOrder: filters.sortOrder })}
        >
          <X className="w-3.5 h-3.5" />Clear
        </Button>
      )}
    </div>
  );
}
