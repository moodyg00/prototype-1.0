import { Button } from '@/components/ui/button';
import { Bookmark, Share2 } from 'lucide-react';

type Byline = {
  author: string;
  date: string;
  readTime: string;
};

// @mock-start
const MOCK_EYEBROW = 'Field Notes · Issue 04';
const MOCK_TITLE = 'Designing operations software for humans and agents alike';
const MOCK_LEDE =
  'A working theory on how to build CRUD that disappears when the agent is driving — and shows up immediately when the human takes the wheel.';
const MOCK_BYLINE: Byline = {
  author: 'Jordan Dahl',
  date: 'May 30, 2026',
  readTime: '8 min read',
};
// @mock-end

export interface PageHeaderEditorialProps {
  eyebrow?: string;
  title?: string;
  lede?: string;
  byline?: Byline;
}

export function PageHeaderEditorial({
  eyebrow = MOCK_EYEBROW,
  title = MOCK_TITLE,
  lede = MOCK_LEDE,
  byline = MOCK_BYLINE,
}: PageHeaderEditorialProps) {
  return (
    <header className="px-8 py-10" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: 'var(--primary)' }}
        >
          {eyebrow}
        </div>
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p
          className="mx-auto max-w-2xl text-base leading-relaxed"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {lede}
        </p>

        <div
          className="flex items-center justify-center gap-3 pt-2 text-xs"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <span>{byline.author}</span>
          <span className="opacity-50">·</span>
          <span>{byline.date}</span>
          <span className="opacity-50">·</span>
          <span>{byline.readTime}</span>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="size-3.5" />
            Save
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="size-3.5" />
            Share
          </Button>
        </div>
      </div>
    </header>
  );
}
