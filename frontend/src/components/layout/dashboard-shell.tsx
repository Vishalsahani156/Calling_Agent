'use client';

import { useState } from 'react';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 shrink-0 lg:block">
        <AppSidebar className="fixed inset-y-0 left-0 z-30 w-64" />
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <AppSidebar
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transition-transform lg:hidden',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <AppHeader onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
