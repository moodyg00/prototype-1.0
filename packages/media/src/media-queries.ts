import type { Prisma, PrismaClient } from '@prototype/db';

export type MediaListQuery = {
  source?: string;
  libraryType?: string;
  mediaKind?: string;
  categoryId?: string;
  agentId?: string;
  tag?: string;
  cursor?: string;
  limit?: number;
};

export type MediaListRow = {
  id: string;
  filename: string;
  originalFilename: string | null;
  fileUrl: string;
  storagePath: string | null;
  thumbnailUrl: string | null;
  mimeType: string;
  mediaKind: string;
  libraryType: string;
  source: string;
  sizeBytes: number | null;
  altText: string | null;
  tags: unknown;
  categoryId: string | null;
  createdAt: Date | null;
  mediaLinks: Array<{ ownerType: string; ownerId: string; role: string | null }>;
};

export function buildMediaListWhere(query: MediaListQuery): Prisma.MediaFileWhereInput {
  const and: Prisma.MediaFileWhereInput[] = [];

  if (query.source) and.push({ source: query.source });
  if (query.libraryType) and.push({ libraryType: query.libraryType });
  if (query.mediaKind) and.push({ mediaKind: query.mediaKind });
  if (query.categoryId) and.push({ categoryId: query.categoryId });

  if (query.agentId) {
    and.push({
      OR: [
        { tags: { path: ['agentId'], equals: query.agentId } },
        {
          mediaLinks: {
            some: { role: `agent:${query.agentId}` },
          },
        },
      ],
    });
  }

  if (query.tag) {
    and.push({
      OR: [
        { tags: { array_contains: [query.tag] } },
        { tags: { path: ['origin'], equals: query.tag } },
      ],
    });
  }

  if (query.cursor) {
    const [iso, id] = query.cursor.split('|');
    if (iso && id) {
      and.push({
        OR: [
          { createdAt: { lt: new Date(iso) } },
          { AND: [{ createdAt: new Date(iso) }, { id: { lt: id } }] },
        ],
      });
    }
  }

  return and.length ? { AND: and } : {};
}

export async function listMediaFilesPaginated(
  prisma: PrismaClient,
  query: MediaListQuery,
): Promise<{ items: MediaListRow[]; nextCursor: string | null; hasMore: boolean }> {
  const limit = Math.min(Math.max(query.limit ?? 40, 1), 80);
  const rows = await prisma.mediaFile.findMany({
    where: buildMediaListWhere(query),
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
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
      mediaLinks: { select: { ownerType: true, ownerId: true, role: true } },
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor =
    hasMore && last?.createdAt ? `${last.createdAt.toISOString()}|${last.id}` : null;

  return { items, nextCursor, hasMore };
}

export async function updateMediaFileMetadata(
  prisma: PrismaClient,
  id: string,
  data: { altText?: string | null; tags?: Prisma.InputJsonValue },
) {
  return prisma.mediaFile.update({
    where: { id },
    data: {
      ...(data.altText !== undefined ? { altText: data.altText } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      updatedAt: new Date(),
    },
  });
}

export async function deleteMediaFileById(prisma: PrismaClient, id: string) {
  return prisma.mediaFile.delete({ where: { id } });
}