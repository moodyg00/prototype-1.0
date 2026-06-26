'use client';

import {
  Check,
  Zap,
  Boxes,
  BadgeCheck,
  Hourglass,
  type LucideIcon,
} from 'lucide-react';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

type Plan = {
  value: string;
  label: string;
  desc: string;
  icon: LucideIcon;
};

// @mock-start
const MOCK_PLANS: Plan[] = [
  {
    value: 'starter',
    label: 'Starter',
    desc: 'Up to 3 seats — for solo operators just getting started.',
    icon: Hourglass,
  },
  {
    value: 'team',
    label: 'Team',
    desc: 'Unlimited seats with role-based access and shared workflows.',
    icon: Boxes,
  },
  {
    value: 'business',
    label: 'Business',
    desc: 'Adds SSO, audit log, and priority agent compute pool.',
    icon: BadgeCheck,
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    desc: 'Dedicated environment, custom SLAs, and named architect.',
    icon: Zap,
  },
];
const MOCK_DEFAULT_PLAN = 'team';
// @mock-end

export interface SelectRichItemsProps {
  plans?: ReadonlyArray<Plan>;
  defaultPlan?: string;
}

export function SelectRichItems({
  plans = MOCK_PLANS,
  defaultPlan = MOCK_DEFAULT_PLAN,
}: SelectRichItemsProps = {}) {
  return (
    <div className="grid gap-8 px-8 py-10 md:grid-cols-2">
      <Field>
        <FieldLabel>Plan</FieldLabel>
        <Select defaultValue={defaultPlan}>
          <SelectTrigger className="min-h-12">
            <SelectValue>
              {(value) => {
                const plan = plans.find((p) => p.value === value);
                if (!plan) return 'Pick a plan';
                const Icon = plan.icon;
                return (
                  <span className="flex items-center gap-3">
                    <span
                      className="grid size-7 place-items-center rounded-md"
                      style={{
                        background: 'var(--primary-soft)',
                        color: 'var(--primary)',
                      }}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="font-medium">{plan.label}</span>
                      <span
                        className="text-[11px]"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {plan.desc}
                      </span>
                    </span>
                  </span>
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <SelectItem key={plan.value} value={plan.value} className="min-h-14 py-2">
                  <span className="flex items-start gap-3">
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-md"
                      style={{
                        background: 'var(--primary-soft)',
                        color: 'var(--primary)',
                      }}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="font-medium">{plan.label}</span>
                      <span
                        className="text-[11px]"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {plan.desc}
                      </span>
                    </span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectPopup>
        </Select>
        <FieldDescription>
          Trigger expands vertically to show the rich label + description.
        </FieldDescription>
      </Field>

      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Open-state preview
        </div>
        <div
          className="relative flex flex-col gap-0.5 rounded-lg border bg-popover not-dark:bg-clip-padding p-1 shadow-lg/5"
          style={{ borderColor: 'var(--border)' }}
        >
          {plans.map((plan) => {
            const active = plan.value === defaultPlan;
            const Icon = plan.icon;
            return (
              <div
                key={plan.value}
                className="grid grid-cols-[1rem_1fr] items-start gap-2 rounded-sm px-2 py-2 text-sm"
                style={{
                  background: active ? 'var(--muted)' : undefined,
                }}
              >
                <span className="col-start-1 mt-1">
                  {active && <Check className="size-3.5" />}
                </span>
                <span className="col-start-2 flex items-start gap-3">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-md"
                    style={{
                      background: 'var(--primary-soft)',
                      color: 'var(--primary)',
                    }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">{plan.label}</span>
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {plan.desc}
                    </span>
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
