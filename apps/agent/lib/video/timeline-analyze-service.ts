import { getAgentMediaItem } from '@/lib/media/agent-media-service';
import { analyzePrimaryAudioOnTimeline } from './audio-analysis';
import { downloadToTemp } from './ffmpeg-pipeline';
import { getTimeline, saveTimeline } from './timeline-store';

export async function runTimelineAnalyze(agentId: string, projectId: string) {
  const project = await getTimeline(agentId, projectId);
  const durationMs = Math.max(project.durationMs, 6000);

  const audioClip = project.clips.find((c) => c.track === 'audio') ?? project.clips[0];
  const analysis = await analyzePrimaryAudioOnTimeline({
    durationMs,
    bpmFallback: project.settings.bpm,
    resolveFirstAudioPath: async () => {
      if (!audioClip) return null;
      const item = await getAgentMediaItem(audioClip.mediaId);
      if (!item?.url) return null;
      return downloadToTemp(item.url, item.mimeType.startsWith('audio/') ? '.wav' : '.mp4');
    },
  });

  return saveTimeline({ ...project, analysis });
}