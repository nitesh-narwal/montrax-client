import { Menu, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { NotificationsMenu } from '@/components/shared/NotificationsMenu';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  onSearchClick: () => void;
}

export function Header({ onMenuClick, title, onSearchClick }: HeaderProps) {
  const { user } = useStore();

  const initials = user?.fullname
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex gap-2 text-muted-foreground w-48 justify-start px-3"
          onClick={onSearchClick}
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search or jump to...</span>
          <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </Button>
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={onSearchClick}>
          <Search className="w-5 h-5" />
        </Button>
        <ThemeToggle />
        <NotificationsMenu />
        <Link to="/profile">
          <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ml-1">
            {user?.profileImageUrl && (
              <AvatarImage
                src={user.profileImageUrl}
                alt={user?.fullname || 'Profile'}
                key={user.profileImageUrl}
              />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
