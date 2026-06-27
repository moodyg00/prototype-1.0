export type CategoryId =
  | 'header'
  | 'sidebar'
  | 'buttons'
  | 'inputs'
  | 'selects'
  | 'tables'
  | 'cards'
  | 'dialogs'
  | 'toasts'
  | 'tabs'
  | 'empty-states'
  | 'loading'
  | 'form-layouts'
  | 'page-header';

export interface VariantEntry {
  slug: string;
  category: CategoryId;
  number: number;
  displayName: string;
  intent: string;
  /** Absolute import path from the project root, no leading slash. */
  file: string;
  /** Component export name inside that file. */
  exportName: string;
  /** Free-form tags useful to the human. Optional. */
  tags?: string[];
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'header',
    label: 'Header / top bar',
    description: 'Application top chrome — branding, primary nav, search, user controls.',
  },
  {
    id: 'sidebar',
    label: 'Sidebar / primary nav',
    description: 'Persistent left rail for grouped destinations and active-state.',
  },
  {
    id: 'buttons',
    label: 'Buttons',
    description: 'Primary, secondary, ghost, destructive, icon, and loading states.',
  },
  {
    id: 'inputs',
    label: 'Inputs / text fields',
    description: 'Single-line text, search, password, with addons and validation.',
  },
  {
    id: 'selects',
    label: 'Selects / comboboxes',
    description: 'Single, multi, async, grouped, autocomplete, and timezone pickers.',
  },
  {
    id: 'tables',
    label: 'Tables',
    description: 'List density, sorting, selection, pagination, and empty rows.',
  },
  {
    id: 'cards',
    label: 'Cards',
    description: 'Surface containers — basic, framed, with header/footer/action slots.',
  },
  {
    id: 'dialogs',
    label: 'Dialogs / modals',
    description: 'Form-in-dialog, alert-dialog, nested, and responsive (drawer-on-mobile).',
  },
  {
    id: 'toasts',
    label: 'Toasts / alerts',
    description: 'Stacked toasts, inline alerts, success/error/warning/info semantics.',
  },
  {
    id: 'tabs',
    label: 'Tabs',
    description: 'Default vs underline, with icons, counts, vertical, and tooltip variants.',
  },
  {
    id: 'empty-states',
    label: 'Empty states',
    description: 'Zero-data screens — icon, title, description, primary action.',
  },
  {
    id: 'loading',
    label: 'Loading / skeletons',
    description: 'Spinner, skeletons, and inline loading affordances per surface.',
  },
  {
    id: 'form-layouts',
    label: 'Form layouts',
    description: 'Field stacks, two-column, fieldsets, validation, and submit rows.',
  },
  {
    id: 'page-header',
    label: 'Page header',
    description: 'In-page title, description, breadcrumb, and right-aligned actions.',
  },
];

