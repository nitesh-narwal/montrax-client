import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMOJI_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  initialCount?: number;
}

export function IconPicker({ value, onChange, initialCount = 20 }: IconPickerProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displayedIcons = showAll ? EMOJI_OPTIONS : EMOJI_OPTIONS.slice(0, initialCount);
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {displayedIcons.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-xl border transition-all hover:scale-105',
              value === emoji 
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
                : 'border-border hover:bg-muted hover:border-muted-foreground/30'
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {EMOJI_OPTIONS.length > initialCount && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
          ) : (
            <>Show More ({EMOJI_OPTIONS.length - initialCount} more) <ChevronDown className="w-4 h-4 ml-1" /></>
          )}
        </Button>
      )}
    </div>
  );
}
