'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navItems } from '@/components/layout/nav-items';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ onNavigate, className }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return user ? hasPermission(user.permissions, item.permission) : false;
  });

  return (
    <aside className={cn('flex h-full flex-col border-r bg-card', className)}>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex flex-col" onClick={onNavigate}>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            AI Voice Calling
          </span>
          <span className="text-sm font-semibold tracking-tight">Campaign Platform</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
