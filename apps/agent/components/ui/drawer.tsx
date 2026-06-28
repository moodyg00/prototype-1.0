'use client';

import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';
import { X } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type DrawerPosition = 'bottom' | 'top' | 'left' | 'right';

const swipeDirectionMap: Record<DrawerPosition, DrawerPrimitive.Root.Props['swipeDirection']> = {
  bottom: 'down',
  top: 'up',
  left: 'left',
  right: 'right',
};

export function Drawer({
  position = 'bottom',
  swipeDirection,
  ...props
}: DrawerPrimitive.Root.Props & { position?: DrawerPosition }): ReactElement {
  return (
    <DrawerPrimitive.Root
      swipeDirection={swipeDirection ?? swipeDirectionMap[position]}
      {...props}
    />
  );
}

export const DrawerPortal = DrawerPrimitive.Portal;
export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;

export function DrawerBackdrop({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props): ReactElement {
  return (
    <DrawerPrimitive.Backdrop
      className={cn('fixed inset-0 z-[40] bg-black/45 backdrop-blur-[2px]', className)}
      {...props}
    />
  );
}

export function DrawerPopup({
  className,
  position = 'bottom',
  style,
  children,
  ...props
}: DrawerPrimitive.Popup.Props & { position?: DrawerPosition }): ReactElement {
  return (
    <DrawerPortal>
      <DrawerBackdrop />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-[41] pointer-events-none">
        <DrawerPrimitive.Popup
          className={cn(
            'pointer-events-auto absolute flex flex-col bg-[#111113] text-zinc-100 outline-none border-white/10 shadow-2xl',
            position === 'bottom' && 'inset-x-0 bottom-0 rounded-t-xl border-t',
            position === 'top' && 'inset-x-0 top-0 rounded-b-xl border-b',
            position === 'left' && 'inset-y-0 left-0 rounded-r-xl border-r max-w-md w-[85vw]',
            position === 'right' && 'inset-y-0 right-0 rounded-l-xl border-l max-w-md w-[85vw]',
            className,
          )}
          style={style}
          {...props}
        >
          {children}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

export function DrawerHeader({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return <div className={cn('flex flex-col gap-1 border-b border-white/8 px-5 py-4', className)} {...props} />;
}

export function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props): ReactElement {
  return (
    <DrawerPrimitive.Title className={cn('text-sm font-semibold tracking-tight', className)} {...props} />
  );
}

export function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props): ReactElement {
  return (
    <DrawerPrimitive.Description className={cn('text-xs text-zinc-500', className)} {...props} />
  );
}

export function DrawerPanel({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return <div className={cn('min-h-0 flex-1 overflow-auto p-5', className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div className={cn('flex items-center justify-end gap-2 border-t border-white/8 px-5 py-3', className)} {...props} />
  );
}

export function DrawerCloseButton({ className }: { className?: string }): ReactElement {
  return (
    <DrawerClose
      aria-label="Close drawer"
      render={<Button variant="ghost" size="icon" className={className} />}
    >
      <X className="h-4 w-4" />
    </DrawerClose>
  );
}