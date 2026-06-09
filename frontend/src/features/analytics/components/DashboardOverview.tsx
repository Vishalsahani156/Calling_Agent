'use client';

import Link from 'next/link';
import { ArrowRight, Bot, BookOpen, Contact, Phone, Radio, Settings, Users } from 'lucide-react';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyticsOverview } from '@/features/analytics/hooks/useAnalyticsOverview';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/lib/auth';

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: `${string}:${string}`;
}

const quickLinks: QuickLink[] = [
  {
    title: 'AI Agents',
    description: 'Configure voice agents and test conversations.',
    href: '/agents',
    icon: Bot,
    permission: 'agents:read',
  },
  {
    title: 'Contacts',
    description: 'Import and manage your contact lists.',
    href: '/contacts',
    icon: Contact,
    permission: 'contacts:read',
  },
  {
    title: 'Knowledge Bases',
    description: 'Upload documents and FAQs for agents.',
    href: '/knowledge',
    icon: BookOpen,
    permission: 'knowledge:read',
  },
  {
    title: 'Team Users',
    description: 'Invite teammates and manage roles.',
    href: '/users',
    icon: Users,
    permission: 'users:read',
  },
  {
    title: 'Settings',
    description: 'Telephony, notifications, and preferences.',
    href: '/settings',
    icon: Settings,
    permission: 'settings:read',
  },
];

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function OverviewStats() {
  const { data, isLoading, isError } = useAnalyticsOverview();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview stats unavailable</CardTitle>
          <CardDescription>
            Analytics data could not be loaded. You can still use the navigation to manage your
            workspace.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Total Calls',
      value: data.calls.total.toLocaleString(),
      description: `${data.calls.today.toLocaleString()} today`,
      icon: Phone,
    },
    {
      title: 'Live Calls',
      value: data.calls.live.toLocaleString(),
      description: 'Currently in progress',
      icon: Radio,
    },
    {
      title: 'Campaigns',
      value: data.campaigns.total.toLocaleString(),
      description: `${data.campaigns.running.toLocaleString()} running`,
      icon: ArrowRight,
    },
    {
      title: 'Completion Rate',
      value: formatPercent(data.calls.completionRate),
      description: `${data.calls.completed.toLocaleString()} completed`,
      icon: ArrowRight,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function DashboardOverview() {
  const { user, isLoading } = useAuth();

  const visibleLinks = quickLinks.filter((link) =>
    user ? hasPermission(user.permissions, link.permission) : false,
  );

  const greetingName = user?.firstName?.trim() || user?.email || 'there';

  return (
    <div className="space-y-8">
      <div>
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {greetingName}</h1>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor call activity and manage your AI voice calling workspace.
        </p>
      </div>

      <PermissionGuard
        permission="analytics:read"
        fallback={null}
        loading={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <OverviewStats />
      </PermissionGuard>

      {visibleLinks.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Quick actions</h2>
            <p className="text-sm text-muted-foreground">
              Jump into the features available in your workspace.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Card key={link.href} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <CardTitle className="text-base">{link.title}</CardTitle>
                    </div>
                    <CardDescription>{link.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Button asChild variant="outline" size="sm">
                      <Link href={link.href}>
                        Open
                        <ArrowRight />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
