import { useEffect, useState } from 'react';
import { Plus, Search, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionCard } from '@/components/shared/TransactionCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { IconPicker } from '@/components/shared/IconPicker';
import { ReceiptUpload } from '@/components/shared/ReceiptUpload';
import { PageControls } from '@/components/shared/PageControls';
import { TransactionFilterBar } from '@/components/shared/TransactionFilterBar';
import { useTransactionSearch } from '@/hooks/useTransactionSearch';
import { useOpenOnQueryParam } from '@/hooks/useOpenOnQueryParam';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/constants';
import type { Expense, Category, Account } from '@/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

function AllExpensesTab({
  onDelete, onSettleSplit, settlingSplitId,
}: {
  onDelete: (id: number) => void;
  onSettleSplit: (expenseId: number, splitId: number) => void;
  settlingSplitId: number | null;
}) {
  const { setPage, filters, setFilters, isFiltered, data, loading } = useTransactionSearch<Expense>('expence');

  return (
    <div className="space-y-4">
      <TransactionFilterBar filters={filters} onChange={setFilters} />
      {loading ? <LoadingSpinner /> : (
        <>
          <Card>
            <CardContent className="p-2">
              {data && data.content.length > 0 ? (
                data.content.map((e) => (
                  <TransactionCard
                    key={e.id}
                    icon={e.icon}
                    name={e.name}
                    category={e.categoryName}
                    amount={e.amount}
                    date={e.date}
                    type="EXPENSE"
                    attachmentUrl={e.attachmentUrl}
                    tags={e.tags}
                    splits={e.splits}
                    settlingSplitId={settlingSplitId}
                    onDelete={() => onDelete(e.id)}
                    onSettleSplit={(splitId) => onSettleSplit(e.id, splitId)}
                  />
                ))
              ) : (
                <EmptyState
                  title="No expenses found"
                  description={isFiltered ? 'Try adjusting your filters.' : 'Nothing here yet.'}
                />
              )}
            </CardContent>
          </Card>
          {data && (
            <PageControls
              currentPage={data.currentPage}
              totalPages={data.totalPages}
              hasNext={data.hasNext}
              hasPrevious={data.hasPrevious}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [allTabKey, setAllTabKey] = useState(0);

  const [form, setForm] = useState<{ name: string; amount: string; categoryId: string; icon: string; date: string; attachmentUrl: string | null; tags: string; accountId: string }>({ name: '', amount: '', categoryId: '', icon: '🛒', date: new Date().toISOString().split('T')[0], attachmentUrl: null, tags: '', accountId: '' });
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitRows, setSplitRows] = useState<{ name: string; amount: string }[]>([{ name: '', amount: '' }]);
  const [settlingSplitId, setSettlingSplitId] = useState<number | null>(null);

  useOpenOnQueryParam(() => setOpen(true));

  const fetchData = async () => {
    try {
      const [expRes, catRes, accRes] = await Promise.all([
        api.get('/expences').catch(() => ({ data: [] })),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/api/accounts').catch(() => ({ data: [] })),
      ]);
      setExpenses(expRes.data || []);
      const expenseCategories = (catRes.data || []).filter((c: Category) => c.type === 'EXPENSE');
      setCategories(expenseCategories);
      setAccounts(accRes.data || []);
    } catch (err) {
      console.error('FetchData error:', err);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.amount || !form.categoryId) {
      toast.error('Please fill all required fields');
      return;
    }
    const amount = parseFloat(form.amount);
    const splits = splitEnabled
      ? splitRows.filter((r) => r.name.trim() && r.amount).map((r) => ({ participantName: r.name.trim(), shareAmount: parseFloat(r.amount) }))
      : [];
    if (splitEnabled) {
      const splitTotal = splits.reduce((sum, s) => sum + s.shareAmount, 0);
      if (splits.length === 0) { toast.error('Add at least one split participant'); return; }
      if (splitTotal > amount) { toast.error('Split amounts add up to more than the total expense'); return; }
    }
    setSaving(true);
    try {
      await api.post('/expences', {
        name: form.name,
        amount,
        categoryId: parseInt(form.categoryId),
        icon: form.icon,
        date: form.date,
        attachmentUrl: form.attachmentUrl,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        accountId: form.accountId ? parseInt(form.accountId) : null,
        splits,
      });
      toast.success('Expense added!');
      setOpen(false);
      setForm({ name: '', amount: '', categoryId: '', icon: '🛒', date: new Date().toISOString().split('T')[0], attachmentUrl: null, tags: '', accountId: '' });
      setSplitEnabled(false);
      setSplitRows([{ name: '', amount: '' }]);
      fetchData();
      setAllTabKey((k) => k + 1); // force "All Transactions" tab to refetch page 0
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add expense'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/expences/${id}`);
      toast.success('Expense deleted');
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setAllTabKey((k) => k + 1);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSettleSplit = async (expenseId: number, splitId: number) => {
    setSettlingSplitId(splitId);
    try {
      await api.patch(`/expences/${expenseId}/splits/${splitId}/settle`);
      toast.success('Marked as settled');
      setExpenses((prev) => prev.map((e) => (
        e.id === expenseId
          ? { ...e, splits: e.splits?.map((s) => (s.id === splitId ? { ...s, isSettled: true } : s)) }
          : e
      )));
      setAllTabKey((k) => k + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to settle'));
    } finally {
      setSettlingSplitId(null);
    }
  };

  const filtered = expenses.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Expenses</h2>
          <p className="text-sm text-muted-foreground">This month: {formatCurrency(total)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input placeholder="Groceries" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" placeholder="500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                {categories.length === 0 ? (
                  <div className="p-3 bg-muted/50 rounded-lg border border-dashed border-border">
                    <p className="text-sm text-muted-foreground mb-2">No expense categories found.</p>
                    <Button variant="outline" size="sm" onClick={() => { setOpen(false); window.location.href = '/categories'; }}>
                      Create Category First
                    </Button>
                  </div>
                ) : (
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Icon</Label>
                <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
              </div>
              <div>
                <Label>Receipt (optional)</Label>
                <ReceiptUpload value={form.attachmentUrl} onChange={(attachmentUrl) => setForm({ ...form, attachmentUrl })} />
              </div>
              <div>
                <Label>Tags (optional, comma-separated)</Label>
                <Input placeholder="work trip, reimbursable" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>
              {accounts.length > 0 && (
                <div>
                  <Label>Account (optional)</Label>
                  <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.icon} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="mb-0">Split this expense</Label>
                  <p className="text-xs text-muted-foreground">Track who owes you their share</p>
                </div>
                <Switch checked={splitEnabled} onCheckedChange={setSplitEnabled} />
              </div>
              {splitEnabled && (
                <div className="space-y-2">
                  {splitRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Name"
                        value={row.name}
                        onChange={(e) => setSplitRows((rows) => rows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))}
                      />
                      <Input
                        type="number"
                        placeholder="Amount"
                        className="w-28"
                        value={row.amount}
                        onChange={(e) => setSplitRows((rows) => rows.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r)))}
                      />
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-expense"
                        onClick={() => setSplitRows((rows) => rows.filter((_, i) => i !== idx))}
                        disabled={splitRows.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setSplitRows((rows) => [...rows, { name: '', amount: '' }])}>
                    + Add Participant
                  </Button>
                </div>
              )}
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Card>
            <CardContent className="p-2">
              {filtered.length > 0 ? (
                filtered.map((e) => (
                  <TransactionCard
                    key={e.id}
                    icon={e.icon}
                    name={e.name}
                    category={e.categoryName}
                    amount={e.amount}
                    date={e.date}
                    type="EXPENSE"
                    attachmentUrl={e.attachmentUrl}
                    tags={e.tags}
                    splits={e.splits}
                    settlingSplitId={settlingSplitId}
                    onDelete={() => handleDelete(e.id)}
                    onSettleSplit={(splitId) => handleSettleSplit(e.id, splitId)}
                  />
                ))
              ) : (
                <EmptyState title="No expenses" description="Add your first expense to start tracking your spending." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <AllExpensesTab key={allTabKey} onDelete={handleDelete} onSettleSplit={handleSettleSplit} settlingSplitId={settlingSplitId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
