'use client';

import * as React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Meter, MeterIndicator, MeterTrack } from '@/components/ui/meter';

type StrengthBucket = {
  label: string;
  ratio: number;
  color: string;
};

function scorePassword(value: string): StrengthBucket {
  if (!value) {
    return {
      label: 'Empty',
      ratio: 0,
      color: 'var(--muted-foreground)',
    };
  }
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) {
    return { label: 'Weak', ratio: 0.25, color: 'var(--destructive)' };
  }
  if (score === 2) {
    return { label: 'Fair', ratio: 0.5, color: 'var(--warning)' };
  }
  if (score === 3) {
    return { label: 'Good', ratio: 0.75, color: 'var(--info)' };
  }
  return { label: 'Strong', ratio: 1, color: 'var(--success)' };
}

// @mock-start
const MOCK_INITIAL_PASSWORD = 'Spring2026';
const MOCK_PASSWORD_LABEL = 'Password';
const MOCK_PASSWORD_PLACEHOLDER = 'At least 12 characters';
const MOCK_STRENGTH_DESCRIPTION = 'Strength updates as you type.';
const MOCK_CONFIRM_LABEL = 'Confirm password';
const MOCK_CONFIRM_PLACEHOLDER = 'Re-enter to confirm';
const MOCK_CONFIRM_DESCRIPTION =
  'Second field shares the visibility toggle for symmetry.';
// @mock-end

export interface InputPasswordStrengthProps {
  initialPassword?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  strengthDescription?: React.ReactNode;
  confirmLabel?: string;
  confirmPlaceholder?: string;
  confirmDescription?: React.ReactNode;
}

export function InputPasswordStrength({
  initialPassword = MOCK_INITIAL_PASSWORD,
  passwordLabel = MOCK_PASSWORD_LABEL,
  passwordPlaceholder = MOCK_PASSWORD_PLACEHOLDER,
  strengthDescription = MOCK_STRENGTH_DESCRIPTION,
  confirmLabel = MOCK_CONFIRM_LABEL,
  confirmPlaceholder = MOCK_CONFIRM_PLACEHOLDER,
  confirmDescription = MOCK_CONFIRM_DESCRIPTION,
}: InputPasswordStrengthProps = {}) {
  const [value, setValue] = React.useState(initialPassword);
  const [visible, setVisible] = React.useState(false);
  const strength = scorePassword(value);

  return (
    <div className="grid gap-6 px-8 py-10 sm:grid-cols-2">
      <Field>
        <FieldLabel>{passwordLabel}</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Lock />
          </InputGroupAddon>
          <InputGroupInput
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={passwordPlaceholder}
          />
          <InputGroupAddon align="inline-end">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              type="button"
            >
              {visible ? <EyeOff /> : <Eye />}
            </Button>
          </InputGroupAddon>
        </InputGroup>

        <Meter value={strength.ratio * 100}>
          <div className="flex items-center justify-between">
            <FieldDescription>
              {strengthDescription}
            </FieldDescription>
            <span
              className="font-medium text-xs"
              style={{ color: strength.color }}
            >
              {strength.label}
            </span>
          </div>
          <MeterTrack className="mt-1.5 h-1.5 rounded-full">
            <MeterIndicator
              className="rounded-full"
              style={{ background: strength.color }}
            />
          </MeterTrack>
        </Meter>
      </Field>

      <Field>
        <FieldLabel>{confirmLabel}</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Lock />
          </InputGroupAddon>
          <InputGroupInput
            type={visible ? 'text' : 'password'}
            placeholder={confirmPlaceholder}
          />
          <InputGroupAddon align="inline-end">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              type="button"
            >
              {visible ? <EyeOff /> : <Eye />}
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          {confirmDescription}
        </FieldDescription>
      </Field>
    </div>
  );
}
