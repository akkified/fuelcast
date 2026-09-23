// The pose-detection page. It runs Google MediaPipe Pose Landmarker (WebAssembly,
// GPU with CPU fallback) inside a WebView on iPhone, or an iframe on web, so
// detection happens on the device. It only downloads the library and model (the
// first time); your photos and videos never leave the phone.
//
// Protocol (JSON messages):
//   → { fc: true, type: 'frame', id, src }              detect one image (data: or blob: URL)
//   → { fc: true, type: 'video', id, src, count }       web only: sample `count` frames from a video
//   ← { type: 'loaded' } then { type: 'ready' }
//   ← { type: 'frame', id, frame: { w, h, t?, landmarks, thumb } }
//   ← { type: 'done', id }
//   ← { type: 'error', id?, message }

export const MEDIAPIPE_VERSION = '1.0.1';
export const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

export const POSE_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0B0F14">
<script type="module">
const post = (m) => {
  const s = JSON.stringify(m);
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
  else window.parent.postMessage(s, '*');
};
post({ type: 'loaded' });

let landmarker = null;
let connections = [];
const THUMB_W = 360;

async function init() {
  const base = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}';
  const { FilesetResolver, PoseLandmarker } = await import(base + '/vision_bundle.mjs');
  const fileset = await FilesetResolver.forVisionTasks(base + '/wasm');
  connections = PoseLandmarker.POSE_CONNECTIONS || [];
  let lastErr;
  for (const delegate of ['GPU', 'CPU']) {
    try {
      landmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '${POSE_MODEL_URL}', delegate },
        runningMode: 'IMAGE',
        numPoses: 1,
      });
      break;
    } catch (e) { lastErr = e; }
  }
  if (!landmarker) throw lastErr || new Error('Pose model failed to load');
  post({ type: 'ready' });
}
const ready = init().catch((e) => { post({ type: 'error', message: 'Pose model failed to load: ' + (e && e.message ? e.message : e) }); throw e; });

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = src;
  });
}

function detect(source, w, h, t) {
  const result = landmarker.detect(source);
  const lm = result.landmarks && result.landmarks[0] ? result.landmarks[0].map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility })) : null;
  // Annotated thumbnail: the frame with the detected skeleton drawn on top.
  const scale = THUMB_W / w;
  const c = document.createElement('canvas');
  c.width = THUMB_W; c.height = Math.round(h * scale);
  const ctx = c.getContext('2d');
  ctx.drawImage(source, 0, 0, c.width, c.height);
  if (lm) {
    ctx.lineWidth = 3; ctx.strokeStyle = '#C6F432'; ctx.fillStyle = '#3BA7FF';
    for (const { start, end } of connections) {
      const a = lm[start], b = lm[end];
      if (start < 11 || end < 11) continue; // skip the face
      if ((a.visibility ?? 1) < 0.3 || (b.visibility ?? 1) < 0.3) continue;
      ctx.beginPath(); ctx.moveTo(a.x * c.width, a.y * c.height); ctx.lineTo(b.x * c.width, b.y * c.height); ctx.stroke();
    }
    for (let i = 11; i < lm.length; i++) {
      if ((lm[i].visibility ?? 1) < 0.3) continue;
      ctx.beginPath(); ctx.arc(lm[i].x * c.width, lm[i].y * c.height, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  return { w, h, t, landmarks: lm, thumb: c.toDataURL('image/jpeg', 0.75) };
}

async function handle(m) {
  try {
    await ready;
    if (m.type === 'frame') {
      const img = await loadImage(m.src);
      post({ type: 'frame', id: m.id, frame: detect(img, img.naturalWidth, img.naturalHeight, m.t) });
      post({ type: 'done', id: m.id });
    } else if (m.type === 'video') {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      if (/^https?:/.test(m.src)) v.crossOrigin = 'anonymous';
      v.src = m.src;
      await new Promise((resolve, reject) => { v.onloadeddata = resolve; v.onerror = () => reject(new Error('Could not read that video')); });
      const dur = Math.min(v.duration || 0, 10);
      const count = Math.max(1, m.count || 12);
      for (let i = 0; i < count; i++) {
        const t = (dur * (i + 0.5)) / count;
        await new Promise((resolve) => { v.onseeked = resolve; v.currentTime = t; });
        post({ type: 'frame', id: m.id, frame: detect(v, v.videoWidth, v.videoHeight, t) });
      }
      post({ type: 'done', id: m.id });
    }
  } catch (e) {
    post({ type: 'error', id: m.id, message: e && e.message ? e.message : String(e) });
  }
}

window.fcHandle = handle;
const onMessage = (e) => {
  let m = e.data;
  if (typeof m === 'string') { try { m = JSON.parse(m); } catch { return; } }
  if (m && m.fc) handle(m);
};
window.addEventListener('message', onMessage);
document.addEventListener('message', onMessage);
</script>
</body></html>`;
