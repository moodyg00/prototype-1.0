'use client';

import * as React from 'react';

export const ADMIN_MAIN_COLUMN_ID = 'admin-main-column';

/** Portal target for admin dialogs — the main column beside the w-64 sidebar. */
export function useAdminMainPortalContainer(): HTMLElement | null {
  const [container, setContainer] = React.useState<HTMLElement | null>(() =>
    typeof document === 'undefined' ? null : document.getElementById(ADMIN_MAIN_COLUMN_ID),
  );

  React.useLayoutEffect(() => {
    setContainer(document.getElementById(ADMIN_MAIN_COLUMN_ID));
  }, []);

  return container;
}
