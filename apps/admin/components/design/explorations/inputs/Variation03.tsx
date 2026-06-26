import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const UNDERLINE_CLS =
  'rounded-none border-x-0 border-t-0 border-b shadow-none before:hidden bg-transparent dark:bg-transparent has-focus-visible:ring-0 has-focus-visible:border-b-[var(--primary)] has-focus-visible:border-b-2 px-0';

// @mock-start
// @mock-end

export interface InputUnderlineMinimalProps {}

export function InputUnderlineMinimal(_props: InputUnderlineMinimalProps = {}) {
  return (
    <div className="grid gap-8 px-8 py-12 sm:grid-cols-2">
      <Field>
        <FieldLabel className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
          Project name
        </FieldLabel>
        <Input
          className={UNDERLINE_CLS}
          placeholder="Untitled project"
          defaultValue="Q3 marketing site refresh"
        />
        <FieldDescription>
          Underline only — paper-and-pen feel for editorial canvases.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
          Headline
        </FieldLabel>
        <Input
          className={`${UNDERLINE_CLS} text-lg leading-7 sm:text-lg`}
          placeholder="Add a headline…"
        />
        <FieldDescription>
          Scales up cleanly for inline-edit fields.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
          Disabled
        </FieldLabel>
        <Input
          className={UNDERLINE_CLS}
          defaultValue="Read-only metadata"
          disabled
        />
        <FieldDescription>
          Loses the bottom border accent on focus disable.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
          With initial value
        </FieldLabel>
        <Input
          className={UNDERLINE_CLS}
          defaultValue="Vertex Labs Inc."
        />
        <FieldDescription>
          Reads as a content surface — fits long, document-style forms.
        </FieldDescription>
      </Field>
    </div>
  );
}
