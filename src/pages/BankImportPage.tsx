import { useEffect, useState, useRef } from 'react';
import { Upload, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { BANK_OPTIONS, formatCurrency, formatDate } from '@/lib/constants';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import type { BankTransaction, ImportUsage, Category } from '@/types';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function BankImportPage() {
  const { isPremiumFeatureAllowed } = useStore();
  const canImport = isPremiumFeatureAllowed('csv-import');
  const [bank, setBank] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [usage, setUsage] = useState<ImportUsage | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/bank/transactions/unconverted').catch(() => ({ data: [] })),
      api.get('/api/bank/import-usage').catch(() => ({ data: null })),
      api.get('/categories').catch(() => ({ data: [] })),
    ]).then(([txRes, usageRes, catRes]) => {
      setTransactions(txRes.data || []);
      setUsage(usageRes.data);
      setCategories(catRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleImport = async () => {
    if (!bank || !file) { toast.error('Select bank and file'); return; }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/api/bank/import?bankName=${bank}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Handle response - check if success
      if (res.data.success) {
        toast.success(res.data.message || `Imported ${res.data.totalImported || 0} transactions`);
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
        // Refresh unconverted transactions
        const txRes = await api.get('/api/bank/transactions/unconverted');
        setTransactions(txRes.data || []);
        // Refresh usage
        const usageRes = await api.get('/api/bank/import-usage');
        setUsage(usageRes.data);
      } else {
        toast.error(res.data.message || 'No valid transactions found in the CSV file');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    }
    finally { setImporting(false); }
  };

  const handleCategorize = async (txId: number, categoryId: number) => {
    try {
      await api.post(`/api/bank/transactions/${txId}/categorize?categoryId=${categoryId}`);
      toast.success('Transaction converted and added to your records!');
      setTransactions((p) => p.filter((t) => t.id !== txId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to categorize');
    }
  };

  const handleDeleteTransaction = async (txId: number) => {
    setDeletingId(txId);
    try {
      await api.delete(`/api/bank/transactions/${txId}`);
      toast.success('Transaction deleted');
      setTransactions((p) => p.filter((t) => t.id !== txId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllUnconverted = async () => {
    setDeletingAll(true);
    try {
      const res = await api.delete('/api/bank/transactions/unconverted');
      toast.success(res.data.message || `Deleted ${res.data.deletedCount} transactions`);
      setTransactions([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingAll(false);
      setDeleteAllDialogOpen(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!canImport) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-display font-bold text-foreground mb-2">Bank Import</h2>
        <p className="text-muted-foreground mb-4">Upgrade to Basic or Premium to import bank statements.</p>
        <Button onClick={() => window.location.href = '/subscription'}>Upgrade Plan</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Bank Import</h2>

      {usage && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">CSV Imports: {usage.used}/{usage.limit} used</p>
              <p className="text-xs text-muted-foreground">{usage.remaining} remaining</p>
            </div>
            <Progress value={(usage.used / usage.limit) * 100} className="w-32 h-2" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="font-display">Import Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Step 1: Select Your Bank</p>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger><SelectValue placeholder="Choose bank" /></SelectTrigger>
              <SelectContent>
                {BANK_OPTIONS.map((b) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Step 2: Upload CSV</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{file ? file.name : 'Click to browse or drag & drop'}</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={handleImport} disabled={importing || !bank || !file} className="w-full">
            {importing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Import Transactions
          </Button>
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Unconverted Transactions ({transactions.length})</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteAllDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete All
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              Select a category to convert transactions to expenses or incomes. DEBIT transactions become expenses, CREDIT transactions become incomes.
            </p>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.transactionDate)} · {tx.merchantName || tx.bankName}
                      <Badge variant={tx.type === 'CREDIT' ? 'default' : 'secondary'} className="ml-2 text-xs">
                        {tx.type}
                      </Badge>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold whitespace-nowrap ${tx.type === 'CREDIT' ? 'text-income' : 'text-expense'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </span>
                    <Select onValueChange={(v) => handleCategorize(tx.id, parseInt(v))}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue placeholder={tx.suggestedCategory || 'Categorize'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive p-1 h-8 w-8"
                      onClick={() => handleDeleteTransaction(tx.id)}
                      disabled={deletingId === tx.id}
                    >
                      {deletingId === tx.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete All Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete All Unconverted Transactions
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all {transactions.length} unconverted transactions?
              This action cannot be undone. Transactions that have already been converted to
              expenses/incomes will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteAllDialogOpen(false)} disabled={deletingAll}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllUnconverted} disabled={deletingAll}>
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
