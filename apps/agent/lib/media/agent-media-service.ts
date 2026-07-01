import {
  createMediaService,
  createStorageAdapter,
  listMediaFilesPaginated,
  parseLibraryFromStoragePath,
  updateMediaFileMetadata,
  deleteMediaFileById,
  type MediaListQuery,
} from '@prototype/media';

import { prisma } from '../prisma';
import {
  AGENT_MEDIA_LIBRARY_TYPES,
  GLOBAL_AGENT_UPLOAD_OWNER_ID,
  type AgentMediaTag,
} from './agent-media-constants';

const storage = createStorageAdapter();
const mediaService = createMediaService({ prisma, storage });

export type AgentMediaItem = {
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

async function resolveUrl(row: {
  fileUrl: string;
  storagePath: string | null;
  thumbnailUrl: string | null;
}): Promise<{ url: string; thumbnailUrl: string | null }> {
  let url = row.fileUrl;
  if (row.storagePath) {
    const library = parseLibraryFromStoragePath(row.storagePath);
    if (library === 'content') {
      url = storage.getPublicUrl(row.storagePath);
    } else if (library) {
      url = await storage.getSignedUrl(row.storagePath, 600);
    }
  }
  return { url, thumbnailUrl: row.thumbnailUrl };
}

export async function listAgentMedia(query: MediaListQuery) {
  if (!prisma) {
    return { items: [] as AgentMediaItem[], nextCursor: null, hasMore: false };
  }
  const { items, nextCursor, hasMore } = await listMediaFilesPaginated(prisma, {
    ...query,
    source: query.source ?? 'agent',
  });

  const mapped = await Promise.all(
    items.map(async (row) => {
      const { url, thumbnailUrl } = await resolveUrl(row);
      return {
        id: row.id,
        filename: row.filename,
        originalFilename: row.originalFilename,
        url,
        thumbnailUrl,
        mimeType: row.mimeType,
        mediaKind: row.mediaKind,
        libraryType: row.libraryType,
        source: row.source,
        sizeBytes: row.sizeBytes,
        altText: row.altText,
        tags: (row.tags as AgentMediaTag) ?? null,
        categoryId: row.categoryId,
        createdAt: row.createdAt?.toISOString() ?? null,
      };
    }),
  );

  return { items: mapped, nextCursor, hasMore };
}

export async function uploadAgentMedia(args: {
  file: File;
  agentId: string;
  libraryType?: (typeof AGENT_MEDIA_LIBRARY_TYPES)[number];
  origin?: AgentMediaTag['origin'];
  categoryId?: string;
  tags?: string[];
}) {
  const library = args.libraryType ?? 'content';
  const tags: AgentMediaTag = {
    workspace: 'agent',
    agentId: args.agentId,
    origin: args.origin ?? 'upload',
    labels: args.tags,
  };

  const kind = args.file.type.startsWith('video/')
    ? 'video'
    : args.file.type.startsWith('image/')
      ? 'image'
      : 'file';

  if (!prisma) throw new Error('Database not configured');

  const summary = await mediaService.createMediaFromUpload({
    file: args.file,
    input: {
      library,
      ownerType: 'global_upload',
      ownerId: GLOBAL_AGENT_UPLOAD_OWNER_ID,
      kind,
      source: 'agent',
      role: `agent:${args.agentId}`,
      categoryId: args.categoryId ?? null,
      tagsRecord: tags,
    },
  });

  const row = await prisma.mediaFile.findUnique({
    where: { id: summary.id },
    select: {
      id: true,
      filename: true,
      originalFilename: true,
      fileUrl: true,
      storagePath: true,
      thumbnailUrl: true,
      mimeType: true,
      mediaKind: true,
      libraryType: true,
      source: true,
      sizeBytes: true,
      altText: true,
      tags: true,
      categoryId: true,
      createdAt: true,
    },
  });

  if (!row) throw new Error('Upload failed');
  const { url, thumbnailUrl } = await resolveUrl(row);
  return {
    id: row.id,
    filename: row.filename,
    originalFilename: row.originalFilename,
    url,
    thumbnailUrl,
    mimeType: row.mimeType,
    mediaKind: row.mediaKind,
    libraryType: row.libraryType,
    source: row.source,
    sizeBytes: row.sizeBytes,
    altText: row.altText,
    tags: (row.tags as AgentMediaTag) ?? null,
    categoryId: row.categoryId,
    createdAt: row.createdAt?.toISOString() ?? null,
  } satisfies AgentMediaItem;
}

export async function getAgentMediaItem(id: string): Promise<AgentMediaItem | null> {
  if (!prisma) return null;
  const row = await prisma.mediaFile.findUnique({
    where: { id },
    select: {
      id: true,
      filename: true,
      originalFilename: true,
      fileUrl: true,
      storagePath: true,
      thumbnailUrl: true,
      mimeType: true,
      mediaKind: true,
      libraryType: true,
      source: true,
      sizeBytes: true,
      altText: true,
      tags: true,
      categoryId: true,
      createdAt: true,
    },
  });
  if (!row || row.source !== 'agent') return null;
  const { url, thumbnailUrl } = await resolveUrl(row);
  return {
    id: row.id,
    filename: row.filename,
    originalFilename: row.originalFilename,
    url,
    thumbnailUrl,
    mimeType: row.mimeType,
    mediaKind: row.mediaKind,
    libraryType: row.libraryType,
    source: row.source,
    sizeBytes: row.sizeBytes,
    altText: row.altText,
    tags: (row.tags as AgentMediaTag) ?? null,
    categoryId: row.categoryId,
    createdAt: row.createdAt?.toISOString() ?? null,
  };
}

export async function patchAgentMedia(
  id: string,
  data: { altText?: string | null; tags?: AgentMediaTag },
) {
  if (!prisma) throw new Error('Database not configured');
  await updateMediaFileMetadata(prisma, id, {
    altText: data.altText,
    tags: data.tags as object,
  });
  return getAgentMediaItem(id);
}

export async function removeAgentMedia(id: string) {
  if (!prisma) return false;
  const row = await prisma.mediaFile.findUnique({
    where: { id },
    select: { storagePath: true, source: true },
  });
  if (!row || row.source !== 'agent') return false;
  if (row.storagePath) {
    try {
      await storage.deleteObject(row.storagePath);
    } catch {
      // continue catalog delete
    }
  }
  await deleteMediaFileById(prisma, id);
  return true;
}

export async function getMediaFacets() {
  if (!prisma) {
    return {
      libraryTypes: [...AGENT_MEDIA_LIBRARY_TYPES],
      origins: ['upload', 'generation', 'edit'] as const,
      mediaKinds: ['image', 'video', 'gif', 'file'] as const,
      categories: [] as Array<{ id: string; name: string; slug: string }>,
    };
  }
  const categories = await prisma.mediaCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });
  return {
    libraryTypes: [...AGENT_MEDIA_LIBRARY_TYPES],
    origins: ['upload', 'generation', 'edit'] as const,
    mediaKinds: ['image', 'video', 'gif', 'file'] as const,
    categories,
  };
}

