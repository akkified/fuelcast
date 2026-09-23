// iPhone / Android: turn a picked photo or video into small JPEG frames (data URLs)
// for the pose page. Videos are sampled evenly over their first 10 seconds.

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';

export interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  /** Milliseconds, for videos. */
  duration?: number | null;
}

const MAX_W = 480;

async function toDataUrl(uri: string): Promise<string> {
  const ref = await ImageManipulator.manipulate(uri).resize({ width: MAX_W }).renderAsync();
  const out = await ref.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
  return `data:image/jpeg;base64,${out.base64}`;
}

/** Returns frames to detect, or null when the page should sample the video itself (web only). */
export async function extractFrames(media: PickedMedia, count = 12): Promise<{ src: string; t?: number }[] | null> {
  if (media.type === 'image') return [{ src: await toDataUrl(media.uri) }];
  const durationMs = Math.min(media.duration && media.duration > 0 ? media.duration : 5000, 10_000);
  const frames: { src: string; t?: number }[] = [];
  for (let i = 0; i < count; i++) {
    const time = Math.round((durationMs * (i + 0.5)) / count);
    try {
      const thumb = await VideoThumbnails.getThumbnailAsync(media.uri, { time, quality: 0.6 });
      frames.push({ src: await toDataUrl(thumb.uri), t: time / 1000 });
    } catch {
      // Skip frames the decoder can't produce (e.g. past the end of a short clip).
    }
  }
  return frames;
}
