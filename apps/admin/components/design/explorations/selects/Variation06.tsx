'use client';

import { Check } from 'lucide-react';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
};

// @mock-start
const MOCK_PEOPLE: Person[] = [
  { id: 'jd', name: 'Jane Doe', initials: 'JD', role: 'Engineering' },
  { id: 'ms', name: 'Marcus Sato', initials: 'MS', role: 'Operations' },
  { id: 'yc', name: 'Yuki Chen', initials: 'YC', role: 'Design' },
  { id: 'pp', name: 'Priya Patel', initials: 'PP', role: 'Finance' },
  { id: 'al', name: 'Alex Long', initials: 'AL', role: 'Sales' },
];
const MOCK_DEFAULT_PERSON_ID = 'ms';
// @mock-end

export interface SelectAvatarIconProps {
  people?: ReadonlyArray<Person>;
  defaultPersonId?: string;
}

export function SelectAvatarIcon({
  people = MOCK_PEOPLE,
  defaultPersonId = MOCK_DEFAULT_PERSON_ID,
}: SelectAvatarIconProps = {}) {
  return (
    <div className="grid gap-8 px-8 py-10 md:grid-cols-2">
      <Field>
        <FieldLabel>Assignee</FieldLabel>
        <Select defaultValue={defaultPersonId}>
          <SelectTrigger>
            <SelectValue>
              {(value) => {
                const person = people.find((p) => p.id === value);
                if (!person) return 'Pick an assignee';
                return (
                  <span className="flex items-center gap-2">
                    <Avatar className="size-5">
                      <AvatarFallback
                        className="text-[10px]"
                        style={{
                          background: 'var(--primary)',
                          color: 'white',
                        }}
                      >
                        {person.initials}
                      </AvatarFallback>
                    </Avatar>
                    {person.name}
                  </span>
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            {people.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                <span className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback
                      className="text-[10px]"
                      style={{ background: 'var(--primary)', color: 'white' }}
                    >
                      {person.initials}
                    </AvatarFallback>
                  </Avatar>
                  {person.name}
                </span>
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <FieldDescription>
          Avatar appears both in the trigger and inside each option for fast
          recognition.
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
          className="relative rounded-lg border bg-popover not-dark:bg-clip-padding p-1 shadow-lg/5"
          style={{ borderColor: 'var(--border)' }}
        >
          {people.map((person) => {
            const active = person.id === defaultPersonId;
            return (
              <div
                key={person.id}
                className="grid min-h-9 grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1 ps-2 pe-4 text-sm"
                style={{
                  background: active ? 'var(--muted)' : undefined,
                }}
              >
                <span className="col-start-1">
                  {active && <Check className="size-3.5" />}
                </span>
                <span className="col-start-2 flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback
                      className="text-[10px]"
                      style={{ background: 'var(--primary)', color: 'white' }}
                    >
                      {person.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="leading-tight">
                    <span className="block">{person.name}</span>
                    <span
                      className="block text-[11px]"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {person.role}
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
