import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import type { PagedResponse } from '@/types';

export interface TransactionFilters {
  keyword: string;
  startDate: string;
  endDate: string;
  tag: string;
  sortField: 'date' | 'amount' | 'name';
  sortOrder: 'asc' | 'desc';
}

export const emptyTransactionFilters: TransactionFilters = {
  keyword: '', startDate: '', endDate: '', tag: '', sortField: 'date', sortOrder: 'desc',
};

const PAGE_SIZE = 20;

/**
 * Backs the "All Transactions" tabs on Expenses/Incomes. Uses the plain
 * /{expences,incomes}/paged endpoint when no filter is active, and switches to
 * POST /filter/paged (keyword + date range + sort) once the user filters —
 * this is the only frontend surface for the FilterController endpoints.
 */
export function useTransactionSearch<T>(kind: 'expence' | 'income') {
  const [page, setPage] = useState(0);
  const [filters, setFiltersState] = useState<TransactionFilters>(emptyTransactionFilters);
  const [data, setData] = useState<PagedResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);

  const isFiltered = !!(filters.keyword || filters.startDate || filters.endDate || filters.tag);
  const basePath = kind === 'expence' ? '/expences' : '/incomes';

  const setFilters = (next: TransactionFilters) => {
    setFiltersState(next);
    setPage(0);
  };

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const sort = `${filters.sortField},${filters.sortOrder}`;
      const res = isFiltered
        ? await api.post(`/filter/paged`, {
          type: kind,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          keyword: filters.keyword || undefined,
          tag: filters.tag || undefined,
          sortField: filters.sortField,
          sortOrder: filters.sortOrder,
        }, { params: { page, size: PAGE_SIZE, sort } })
        : await api.get(`${basePath}/paged`, { params: { page, size: PAGE_SIZE, sort } });
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to load ${kind === 'expence' ? 'expenses' : 'incomes'}`));
    } finally {
      setLoading(false);
    }
  }, [page, filters, kind, basePath, isFiltered]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  return { page, setPage, filters, setFilters, isFiltered, data, loading, refetch: fetchPage };
}
