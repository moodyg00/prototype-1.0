import { Mail } from 'lucide-react';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

// @mock-start
// @mock-end

export interface InputSizesMatrixProps {}

export function InputSizesMatrix(_props: InputSizesMatrixProps = {}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Plain inputs
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel>Small (sm)</FieldLabel>
            <Input size="sm" placeholder="Compact density" />
            <FieldDescription>32px tall — fits dense filter rows.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Default</FieldLabel>
            <Input placeholder="Standard density" />
            <FieldDescription>The default — used everywhere.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Large (lg)</FieldLabel>
            <Input size="lg" placeholder="Comfortable density" />
            <FieldDescription>Extra room — auth forms and CTAs.</FieldDescription>
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          With leading icon (input-group sizes match)
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel>Small</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Mail />
              </InputGroupAddon>
              <InputGroupInput size="sm" placeholder="email@vertexlabs.com" />
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel>Default</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Mail />
              </InputGroupAddon>
              <InputGroupInput placeholder="email@vertexlabs.com" />
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel>Large</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Mail />
              </InputGroupAddon>
              <InputGroupInput size="lg" placeholder="email@vertexlabs.com" />
            </InputGroup>
          </Field>
        </div>
      </div>
    </div>
  );
}
