'use client';

import { ShieldAlert } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PermissionDenied({
  title = 'Access denied',
  description = 'You do not have permission to view this page.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Contact your organization administrator if you need access.
        </p>
      </CardContent>
    </Card>
  );
}
