import { useRef, useState } from 'react';
import { Paperclip, X, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

interface ReceiptUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

const MAX_SIZE = 10 * 1024 * 1024;

export function ReceiptUpload({ value, onChange }: ReceiptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    const isAllowed = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isAllowed) {
      toast.error('Only images or PDF files are allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('File must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/receipts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.url);
      toast.success('Receipt attached');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload receipt'));
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline min-w-0"
        >
          <Paperclip className="w-4 h-4 shrink-0" />
          <span className="truncate">Receipt attached</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-expense shrink-0"
          onClick={() => onChange(null)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        Attach Receipt
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
