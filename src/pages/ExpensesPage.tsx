import { useEffect, useState } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionCard } from '@/components/shared/TransactionCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { IconPicker } from '@/components/shared/IconPicker';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/constants';
import type { Expense, Category } from '@/types';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ name: '', amount: '', categoryId: '', icon: '🛒', date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    console.log('=== Fetching Expenses & Categories ===');
    try {
      const [expRes, catRes] = await Promise.all([
        api.get('/expences').catch((err) => {
          console.error('Expenses error:', err.response?.status, err.response?.data);
          return { data: [] };
        }),
        api.get('/categories').catch((err) => {
          console.error('Categories error:', err.response?.status, err.response?.data);
          return { data: [] };
        }),
      ]);
      console.log('Expenses response:', expRes.data);
      console.log('Categories response:', catRes.data);
      setExpenses(expRes.data || []);
      const expenseCategories = (catRes.data || []).filter((c: Category) => c.type === 'EXPENSE');
      console.log('Filtered expense categories:', expenseCategories);
      setCategories(expenseCategories);
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
    setSaving(true);
    try {
      await api.post('/expences', {
        name: form.name,
        amount: parseFloat(form.amount),
        categoryId: parseInt(form.categoryId),
        icon: form.icon,
        date: form.date,
      });
      toast.success('Expense added!');
      setOpen(false);
      setForm({ name: '', amount: '', categoryId: '', icon: '🛒', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/expences/${id}`);
      toast.success('Expense deleted');
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error('Failed to delete');
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
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(total)}</p>
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
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                onDelete={() => handleDelete(e.id)}
              />
            ))
          ) : (
            <EmptyState title="No expenses" description="Add your first expense to start tracking your spending." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
