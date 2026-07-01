import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

import { getAgentMediaItem, saveGeneratedVideoBuffer } from '@/lib/media/agent-media-service';
import { applySyncOffsets, renderTimelineToFile } from './ffmpeg-pipeline';
import { getTimeline, saveTimeline } from './timeline-store';

export async function runTimelineSync(agentId: string, projectId: string) {
  const project = await getTimeline(agentId, projectId);
  const synced = applySyncOffsets(project.clips, project.settings.syncMode);
  return saveTimeline({ ...project, clips: synced });
}

export async function runTimelineRender(agentId: string, projectId: string) {
  const project = await getTimeline(agentId, projectId);
  const { outputPath, usedFfmpeg, warnings } = await renderTimelineToFile({
    project,
    resolveMediaUrl: async (mediaId) => {
      const item = await getAgentMediaItem(mediaId);
      return item?.url ?? null;
    },
  });

  const buffer = await fs.readFile(outputPath);
  const generationId = randomUUID();
  const item = await saveGeneratedVideoBuffer({
    buffer,
    mimeType: 'video/mp4',
    agentId,
    prompt: `Timeline render: ${project.name}`,
    generationId,
    settings: project.settings,
  });

  await fs.unlink(outputPath).catch(() => undefined);

  return { item, usedFfmpeg, warnings, projectId: project.id };
}