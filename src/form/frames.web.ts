// Web: photos are passed straight through; videos are sampled inside the pose page.

export interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  duration?: number | null;
}

export async function extractFrames(media: PickedMedia): Promise<{ src: string; t?: number }[] | null> {
  if (media.type === 'image') return [{ src: media.uri }];
  return null;
}