export const VARIANTS: VariantEntry[] = [
  // header
  {
    slug: 'header-classic-shell',
    category: 'header',
    number: 1,
    displayName: 'Classic admin shell',
    intent:
      'Logo on the left, horizontal primary nav in the center, search and user controls on the right. The familiar SaaS pattern that keeps every utility within one click.',
    file: 'components/design/explorations/header/Variation01.tsx',
    exportName: 'HeaderClassicShell',
    tags: ['nav', 'classic'],
  },
  {
    slug: 'header-command-bar',
    category: 'header',
    number: 2,
    displayName: 'Command-bar dominant',
    intent:
      'A single oversized search and command trigger anchors the header. Branding and avatar shrink to the edges so the search input becomes the obvious entry point.',
    file: 'components/design/explorations/header/Variation02.tsx',
    exportName: 'HeaderCommandBar',
    tags: ['search', 'command'],
  },
  {
    slug: 'sidebar-classic-grouped',
    category: 'sidebar',
    number: 1,
    displayName: 'Classic grouped flat list',
    intent:
      'A familiar SaaS rail: brand on top, destinations grouped under uppercase section labels, account chip on the bottom. Predictable, easy to scan, low cognitive load.',
    file: 'components/design/explorations/sidebar/Variation01.tsx',
    exportName: 'SidebarClassicGrouped',
    tags: ['nav', 'classic'],
  },
  {
    slug: 'sidebar-collapsible-sections',
    category: 'sidebar',
    number: 2,
    displayName: 'Collapsible nested sections',
    intent:
      'Top-level groups are collapsible accordions revealing sub-items. Good when the product has many destinations and most users only operate inside one or two areas at a time.',
    file: 'components/design/explorations/sidebar/Variation02.tsx',
    exportName: 'SidebarCollapsibleSections',
    tags: ['collapsible'],
  },
  {
    slug: 'button-variant-matrix',
    category: 'buttons',
    number: 1,
    displayName: 'Variant matrix',
    intent:
      'Every visual variant on a single canvas — default, secondary, outline, ghost, link, and the destructive pair. The base reference for what a button can look like in the system.',
    file: 'components/design/explorations/buttons/Variation01.tsx',
    exportName: 'ButtonVariantMatrix',
    tags: ['reference', 'matrix'],
  },
  {
    slug: 'button-size-rhythm',
    category: 'buttons',
    number: 2,
    displayName: 'Size rhythm — xs to xl',
    intent:
      'A consistent size scale from xs to xl alongside the icon-only counterparts. Establishes the vertical rhythm so buttons line up with inputs, badges, and tags.',
    file: 'components/design/explorations/buttons/Variation02.tsx',
    exportName: 'ButtonSizeRhythm',
    tags: ['sizes'],
  },
  {
    slug: 'input-classic-outline',
    category: 'inputs',
    number: 1,
    displayName: 'Classic outline',
    intent:
      'The default Field + Label + Input + Description stack. Border, soft shadow, focus ring — the look every other variation departs from.',
    file: 'components/design/explorations/inputs/Variation01.tsx',
    exportName: 'InputClassicOutline',
    tags: ['classic'],
  },
  {
    slug: 'input-filled-soft-tint',
    category: 'inputs',
    number: 2,
    displayName: 'Filled / soft-tint',
    intent:
      'Tinted background with a transparent border at rest. Reads as a content surface; the border only appears on focus. Good for stacked content forms.',
    file: 'components/design/explorations/inputs/Variation02.tsx',
    exportName: 'InputFilledSoftTint',
    tags: ['filled'],
  },
  {
    slug: 'select-classic-single',
    category: 'selects',
    number: 1,
    displayName: 'Classic single select',
    intent:
      'The default Select — a closed trigger plus a static open-state preview that mirrors the popup styling. The reference for every other variation.',
    file: 'components/design/explorations/selects/Variation01.tsx',
    exportName: 'SelectClassicSingle',
    tags: ['classic'],
  },
  {
    slug: 'select-autocomplete',
    category: 'selects',
    number: 2,
    displayName: 'Combobox autocomplete + filter',
    intent:
      'Combobox trigger paired with an inline-rendered filtering popup so the live filter behavior is visible at a glance.',
    file: 'components/design/explorations/selects/Variation02.tsx',
    exportName: 'SelectAutocomplete',
    tags: ['combobox', 'filter'],
  },
  {
    slug: 'table-classic-bordered',
    category: 'tables',
    number: 1,
    displayName: 'Classic bordered with sortable headers',
    intent:
      'Card-wrapped table with sortable column affordances, status pills, and an inline pagination footer. The familiar pattern most operators expect from a SaaS list view.',
    file: 'components/design/explorations/tables/Variation01.tsx',
    exportName: 'TableClassicBordered',
    tags: ['classic'],
  },
  {
    slug: 'table-minimal-hover-lanes',
    category: 'tables',
    number: 2,
    displayName: 'Minimal borderless with hover lanes',
    intent:
      'No outer border, no inner dividers — just generous spacing, an inline progress bar per row, and a subtle hover lane. Reads as content, not a database dump.',
    file: 'components/design/explorations/tables/Variation02.tsx',
    exportName: 'TableMinimalHoverLanes',
    tags: ['minimal'],
  },
  {
    slug: 'card-basic-surface',
    category: 'cards',
    number: 1,
    displayName: 'Basic surface with title and content',
    intent:
      'The simplest possible card — a soft border, header, description, and body. Use this when nothing more is needed and you want the content to do the talking.',
    file: 'components/design/explorations/cards/Variation01.tsx',
    exportName: 'CardBasicSurface',
    tags: ['basic'],
  },
  {
    slug: 'card-stat-sparkline',
    category: 'cards',
    number: 3,
    displayName: 'Stat card with big number, delta, sparkline',
    intent:
      'Eyebrow label, oversized tabular number, and an inline sparkline trend. Dense, scannable, and ideal for executive dashboards and KPI rows.',
    file: 'components/design/explorations/cards/Variation03.tsx',
    exportName: 'CardStatSparkline',
    tags: ['stat', 'sparkline', 'dashboard'],
  },
  {
    slug: 'dialog-classic-centered',
    category: 'dialogs',
    number: 1,
    displayName: 'Classic centered modal',
    intent:
      'Title, supporting copy, body, and a right-aligned action row. The default modal — used everywhere a confirm-or-cancel decision needs explanation.',
    file: 'components/design/explorations/dialogs/Variation01.tsx',
    exportName: 'DialogClassicCentered',
    tags: ['classic'],
  },
  {
    slug: 'dialog-alert-destructive',
    category: 'dialogs',
    number: 2,
    displayName: 'Alert dialog (destructive confirm)',
    intent:
      'Compact confirmation surface with a leading warning glyph and a destructive primary action. Optimised for irreversible operations like delete.',
    file: 'components/design/explorations/dialogs/Variation02.tsx',
    exportName: 'DialogAlertDestructive',
    tags: ['destructive', 'alert'],
  },
  {
    slug: 'toast-stacked-corner',
    category: 'toasts',
    number: 1,
    displayName: 'Stacked corner toasts',
    intent:
      'Bottom-right stack of three toasts with icon, title, and short description. The current sonner default snapshot — quiet, layered, dismissable.',
    file: 'components/design/explorations/toasts/Variation01.tsx',
    exportName: 'ToastStackedCorner',
    tags: ['stacked'],
  },
  {
    slug: 'toast-banner',
    category: 'toasts',
    number: 2,
    displayName: 'Inline alert banner',
    intent:
      'Full-width banner pinned to the top of the page surface. Best for system-wide messages like maintenance windows that everyone needs to see.',
    file: 'components/design/explorations/toasts/Variation02.tsx',
    exportName: 'ToastBanner',
    tags: ['banner'],
  },
  {
    slug: 'tab-classic-underline',
    category: 'tabs',
    number: 1,
    displayName: 'Classic underline',
    intent:
      'Text-only tabs separated by a thin baseline rule, with a primary-coloured underline indicating the active tab. The most familiar and least visually noisy pattern.',
    file: 'components/design/explorations/tabs/Variation01.tsx',
    exportName: 'TabClassicUnderline',
    tags: ['classic', 'underline'],
  },
  {
    slug: 'tab-pill-segmented',
    category: 'tabs',
    number: 2,
    displayName: 'Pill / segmented control',
    intent:
      'A filled segmented control where the active tab gets a contrasting chip. Reads as a discrete control, ideal for view-mode toggles or short scoped switches.',
    file: 'components/design/explorations/tabs/Variation02.tsx',
    exportName: 'TabPillSegmented',
    tags: ['pill', 'segmented'],
  },
  {
    slug: 'empty-state-classic',
    category: 'empty-states',
    number: 1,
    displayName: 'Classic icon + title + description + CTA',
    intent:
      'The default Empty primitive composition — a centered icon medallion, headline, supportive copy, and a single primary action. Best fit when nothing fancy is needed.',
    file: 'components/design/explorations/empty-states/Variation01.tsx',
    exportName: 'EmptyStateClassic',
    tags: ['classic'],
  },
  {
    slug: 'empty-state-search-no-results',
    category: 'empty-states',
    number: 5,
    displayName: 'Search-no-results with query echo',
    intent:
      'Echoes the failed query in the headline, lists the active filters as removable chips, and offers a "clear filters" escape hatch. The default for any search surface.',
    file: 'components/design/explorations/empty-states/Variation05.tsx',
    exportName: 'EmptyStateSearchNoResults',
    tags: ['search'],
  },
  {
    slug: 'loading-spinner-only',
    category: 'loading',
    number: 1,
    displayName: 'Spinner only (centered)',
    intent:
      'The simplest possible loading affordance — a centered spinner with nothing else. Use when the surface is small, transient, or the context is already obvious.',
    file: 'components/design/explorations/loading/Variation01.tsx',
    exportName: 'LoadingSpinnerOnly',
    tags: ['spinner'],
  },
  {
    slug: 'loading-full-page-skeleton',
    category: 'loading',
    number: 3,
    displayName: 'Full-page skeleton (header + table)',
    intent:
      'Mimics the final page layout in low-contrast placeholders. Reduces perceived latency by keeping the user oriented while real data streams in.',
    file: 'components/design/explorations/loading/Variation03.tsx',
    exportName: 'LoadingFullPageSkeleton',
    tags: ['skeleton', 'page'],
  },
  {
    slug: 'form-layout-single-column',
    category: 'form-layouts',
    number: 1,
    displayName: 'Single-column stack (settings)',
    intent:
      'Vertical stack of full-width fields with description text under each. The default settings-style form — calm hierarchy, plenty of breathing room.',
    file: 'components/design/explorations/form-layouts/Variation01.tsx',
    exportName: 'FormLayoutSingleColumn',
    tags: ['settings', 'single-column'],
  },
  {
    slug: 'form-layout-two-column',
    category: 'form-layouts',
    number: 2,
    displayName: 'Two-column with labels on left',
    intent:
      'Definition-list layout: the label column carries the field name and supporting copy, the right column holds the control. Dense but legible.',
    file: 'components/design/explorations/form-layouts/Variation02.tsx',
    exportName: 'FormLayoutTwoColumn',
    tags: ['two-column'],
  },
  {
    slug: 'page-header-simple',
    category: 'page-header',
    number: 1,
    displayName: 'Simple title + description + action',
    intent:
      'The minimal-viable page header: a title, one supporting line, and a single primary action. The default for most index/landing pages where the destination is unambiguous.',
    file: 'components/design/explorations/page-header/Variation01.tsx',
    exportName: 'PageHeaderSimple',
    tags: ['simple'],
  },
  {
    slug: 'page-header-breadcrumb-detail',
    category: 'page-header',
    number: 2,
    displayName: 'Breadcrumb + detail-record header',
    intent:
      'Breadcrumb above the title to anchor the user inside a deep hierarchy, with edit / share / overflow actions on the right. Standard pattern for record detail screens.',
    file: 'components/design/explorations/page-header/Variation02.tsx',
    exportName: 'PageHeaderBreadcrumbDetail',
    tags: ['breadcrumb', 'detail'],
  },
];

/**
 * Slugs the team has marked as "production-strong" exemplars.
 * Toggling a favorite in the UI surfaces an instruction toast — to actually
 * pin a variant, hand-edit this list. Order here = order on the index page.
 */
export const FAVORITES: readonly string[] = [
  'header-classic-shell',
  'header-command-bar',
  'sidebar-classic-grouped',
  'card-basic-surface',
  'card-stat-sparkline',
  'table-classic-bordered',
  'empty-state-classic',
  'empty-state-search-no-results',
  'loading-full-page-skeleton',
  'form-layout-single-column',
  'page-header-breadcrumb-detail',
];

export function getVariant(slug: string): VariantEntry | undefined {
  return VARIANTS.find((v) => v.slug === slug);
}

export function getVariantsByCategory(category: CategoryId): VariantEntry[] {
  return VARIANTS.filter((v) => v.category === category).sort((a, b) => a.number - b.number);
}

export function getFavoriteEntries(): VariantEntry[] {
  return FAVORITES.map((slug) => getVariant(slug)).filter(
    (v): v is VariantEntry => Boolean(v),
  );
}

export function countFavoritesInCategory(category: CategoryId): number {
  return getVariantsByCategory(category).filter((v) => FAVORITES.includes(v.slug)).length;
}
