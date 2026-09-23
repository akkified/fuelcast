// Web: runs the pose page in a hidden iframe (same code as the iPhone WebView).

import { useEffect, useRef } from 'react';

import { useDetectorBridge, type PoseDetectorProps } from './bridge';
import { POSE_HTML } from './poseHtml';

export function PoseDetector(props: PoseDetectorProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const onRaw = useDetectorBridge((msg) => frame.current?.contentWindow?.postMessage(JSON.stringify(msg), '*'), props);

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow) onRaw(e.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onRaw]);

  return (
    <iframe
      ref={frame}
      title="pose-detector"
      srcDoc={POSE_HTML}
      style={{ width: 1, height: 1, opacity: 0, position: 'absolute', border: 0, pointerEvents: 'none' }}
    />
  );
}
