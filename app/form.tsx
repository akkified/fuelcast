import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Text, View } from 'react-native';

import { askFormFeedback, CoachError } from '@/ai/coach';
import { getApiKey } from '@/ai/key';
import { analyzeForm, MOVEMENT_BY_ID, MOVEMENTS, type CheckStatus, type FormReport, type MovementId } from '@/engine/form';
import { dateKey } from '@/engine/time';
import type { DetectedFrame, DetectorStatus, PoseDetectorHandle } from '@/form/bridge';
import { extractFrames, type PickedMedia } from '@/form/frames';
import { PoseDetector } from '@/form/PoseDetector';
import { newId, useStore } from '@/state/store';
import { Button, Card, ProgressBar, Ring, Row, Screen, SectionHeader, success } from '@/ui/components';
import { colors, radius, space, type } from '@/ui/theme';

const STATUS_ICON: Record<CheckStatus, { name: 'checkmark-circle' | 'alert-circle' | 'close-circle'; color: string }> = {
  good: { name: 'checkmark-circle', color: colors.great },
  warn: { name: 'alert-circle', color: colors.warn },
  bad: { name: 'close-circle', color: colors.avoid },
};

const isMovement = (m?: string): m is MovementId => !!m && m in MOVEMENT_BY_ID;

export default function FormCheckScreen() {
  const params = useLocalSearchParams<{ movement?: string; testImage?: string; testVideo?: string }>();
  const { addFormCheck } = useStore();
  const [movementId, setMovementId] = useState<MovementId | undefined>(isMovement(params.movement) ? params.movement : undefined);
  const detector = useRef<PoseDetectorHandle>(null);
  const [engine, setEngine] = useState<{ status: DetectorStatus; message?: string }>({ status: 'loading' });
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });
  const [report, setReport] = useState<FormReport | null>(null);
  const [frames, setFrames] = useState<DetectedFrame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [ai, setAi] = useState<{ loading: boolean; text?: string; error?: string }>({ loading: false });

  useEffect(() => {
    getApiKey().then(setApiKey);
  }, []);

  const onStatus = useCallback((status: DetectorStatus, message?: string) => setEngine({ status, message }), []);
  const movement = movementId ? MOVEMENT_BY_ID[movementId] : undefined;

  const run = useCallback(
    async (media: PickedMedia) => {
      if (!movementId || !detector.current) return;
      setWorking(true);
      setError(null);
      setReport(null);
      setAi({ loading: false });
      try {
        setProgress({ done: 0, total: 0, label: 'Getting frames ready…' });
        const images = await extractFrames(media);
        const onProgress = (done: number, total: number) => setProgress({ done, total, label: 'Finding your joints…' });
        let detected: DetectedFrame[];
        if (images === null) detected = await detector.current.detectVideo(media.uri, 12, onProgress);
        else {
          if (images.length === 0) throw new Error('I couldn’t read any frames from that video. Try recording again.');
          detected = await detector.current.detectImages(images, onProgress);
        }
        const r = analyzeForm(movementId, detected);
        setFrames(detected);
        setReport(r);
        if (r.ok) {
          success();
          addFormCheck({
            id: newId(),
            movement: movementId,
            score: r.score,
            date: dateKey(new Date()),
            at: Date.now(),
            topCue: r.topCue,
            checks: r.checks.map((c) => ({ label: c.label, status: c.status })),
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong analyzing that clip.');
      } finally {
        setWorking(false);
      }
    },
    [movementId, addFormCheck],
  );

  // Development shortcut: /form?movement=squat&testImage=<url> (or &testVideo=<url>) analyzes a sample clip.
  useEffect(() => {
    const src = params.testVideo ?? params.testImage;
    if (__DEV__ && src && engine.status === 'ready' && movementId && !report && !working) {
      run({ uri: src, type: params.testVideo ? 'video' : 'image' });
    }
    // Run once when the engine becomes ready.
  }, [engine.status]);

  const pick = async (kind: 'camera' | 'video' | 'photo') => {
    setError(null);
    let res: ImagePicker.ImagePickerResult;
    if (kind === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Camera access is off. Turn it on in Settings, or choose a video you already recorded.');
        return;
      }
      res = await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 10, quality: 0.7 });
    } else {
      res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: kind === 'video' ? ['videos'] : ['images'],
        videoMaxDuration: 10,
        quality: 0.8,
      });
    }
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    const isVideo = a.type === 'video' || (a.mimeType?.startsWith('video') ?? false) || kind !== 'photo';
    run({ uri: a.uri, type: isVideo ? 'video' : 'image', duration: a.duration });
  };

  const askAi = async () => {
    if (!apiKey || !report || !movement) return;
    const frame = frames[report.keyFrame];
    setAi({ loading: true });
    try {
      const text = await askFormFeedback({
        apiKey,
        movementName: movement.name,
        summary: report.checks.map((c) => `${c.label}: ${c.status}${c.value ? ` (${c.value})` : ''}. ${c.detail}`).join('\n'),
        imageDataUrl: frame.thumb,
      });
      setAi({ loading: false, text });
    } catch (e) {
      setAi({ loading: false, error: e instanceof CoachError ? e.message : 'The coach couldn’t review this one.' });
    }
  };

  const key = report?.ok ? frames[report.keyFrame] : undefined;

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: movement ? `${movement.name} check` : 'Form Check' }} />
      <PoseDetector ref={detector} onStatus={onStatus} />

      {!movement ? (
        <>
          <Text style={type.h2}>What are you checking?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {MOVEMENTS.map((m) => (
              <Card key={m.id} onPress={() => setMovementId(m.id)} style={{ width: '48%', gap: 4, padding: space.md }}>
                <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                <Text style={[type.body, { fontWeight: '700' }]}>{m.name}</Text>
                <Text style={type.small}>{m.view === 'side' ? 'Side view' : 'Front view'}</Text>
              </Card>
            ))}
          </View>
        </>
      ) : (
        <>
          <Card style={{ gap: space.sm }}>
            <Row style={{ gap: space.md }}>
              <Text style={{ fontSize: 34 }}>{movement.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={type.h2}>{movement.name}</Text>
                <Text style={type.small}>{movement.view === 'side' ? '📱 Film from the side' : '📱 Film from the front'}</Text>
              </View>
              {!params.movement && <Button label="Change" variant="ghost" onPress={() => { setMovementId(undefined); setReport(null); }} style={{ paddingVertical: 4 }} />}
            </Row>
            <Text style={type.body}>{movement.setup}</Text>
            <Text style={type.small}>Tips: good light, plain background, and prop the phone up (or ask a teammate to film). Clips up to 10 seconds.</Text>
          </Card>

          {!working && (
            <View style={{ gap: space.sm }}>
              {Platform.OS !== 'web' && <Button label="Record a video" icon="videocam" onPress={() => pick('camera')} />}
              <Button label="Choose a video" icon="film-outline" variant={Platform.OS === 'web' ? 'primary' : 'secondary'} onPress={() => pick('video')} />
              <Button label="Choose a photo" icon="image-outline" variant="secondary" onPress={() => pick('photo')} />
            </View>
          )}

          <Row style={{ gap: space.sm }}>
            {engine.status === 'loading' && <ActivityIndicator size="small" color={colors.textDim} />}
            <Ionicons
              name={engine.status === 'ready' ? 'hardware-chip-outline' : engine.status === 'error' ? 'cloud-offline-outline' : 'download-outline'}
              size={14}
              color={engine.status === 'error' ? colors.danger : colors.textDim}
            />
            <Text style={[type.small, { flex: 1 }, engine.status === 'error' && { color: colors.danger }]}>
              {engine.status === 'ready'
                ? 'Pose model ready. Your video is analyzed on this phone and never uploaded.'
                : engine.status === 'error'
                  ? `${engine.message ?? 'The pose model couldn’t load.'} It needs internet the first time.`
                  : 'Loading the pose model (the first time needs internet)…'}
            </Text>
          </Row>

          {working && (
            <Card style={{ gap: space.sm }}>
              <Row style={{ gap: space.sm }}>
                <ActivityIndicator color={colors.accent} />
                <Text style={type.body}>{progress.label || 'Analyzing…'}</Text>
              </Row>
              {progress.total > 0 && <ProgressBar progress={progress.done / progress.total} />}
            </Card>
          )}

          {error && (
            <Card style={{ borderColor: colors.danger }}>
              <Text style={[type.body, { color: colors.danger }]}>{error}</Text>
            </Card>
          )}

          {report && !report.ok && (
            <Card style={{ gap: space.sm, borderColor: colors.warn }}>
              <Text style={type.h2}>{report.verdict}</Text>
              <Text style={type.body}>{report.message}</Text>
              {frames[0]?.thumb ? (
                <Image source={{ uri: frames[0].thumb }} style={{ width: '100%', aspectRatio: frames[0].w / frames[0].h, borderRadius: radius.md }} resizeMode="contain" />
              ) : null}
            </Card>
          )}

          {report?.ok && key && (
            <>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
                <Ring progress={report.score / 100} size={96} stroke={9} color={report.score >= 85 ? colors.great : report.score >= 65 ? colors.warn : colors.avoid}>
                  <Text style={[type.h1, { fontSize: 26 }]}>{report.score}</Text>
                  <Text style={type.small}>Form</Text>
                </Ring>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={type.h2}>{report.verdict}</Text>
                  <Text style={type.small}>
                    {key.t !== undefined ? `Graded at ${key.t.toFixed(1)} s · ` : ''}
                    {report.framesWithPose} {report.framesWithPose === 1 ? 'frame' : 'frames'} analyzed
                  </Text>
                </View>
              </Card>

              {report.viewNote && (
                <Card style={{ flexDirection: 'row', gap: space.sm, borderColor: colors.warn, padding: space.md }}>
                  <Ionicons name="videocam-outline" size={20} color={colors.warn} />
                  <Text style={[type.dim, { flex: 1 }]}>{report.viewNote}</Text>
                </Card>
              )}

              <Image
                source={{ uri: key.thumb }}
                accessibilityLabel="Your frame with the detected skeleton"
                style={{ width: '100%', aspectRatio: key.w / key.h, maxHeight: 460, borderRadius: radius.lg, backgroundColor: colors.card }}
                resizeMode="contain"
              />

              <Card style={{ gap: space.sm, borderColor: colors.accent }}>
                <Text style={type.label}>Focus on this</Text>
                <Text style={type.h2}>{report.topCue}</Text>
              </Card>

              <SectionHeader title="What we measured" />
              {report.checks.map((c) => (
                <Card key={c.label} style={{ flexDirection: 'row', gap: space.md, padding: space.md, alignItems: 'flex-start' }}>
                  <Ionicons name={STATUS_ICON[c.status].name} size={24} color={STATUS_ICON[c.status].color} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={[type.body, { fontWeight: '700' }]}>{c.label}</Text>
                      {c.value && <Text style={[type.small, { color: STATUS_ICON[c.status].color }]}>{c.value}</Text>}
                    </Row>
                    <Text style={type.dim}>{c.detail}</Text>
                  </View>
                </Card>
              ))}

              <SectionHeader title="Coach’s take" />
              <Card style={{ gap: space.sm }}>
                {ai.text ? (
                  <>
                    <Row style={{ gap: 6 }}>
                      <Ionicons name="sparkles" size={12} color={colors.recovery} />
                      <Text style={[type.small, { fontSize: 11 }]}>AI Coach · Claude</Text>
                    </Row>
                    <Text style={type.body}>{ai.text}</Text>
                  </>
                ) : apiKey ? (
                  <>
                    <Text style={type.dim}>Send this one frame (with the skeleton) and the measurements to the AI Coach for personal cues.</Text>
                    <Button label={ai.loading ? 'Asking the coach…' : 'Get AI Coach feedback'} icon="sparkles" variant="secondary" disabled={ai.loading} onPress={askAi} />
                    {ai.error && <Text style={[type.small, { color: colors.danger }]}>{ai.error}</Text>}
                  </>
                ) : (
                  <Text style={type.dim}>Connect Claude in Settings → AI Coach to get a coach’s take on this frame. The measurements above work without it.</Text>
                )}
              </Card>

              <Text style={type.small}>Form Check is a coaching aid based on 2D video, not a medical assessment. If anything hurts, stop and see your athletic trainer.</Text>
            </>
          )}

          {report && !working && <Button label="Check another clip" icon="refresh" variant="secondary" onPress={() => { setReport(null); setFrames([]); setAi({ loading: false }); }} />}
        </>
      )}
    </Screen>
  );
}
