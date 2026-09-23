// Shared request/response bookkeeping for the pose-detection page, used by both the
// native WebView and the web iframe versions of <PoseDetector>.

import { useCallback, useImperativeHandle, useRef, type Ref } from 'react';

import type { PoseFrame } from '../engine/form';

export interface DetectedFrame extends PoseFrame {
  /** Annotated JPEG (data URL) with the skeleton drawn on. */
  thumb: string;
}

export type DetectorStatus = 'loading' | 'ready' | 'error';

export interface PoseDetectorHandle {
  /** Detect poses in still images (data: or blob: URLs), one at a time. */
  detectImages(images: { src: string; t?: number }[], onProgress?: (done: number, total: number) => void): Promise<DetectedFrame[]>;
  /** Web only: sample frames from a video inside the page. */
  detectVideo(src: string, count: number, onProgress?: (done: number, total: number) => void): Promise<DetectedFrame[]>;
}

export interface PoseDetectorProps {
  onStatus: (status: DetectorStatus, message?: string) => void;
  ref?: Ref<PoseDetectorHandle>;
}

interface Pending {
  frames: DetectedFrame[];
  resolve: (f: DetectedFrame[]) => void;
  reject: (e: Error) => void;
  onFrame?: () => void;
  timer: ReturnType<typeof setTimeout>;
}

const FRAME_TIMEOUT_MS = 30_000;
let counter = 0;

export function useDetectorBridge(send: (msg: object) => void, props: PoseDetectorProps) {
  const pending = useRef(new Map<string, Pending>());
  const ready = useRef(false);
  const readyWaiters = useRef<((ok: boolean) => void)[]>([]);

  const onRaw = useCallback(
    (raw: unknown) => {
      let m: { type?: string; id?: string; frame?: DetectedFrame; message?: string };
      try {
        m = typeof raw === 'string' ? JSON.parse(raw) : (raw as typeof m);
      } catch {
        return;
      }
      if (!m || typeof m !== 'object') return;
      if (m.type === 'ready') {
        ready.current = true;
        props.onStatus('ready');
        readyWaiters.current.splice(0).forEach((w) => w(true));
        return;
      }
      const p = m.id ? pending.current.get(m.id) : undefined;
      if (m.type === 'frame' && p && m.frame) {
        p.frames.push(m.frame);
        p.onFrame?.();
        clearTimeout(p.timer);
        p.timer = setTimeout(() => fail(m.id!, 'Pose detection timed out.'), FRAME_TIMEOUT_MS);
      } else if (m.type === 'done' && p) {
        clearTimeout(p.timer);
        pending.current.delete(m.id!);
        p.resolve(p.frames);
      } else if (m.type === 'error') {
        if (p) fail(m.id!, m.message ?? 'Pose detection failed.');
        else {
          props.onStatus('error', m.message);
          readyWaiters.current.splice(0).forEach((w) => w(false));
        }
      }
    },
    [props.onStatus],
  );

  function fail(id: string, message: string) {
    const p = pending.current.get(id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.current.delete(id);
    p.reject(new Error(message));
  }

  const waitReady = () =>
    ready.current
      ? Promise.resolve(true)
      : new Promise<boolean>((resolve) => {
          readyWaiters.current.push(resolve);
          setTimeout(() => resolve(ready.current), 60_000);
        });

  const request = async (msg: object, expected: number, onProgress?: (d: number, t: number) => void) => {
    if (!(await waitReady())) throw new Error('The pose model didn’t load. Check your internet connection and try again.');
    const id = `r${++counter}`;
    return new Promise<DetectedFrame[]>((resolve, reject) => {
      const entry: Pending = {
        frames: [],
        resolve,
        reject,
        onFrame: () => onProgress?.(entry.frames.length, expected),
        timer: setTimeout(() => fail(id, 'Pose detection timed out.'), FRAME_TIMEOUT_MS),
      };
      pending.current.set(id, entry);
      send({ fc: true, id, ...msg });
    });
  };

  useImperativeHandle(props.ref, () => ({
    async detectImages(images, onProgress) {
      const out: DetectedFrame[] = [];
      for (const img of images) {
        const frames = await request({ type: 'frame', src: img.src, t: img.t }, 1);
        out.push(...frames);
        onProgress?.(out.length, images.length);
      }
      return out;
    },
    detectVideo(src, count, onProgress) {
      return request({ type: 'video', src, count }, count, onProgress);
    },
  }));

  return onRaw;
}
