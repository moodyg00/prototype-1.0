import { NextResponse } from 'next/server';

import {
  addClipFromMedia,
  getTimeline,
  removeClip,
  reorderTimelineClips,
  saveTimeline,
  updateClip,
} from '@/lib/video/timeline-store';
import type { TimelineClip, VideoTimelineProject } from '@prototype/ide-tools';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId') ?? 'default';
  const projectId = searchParams.get('projectId') ?? 'default';
  const project = await getTimeline(agentId, projectId);
  return NextResponse.json({ project });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { project: VideoTimelineProject };
    if (!body.project?.agentId) {
      return NextResponse.json({ error: 'project.agentId required' }, { status: 400 });
    }
    const project = await saveTimeline(body.project);
    return NextResponse.json({ project });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save timeline';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'add_clip' | 'update_clip' | 'remove_clip' | 'reorder_clips';
      track?: 'video' | 'audio' | 'overlay';
      orderedIds?: string[];
      agentId?: string;
      projectId?: string;
      mediaId?: string;
      label?: string;
      durationMs?: number;
      clipId?: string;
      patch?: Partial<TimelineClip>;
    };
    const agentId = body.agentId ?? 'default';
    const projectId = body.projectId ?? 'default';

    if (body.action === 'add_clip' && body.mediaId) {
      const project = await addClipFromMedia({
        agentId,
        projectId,
        mediaId: body.mediaId,
        label: body.label,
        durationMs: body.durationMs,
        track: body.track,
      });
      return NextResponse.json({ project });
    }
    if (body.action === 'update_clip' && body.clipId && body.patch) {
      const project = await updateClip(agentId, projectId, body.clipId, body.patch);
      return NextResponse.json({ project });
    }
    if (body.action === 'remove_clip' && body.clipId) {
      const project = await removeClip(agentId, projectId, body.clipId);
      return NextResponse.json({ project });
    }
    if (body.action === 'reorder_clips' && body.orderedIds?.length && body.track) {
      const project = await reorderTimelineClips({
        agentId,
        projectId,
        track: body.track,
        orderedIds: body.orderedIds,
      });
      return NextResponse.json({ project });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Timeline action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}