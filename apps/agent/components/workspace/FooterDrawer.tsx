'use client';

import { ChevronUp } from 'lucide-react';
import { PanelContent } from '@/components/PanelContent';
import {
  Drawer,
  DrawerCloseButton,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { getTool } from '@/lib/tools';

export function FooterDrawer() {
  const { session, setDrawerOpen, activeLayout, insets } = useWorkspace();
  const tools = activeLayout.drawerTools;

  return (
    <>
      <button
        type="button"
        className="footer-drawer-trigger fixed left-1/2 z-[35] flex h-7 w-10 -translate-x-1/2 items-center justify-center rounded-t-md border border-b-0 border-white/12 bg-[#111113] text-zinc-400 hover:text-zinc-100"
        style={{ bottom: insets.bottom }}
        onClick={() => setDrawerOpen(true)}
        aria-label="Open drawer"
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      <Drawer open={session.drawerOpen} onOpenChange={setDrawerOpen} position="bottom">
        <DrawerPopup position="bottom" style={{ height: '33vh', maxHeight: '33vh' }}>
          <DrawerHeader>
            <DrawerTitle>Workspace drawer</DrawerTitle>
            <DrawerDescription>
              Bottom workspace zone. Covers pinned bottom chrome while open.
            </DrawerDescription>
            <DrawerCloseButton />
          </DrawerHeader>
          <DrawerPanel>
            {tools.length === 0 ? (
              <div className="text-sm text-zinc-500">Drawer is empty for this workspace.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {tools.map((toolId) => {
                  const tool = getTool(toolId);
                  return (
                    <div key={toolId} className="rounded-lg border border-white/10 bg-[#0d0d0f] p-3">
                      <div className="mb-2 text-xs font-medium text-zinc-300">{tool.label}</div>
                      <div className="h-48 overflow-hidden rounded border border-white/8">
                        <PanelContent toolId={toolId} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
    </>
  );
}