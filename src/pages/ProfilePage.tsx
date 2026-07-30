import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogOut, Mail, Calendar, Camera, Trash2, Loader2, AlertTriangle, XCircle, Phone, ShieldCheck, Shield, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/constants';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

interface DeletionStatus {
  isPendingDeletion: boolean;
  deletionRequestedAt?: string;
  scheduledDeletionAt?: string;
  hoursRemaining?: number;
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [notificationTime, setNotificationTime] = useState(user?.notificationTime ? user.notificationTime.slice(0, 5) : '');
  const [savingTime, setSavingTime] = useState(false);

  const initials = user?.fullname?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';

  // Check deletion status on load
  useEffect(() => {
    checkDeletionStatus();
  }, []);

  const checkDeletionStatus = async () => {
    try {
      const res = await api.get('/api/account/deletion-status');
      setDeletionStatus(res.data);
    } catch (err) {
      console.error('Failed to check deletion status:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Update user in store with new image URL
      if (user && res.data.profileImageUrl) {
        updateUser({ ...user, profileImageUrl: res.data.profileImageUrl });
      }
      toast.success('Profile image updated!');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(getErrorMessage(err, 'Failed to upload image'));
    } finally {
      setUploading(false);
    }
  };

  const handleRequestDeletion = async () => {
    setDeleting(true);
    try {
      const res = await api.post('/api/account/delete-request');
      if (res.data.success) {
        toast.success('Account deletion scheduled. You have 3 days to cancel by logging in again.');
        setDeletionStatus({
          isPendingDeletion: true,
          deletionRequestedAt: res.data.deletionRequestedAt,
          scheduledDeletionAt: res.data.scheduledDeletionAt,
          hoursRemaining: 72
        });
      } else {
        toast.error(res.data.message || 'Failed to request deletion');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      toast.error(getErrorMessage(err, 'Failed to request deletion'));
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelling(true);
    try {
      const res = await api.post('/api/account/cancel-deletion');
      if (res.data.success) {
        toast.success('Account deletion cancelled. Your account is safe.');
        setDeletionStatus({ isPendingDeletion: false });
      } else {
        toast.error(res.data.message || 'Failed to cancel deletion');
      }
    } catch (err) {
      console.error('Cancel deletion error:', err);
      toast.error(getErrorMessage(err, 'Failed to cancel deletion'));
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveNotificationTime = async () => {
    setSavingTime(true);
    try {
      const res = await api.put('/profile/notification-time', { time: notificationTime || null });
      if (user) {
        updateUser({ ...user, notificationTime: res.data.notificationTime });
      }
      toast.success(notificationTime ? 'Notification time saved!' : 'Reset to default times');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save notification time'));
    } finally {
      setSavingTime(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Profile</h2>

      {/* Pending Deletion Alert */}
      {deletionStatus?.isPendingDeletion && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Account Deletion Scheduled</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Your account is scheduled for permanent deletion on{' '}
              <strong>{deletionStatus.scheduledDeletionAt ? formatDate(deletionStatus.scheduledDeletionAt) : 'soon'}</strong>.
            </p>
            <p className="text-sm">
              {deletionStatus.hoursRemaining !== undefined && deletionStatus.hoursRemaining > 0
                ? `${deletionStatus.hoursRemaining} hours remaining to cancel.`
                : 'Deletion imminent.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 bg-white hover:bg-gray-100 text-destructive"
              onClick={handleCancelDeletion}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Cancel Deletion
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6 text-center">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              {user?.profileImageUrl ? (
                <AvatarImage src={user.profileImageUrl} alt={user.fullname} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-display font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-3 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground">{user?.fullname || 'User'}</h3>
          <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
            {user?.role === 'ADMIN' && (
              <Badge variant="secondary" className="gap-1"><Shield className="w-3 h-3" />Admin</Badge>
            )}
            {user?.authProvider === 'GOOGLE' && (
              <Badge variant="outline">Signed in with Google</Badge>
            )}
            {deletionStatus?.isPendingDeletion && (
              <Badge variant="destructive">Pending Deletion</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Account Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user?.email || 'N/A'}</p>
            </div>
          </div>
          {user?.phoneNumber && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="text-sm font-medium text-foreground">{user.phoneNumber}</p>
                </div>
                {user.isPhoneVerified && (
                  <Badge variant="outline" className="gap-1 text-income border-income/30"><ShieldCheck className="w-3 h-3" />Verified</Badge>
                )}
              </div>
            </>
          )}
          <Separator />
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium text-foreground">{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display flex items-center gap-2"><BellRing className="w-5 h-5" /> Notification Time</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose when you'd like to receive budget alert and bill reminder emails.
            Leave blank to use the defaults (bill reminders 9:00 AM, budget alerts 9:00 PM).
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveNotificationTime} disabled={savingTime}>
              {savingTime ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
          {notificationTime && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setNotificationTime(''); }}>
              Clear (use defaults)
            </Button>
          )}
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="w-4 h-4" /> Logout
      </Button>

      {/* Delete Account Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="font-display text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Request account deletion. You'll have <strong>3 days</strong> to change your mind.
            Simply log in again to cancel the deletion.
          </p>
          {deletionStatus?.isPendingDeletion ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCancelDeletion}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancel Account Deletion
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" /> Request Account Deletion
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>Are you sure you want to delete your account?</p>
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                <li>Your account will be scheduled for deletion in <strong>3 days</strong></li>
                <li>You can cancel by logging in again within this period</li>
                <li>After 3 days, all your data will be permanently deleted</li>
                <li>This includes expenses, incomes, categories, budgets, and AI insights</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRequestDeletion} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, Schedule Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
