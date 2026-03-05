import { useEffect, useState } from 'react';
import { Plus, Loader2, Pause, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency, formatDate, FREQUENCY_OPTIONS, EMOJI_OPTIONS } from '@/lib/constants';
import api from '@/lib/api';
import type { RecurringTransaction, Category } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', amount: '', type: 'EXPENSE' as 'EXPENSE' | 'INCOME', categoryId: '',
    icon: '🔄', frequency: 'MONTHLY', dayOfPeriod: '1',
    startDate: new Date().toISOString().split('T')[0], endDate: '',
  });

  const fetchData = async () => {
    try {
      const [rRes, cRes] = await Promise.all([api.get('/api/recurring'), api.get('/categories')]);
      setItems(rRes.data || []);
      setCategories(cRes.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.amount || !form.categoryId) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      await api.post('/api/recurring', {
        ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId),
        dayOfPeriod: parseInt(form.dayOfPeriod), endDate: form.endDate || null,
      });
      toast.success('Created!');
      setOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/api/recurring/${id}`); toast.success('Deleted'); setItems((p) => p.filter((i) => i.id !== id)); }
    catch { toast.error('Failed'); }
  };

  const filteredCats = categories.filter((c) => c.type === form.type);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">Recurring Transactions</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Add Recurring</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">Add Recurring Transaction</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input placeholder="Netflix" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Amount (₹)</Label><Input type="number" placeholder="499" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any, categoryId: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="EXPENSE">Expense</SelectItem><SelectItem value="INCOME">Income</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{filteredCats.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FREQUENCY_OPTIONS.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><Label>Day of Period</Label><Input type="number" min="1" max="31" value={form.dayOfPeriod} onChange={(e) => setForm({ ...form, dayOfPeriod: e.target.value })} /></div>
              <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>End Date (optional)</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                    </div>
                  </div>
                  <span className={cn('text-lg font-bold', item.type === 'INCOME' ? 'text-income' : 'text-expense')}>
                    {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{item.frequency}</Badge>
                  <Badge variant={item.isActive ? 'default' : 'outline'}>
                    {item.isActive ? 'Active' : 'Paused'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Next: {formatDate(item.nextExecution)}</span>
                </div>
                <div className="flex justify-end mt-3 gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-expense" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No recurring transactions" description="Set up automatic expenses or incomes." />
      )}
    </div>
  );
}
