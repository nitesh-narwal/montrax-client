import { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BudgetProgressCard } from '@/components/shared/BudgetProgressCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import api from '@/lib/api';
import type { BudgetGoal, Category } from '@/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useOpenOnQueryParam } from '@/hooks/useOpenOnQueryParam';

const emptyForm = { categoryId: '', amount: '', alertThreshold: '80', isRecurring: false };

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const [bRes, cRes] = await Promise.all([api.get('/api/budgets'), api.get('/categories')]);
      setBudgets(bRes.data || []);
      setCategories((cRes.data || []).filter((c: Category) => c.type === 'EXPENSE'));
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  useOpenOnQueryParam(openCreateDialog);

  const openEditDialog = (budget: BudgetGoal) => {
    setEditingId(budget.id);
    setForm({
      categoryId: budget.categoryId ? String(budget.categoryId) : '',
      amount: String(budget.budgetAmount),
      alertThreshold: String(budget.alertThreshold),
      isRecurring: budget.isRecurring,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.amount) { toast.error('Amount is required'); return; }
    setSaving(true);
    try {
      // POST both creates and updates (upsert keyed by categoryId + month/year)
      await api.post('/api/budgets', {
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        amount: parseFloat(form.amount),
        alertThreshold: parseInt(form.alertThreshold),
        isRecurring: form.isRecurring,
      });
      toast.success(editingId ? 'Budget updated!' : 'Budget created!');
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
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
          <DialogTrigger asChild><Button className="gap-2" onClick={openCreateDialog}><Plus className="w-4 h-4" /> Add Budget</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editingId ? 'Edit' : 'Add'} Budget Goal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category (leave empty for Overall)</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })} disabled={!!editingId}>
                  <SelectTrigger><SelectValue placeholder="Overall Budget" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Amount (₹)</Label><Input type="number" placeholder="10000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Alert Threshold (%)</Label><Input type="number" placeholder="80" value={form.alertThreshold} onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })} /></div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="mb-0">Recurring</Label>
                  <p className="text-xs text-muted-foreground">Auto-copy this budget to next month</p>
                </div>
                <Switch checked={form.isRecurring} onCheckedChange={(v) => setForm({ ...form, isRecurring: v })} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? 'Save Changes' : 'Create Budget'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <BudgetProgressCard key={b.id} {...b} onDelete={() => handleDelete(b.id)} onEdit={() => openEditDialog(b)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No budgets set" description="Create budget goals to track your spending limits." />
      )}
    </div>
  );
}
