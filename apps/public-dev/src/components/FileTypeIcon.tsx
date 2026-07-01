'use client';

import {
  DefaultFolderOpenedIcon,
  FileIcon,
  FolderIcon,
  getIconForFolder,
  DefaultFolderIcon,
} from '@react-symbols/icons/utils';

const ICON_SIZE = 14;

const iconProps = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  className: 'shrink-0',
};

export function FileTypeIcon({ fileName }: { fileName: string }) {
  return <FileIcon fileName={fileName} autoAssign {...iconProps} />;
}

export function FolderTypeIcon({ folderName, open }: { folderName: string; open: boolean }) {
  if (open) {
    const closed = getIconForFolder({ folderName, ...iconProps });
    const isGeneric = closed.type === DefaultFolderIcon;
    if (isGeneric) {
      return <DefaultFolderOpenedIcon {...iconProps} />;
    }
  }

  return <FolderIcon folderName={folderName} {...iconProps} />;
}
