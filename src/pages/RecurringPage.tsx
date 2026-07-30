import { useEffect, useState } from 'react';
import { Plus, Loader2, Pause, Play, Trash2, Pencil, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { IconPicker } from '@/components/shared/IconPicker';
import { formatCurrency, formatDate, FREQUENCY_OPTIONS } from '@/lib/constants';
import api from '@/lib/api';
import type { RecurringTransaction, Category } from '@/types';
import { toast } from 'sonner';
import { cn, getErrorMessage } from '@/lib/utils';
import { useOpenOnQueryParam } from '@/hooks/useOpenOnQueryParam';

const emptyForm = {
  name: '', amount: '', type: 'EXPENSE' as 'EXPENSE' | 'INCOME', categoryId: '',
  icon: '🔄', frequency: 'MONTHLY', dayOfPeriod: '1',
  startDate: new Date().toISOString().split('T')[0], endDate: '',
  sendReminder: true, reminderDaysBefore: '1',
};

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const [rRes, cRes] = await Promise.all([api.get('/api/recurring'), api.get('/categories')]);
      setItems(rRes.data || []);
      setCategories(cRes.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  useOpenOnQueryParam(openCreateDialog);

  const openEditDialog = (item: RecurringTransaction) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      amount: String(item.amount),
      type: item.type,
      categoryId: String(item.categoryId),
      icon: item.icon,
      frequency: item.frequency,
      dayOfPeriod: String(item.dayOfPeriod),
      startDate: item.startDate,
      endDate: item.endDate || '',
      sendReminder: item.sendReminder,
      reminderDaysBefore: String(item.reminderDaysBefore ?? 1),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.categoryId) { toast.error('Fill all fields'); return; }
    setSaving(true);
    const payload = {
      ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId),
      dayOfPeriod: parseInt(form.dayOfPeriod), endDate: form.endDate || null,
      reminderDaysBefore: parseInt(form.reminderDaysBefore),
    };
    try {
      if (editingId) {
        await api.put(`/api/recurring/${editingId}`, payload);
        toast.success('Updated!');
      } else {
        await api.post('/api/recurring', payload);
        toast.success('Created!');
      }
      setOpen(false);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (item: RecurringTransaction) => {
    setTogglingId(item.id);
    try {
      await api.put(`/api/recurring/${item.id}`, { isActive: !item.isActive });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
      toast.success(item.isActive ? 'Paused' : 'Resumed');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try { await api.delete(`/api/recurring/${id}`); toast.success('Deleted'); setItems((p) => p.filter((i) => i.id !== id)); }
    catch { toast.error('Failed'); }
    finally { setDeletingId(null); }
  };

  const filteredCats = categories.filter((c) => c.type === form.type);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">Recurring Transactions</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2" onClick={openCreateDialog}><Plus className="w-4 h-4" /> Add Recurring</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editingId ? 'Edit' : 'Add'} Recurring Transaction</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input placeholder="Netflix" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Amount (₹)</Label><Input type="number" placeholder="499" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'EXPENSE' | 'INCOME', categoryId: '' })}>
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
              <div>
                <Label>Icon</Label>
                <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} initialCount={20} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="mb-0">Send Reminder</Label>
                  <p className="text-xs text-muted-foreground">Get notified before this runs</p>
                </div>
                <Switch checked={form.sendReminder} onCheckedChange={(v) => setForm({ ...form, sendReminder: v })} />
              </div>
              {form.sendReminder && (
                <div><Label>Remind Days Before</Label><Input type="number" min="0" max="30" value={form.reminderDaysBefore} onChange={(e) => setForm({ ...form, reminderDaysBefore: e.target.value })} /></div>
              )}
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className={cn('card-hover', !item.isActive && 'opacity-60')}>
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
                  {item.sendReminder ? (
                    <Badge variant="outline" className="gap-1 text-xs"><Bell className="w-3 h-3" />{item.reminderDaysBefore}d before</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-xs text-muted-foreground"><BellOff className="w-3 h-3" />No reminder</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">Next: {formatDate(item.nextExecution)}</span>
                </div>
                <div className="flex justify-end mt-3 gap-1">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleToggleActive(item)} disabled={togglingId === item.id}
                    title={item.isActive ? 'Pause' : 'Resume'}
                  >
                    {togglingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(item)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-expense"
                    onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} title="Delete"
                  >
                    {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
