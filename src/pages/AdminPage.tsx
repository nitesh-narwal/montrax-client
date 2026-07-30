import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageControls } from '@/components/shared/PageControls';
import {
  Shield, Search, Users, Activity, Settings2, RefreshCw, Loader2,
  UserCheck, PhoneCall, ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import { formatDate } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';
import type { AdminUserSummary, AdminStats, AdminConfigItem, PagedResponse } from '@/types';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

function UsersTab() {
  const { user: currentUser } = useStore();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [data, setData] = useState<PagedResponse<AdminUserSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [debouncedSearch]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users', {
        params: { page, size: PAGE_SIZE, search: debouncedSearch || undefined },
      });
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (id: number, role: 'USER' | 'ADMIN') => {
    setUpdatingId(id);
    try {
      await api.put(`/api/admin/users/${id}/role`, { role });
      toast.success('Role updated');
      setData((prev) => prev ? {
        ...prev,
        content: prev.content.map((u) => (u.id === id ? { ...u, role } : u)),
      } : prev);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update role'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8"><LoadingSpinner /></div>
          ) : !data || data.content.length === 0 ? (
            <div className="p-8"><EmptyState title="No users found" description="Try a different search term." /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{u.fullname}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Badge variant={u.isActive ? 'default' : 'secondary'} className="text-xs">
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {u.isPhoneVerified && (
                          <Badge variant="outline" className="text-xs gap-1"><PhoneCall className="w-3 h-3" />Verified</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={u.role}
                        disabled={updatingId === u.id || u.id === currentUser?.id}
                        onValueChange={(v) => handleRoleChange(u.id, v as 'USER' | 'ADMIN')}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs ml-auto">
                          {updatingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load stats')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <EmptyState title="No stats available" description="Could not load system statistics." />;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Active Users', value: stats.activeUsers, icon: UserCheck },
    { label: 'Phone Verified', value: stats.phoneVerifiedUsers, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-display font-bold text-foreground">{c.value ?? 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.usersByRole && (
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Users by Role</CardTitle></CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <Badge key={role} variant="secondary" className="text-sm px-3 py-1">
                {role}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConfigTab() {
  const [items, setItems] = useState<AdminConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/config');
      setItems(res.data || []);
      setDrafts(Object.fromEntries((res.data || []).map((i: AdminConfigItem) => [i.key, i.value])));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load config'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      await api.put(`/api/admin/config/${key}`, { value: drafts[key] });
      toast.success(`Updated ${key}`);
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, value: drafts[key] } : i)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update config'));
    } finally {
      setSavingKey(null);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      await api.post('/api/admin/cache/refresh');
      toast.success('Config cache refreshed');
      await fetchConfig();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to refresh cache'));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRefreshCache} disabled={refreshing} className="gap-2">
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Flush Config Cache
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No config entries" description="Server-side runtime config will appear here." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.key}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold text-foreground truncate">{item.key}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={drafts[item.key] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [item.key]: e.target.value }))}
                    className="w-56"
                  />
                  <Button
                    size="sm"
                    disabled={savingKey === item.key || drafts[item.key] === item.value}
                    onClick={() => handleSave(item.key)}
                  >
                    {savingKey === item.key ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useStore();

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Admin</h2>
          <p className="text-sm text-muted-foreground">Manage users, view system stats, and edit runtime config.</p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-4 h-4" />Users</TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5"><Activity className="w-4 h-4" />Stats</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5"><Settings2 className="w-4 h-4" />Config</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        <TabsContent value="stats" className="mt-4"><StatsTab /></TabsContent>
        <TabsContent value="config" className="mt-4"><ConfigTab /></TabsContent>
      </Tabs>
    </div>
  );
}
