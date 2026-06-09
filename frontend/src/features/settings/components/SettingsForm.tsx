'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useUpdateSettings } from '@/features/settings/hooks/useUpdateSettings';
import {
  EXOTEL_CONFIG_KEYS,
  FEATURE_FLAG_KEYS,
  NOTIFICATION_PREF_KEYS,
  updateSettingsSchema,
} from '@/features/settings/schemas';
import type { Settings } from '@/features/settings/types';

const settingsFormSchema = z.object({
  defaultCallerId: z.string().max(20).optional(),
  retentionDays: z.coerce.number().int().min(7).max(365),
  exotelConfig: z.object({
    accountSid: z.string().optional(),
    apiKey: z.string().optional(),
    apiToken: z.string().optional(),
    subdomain: z.string().optional(),
  }),
  notificationPrefs: z.record(z.boolean()),
  featureFlags: z.record(z.boolean()),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

function buildBooleanMap(
  source: Record<string, boolean>,
  keys: readonly string[],
): Record<string, boolean> {
  return keys.reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = source[key] ?? false;
    return acc;
  }, {});
}

function buildExotelConfig(source: Record<string, unknown>): SettingsFormValues['exotelConfig'] {
  return EXOTEL_CONFIG_KEYS.reduce<SettingsFormValues['exotelConfig']>((acc, key) => {
    acc[key] = typeof source[key] === 'string' ? source[key] : '';
    return acc;
  }, {} as SettingsFormValues['exotelConfig']);
}

function toFormValues(settings: Settings): SettingsFormValues {
  return {
    defaultCallerId: settings.defaultCallerId ?? '',
    retentionDays: settings.retentionDays,
    exotelConfig: buildExotelConfig(settings.exotelConfig),
    notificationPrefs: buildBooleanMap(settings.notificationPrefs, NOTIFICATION_PREF_KEYS),
    featureFlags: buildBooleanMap(settings.featureFlags, FEATURE_FLAG_KEYS),
  };
}

function toUpdatePayload(values: SettingsFormValues) {
  const exotelConfig = Object.fromEntries(
    Object.entries(values.exotelConfig).filter(([, value]) => value && value.length > 0),
  );

  const payload = {
    defaultCallerId: values.defaultCallerId?.trim() || undefined,
    retentionDays: values.retentionDays,
    exotelConfig: Object.keys(exotelConfig).length > 0 ? exotelConfig : undefined,
    notificationPrefs: values.notificationPrefs,
    featureFlags: values.featureFlags,
  };

  return updateSettingsSchema.parse(payload);
}

const NOTIFICATION_LABELS: Record<(typeof NOTIFICATION_PREF_KEYS)[number], string> = {
  campaignCompleted: 'Campaign completed',
  callFailed: 'Call failed',
  weeklyReport: 'Weekly report',
};

const FEATURE_FLAG_LABELS: Record<(typeof FEATURE_FLAG_KEYS)[number], string> = {
  voiceAgent: 'Voice agent',
  analytics: 'Analytics',
  csvImport: 'CSV import',
};

interface SettingsFormProps {
  canWrite: boolean;
}

export function SettingsForm({ canWrite }: SettingsFormProps) {
  const { data: settings, isLoading, isError } = useSettings();
  const updateMutation = useUpdateSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      defaultCallerId: '',
      retentionDays: 90,
      exotelConfig: buildExotelConfig({}),
      notificationPrefs: buildBooleanMap({}, NOTIFICATION_PREF_KEYS),
      featureFlags: buildBooleanMap({}, FEATURE_FLAG_KEYS),
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(toFormValues(settings));
    }
  }, [settings, form]);

  function onSubmit(values: SettingsFormValues) {
    updateMutation.mutate(toUpdatePayload(values));
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <p className="text-sm text-destructive">Failed to load settings. Please refresh the page.</p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Telephony</h2>
            <p className="text-sm text-muted-foreground">Default caller ID and Exotel integration</p>
          </div>

          <FormField
            control={form.control}
            name="defaultCallerId"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>Default caller ID</FormLabel>
                <FormControl>
                  <Input placeholder="+91XXXXXXXXXX" disabled={!canWrite} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {EXOTEL_CONFIG_KEYS.map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={`exotelConfig.${key}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</FormLabel>
                    <FormControl>
                      <Input
                        type={key.toLowerCase().includes('token') || key.toLowerCase().includes('key') ? 'password' : 'text'}
                        disabled={!canWrite}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Data retention</h2>
            <p className="text-sm text-muted-foreground">How long call records are kept (7–365 days)</p>
          </div>

          <FormField
            control={form.control}
            name="retentionDays"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Retention days</FormLabel>
                <FormControl>
                  <Input type="number" min={7} max={365} disabled={!canWrite} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">Email alerts for your organization</p>
          </div>

          {NOTIFICATION_PREF_KEYS.map((key) => (
            <FormField
              key={key}
              control={form.control}
              name={`notificationPrefs.${key}`}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{NOTIFICATION_LABELS[key]}</FormLabel>
                    <FormDescription>Send email when this event occurs</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canWrite}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Feature flags</h2>
            <p className="text-sm text-muted-foreground">Enable or disable platform features</p>
          </div>

          {FEATURE_FLAG_KEYS.map((key) => (
            <FormField
              key={key}
              control={form.control}
              name={`featureFlags.${key}`}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{FEATURE_FLAG_LABELS[key]}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canWrite}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </section>

        {canWrite ? (
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save settings'
            )}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">You have read-only access to settings.</p>
        )}
      </form>
    </Form>
  );
}
