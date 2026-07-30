import { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SavingsGoalCard } from '@/components/shared/SavingsGoalCard';
import { IconPicker } from '@/components/shared/IconPicker';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import api from '@/lib/api';
import type { SavingsGoal } from '@/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useOpenOnQueryParam } from '@/hooks/useOpenOnQueryParam';

const emptyForm = { name: '', icon: '🎯', targetAmount: '', targetDate: '' };

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [contributeId, setContributeId] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/savings-goals');
      setGoals(res.data || []);
    } catch { toast.error('Failed to load savings goals'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  useOpenOnQueryParam(openCreateDialog);

  const openEditDialog = (goal: SavingsGoal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      icon: goal.icon,
      targetAmount: String(goal.targetAmount),
      targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.targetAmount) { toast.error('Name and target amount are required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        icon: form.icon,
        targetAmount: parseFloat(form.targetAmount),
        targetDate: form.targetDate || null,
      };
      if (editingId) {
        await api.put(`/api/savings-goals/${editingId}`, payload);
      } else {
        await api.post('/api/savings-goals', payload);
      }
      toast.success(editingId ? 'Goal updated!' : 'Goal created!');
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/savings-goals/${id}`);
      toast.success('Deleted');
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const handleContribute = async () => {
    if (!contributeId || !contributeAmount) return;
    setContributing(true);
    try {
      const res = await api.post(`/api/savings-goals/${contributeId}/contribute`, {
        amount: parseFloat(contributeAmount),
      });
      setGoals((prev) => prev.map((g) => (g.id === contributeId ? res.data : g)));
      toast.success('Added to savings goal!');
      setContributeId(null);
      setContributeAmount('');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setContributing(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Savings Goals</h2>
          <p className="text-sm text-muted-foreground">Track progress toward what you're saving for</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2" onClick={openCreateDialog}><Plus className="w-4 h-4" /> Add Goal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editingId ? 'Edit' : 'Add'} Savings Goal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input placeholder="Emergency Fund" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Target Amount (₹)</Label><Input type="number" placeholder="50000" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></div>
              <div><Label>Target Date (optional)</Label><Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></div>
              <div>
                <Label>Icon</Label>
                <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? 'Save Changes' : 'Create Goal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <SavingsGoalCard
              key={g.id}
              name={g.name}
              icon={g.icon}
              targetAmount={g.targetAmount}
              currentAmount={g.currentAmount}
              percentageProgress={g.percentageProgress}
              targetDate={g.targetDate}
              isCompleted={g.isCompleted}
              onDelete={() => handleDelete(g.id)}
              onEdit={() => openEditDialog(g)}
              onContribute={() => setContributeId(g.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No savings goals yet" description="Create a goal to start saving toward something specific." />
      )}

      <Dialog open={contributeId !== null} onOpenChange={(v) => { if (!v) { setContributeId(null); setContributeAmount(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Add Money to Goal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Amount (₹)</Label><Input type="number" placeholder="1000" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} autoFocus /></div>
            <Button onClick={handleContribute} disabled={contributing} className="w-full">
              {contributing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
