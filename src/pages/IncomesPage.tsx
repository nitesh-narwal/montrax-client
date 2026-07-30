import { useEffect, useState } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import type { Income, Category } from '@/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

function AllIncomesTab({ onDelete }: { onDelete: (id: number) => void }) {
  const { setPage, filters, setFilters, isFiltered, data, loading } = useTransactionSearch<Income>('income');

  return (
    <div className="space-y-4">
      <TransactionFilterBar filters={filters} onChange={setFilters} />
      {loading ? <LoadingSpinner /> : (
        <>
          <Card>
            <CardContent className="p-2">
              {data && data.content.length > 0 ? (
                data.content.map((i) => (
                  <TransactionCard
                    key={i.id}
                    icon={i.icon}
                    name={i.name}
                    category={i.categoryName}
                    amount={i.amount}
                    date={i.date}
                    type="INCOME"
                    attachmentUrl={i.attachmentUrl}
                    onDelete={() => onDelete(i.id)}
                  />
                ))
              ) : (
                <EmptyState
                  title="No incomes found"
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

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [allTabKey, setAllTabKey] = useState(0);
  const [form, setForm] = useState<{ name: string; amount: string; categoryId: string; icon: string; date: string; attachmentUrl: string | null }>({ name: '', amount: '', categoryId: '', icon: '💰', date: new Date().toISOString().split('T')[0], attachmentUrl: null });

  useOpenOnQueryParam(() => setOpen(true));

  const fetchData = async () => {
    try {
      const [incRes, catRes] = await Promise.all([
        api.get('/incomes').catch(() => ({ data: [] })),
        api.get('/categories').catch(() => ({ data: [] })),
      ]);
      setIncomes(incRes.data || []);
      const incomeCategories = (catRes.data || []).filter((c: Category) => c.type === 'INCOME');
      setCategories(incomeCategories);
    } catch (err) {
      console.error('FetchData error:', err);
      toast.error('Failed to load incomes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.amount || !form.categoryId) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      await api.post('/incomes', { name: form.name, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId), icon: form.icon, date: form.date, attachmentUrl: form.attachmentUrl });
      toast.success('Income added!');
      setOpen(false);
      setForm({ name: '', amount: '', categoryId: '', icon: '💰', date: new Date().toISOString().split('T')[0], attachmentUrl: null });
      fetchData();
      setAllTabKey((k) => k + 1);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/incomes/${id}`);
      toast.success('Deleted');
      setIncomes((p) => p.filter((i) => i.id !== id));
      setAllTabKey((k) => k + 1);
    }
    catch { toast.error('Failed'); }
  };

  const filtered = incomes.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((sum, i) => sum + i.amount, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Incomes</h2>
          <p className="text-sm text-muted-foreground">This month: {formatCurrency(total)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Income</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Add Income</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input placeholder="Salary" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Amount (₹)</Label><Input type="number" placeholder="50000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div>
                <Label>Category</Label>
                {categories.length === 0 ? (
                  <div className="p-3 bg-muted/50 rounded-lg border border-dashed border-border">
                    <p className="text-sm text-muted-foreground mb-2">No income categories found.</p>
                    <Button variant="outline" size="sm" onClick={() => { setOpen(false); window.location.href = '/categories'; }}>
                      Create Category First
                    </Button>
                  </div>
                ) : (
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>))}</SelectContent>
                  </Select>
                )}
              </div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div>
                <Label>Icon</Label>
                <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
              </div>
              <div>
                <Label>Receipt (optional)</Label>
                <ReceiptUpload value={form.attachmentUrl} onChange={(attachmentUrl) => setForm({ ...form, attachmentUrl })} />
              </div>
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Add Income
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
            <Input placeholder="Search incomes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Card><CardContent className="p-2">
            {filtered.length > 0 ? filtered.map((i) => (
              <TransactionCard key={i.id} icon={i.icon} name={i.name} category={i.categoryName} amount={i.amount} date={i.date} type="INCOME" attachmentUrl={i.attachmentUrl} onDelete={() => handleDelete(i.id)} />
            )) : <EmptyState title="No incomes" description="Add your first income to start tracking." />}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <AllIncomesTab key={allTabKey} onDelete={handleDelete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
