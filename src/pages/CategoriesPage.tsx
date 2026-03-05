import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { IconPicker } from '@/components/shared/IconPicker';
import api from '@/lib/api';
import type { Category } from '@/types';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', icon: '🛒', type: 'EXPENSE' as 'EXPENSE' | 'INCOME' });

  const fetchData = async () => {
    console.log('=== Fetching Categories ===');
    try {
      const res = await api.get('/categories');
      console.log('Categories response:', res.data);
      setCategories(res.data || []);
    } catch (err: any) {
      console.error('Categories error:', err.response?.status, err.response?.data);
      toast.error('Failed to load categories');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await api.post('/categories', form);
      toast.success('Category added!');
      setOpen(false);
      setForm({ name: '', icon: '🛒', type: 'EXPENSE' });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (categoryId: number) => {
    setDeleting(categoryId);
    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success('Category deleted!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
    finally { setDeleting(null); }
  };

  const expenseCats = categories.filter((c) => c.type === 'EXPENSE');
  const incomeCats = categories.filter((c) => c.type === 'INCOME');

  if (loading) return <LoadingSpinner />;

  const CategoryGrid = ({ items }: { items: Category[] }) => (
    items.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl p-4 border border-border card-hover flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <p className="font-semibold text-foreground">{cat.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.type === 'EXPENSE' ? 'bg-expense/10 text-expense' : 'bg-income/10 text-income'}`}>
                  {cat.type}
                </span>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-expense"
                  disabled={deleting === cat.id}
                >
                  {deleting === cat.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{cat.name}"? This action cannot be undone.
                    Any transactions using this category may be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(cat.id)}
                    className="bg-expense hover:bg-expense/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    ) : <EmptyState title="No categories" description="Add a category to organize your transactions." />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">Categories</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Add Category</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input placeholder="Food & Dining" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'EXPENSE' | 'INCOME' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Icon</Label>
                <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} initialCount={30} />
              </div>
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Add Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Expense ({expenseCats.length})</TabsTrigger>
          <TabsTrigger value="income">Income ({incomeCats.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="mt-4"><CategoryGrid items={expenseCats} /></TabsContent>
        <TabsContent value="income" className="mt-4"><CategoryGrid items={incomeCats} /></TabsContent>
      </Tabs>
    </div>
  );
}
