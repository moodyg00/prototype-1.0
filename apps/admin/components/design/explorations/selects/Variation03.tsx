'use client';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@/components/ui/combobox';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

// @mock-start
const MOCK_TAGS = [
  'design',
  'frontend',
  'backend',
  'ops',
  'finance',
  'launch',
  'urgent',
  'research',
  'agent-ready',
  'archived',
];
const MOCK_DEFAULT_TAGS = ['design', 'frontend', 'urgent'];
const MOCK_REVIEWERS = ['Jane', 'Marcus', 'Yuki', 'Priya'];
// @mock-end

export interface SelectMultiChipsProps {
  tags?: ReadonlyArray<string>;
  defaultTags?: ReadonlyArray<string>;
  reviewers?: ReadonlyArray<string>;
}

export function SelectMultiChips({
  tags = MOCK_TAGS,
  defaultTags = MOCK_DEFAULT_TAGS,
  reviewers = MOCK_REVIEWERS,
}: SelectMultiChipsProps = {}) {
  const tagItems = tags as string[];
  const reviewerItems = reviewers as string[];
  const defaultTagsArr = defaultTags as string[];
  return (
    <div className="grid gap-8 px-8 py-10 md:grid-cols-2">
      <Field>
        <FieldLabel>Tags</FieldLabel>
        <Combobox<string, true>
          items={tagItems}
          multiple
          defaultValue={defaultTagsArr}
        >
          <ComboboxChips>
            <ComboboxCollection>
              {(item: string) => (
                <ComboboxChip key={item}>{item}</ComboboxChip>
              )}
            </ComboboxCollection>
            <ComboboxChipsInput placeholder="Add tag…" />
          </ComboboxChips>
          <ComboboxPopup>
            <ComboboxList>
              <ComboboxEmpty>No tags match.</ComboboxEmpty>
              <ComboboxCollection>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
        <FieldDescription>
          Type to add — selected tags become removable chips. Backspace removes
          the most recent.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Reviewers (empty state)</FieldLabel>
        <Combobox<string, true> items={reviewerItems} multiple>
          <ComboboxChips>
            <ComboboxCollection>
              {(item: string) => (
                <ComboboxChip key={item}>{item}</ComboboxChip>
              )}
            </ComboboxCollection>
            <ComboboxChipsInput placeholder="Search teammates…" />
          </ComboboxChips>
          <ComboboxPopup>
            <ComboboxList>
              <ComboboxEmpty>No teammates match.</ComboboxEmpty>
              <ComboboxCollection>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
        <FieldDescription>
          Same control with no chips yet — placeholder reads as a hint.
        </FieldDescription>
      </Field>
    </div>
  );
}