export async function saveGeneratedImageBuffer(args: {
  buffer: Buffer;
  mimeType: string;
  agentId: string;
  prompt: string;
  generationId: string;
}) {
  if (!prisma) throw new Error('Database not configured');
  const tags: AgentMediaTag = {
    workspace: 'agent',
    agentId: args.agentId,
    origin: 'generation',
    generationId: args.generationId,
    labels: [args.prompt.slice(0, 80)],
  };

  const summary = await mediaService.createMediaFromBuffer({
    buffer: args.buffer,
    mimeType: args.mimeType,
    originalName: `gen-${args.generationId}.png`,
    input: {
      library: 'content',
      ownerType: 'global_upload',
      ownerId: GLOBAL_AGENT_UPLOAD_OWNER_ID,
      kind: 'image',
      source: 'agent',
      role: `agent:${args.agentId}`,
      tagsRecord: tags,
    },
  });

  return getAgentMediaItem(summary.id);
}

export async function saveGeneratedVideoBuffer(args: {
  buffer: Buffer;
  mimeType: string;
  agentId: string;
  prompt: string;
  generationId: string;
  settings: import('@prototype/ide-tools').VideoProductionSettings;
}) {
  if (!prisma) throw new Error('Database not configured');
  const tags: AgentMediaTag = {
    workspace: 'agent',
    agentId: args.agentId,
    origin: 'generation',
    generationId: args.generationId,
    modality: 'video',
    labels: [args.prompt.slice(0, 80)],
    videoProduction: args.settings,
  };

  const summary = await mediaService.createMediaFromBuffer({
    buffer: args.buffer,
    mimeType: args.mimeType,
    originalName: `gen-${args.generationId}.mp4`,
    input: {
      library: 'content',
      ownerType: 'global_upload',
      ownerId: GLOBAL_AGENT_UPLOAD_OWNER_ID,
      kind: 'video',
      source: 'agent',
      role: `agent:${args.agentId}`,
      tagsRecord: tags,
    },
  });

  return getAgentMediaItem(summary.id);
}