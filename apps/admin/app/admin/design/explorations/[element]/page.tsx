import Link from 'next/link';
import { ArrowLeft, ChevronRight, Compass } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeaderExplorations } from '@/components/design/explorations/header/HeaderExplorations';
import { SidebarExplorations } from '@/components/design/explorations/sidebar/SidebarExplorations';
import { TabsExplorations } from '@/components/design/explorations/tabs/TabsExplorations';
import { PageHeaderExplorations } from '@/components/design/explorations/page-header/PageHeaderExplorations';
import { ButtonsExplorations } from '@/components/design/explorations/buttons/ButtonsExplorations';
import { InputsExplorations } from '@/components/design/explorations/inputs/InputsExplorations';
import { SelectsExplorations } from '@/components/design/explorations/selects/SelectsExplorations';
import { TablesExplorations } from '@/components/design/explorations/tables/TablesExplorations';
import { CardsExplorations } from '@/components/design/explorations/cards/CardsExplorations';
import { EmptyStatesExplorations } from '@/components/design/explorations/empty-states/EmptyStatesExplorations';
import { LoadingExplorations } from '@/components/design/explorations/loading/LoadingExplorations';
import { DialogsExplorations } from '@/components/design/explorations/dialogs/DialogsExplorations';
import { ToastsExplorations } from '@/components/design/explorations/toasts/ToastsExplorations';
import { FormLayoutsExplorations } from '@/components/design/explorations/form-layouts/FormLayoutsExplorations';

type ElementMeta = {
  label: string;
  intent: string;
};

const ELEMENT_META: Record<string, ElementMeta> = {
  header: {
    label: 'Header',
    intent:
      'Top-bar patterns for the admin shell — from classic logo-nav-user, to command-bar dominant, to agent-native prompt-first. Copy the one that best fits how operators use the product day-to-day.',
  },
  sidebar: {
    label: 'Sidebar',
    intent:
      'Persistent left-rail patterns — grouping, density, active-state treatment, and collapse behavior. Each variation takes a different stance on how primary navigation should feel.',
  },
  buttons: {
    label: 'Buttons',
    intent:
      'Button systems across primary, secondary, ghost, destructive, icon, and loading states. Variations cover different shape, weight, and emphasis languages.',
  },
  inputs: {
    label: 'Inputs',
    intent:
      'Single-line text, search, password, and prefix/suffix addons with validation. Each variation takes a different stance on label position, focus treatment, and feedback density.',
  },
  selects: {
    label: 'Selects & comboboxes',
    intent:
      'Single, multi, async, grouped, and autocomplete pickers. Variations cover trigger styling, dropdown density, and search-inside-select behavior.',
  },
  tables: {
    label: 'Tables',
    intent:
      'List density, sorting, selection, pagination, and empty rows. Each variation tries a different take on the structural rhythm — borders, zebra, hover, and inline actions.',
  },
  cards: {
    label: 'Cards',
    intent:
      'Surface containers — basic, framed, with header/footer/action slots. Variations cover elevation, border weight, padding scale, and how cards compose into grids.',
  },
  dialogs: {
    label: 'Dialogs & modals',
    intent:
      'Form-in-dialog, alert-dialog, nested, and responsive (drawer-on-mobile). Each variation explores a different stance on overlay treatment, header structure, and footer action ordering.',
  },
  toasts: {
    label: 'Toasts & alerts',
    intent:
      'Stacked toasts, inline alerts, and success/error/warning/info semantics. Variations cover placement, density, dismiss patterns, and how loud feedback should feel.',
  },
  tabs: {
    label: 'Tabs',
    intent:
      'Default vs underline, with icons, counts, vertical orientation, and tooltip variants. Each variation tries a different rhythm for active-state, separation, and content transitions.',
  },
  'empty-states': {
    label: 'Empty states',
    intent:
      'Zero-data screens — icon, title, description, primary action. Variations cover tone (warm vs neutral), illustration density, and whether the call-to-action should dominate.',
  },
  loading: {
    label: 'Loading & skeletons',
    intent:
      'Spinners, skeletons, and inline loading affordances per surface. Variations cover the trade-off between motion, structural shimmer, and progressive disclosure.',
  },
  'form-layouts': {
    label: 'Form layouts',
    intent:
      'Field stacks, two-column layouts, fieldsets, validation, and submit rows. Each variation takes a different stance on label position, helper density, and group separation.',
  },
  'page-header': {
    label: 'Page header',
    intent:
      'In-page title, description, breadcrumb, and right-aligned actions. Variations cover hierarchy weight, breadcrumb prominence, and how meta info (status, owner, dates) sits alongside the title.',
  },
};

export default async function ExplorationPage({
  params,
}: {
  params: Promise<{ element: string }>;
}) {
  const { element } = await params;
  const meta = ELEMENT_META[element];

  if (!meta) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <Compass />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No exploration yet for &ldquo;{element}&rdquo;</EmptyTitle>
          <EmptyDescription>
            This element category is still pending. Build a set of variations in
            <code className="mx-1 rounded bg-[var(--muted)] px-1 py-0.5 font-mono text-xs">
              components/design/explorations/{element}/
            </code>
            and register it on this page.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/admin/design" />} variant="outline" size="sm">
            <ArrowLeft className="size-4" />
            Back to design reference
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Link
          href="/admin/design"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] transition-colors hover:text-[var(--foreground)]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft className="size-3.5" />
          <span>Design Library</span>
          <ChevronRight className="size-3" />
          <span style={{ color: 'var(--foreground)' }}>{meta.label}</span>
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {meta.label} library
              </h1>
              <Badge variant="info" size="sm" className="gap-1.5">
                <span className="size-1.5 rounded-full bg-current" />
                10 variations
              </Badge>
            </div>
            <p
              className="max-w-3xl text-sm leading-relaxed sm:text-base"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {meta.intent}
            </p>
          </div>
        </div>
      </section>

      {element === 'header' && <HeaderExplorations />}
      {element === 'sidebar' && <SidebarExplorations />}
      {element === 'buttons' && <ButtonsExplorations />}
      {element === 'inputs' && <InputsExplorations />}
      {element === 'selects' && <SelectsExplorations />}
      {element === 'tables' && <TablesExplorations />}
      {element === 'cards' && <CardsExplorations />}
      {element === 'dialogs' && <DialogsExplorations />}
      {element === 'toasts' && <ToastsExplorations />}
      {element === 'tabs' && <TabsExplorations />}
      {element === 'empty-states' && <EmptyStatesExplorations />}
      {element === 'loading' && <LoadingExplorations />}
      {element === 'form-layouts' && <FormLayoutsExplorations />}
      {element === 'page-header' && <PageHeaderExplorations />}
    </div>
  );
}
