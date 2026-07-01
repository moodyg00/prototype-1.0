import type { AgentMediaTag } from '@/lib/media/agent-media-constants';

export type MediaLibraryItem = {
  id: string;
  filename: string;
  originalFilename: string | null;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  mediaKind: string;
  libraryType: string;
  source: string;
  sizeBytes: number | null;
  altText: string | null;
  tags: AgentMediaTag | null;
  categoryId: string | null;
  createdAt: string | null;
};

export type MediaLibraryFilters = {
  libraryType: string;
  categoryId: string;
  tag: string;
  agentId: string;
  mediaKind: string;
};

export const DEFAULT_MEDIA_FILTERS: MediaLibraryFilters = {
  libraryType: '',
  categoryId: '',
  tag: '',
  agentId: '',
  mediaKind: '',
};