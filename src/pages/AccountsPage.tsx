import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, Pencil, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { IconPicker } from '@/components/shared/IconPicker';
import { formatCurrency } from '@/lib/constants';
import api from '@/lib/api';
import type { Account, NetWorthSnapshot } from '@/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useOpenOnQueryParam } from '@/hooks/useOpenOnQueryParam';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const ACCOUNT_TYPES = ['BANK', 'CASH', 'WALLET', 'CREDIT_CARD', 'INVESTMENT'] as const;

const emptyForm = { name: '', type: 'BANK' as Account['type'], icon: '🏦', balance: '0' };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [netWorth, setNetWorth] = useState<number>(0);
  const [trend, setTrend] = useState<NetWorthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const [accRes, nwRes, trendRes] = await Promise.all([
        api.get('/api/accounts'),
        api.get('/api/accounts/net-worth'),
        api.get('/api/accounts/net-worth-trend', { params: { months: 6 } }),
      ]);
      setAccounts(accRes.data || []);
      setNetWorth(nwRes.data?.netWorth ?? 0);
      setTrend(trendRes.data || []);
    } catch {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  useOpenOnQueryParam(openCreateDialog);

  const openEditDialog = (account: Account) => {
    setEditingId(account.id);
    setForm({ name: account.name, type: account.type, icon: account.icon, balance: String(account.balance) });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/accounts/${editingId}`, { name: form.name, type: form.type, icon: form.icon });
        toast.success('Updated!');
      } else {
        await api.post('/api/accounts', { name: form.name, type: form.type, icon: form.icon, balance: parseFloat(form.balance) || 0 });
        toast.success('Account created!');
      }
      setOpen(false);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save account'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/accounts/${id}`);
      toast.success('Account deleted');
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete account'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const trendData = {
    labels: trend.map((t) => t.snapshotDate.slice(5)),
    datasets: [{
      label: 'Net Worth',
      data: trend.map((t) => t.totalNetWorth),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">Accounts</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}><Plus className="w-4 h-4" /> Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editingId ? 'Edit' : 'Add'} Account</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input placeholder="HDFC Savings" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Account['type'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (<SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              {!editingId && (
                <div><Label>Starting Balance (₹)</Label><Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
              )}
              <div>
                <Label>Icon</Label>
                <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} initialCount={20} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editingId ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <p className="text-2xl font-display font-bold text-foreground">{formatCurrency(netWorth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-display text-base">Net Worth Trend</CardTitle></CardHeader>
          <CardContent>
            {trend.length > 0 ? (
              <Line data={trendData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : <p className="text-center text-muted-foreground py-8">Snapshots build up daily - check back tomorrow.</p>}
          </CardContent>
        </Card>
      </div>

      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{account.icon || '🏦'}</span>
                    <div>
                      <p className="font-semibold text-foreground">{account.name}</p>
                      <Badge variant="secondary" className="text-xs">{account.type.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(account.balance)}</p>
                <div className="flex justify-end mt-3 gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(account)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-expense"
                    onClick={() => handleDelete(account.id)} disabled={deletingId === account.id} title="Delete"
                  >
                    {deletingId === account.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No accounts yet" description="Add a bank, cash, or wallet account to track net worth." />
      )}
    </div>
  );
}
