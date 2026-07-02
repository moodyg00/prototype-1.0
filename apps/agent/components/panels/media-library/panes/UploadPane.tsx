'use client';

import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useMediaLibrary } from '../MediaLibraryProvider';

export function UploadPane({ context }: { context: PaneRenderContext }) {
  const { triggerUploadPicker, upload } = useMediaLibrary();
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void upload(file);
    },
    [upload],
  );

  return (
    <div
      className="flex h-full min-h-0 flex-col items-center justify-center gap-2 bg-zinc-950 p-3"
      data-pane-instance={context.instanceId}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <button
        type="button"
        onClick={triggerUploadPicker}
        className={`flex flex-1 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center transition ${
          dragOver ? 'border-violet-400/60 bg-violet-500/10' : 'border-white/15 hover:border-white/30'
        }`}
      >
        <Upload size={18} className="text-violet-300" />
        <span className="text-[11px] font-medium text-zinc-200">Upload media</span>
        <span className="text-[10px] text-zinc-500">Click or drop a file</span>
      </button>
    </div>
  );
}
