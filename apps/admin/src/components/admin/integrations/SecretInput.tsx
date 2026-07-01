'use client';

import * as React from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SecretInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/** Password-style field with show/hide and clipboard copy (browsers block copy from type=password). */
export function SecretInput({ id, value, onChange, placeholder }: SecretInputProps) {
  const [visible, setVisible] = React.useState(false);

  const copy = async () => {
    if (!value.trim()) {
      toast.error('Nothing to copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard.');
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="min-w-0 flex-1 font-mono text-xs"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide secret' : 'Show secret'}
        title={visible ? 'Hide' : 'Show'}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => void copy()}
        aria-label="Copy to clipboard"
        title="Copy"
      >
        <Copy className="size-4" />
      </Button>
    </div>
  );
}
