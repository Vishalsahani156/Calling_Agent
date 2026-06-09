'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { Control } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AgentFormValues } from '@/features/agents/schemas';

interface GreetingScriptFieldProps {
  control: Control<AgentFormValues>;
}

export function GreetingScriptField({ control }: GreetingScriptFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'greetingEntries',
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>Greeting script</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ language: '', text: '' })}
        >
          <Plus className="h-4 w-4" />
          Add language
        </Button>
      </div>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 rounded-md border p-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-[120px_1fr]">
              <FormField
                control={control}
                name={`greetingEntries.${index}.language`}
                render={({ field: languageField }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Language</FormLabel>
                    <FormControl>
                      <Input placeholder="en" {...languageField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`greetingEntries.${index}.text`}
                render={({ field: textField }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Greeting</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hello! How can I help you today?"
                        className="min-h-[60px]"
                        {...textField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {fields.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-6 shrink-0"
                onClick={() => remove(index)}
                aria-label="Remove greeting"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
