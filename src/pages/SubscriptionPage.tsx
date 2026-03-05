import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Check, Crown, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import type { SubscriptionPlan, Subscription, PaymentHistory } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

declare global {
  interface Window { Razorpay: any; }
}

export default function SubscriptionPage() {
  const { subscription, setSubscription } = useStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [current, setCurrent] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [upgrading, setUpgrading] = useState('');
  const [deletingPayment, setDeletingPayment] = useState<number | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const loadData = async () => {
    try {
      const [planRes, curRes, histRes] = await Promise.all([
        api.get('/api/subscription/plans').catch(() => ({ data: [] })),
        api.get('/api/subscription/current').catch(() => ({ data: null })),
        api.get('/api/payments/history').catch(() => ({ data: [] })),
      ]);
      setPlans(planRes.data || []);
      setCurrent(curRes.data);
      if (curRes.data) setSubscription(curRes.data);
      setHistory(histRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planName: string) => {
    setUpgrading(planName);
    try {
      const res = await api.post('/api/payments/create-order', {
        planName,
        billingCycle: yearly ? 'YEARLY' : 'MONTHLY',
      });
      const order = res.data;

      const options = {
        key: order.razorpayKeyId,
        amount: order.amount * 100,
        currency: 'INR',
        name: 'Montrax',
        description: `${order.planName} - ${order.billingCycle}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await api.post('/api/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful! Subscription activated.');
            // Reload all data
            await loadData();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed. Please contact support.');
            // Reload history to show failed status
            await loadData();
          }
        },
        modal: {
          ondismiss: () => {
            // Reload data if user closes the modal
            loadData();
          }
        },
        prefill: {
          email: current?.planName || '',
        },
        theme: {
          color: '#3b82f6',
        },
      };

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        toast.error('Razorpay not loaded. Please refresh and try again.');
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create order'); }
    finally { setUpgrading(''); }
  };

  const handleCancel = async () => {
    try {
      await api.post('/api/subscription/cancel');
      toast.success('Subscription cancelled');
      await loadData();
    } catch { toast.error('Failed to cancel'); }
  };

  const handleDeletePayment = async (id: number) => {
    setDeletingPayment(id);
    try {
      const res = await api.delete(`/api/payments/history/${id}`);
      if (res.data.success) {
        toast.success('Payment record deleted');
        setHistory(history.filter(h => h.id !== id));
      } else {
        toast.error(res.data.message || 'Cannot delete this payment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete payment record');
    } finally {
      setDeletingPayment(null);
    }
  };

  const handleClearAllHistory = async () => {
    setClearingAll(true);
    try {
      const res = await api.delete('/api/payments/history/all');
      if (res.data.success) {
        toast.success(`Cleared ${res.data.deletedCount} payment record(s)`);
        setHistory([]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clear payment history');
    } finally {
      setClearingAll(false);
      setClearAllDialogOpen(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const planFeatures: Record<string, string[]> = {
    FREE: ['5 categories', 'Expense & Income tracking', 'Basic analytics', 'Budget goals'],
    BASIC: ['Unlimited categories', '5 AI queries/month', '3 CSV imports/month', 'Smart predictions', 'Anomaly detection'],
    PREMIUM: ['Everything in Basic', '50 AI queries/month', 'Unlimited CSV imports', 'Savings strategy', 'Financial health score'],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Subscription</h2>

      {current && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-5 h-5 text-warning" />
                  <span className="font-display font-bold text-foreground">{current.planName}</span>
                  <Badge variant={current.status === 'ACTIVE' ? 'default' : 'destructive'}>{current.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{current.daysRemaining} days remaining</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>AI: {current.aiQueriesUsed}/{current.aiQueriesLimit}</span>
                  <span>CSV: {current.csvImportsUsed}/{current.csvImportsLimit}</span>
                </div>
              </div>
              {current.planType !== 'FREE' && (
                <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-3">
        <span className={cn('text-sm', !yearly ? 'text-foreground font-semibold' : 'text-muted-foreground')}>Monthly</span>
        <Switch checked={yearly} onCheckedChange={setYearly} />
        <span className={cn('text-sm', yearly ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
          Yearly <Badge variant="secondary" className="ml-1">Save 17%</Badge>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(plans.length > 0 ? plans : [
          { id: 1, name: 'FREE' as const, description: '', monthlyPrice: 0, yearlyPrice: 0, maxCategories: 5, maxBankImports: 0, aiQueriesPerMonth: 0 },
          { id: 2, name: 'BASIC' as const, description: '', monthlyPrice: 99, yearlyPrice: 999, maxCategories: -1, maxBankImports: 3, aiQueriesPerMonth: 5 },
          { id: 3, name: 'PREMIUM' as const, description: '', monthlyPrice: 299, yearlyPrice: 2999, maxCategories: -1, maxBankImports: -1, aiQueriesPerMonth: 50 },
        ]).map((plan) => {
          const isCurrent = current?.planType === plan.name;
          const isPopular = plan.name === 'BASIC';
          const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
          return (
            <Card key={plan.name} className={cn('relative card-hover', isPopular && 'border-2 border-primary shadow-lg')}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">Popular</div>
              )}
              <CardContent className="p-6">
                <h3 className="text-xl font-display font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 mb-6">
                  <span className="text-3xl font-display font-bold text-foreground">₹{price}</span>
                  <span className="text-muted-foreground">/{yearly ? 'year' : 'month'}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {(planFeatures[plan.name] || []).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-income shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button className="w-full" disabled>Current Plan</Button>
                ) : plan.name === 'FREE' ? (
                  <Button className="w-full" variant="outline" disabled>Free</Button>
                ) : (
                  <Button className="w-full" variant={isPopular ? 'default' : 'outline'} disabled={!!upgrading}
                    onClick={() => handleUpgrade(plan.name)}>
                    {upgrading === plan.name && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Upgrade
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {history.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Payment History</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setClearAllDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(h.amount)}</p>
                      <Badge variant={h.status === 'SUCCESS' ? 'default' : h.status === 'PENDING' ? 'secondary' : 'destructive'}>
                        {h.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</p>
                    {h.razorpayOrderId && (
                      <p className="text-xs text-muted-foreground font-mono">Order: {h.razorpayOrderId}</p>
                    )}
                  </div>
                  {h.status !== 'SUCCESS' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeletePayment(h.id)}
                      disabled={deletingPayment === h.id}
                    >
                      {deletingPayment === h.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clear All Payment History Dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Clear Payment History
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all payment history? This action cannot be undone.
              All payment records will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setClearAllDialogOpen(false)} disabled={clearingAll}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAllHistory} disabled={clearingAll}>
              {clearingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
