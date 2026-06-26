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
    slug: 'header-monoline-breadcrumb',
    category: 'header',
    number: 3,
    displayName: 'Minimal monoline, breadcrumb-first',
    intent:
      'A thin status bar where the breadcrumb path is the dominant element. Designed for deep-record screens where the user already knows where they are going.',
    file: 'components/design/explorations/header/Variation03.tsx',
    exportName: 'HeaderMonolineBreadcrumb',
    tags: ['minimal', 'breadcrumb'],
  },
  {
    slug: 'header-dense-utility',
    category: 'header',
    number: 4,
    displayName: 'Dense utility bar with inline filters',
    intent:
      'A two-row top bar packed with view modes, filter chips, sort controls, counts, and search. Optimized for power users who live inside list and table views.',
    file: 'components/design/explorations/header/Variation04.tsx',
    exportName: 'HeaderDenseUtility',
    tags: ['dense', 'power-user'],
  },
  {
    slug: 'header-floating-pill',
    category: 'header',
    number: 5,
    displayName: 'Floating pill / chip header',
    intent:
      'The header is a rounded pill that floats inside generous padding. Reads as a navigation island rather than a boundary, which suits content-led pages.',
    file: 'components/design/explorations/header/Variation05.tsx',
    exportName: 'HeaderFloatingPill',
    tags: ['floating', 'editorial'],
  },
  {
    slug: 'header-split-tabs',
    category: 'header',
    number: 6,
    displayName: 'Split header with primary nav row',
    intent:
      'Top row hosts identity, search, and account controls; the bottom row carries primary navigation as underline tabs. Strong vertical hierarchy and clear active-state.',
    file: 'components/design/explorations/header/Variation06.tsx',
    exportName: 'HeaderSplitTabs',
    tags: ['split', 'tabs'],
  },
  {
    slug: 'header-mega-menu',
    category: 'header',
    number: 7,
    displayName: 'Sidebar-collapsed with mega-menu trigger',
    intent:
      'Replaces a permanent sidebar with a single button that opens a mega-menu of grouped destinations. Maximises canvas room for the page content underneath.',
    file: 'components/design/explorations/header/Variation07.tsx',
    exportName: 'HeaderMegaMenu',
    tags: ['mega-menu'],
  },
  {
    slug: 'header-agent-prompt',
    category: 'header',
    number: 8,
    displayName: 'Agent-native AI prompt header',
    intent:
      'The header treats the agent prompt as the primary action — a centered input with attach, mention, and send affordances, plus suggestion chips below.',
    file: 'components/design/explorations/header/Variation08.tsx',
    exportName: 'HeaderAgentPrompt',
    tags: ['agent', 'prompt'],
  },
  {
    slug: 'header-context-status',
    category: 'header',
    number: 9,
    displayName: 'Status- and context-aware header',
    intent:
      'Workspace switcher, environment badge, and live system status are surfaced front-and-center. Optimised for operators who need situational awareness at all times.',
    file: 'components/design/explorations/header/Variation09.tsx',
    exportName: 'HeaderContextStatus',
    tags: ['status', 'workspace'],
  },
  {
    slug: 'header-editorial',
    category: 'header',
    number: 10,
    displayName: 'Ultra-minimal editorial',
    intent:
      'Whitespace-heavy, centered wordmark with a subtle subtitle and a single utility action. Reads more like a publication than a tool — for marketing-adjacent surfaces.',
    file: 'components/design/explorations/header/Variation10.tsx',
    exportName: 'HeaderEditorial',
    tags: ['editorial', 'minimal'],
  },

  // sidebar
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
    slug: 'sidebar-icon-rail',
    category: 'sidebar',
    number: 3,
    displayName: 'Icon-only mini rail',
    intent:
      'Ultra-narrow vertical rail of icon-only buttons. Tooltips on hover supply the labels. Maximises canvas space for the page content alongside.',
    file: 'components/design/explorations/sidebar/Variation03.tsx',
    exportName: 'SidebarIconRail',
    tags: ['compact', 'icons'],
  },
  {
    slug: 'sidebar-double-pane',
    category: 'sidebar',
    number: 4,
    displayName: 'Double-pane categories + items',
    intent:
      'A mini icon rail picks the area; a second column shows the items inside that area. A drill-in pattern that scales when each category has 6+ destinations.',
    file: 'components/design/explorations/sidebar/Variation04.tsx',
    exportName: 'SidebarDoublePane',
    tags: ['double-pane'],
  },
  {
    slug: 'sidebar-search-led',
    category: 'sidebar',
    number: 5,
    displayName: 'Search-led / command palette feel',
    intent:
      'A persistent search input dominates the rail. Below it: jump-to, recents, and quick actions with keyboard hints. The sidebar behaves like an always-open ⌘K.',
    file: 'components/design/explorations/sidebar/Variation05.tsx',
    exportName: 'SidebarSearchLed',
    tags: ['search', 'palette'],
  },
  {
    slug: 'sidebar-pinned-recent',
    category: 'sidebar',
    number: 6,
    displayName: 'Pinned + recent above sections',
    intent:
      'Surface what the operator actually clicks: pinned shortcuts and recent records on top, the canonical section list below. Trades hierarchy for usefulness.',
    file: 'components/design/explorations/sidebar/Variation06.tsx',
    exportName: 'SidebarPinnedRecent',
    tags: ['pinned', 'recents'],
  },
  {
    slug: 'sidebar-activity-cards',
    category: 'sidebar',
    number: 7,
    displayName: 'Activity-styled status cards',
    intent:
      'Each section is a card showing live state — counts, deltas, status colour. The sidebar doubles as a glanceable dashboard for operators on the move.',
    file: 'components/design/explorations/sidebar/Variation07.tsx',
    exportName: 'SidebarActivityCards',
    tags: ['dashboard'],
  },
  {
    slug: 'sidebar-workspace-switcher',
    category: 'sidebar',
    number: 8,
    displayName: 'Workspace switcher header + nav',
    intent:
      'A prominent team/workspace switcher anchors the top of the rail. Suits multi-tenant or multi-project apps where context-switching is a first-class action.',
    file: 'components/design/explorations/sidebar/Variation08.tsx',
    exportName: 'SidebarWorkspaceSwitcher',
    tags: ['workspace'],
  },
  {
    slug: 'sidebar-floating-island',
    category: 'sidebar',
    number: 9,
    displayName: 'Floating-island rounded panel',
    intent:
      'A rounded card detached from the viewport edge with shadow and breathing room. Reads as a navigation island; pairs well with content-led, less industrial UIs.',
    file: 'components/design/explorations/sidebar/Variation09.tsx',
    exportName: 'SidebarFloatingIsland',
    tags: ['floating'],
  },
  {
    slug: 'sidebar-agent-prompt',
    category: 'sidebar',
    number: 10,
    displayName: 'Agent-native prompt + tools',
    intent:
      'No pages — just an agent prompt, recent prompts, and callable tools. The sidebar becomes the way you do work, not the way you navigate it.',
    file: 'components/design/explorations/sidebar/Variation10.tsx',
    exportName: 'SidebarAgentPrompt',
    tags: ['agent'],
  },

  // buttons
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
    slug: 'button-icon-only-tooltip',
    category: 'buttons',
    number: 3,
    displayName: 'Icon-only with tooltips',
    intent:
      'Toolbar-style icon buttons that rely on hover/focus tooltips for labelling. Optimised for dense surfaces like editors and table rows.',
    file: 'components/design/explorations/buttons/Variation03.tsx',
    exportName: 'ButtonIconOnlyTooltip',
    tags: ['icon-only', 'toolbar'],
  },
  {
    slug: 'button-loading-disabled',
    category: 'buttons',
    number: 4,
    displayName: 'Loading and disabled states',
    intent:
      'How each variant behaves when async work is in flight or the action is unavailable. Width is preserved, the label hides, and a centered spinner appears.',
    file: 'components/design/explorations/buttons/Variation04.tsx',
    exportName: 'ButtonLoadingDisabled',
    tags: ['loading', 'states'],
  },
  {
    slug: 'button-split',
    category: 'buttons',
    number: 5,
    displayName: 'Split button (action + dropdown)',
    intent:
      'Pairs a primary action with a secondary menu of related actions. Ideal for "Save / Save and publish / Save as draft" style flows.',
    file: 'components/design/explorations/buttons/Variation05.tsx',
    exportName: 'ButtonSplit',
    tags: ['split', 'dropdown'],
  },
  {
    slug: 'button-segmented',
    category: 'buttons',
    number: 6,
    displayName: 'Segmented / button group',
    intent:
      'Toggle-group based segmented controls in single-select, multi-select, and three sizes. The canonical pattern for view-mode and small enum switches.',
    file: 'components/design/explorations/buttons/Variation06.tsx',
    exportName: 'ButtonSegmented',
    tags: ['segmented', 'toggle-group'],
  },
  {
    slug: 'button-fab',
    category: 'buttons',
    number: 7,
    displayName: 'Floating action button',
    intent:
      'A tinted, elevated round button anchored to the page surface, plus a speed-dial stack and an extended (label) variant. For mobile-leaning canvases.',
    file: 'components/design/explorations/buttons/Variation07.tsx',
    exportName: 'ButtonFab',
    tags: ['fab', 'floating'],
  },
  {
    slug: 'button-badge-shortcut',
    category: 'buttons',
    number: 8,
    displayName: 'CTA with badge / shortcut',
    intent:
      'Buttons that carry a counter badge or a keyboard-shortcut hint. Useful for inboxes, palette triggers, and surfaces where power users live.',
    file: 'components/design/explorations/buttons/Variation08.tsx',
    exportName: 'ButtonBadgeShortcut',
    tags: ['badge', 'kbd'],
  },
  {
    slug: 'button-pill',
    category: 'buttons',
    number: 9,
    displayName: 'Pill — heavy radius',
    intent:
      'Rounded-full buttons that read as soft chips. Good for marketing-adjacent surfaces, filter rows, and friendly CTAs.',
    file: 'components/design/explorations/buttons/Variation09.tsx',
    exportName: 'ButtonPill',
    tags: ['pill'],
  },
  {
    slug: 'button-toggle-stateful',
    category: 'buttons',
    number: 10,
    displayName: 'Toggle / pressed state buttons',
    intent:
      'Stateful buttons that retain a pressed look. Format toggles, pin/star/mute style controls, and a size matrix for the outline variant.',
    file: 'components/design/explorations/buttons/Variation10.tsx',
    exportName: 'ButtonToggleStateful',
    tags: ['toggle', 'pressed'],
  },

  // inputs
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
    slug: 'input-underline-minimal',
    category: 'inputs',
    number: 3,
    displayName: 'Underline-only minimal',
    intent:
      'No box, just a baseline. Pairs well with editorial or document-like forms where chrome needs to disappear.',
    file: 'components/design/explorations/inputs/Variation03.tsx',
    exportName: 'InputUnderlineMinimal',
    tags: ['underline', 'minimal'],
  },
  {
    slug: 'input-leading-icon',
    category: 'inputs',
    number: 4,
    displayName: 'With leading icon',
    intent:
      'InputGroup with a leading icon addon — the strongest single-glyph affordance. Email, search, phone, address all use this pattern.',
    file: 'components/design/explorations/inputs/Variation04.tsx',
    exportName: 'InputLeadingIcon',
    tags: ['icon', 'addon'],
  },
  {
    slug: 'input-trailing-kbd',
    category: 'inputs',
    number: 5,
    displayName: 'With trailing keyboard hint',
    intent:
      'Trailing kbd in an inline-end addon. Pairs naturally with command-bars, agent inputs, and submit-on-enter contexts.',
    file: 'components/design/explorations/inputs/Variation05.tsx',
    exportName: 'InputTrailingKbd',
    tags: ['kbd', 'shortcut'],
  },
  {
    slug: 'input-password-strength',
    category: 'inputs',
    number: 6,
    displayName: 'Password — visibility + strength',
    intent:
      'Password input with a visibility toggle and a live strength meter. The toggle is shared across confirm-password fields for symmetry.',
    file: 'components/design/explorations/inputs/Variation06.tsx',
    exportName: 'InputPasswordStrength',
    tags: ['password'],
  },
  {
    slug: 'input-search-clear',
    category: 'inputs',
    number: 7,
    displayName: 'Search with clear / loading',
    intent:
      'Search input that surfaces a clear button only when there is a value, plus a loading variant with a spinner-and-cancel pair.',
    file: 'components/design/explorations/inputs/Variation07.tsx',
    exportName: 'InputSearchClear',
    tags: ['search'],
  },
  {
    slug: 'input-prefix-suffix',
    category: 'inputs',
    number: 8,
    displayName: 'Prefix / suffix addons',
    intent:
      'Inline-start and inline-end text addons for URLs, currency, units, and path-like fields. The input edges blend with the addons.',
    file: 'components/design/explorations/inputs/Variation08.tsx',
    exportName: 'InputPrefixSuffix',
    tags: ['addon'],
  },
  {
    slug: 'input-validation-states',
    category: 'inputs',
    number: 9,
    displayName: 'Validation states',
    intent:
      'Error, success, and warning visuals with inline messages and themed border tints. Neutral state shown alongside for comparison.',
    file: 'components/design/explorations/inputs/Variation09.tsx',
    exportName: 'InputValidationStates',
    tags: ['validation', 'states'],
  },
  {
    slug: 'input-sizes-matrix',
    category: 'inputs',
    number: 10,
    displayName: 'Sizes matrix — sm / default / lg',
    intent:
      'Side-by-side density comparison for both plain Input and the leading-icon InputGroup. Use to align inputs with adjacent buttons and badges.',
    file: 'components/design/explorations/inputs/Variation10.tsx',
    exportName: 'InputSizesMatrix',
    tags: ['sizes'],
  },

  // selects
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
    slug: 'select-multi-chips',
    category: 'selects',
    number: 3,
    displayName: 'Multi-select with chip tokens',
    intent:
      'ComboboxChips control — selected values become inline removable chips while typing continues to filter the menu.',
    file: 'components/design/explorations/selects/Variation03.tsx',
    exportName: 'SelectMultiChips',
    tags: ['multi', 'chips'],
  },
  {
    slug: 'select-grouped-sections',
    category: 'selects',
    number: 4,
    displayName: 'Grouped sections with headers',
    intent:
      'A select whose options are organised by team or category. Group headers keep dense option lists scannable.',
    file: 'components/design/explorations/selects/Variation04.tsx',
    exportName: 'SelectGroupedSections',
    tags: ['grouped'],
  },
  {
    slug: 'select-async-loading',
    category: 'selects',
    number: 5,
    displayName: 'Async loading (skeleton items)',
    intent:
      'Async-aware select — shows the skeleton / spinner state while the directory is being searched, with an inline status footer.',
    file: 'components/design/explorations/selects/Variation05.tsx',
    exportName: 'SelectAsyncLoading',
    tags: ['async', 'loading'],
  },
  {
    slug: 'select-avatar-icon',
    category: 'selects',
    number: 6,
    displayName: 'With leading avatar / icon',
    intent:
      'Each option carries an avatar (or icon) so people, environments, and entities are recognisable without reading the label.',
    file: 'components/design/explorations/selects/Variation06.tsx',
    exportName: 'SelectAvatarIcon',
    tags: ['avatar', 'icon'],
  },
  {
    slug: 'select-rich-items',
    category: 'selects',
    number: 7,
    displayName: 'Rich items — label + description',
    intent:
      'Two-line options for plans, environments, or workflow templates. The trigger expands to show the same rich label.',
    file: 'components/design/explorations/selects/Variation07.tsx',
    exportName: 'SelectRichItems',
    tags: ['rich'],
  },
  {
    slug: 'select-timezone-grouped',
    category: 'selects',
    number: 8,
    displayName: 'Timezone — search + region grouping',
    intent:
      'A region-grouped combobox with live search and right-aligned offsets. The canonical timezone-style picker.',
    file: 'components/design/explorations/selects/Variation08.tsx',
    exportName: 'SelectTimezoneGrouped',
    tags: ['timezone'],
  },
  {
    slug: 'select-cascading-two-pane',
    category: 'selects',
    number: 9,
    displayName: 'Cascading two-pane select',
    intent:
      'Country → city pattern. Choosing a country resets the dependent city select to the first valid option for that country.',
    file: 'components/design/explorations/selects/Variation09.tsx',
    exportName: 'SelectCascadingTwoPane',
    tags: ['cascading'],
  },
  {
    slug: 'select-command-palette',
    category: 'selects',
    number: 10,
    displayName: 'Command palette dialog combobox',
    intent:
      'A trigger button styled like a search bar opens a centered command palette with grouped commands, shortcuts, and a footer keymap.',
    file: 'components/design/explorations/selects/Variation10.tsx',
    exportName: 'SelectCommandPalette',
    tags: ['command', 'palette'],
  },

  // tables
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
    slug: 'table-dense-power',
    category: 'tables',
    number: 3,
    displayName: 'Dense power-user grid',
    intent:
      '32px rows, 12px text, tight column padding and monospace identifiers. Optimised for inventory or ledger work where seeing twenty rows at once matters more than air.',
    file: 'components/design/explorations/tables/Variation03.tsx',
    exportName: 'TableDensePower',
    tags: ['dense', 'power-user'],
  },
  {
    slug: 'table-selection-bulk-actions',
    category: 'tables',
    number: 4,
    displayName: 'Checkbox selection with bulk-action bar',
    intent:
      'Inbox-style table — when one or more rows are selected, a tinted action strip slides in above the header offering bulk operations and a clear-selection escape.',
    file: 'components/design/explorations/tables/Variation04.tsx',
    exportName: 'TableSelectionBulkActions',
    tags: ['selection', 'bulk'],
  },
  {
    slug: 'table-expandable-detail',
    category: 'tables',
    number: 5,
    displayName: 'Expandable rows with detail panel',
    intent:
      'Chevron toggle on each row reveals a structured detail card inline — address, notes, parts list — without leaving the list context. Great for dispatch and ticket queues.',
    file: 'components/design/explorations/tables/Variation05.tsx',
    exportName: 'TableExpandableDetail',
    tags: ['expandable'],
  },
  {
    slug: 'table-inline-editable',
    category: 'tables',
    number: 6,
    displayName: 'Inline editable cells',
    intent:
      'Pencil affordance flips a row into edit mode where every cell becomes an input. Save/cancel chips replace the pencil. Keeps admins inside the table for routine corrections.',
    file: 'components/design/explorations/tables/Variation06.tsx',
    exportName: 'TableInlineEditable',
    tags: ['editable'],
  },
  {
    slug: 'table-card-rows',
    category: 'tables',
    number: 7,
    displayName: 'Card-style rows (no shared columns)',
    intent:
      'Each row is a self-contained card with avatar, status, meta chips, and a right-aligned value. Loses strict column alignment but gains scannability and personality.',
    file: 'components/design/explorations/tables/Variation07.tsx',
    exportName: 'TableCardRows',
    tags: ['cards'],
  },
  {
    slug: 'table-sticky-first-column',
    category: 'tables',
    number: 8,
    displayName: 'Sticky first column, wide horizontal scroll',
    intent:
      'Account column anchors to the left while quarter-by-quarter numerics scroll horizontally. Built for financial and ops tables that outgrow the viewport.',
    file: 'components/design/explorations/tables/Variation08.tsx',
    exportName: 'TableStickyFirstColumn',
    tags: ['sticky', 'scroll'],
  },
  {
    slug: 'table-zebra-grouped',
    category: 'tables',
    number: 9,
    displayName: 'Zebra striping with section group headers',
    intent:
      'Tinted group bands carve the table into sections (Active / Archived / Shared). Zebra rows inside each group make long lists easier to track without scrollbars.',
    file: 'components/design/explorations/tables/Variation09.tsx',
    exportName: 'TableZebraGrouped',
    tags: ['zebra', 'grouped'],
  },
  {
    slug: 'table-spreadsheet-grid',
    category: 'tables',
    number: 10,
    displayName: 'Spreadsheet data-grid with column resize',
    intent:
      'Monospaced cells, row numbers, lettered column headers, and a column-resize grip on hover. For accountants, analysts, and anyone who lives in Excel.',
    file: 'components/design/explorations/tables/Variation10.tsx',
    exportName: 'TableSpreadsheetGrid',
    tags: ['spreadsheet'],
  },

  // cards
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
    slug: 'card-bordered-footer-actions',
    category: 'cards',
    number: 2,
    displayName: 'Bordered card with footer actions',
    intent:
      'Header, body, and a divided footer carrying destructive plus confirm buttons. The default pattern for cards that ask the user to make a decision.',
    file: 'components/design/explorations/cards/Variation02.tsx',
    exportName: 'CardBorderedFooterActions',
    tags: ['actions', 'footer'],
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
    slug: 'card-media-led',
    category: 'cards',
    number: 4,
    displayName: 'Media-led card with image header',
    intent:
      'A full-bleed gradient or media block sits above the title — useful for marketing surfaces, agent feature announcements, or any card that benefits from a visual hook.',
    file: 'components/design/explorations/cards/Variation04.tsx',
    exportName: 'CardMediaLed',
    tags: ['media'],
  },
  {
    slug: 'card-list',
    category: 'cards',
    number: 5,
    displayName: 'List card with scrollable items and view-all',
    intent:
      'Header, a scrollable list body of homogeneous items, and a tiny "view all" link footer. The natural shape for activity feeds, recent items, and notifications.',
    file: 'components/design/explorations/cards/Variation05.tsx',
    exportName: 'CardList',
    tags: ['list', 'feed'],
  },
  {
    slug: 'card-avatar-record',
    category: 'cards',
    number: 6,
    displayName: 'Avatar-led record card with status badge',
    intent:
      'Avatar plus identity at the top, structured contact rows in the middle, two equal-weight CTAs at the bottom. Perfect for people, accounts, or vendor records.',
    file: 'components/design/explorations/cards/Variation06.tsx',
    exportName: 'CardAvatarRecord',
    tags: ['record', 'avatar'],
  },
  {
    slug: 'card-framed-action-menu',
    category: 'cards',
    number: 7,
    displayName: 'Framed card with corner action menu',
    intent:
      'Uses CardFrame to visually separate the shell chrome from the body. A three-dot menu in the corner exposes destructive and secondary actions without crowding the header.',
    file: 'components/design/explorations/cards/Variation07.tsx',
    exportName: 'CardFramedActionMenu',
    tags: ['framed'],
  },
  {
    slug: 'card-metric-comparison',
    category: 'cards',
    number: 8,
    displayName: 'Metric KPI card with comparison strip',
    intent:
      'Eyebrow, value, a 12-month mini bar chart, and a footer comparison line. A more visual cousin of the sparkline stat — great for finance and growth surfaces.',
    file: 'components/design/explorations/cards/Variation08.tsx',
    exportName: 'CardMetricComparison',
    tags: ['metric', 'kpi'],
  },
  {
    slug: 'card-callout-alert',
    category: 'cards',
    number: 9,
    displayName: 'Callout / alert card with icon',
    intent:
      'Tinted alert cards across four tones — warning, info, success, and an agent-native variant. Use sparingly to surface system status or one-off prompts.',
    file: 'components/design/explorations/cards/Variation09.tsx',
    exportName: 'CardCalloutAlert',
    tags: ['callout', 'alert'],
  },
  {
    slug: 'card-ghost-add-new',
    category: 'cards',
    number: 10,
    displayName: 'Ghost dashed add-new card',
    intent:
      'A dashed-outline button shaped like a card. Sits beside real cards in a grid and offers a clear, low-emphasis affordance for adding a new record or starting a flow.',
    file: 'components/design/explorations/cards/Variation10.tsx',
    exportName: 'CardGhostAddNew',
    tags: ['ghost', 'add'],
  },

  // dialogs
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
    slug: 'dialog-form-grid',
    category: 'dialogs',
    number: 3,
    displayName: 'Form-in-dialog with field grid',
    intent:
      'Dialog body holds a two-column field grid for create/edit flows. Header carries an icon and short context, footer surfaces a secondary metric.',
    file: 'components/design/explorations/dialogs/Variation03.tsx',
    exportName: 'DialogFormGrid',
    tags: ['form'],
  },
  {
    slug: 'dialog-full-screen',
    category: 'dialogs',
    number: 4,
    displayName: 'Full-screen dialog with side rail',
    intent:
      'Edge-to-edge surface for complex flows like onboarding. Left rail tracks step progress, right pane scrolls, footer pins primary actions.',
    file: 'components/design/explorations/dialogs/Variation04.tsx',
    exportName: 'DialogFullScreen',
    tags: ['full-screen'],
  },
  {
    slug: 'dialog-bottom-sheet',
    category: 'dialogs',
    number: 5,
    displayName: 'Bottom-sheet on desktop',
    intent:
      'Sheet anchors to the bottom edge with a grab handle. Reads as transient and modeless, ideal for quick attach / pick / share decisions.',
    file: 'components/design/explorations/dialogs/Variation05.tsx',
    exportName: 'DialogBottomSheet',
    tags: ['sheet', 'mobile'],
  },
  {
    slug: 'dialog-wizard',
    category: 'dialogs',
    number: 6,
    displayName: 'Nested two-step wizard',
    intent:
      'Same dialog frame, two screens. A stepper in the header carries progress, and prior step decisions surface as a context summary in the body.',
    file: 'components/design/explorations/dialogs/Variation06.tsx',
    exportName: 'DialogWizard',
    tags: ['wizard'],
  },
  {
    slug: 'dialog-right-drawer',
    category: 'dialogs',
    number: 7,
    displayName: 'Right-side drawer (record peek)',
    intent:
      'Right-anchored sheet that opens beside the workspace. Designed for quick record peeks — contact card, timeline, and actions without losing context.',
    file: 'components/design/explorations/dialogs/Variation07.tsx',
    exportName: 'DialogRightDrawer',
    tags: ['drawer'],
  },
  {
    slug: 'dialog-command-palette',
    category: 'dialogs',
    number: 8,
    displayName: 'Command-palette dialog',
    intent:
      'Top-anchored dialog dominated by a search field and grouped results. Doubles as a navigation, search, and agent-prompt entry point.',
    file: 'components/design/explorations/dialogs/Variation08.tsx',
    exportName: 'DialogCommandPalette',
    tags: ['command', 'palette'],
  },
  {
    slug: 'dialog-sidebar-tabs',
    category: 'dialogs',
    number: 9,
    displayName: 'Rich-content dialog with sidebar tabs',
    intent:
      'Two-pane settings dialog: tab list on the left, scrollable detail pane on the right. Used when one dialog covers many subjects.',
    file: 'components/design/explorations/dialogs/Variation09.tsx',
    exportName: 'DialogSidebarTabs',
    tags: ['settings'],
  },
  {
    slug: 'dialog-compact-popover',
    category: 'dialogs',
    number: 10,
    displayName: 'Compact toolbar dialog (popover-feel)',
    intent:
      'A small, button-anchored panel that behaves like a dialog but reads like a popover menu. Best for quick actions and contextual create flows.',
    file: 'components/design/explorations/dialogs/Variation10.tsx',
    exportName: 'DialogCompactPopover',
    tags: ['popover', 'compact'],
  },

  // toasts
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
    slug: 'toast-semantic-soft',
    category: 'toasts',
    number: 3,
    displayName: 'Soft-tint semantic alerts',
    intent:
      'Four stacked alerts using success / error / warning / info tints. Reads as inline page feedback rather than transient toast.',
    file: 'components/design/explorations/toasts/Variation03.tsx',
    exportName: 'ToastSemanticSoft',
    tags: ['semantic'],
  },
  {
    slug: 'toast-bordered-action',
    category: 'toasts',
    number: 4,
    displayName: 'Bordered with leading icon and actions',
    intent:
      'Larger card-style toast with a soft icon tile and two trailing buttons. Good fit for mention notifications and inbox-like updates.',
    file: 'components/design/explorations/toasts/Variation04.tsx',
    exportName: 'ToastBorderedAction',
    tags: ['actions'],
  },
  {
    slug: 'toast-pill',
    category: 'toasts',
    number: 5,
    displayName: 'Compact pill toasts',
    intent:
      'Tiny rounded-full pills that read as ambient confirmation. Reserved for low-stakes events like Saved, Copied, Refreshing, Back online.',
    file: 'components/design/explorations/toasts/Variation05.tsx',
    exportName: 'ToastPill',
    tags: ['pill'],
  },
  {
    slug: 'toast-progress-undo',
    category: 'toasts',
    number: 6,
    displayName: 'Progress-bar countdown with undo',
    intent:
      'Toast with a thin progress bar showing the auto-dismiss timer, plus an inline Undo affordance for reversible destructive actions.',
    file: 'components/design/explorations/toasts/Variation06.tsx',
    exportName: 'ToastProgressUndo',
    tags: ['progress', 'undo'],
  },
  {
    slug: 'toast-long-form',
    category: 'toasts',
    number: 7,
    displayName: 'Long-form notification',
    intent:
      'In-app message style: avatar, sender, title, body, structured meta, and a row of accept/decline/view actions. Lives in a notification feed feel.',
    file: 'components/design/explorations/toasts/Variation07.tsx',
    exportName: 'ToastLongForm',
    tags: ['notification'],
  },
  {
    slug: 'toast-destructive-inline',
    category: 'toasts',
    number: 8,
    displayName: 'Destructive alert with inline confirm',
    intent:
      'Toast asks the user to confirm an irreversible decision in-place — no full dialog needed. Tinted destructive surface with two responses.',
    file: 'components/design/explorations/toasts/Variation08.tsx',
    exportName: 'ToastDestructiveInline',
    tags: ['destructive'],
  },
  {
    slug: 'toast-promise',
    category: 'toasts',
    number: 9,
    displayName: 'Loading promise toast (loading → success)',
    intent:
      'Spinner-led toast that transitions into a success state. Models the sonner promise pattern visually so the design carries through both phases.',
    file: 'components/design/explorations/toasts/Variation09.tsx',
    exportName: 'ToastPromise',
    tags: ['promise', 'loading'],
  },
  {
    slug: 'toast-agent-finished',
    category: 'toasts',
    number: 10,
    displayName: 'Agent-native task-finished toast',
    intent:
      'Agent avatar, badge, summary of work performed, preview of one artifact, and a CTA to review. Designed for our agent-native moments.',
    file: 'components/design/explorations/toasts/Variation10.tsx',
    exportName: 'ToastAgentFinished',
    tags: ['agent'],
  },

  // tabs
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
    slug: 'tab-connected-cards',
    category: 'tabs',
    number: 3,
    displayName: 'Connected card-style tabs',
    intent:
      'Each tab is a top-rounded card joined to the panel below, like browser tabs. The active tab visually unifies with the panel surface.',
    file: 'components/design/explorations/tabs/Variation03.tsx',
    exportName: 'TabConnectedCards',
    tags: ['cards'],
  },
  {
    slug: 'tab-vertical-stack',
    category: 'tabs',
    number: 4,
    displayName: 'Vertical stack with descriptions',
    intent:
      'Tabs stacked vertically on the left, each with an icon, label, and a one-line hint. Best for settings-style screens with many distinct sections.',
    file: 'components/design/explorations/tabs/Variation04.tsx',
    exportName: 'TabVerticalStack',
    tags: ['vertical'],
  },
  {
    slug: 'tab-icon-count',
    category: 'tabs',
    number: 5,
    displayName: 'Icon + label with count badges',
    intent:
      'Underline tabs decorated with leading icons and tabular count pills. Optimised for filter rows over lists where each tab represents a saved view.',
    file: 'components/design/explorations/tabs/Variation05.tsx',
    exportName: 'TabIconCount',
    tags: ['icon', 'count'],
  },
  {
    slug: 'tab-route-style',
    category: 'tabs',
    number: 6,
    displayName: 'Route-like tabs with chevron affordance',
    intent:
      'Tabs that visually hint they are real navigation destinations, not in-place toggles. Useful when each tab is its own URL and you want users to know.',
    file: 'components/design/explorations/tabs/Variation06.tsx',
    exportName: 'TabRouteStyle',
    tags: ['route'],
  },
  {
    slug: 'tab-responsive-dropdown',
    category: 'tabs',
    number: 7,
    displayName: 'Tabs on desktop, dropdown on mobile',
    intent:
      'Full underline tabs at the top breakpoint and above, collapsing to a single Select on small screens. Keeps narrow viewports tidy without sacrificing affordance.',
    file: 'components/design/explorations/tabs/Variation07.tsx',
    exportName: 'TabResponsiveDropdown',
    tags: ['responsive'],
  },
  {
    slug: 'tab-cards-with-description',
    category: 'tabs',
    number: 8,
    displayName: 'Large bordered cards with descriptions',
    intent:
      'Each tab is a bordered card with an icon, label, and supporting line. Reads more like a destination grid than a tab strip — great for hub/landing screens.',
    file: 'components/design/explorations/tabs/Variation08.tsx',
    exportName: 'TabCardsWithDescription',
    tags: ['cards'],
  },
  {
    slug: 'tab-minimal-dot',
    category: 'tabs',
    number: 9,
    displayName: 'Minimalist text + moving dot indicator',
    intent:
      'No baseline, no chrome — just text labels with an animated dot under the active tab. The lightest tab pattern; works on dense pages where a baseline rule would compete with content.',
    file: 'components/design/explorations/tabs/Variation09.tsx',
    exportName: 'TabMinimalDot',
    tags: ['minimal'],
  },
  {
    slug: 'tab-with-toolbar',
    category: 'tabs',
    number: 10,
    displayName: 'Tabs combined with a contextual filter row',
    intent:
      'Tabs sit on the same row as primary actions; below them, a filter/sort/search toolbar that scopes to the active tab. The right pattern for dense list/table views.',
    file: 'components/design/explorations/tabs/Variation10.tsx',
    exportName: 'TabWithToolbar',
    tags: ['toolbar'],
  },

  // empty-states
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
    slug: 'empty-state-illustration-led',
    category: 'empty-states',
    number: 2,
    displayName: 'Illustration-led with playful shapes',
    intent:
      'Replaces the icon with a small composed illustration built from primitives — circles, cards, soft shadows. A more inviting feel for first-run and marketing surfaces.',
    file: 'components/design/explorations/empty-states/Variation02.tsx',
    exportName: 'EmptyStateIllustrationLed',
    tags: ['illustration'],
  },
  {
    slug: 'empty-state-tip-how-to',
    category: 'empty-states',
    number: 3,
    displayName: 'Tip / how-to with numbered steps',
    intent:
      'A structured "three things to do" list instead of a CTA-driven empty state. Useful when the space is empty because the user hasn\'t learned the workflow yet.',
    file: 'components/design/explorations/empty-states/Variation03.tsx',
    exportName: 'EmptyStateTipHowTo',
    tags: ['howto', 'onboarding'],
  },
  {
    slug: 'empty-state-table-row',
    category: 'empty-states',
    number: 4,
    displayName: 'Table empty row (full-width inside shell)',
    intent:
      'Lives inside a real table shell. The empty state spans every column, preserving the surrounding chrome — operators stay oriented while seeing why the list is empty.',
    file: 'components/design/explorations/empty-states/Variation04.tsx',
    exportName: 'EmptyStateTableRow',
    tags: ['table'],
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
    slug: 'empty-state-permission-locked',
    category: 'empty-states',
    number: 6,
    displayName: 'Permission / locked with key icon',
    intent:
      'A locked surface with the missing permission scope spelled out, the signed-in account shown, and primary/secondary CTAs to request access or switch users.',
    file: 'components/design/explorations/empty-states/Variation06.tsx',
    exportName: 'EmptyStatePermissionLocked',
    tags: ['permission', 'locked'],
  },
  {
    slug: 'empty-state-loading-finished',
    category: 'empty-states',
    number: 7,
    displayName: 'Loading-finished with skeleton residue',
    intent:
      'Two faint skeleton rows still visible above an "all caught up" panel. Communicates that the system did fetch — there was just nothing meaningful to show.',
    file: 'components/design/explorations/empty-states/Variation07.tsx',
    exportName: 'EmptyStateLoadingFinished',
    tags: ['caught-up'],
  },
  {
    slug: 'empty-state-getting-started',
    category: 'empty-states',
    number: 8,
    displayName: 'Getting-started checklist',
    intent:
      'A progress bar and a structured list of setup tasks. Replaces a generic empty state with momentum — every interaction in the workspace nudges the bar forward.',
    file: 'components/design/explorations/empty-states/Variation08.tsx',
    exportName: 'EmptyStateGettingStarted',
    tags: ['checklist', 'onboarding'],
  },
  {
    slug: 'empty-state-error',
    category: 'empty-states',
    number: 9,
    displayName: 'Error-empty with retry and context',
    intent:
      'When the surface is empty because something failed, not because data is missing. Surfaces a request ID, region, and timestamp for debugging plus a safe retry.',
    file: 'components/design/explorations/empty-states/Variation09.tsx',
    exportName: 'EmptyStateError',
    tags: ['error'],
  },
  {
    slug: 'empty-state-agent-prompt',
    category: 'empty-states',
    number: 10,
    displayName: 'Agent-native prompt CTA',
    intent:
      'Treats "ask the agent" as the primary action — a large prompt input with mention/attach, plus suggestion chips. The right answer when the agent is the better operator.',
    file: 'components/design/explorations/empty-states/Variation10.tsx',
    exportName: 'EmptyStateAgentPrompt',
    tags: ['agent'],
  },

  // loading
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
    slug: 'loading-inline-label',
    category: 'loading',
    number: 2,
    displayName: 'Inline spinner with text label',
    intent:
      'A rounded pill containing a small spinner plus a one-line status string. Communicates "something is happening, and here\'s what" without dominating the page.',
    file: 'components/design/explorations/loading/Variation02.tsx',
    exportName: 'LoadingInlineLabel',
    tags: ['inline'],
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
    slug: 'loading-list-skeleton',
    category: 'loading',
    number: 4,
    displayName: 'List / feed item skeletons',
    intent:
      'A vertical stack of avatar + multi-line text placeholders shaped like a notifications or activity feed. The right call when the next surface is row-shaped.',
    file: 'components/design/explorations/loading/Variation04.tsx',
    exportName: 'LoadingListSkeleton',
    tags: ['skeleton', 'list'],
  },
  {
    slug: 'loading-card-grid-skeleton',
    category: 'loading',
    number: 5,
    displayName: 'Card grid skeleton',
    intent:
      'Three-to-six card placeholders laid out in a responsive grid. Use for dashboards and any surface whose final state is a grid of cards.',
    file: 'components/design/explorations/loading/Variation05.tsx',
    exportName: 'LoadingCardGridSkeleton',
    tags: ['skeleton', 'grid'],
  },
  {
    slug: 'loading-progress-bar',
    category: 'loading',
    number: 6,
    displayName: 'Progress bars with percentage',
    intent:
      'Determinate progress bars with labels, hints, and a percentage readout. Use when you know roughly how long the operation will take and can report progress.',
    file: 'components/design/explorations/loading/Variation06.tsx',
    exportName: 'LoadingProgressBar',
    tags: ['progress'],
  },
  {
    slug: 'loading-indeterminate-shimmer',
    category: 'loading',
    number: 7,
    displayName: 'Indeterminate shimmer bar',
    intent:
      'A continuously sweeping gradient inside a thin track. Use when the operation has no known duration but you still want to signal "something is happening".',
    file: 'components/design/explorations/loading/Variation07.tsx',
    exportName: 'LoadingIndeterminateShimmer',
    tags: ['shimmer'],
  },
  {
    slug: 'loading-button-matrix',
    category: 'loading',
    number: 8,
    displayName: 'Button loading state matrix',
    intent:
      'Every button size and variant shown side-by-side in its loading state. A useful reference card for ensuring spinners replace icons cleanly at every scale.',
    file: 'components/design/explorations/loading/Variation08.tsx',
    exportName: 'LoadingButtonMatrix',
    tags: ['button', 'matrix'],
  },
  {
    slug: 'loading-skeleton-shimmer',
    category: 'loading',
    number: 9,
    displayName: 'Skeleton with shimmer accent',
    intent:
      'Showcases the default coss Skeleton shimmer in two different layouts — a profile card and a structured list. Standard look for any skeleton state.',
    file: 'components/design/explorations/loading/Variation09.tsx',
    exportName: 'LoadingSkeletonShimmer',
    tags: ['skeleton'],
  },
  {
    slug: 'loading-long-task',
    category: 'loading',
    number: 10,
    displayName: 'Long-running task panel with steps',
    intent:
      'For multi-step operations (exports, migrations, batch sends). Each step shows a state — done, running, pending — with detail copy and a connecting timeline.',
    file: 'components/design/explorations/loading/Variation10.tsx',
    exportName: 'LoadingLongTask',
    tags: ['long-task', 'steps'],
  },

  // form-layouts
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
    slug: 'form-layout-fieldset-sections',
    category: 'form-layouts',
    number: 3,
    displayName: 'Section-grouped with fieldsets',
    intent:
      'Long forms broken into legend-titled fieldsets with thin dividers. Reads as scannable groups, makes large forms feel structured rather than overwhelming.',
    file: 'components/design/explorations/form-layouts/Variation03.tsx',
    exportName: 'FormLayoutFieldsetSections',
    tags: ['fieldset'],
  },
  {
    slug: 'form-layout-inline-row',
    category: 'form-layouts',
    number: 4,
    displayName: 'Horizontal inline form',
    intent:
      'Single-row mini form for filtering or quick lookups. Equal-height controls with a primary action on the right. Used above tables and lists.',
    file: 'components/design/explorations/form-layouts/Variation04.tsx',
    exportName: 'FormLayoutInlineRow',
    tags: ['inline', 'filter'],
  },
  {
    slug: 'form-layout-compact-card',
    category: 'form-layouts',
    number: 5,
    displayName: 'Compact card-bordered form',
    intent:
      'Centered narrow card with iconographic header. Designed for sign-in, sign-up, and other focused single-step flows that take over a page.',
    file: 'components/design/explorations/form-layouts/Variation05.tsx',
    exportName: 'FormLayoutCompactCard',
    tags: ['auth', 'compact'],
  },
  {
    slug: 'form-layout-wizard',
    category: 'form-layouts',
    number: 6,
    displayName: 'Multi-step wizard with stepper',
    intent:
      'A single-pill stepper carries progress across steps; each step is its own page-level form. Heavier than a wizard dialog, used for onboarding and tax flows.',
    file: 'components/design/explorations/form-layouts/Variation06.tsx',
    exportName: 'FormLayoutWizard',
    tags: ['wizard', 'stepper'],
  },
  {
    slug: 'form-layout-modal-shape',
    category: 'form-layouts',
    number: 7,
    displayName: 'Modal-shaped form (no chrome)',
    intent:
      'Just the form — same proportions as our dialog body but rendered inline at the page level. Footer doubles as the submit row.',
    file: 'components/design/explorations/form-layouts/Variation07.tsx',
    exportName: 'FormLayoutModalShape',
    tags: ['modal-shape'],
  },
  {
    slug: 'form-layout-split-preview',
    category: 'form-layouts',
    number: 8,
    displayName: 'Split-pane with live preview',
    intent:
      'Editor on the left, live preview rendered on the right. Strong fit for content authoring — emails, notification bodies, and template editors.',
    file: 'components/design/explorations/form-layouts/Variation08.tsx',
    exportName: 'FormLayoutSplitPreview',
    tags: ['split', 'preview'],
  },
  {
    slug: 'form-layout-progressive',
    category: 'form-layouts',
    number: 9,
    displayName: 'Progressive-disclosure form',
    intent:
      'Top sections are open by default; advanced sections start collapsed. Keeps the surface short while letting power users get to depth without leaving the page.',
    file: 'components/design/explorations/form-layouts/Variation09.tsx',
    exportName: 'FormLayoutProgressive',
    tags: ['progressive'],
  },
  {
    slug: 'form-layout-review-summary',
    category: 'form-layouts',
    number: 10,
    displayName: 'Review-and-submit summary',
    intent:
      'Read-only summary of every prior step grouped by section, with quick edit links and a final commitment row. The last screen of any multi-step flow.',
    file: 'components/design/explorations/form-layouts/Variation10.tsx',
    exportName: 'FormLayoutReviewSummary',
    tags: ['review'],
  },

  // page-header
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
  {
    slug: 'page-header-with-tabs',
    category: 'page-header',
    number: 3,
    displayName: 'Title combined with tabs row',
    intent:
      'Title and primary action on the top row, in-page navigation tabs flush to the bottom edge. The right call when one resource has 3-6 sub-views (overview, jobs, invoices…).',
    file: 'components/design/explorations/page-header/Variation03.tsx',
    exportName: 'PageHeaderWithTabs',
    tags: ['tabs'],
  },
  {
    slug: 'page-header-status-meta',
    category: 'page-header',
    number: 4,
    displayName: 'Title + status badges + meta row',
    intent:
      'Title flanked by state badges and a dense meta row of owner / due date / location / id. Trades whitespace for at-a-glance situational awareness on records.',
    file: 'components/design/explorations/page-header/Variation04.tsx',
    exportName: 'PageHeaderStatusMeta',
    tags: ['status', 'meta'],
  },
  {
    slug: 'page-header-hero-stats',
    category: 'page-header',
    number: 5,
    displayName: 'Hero with description and inline stats',
    intent:
      'A larger, branded hero with description text and a four-up stats card directly below. Best for dashboard or report landing pages where the header IS the summary.',
    file: 'components/design/explorations/page-header/Variation05.tsx',
    exportName: 'PageHeaderHeroStats',
    tags: ['hero', 'stats'],
  },
  {
    slug: 'page-header-sticky-compact',
    category: 'page-header',
    number: 6,
    displayName: 'Sticky compact (collapsed-on-scroll) header',
    intent:
      'A slim 48px-tall header optimised to stay docked at the top of a long page. Truncated title, status badge, and a tight action cluster on the right.',
    file: 'components/design/explorations/page-header/Variation06.tsx',
    exportName: 'PageHeaderStickyCompact',
    tags: ['sticky'],
  },
  {
    slug: 'page-header-avatar-record',
    category: 'page-header',
    number: 7,
    displayName: 'Avatar / icon-led record header',
    intent:
      'Customer or contact-style detail with an avatar, name, status pills, and contact meta. The right pattern when the page is fundamentally about a person or entity.',
    file: 'components/design/explorations/page-header/Variation07.tsx',
    exportName: 'PageHeaderAvatarRecord',
    tags: ['record', 'avatar'],
  },
  {
    slug: 'page-header-search-led',
    category: 'page-header',
    number: 8,
    displayName: 'Search-led catalog header',
    intent:
      'Title and counts on one row, a prominent search input plus filter / sort controls on the next. Designed for catalog and listing pages where finding things is the work.',
    file: 'components/design/explorations/page-header/Variation08.tsx',
    exportName: 'PageHeaderSearchLed',
    tags: ['search', 'catalog'],
  },
  {
    slug: 'page-header-split-actions',
    category: 'page-header',
    number: 9,
    displayName: 'Split primary/secondary actions + more menu',
    intent:
      'Primary action lives in a split-button (with a dropdown for variants), secondary action sits beside it, and an overflow menu absorbs the long tail. Power-user header.',
    file: 'components/design/explorations/page-header/Variation09.tsx',
    exportName: 'PageHeaderSplitActions',
    tags: ['split-actions'],
  },
  {
    slug: 'page-header-editorial',
    category: 'page-header',
    number: 10,
    displayName: 'Editorial / publication-style header',
    intent:
      'Centered hero with kicker label, serif headline, lede paragraph, and byline. For marketing, docs, or content-led surfaces inside the admin.',
    file: 'components/design/explorations/page-header/Variation10.tsx',
    exportName: 'PageHeaderEditorial',
    tags: ['editorial'],
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
  'header-agent-prompt',
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
