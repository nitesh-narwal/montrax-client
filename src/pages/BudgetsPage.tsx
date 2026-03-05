import { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BudgetProgressCard } from '@/components/shared/BudgetProgressCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import api from '@/lib/api';
import type { BudgetGoal, Category } from '@/types';
import { toast } from 'sonner';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ categoryId: '', amount: '', alertThreshold: '80', isRecurring: false });

  const fetchData = async () => {
    try {
      const [bRes, cRes] = await Promise.all([api.get('/api/budgets'), api.get('/categories')]);
      setBudgets(bRes.data || []);
      setCategories((cRes.data || []).filter((c: Category) => c.type === 'EXPENSE'));
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.amount) { toast.error('Amount is required'); return; }
    setSaving(true);
    try {
      await api.post('/api/budgets', {
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        amount: parseFloat(form.amount),
        alertThreshold: parseInt(form.alertThreshold),
        isRecurring: form.isRecurring,
      });
      toast.success('Budget created!');
      setOpen(false);
      setForm({ categoryId: '', amount: '', alertThreshold: '80', isRecurring: false });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/api/budgets/${id}`); toast.success('Deleted'); setBudgets((p) => p.filter((b) => b.id !== id)); }
    catch { toast.error('Failed'); }
  };

  const now = new Date();
  const monthYear = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Budget Goals</h2>
          <p className="text-sm text-muted-foreground">{monthYear}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Add Budget</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Add Budget Goal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category (leave empty for Overall)</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Overall Budget" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Amount (₹)</Label><Input type="number" placeholder="10000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Alert Threshold (%)</Label><Input type="number" placeholder="80" value={form.alertThreshold} onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })} /></div>
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <BudgetProgressCard key={b.id} {...b} onDelete={() => handleDelete(b.id)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No budgets set" description="Create budget goals to track your spending limits." />
      )}
    </div>
  );
}
