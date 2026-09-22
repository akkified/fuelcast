import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { buildDayPlan } from '@/engine/forecast';
import { addDays, dateKey, formatClock, formatDateShort, formatDuration, formatRange, weekdayOf, WEEKDAYS_SHORT } from '@/engine/time';
import type { EventKind, Intensity, TrainingEvent } from '@/engine/types';
import { newId, useNow, useStore } from '@/state/store';
import { allWorkouts, findWorkout } from '@/state/useTraining';
import { Button, Card, Chip, Row, Screen, SectionHeader, Stepper, goBack, styles } from '@/ui/components';
import { colors, space, type, windowColor, windowIcon } from '@/ui/theme';

const KINDS: { kind: EventKind; label: string; title: string }[] = [
  { kind: 'practice', label: 'Practice', title: 'Practice' },
  { kind: 'game', label: 'Game', title: 'Game' },
  { kind: 'lift', label: 'Lift', title: 'Weight room' },
  { kind: 'conditioning', label: 'Conditioning', title: 'Conditioning' },
];
const INTENSITIES: Intensity[] = ['light', 'moderate', 'hard'];
const MIN_START = 5 * 60;
const MAX_START = 21 * 60;

export default function EventEditor() {
  const params = useLocalSearchParams<{ id?: string; kind?: string; workoutId?: string; title?: string }>();
  const id = params.id;
  const { state, upsertEvent, deleteEvent } = useStore();
  const today = dateKey(useNow());
  const existing = state.events.find((e) => e.id === id);

  const paramKind = KINDS.find((k) => k.kind === params.kind)?.kind;
  const [kind, setKind] = useState<EventKind>(existing?.kind ?? paramKind ?? 'practice');
  const [title, setTitle] = useState(existing?.title ?? params.title ?? '');
  const [workoutId, setWorkoutId] = useState<string | undefined>(existing?.workoutId ?? params.workoutId);
  const [pickWorkout, setPickWorkout] = useState(false);
  const [oneTime, setOneTime] = useState(!!existing?.date);
  const [days, setDays] = useState<number[]>(existing?.days.length ? existing.days : [weekdayOf(today)]);
  const [date, setDate] = useState(existing?.date ?? today);
  const [startMin, setStartMin] = useState(existing?.startMin ?? 15 * 60 + 30);
  const [durationMin, setDurationMin] = useState(existing?.durationMin ?? (paramKind ? 60 : 90));
  const [intensity, setIntensity] = useState<Intensity>(existing?.intensity ?? 'moderate');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const defaultTitle = KINDS.find((k) => k.kind === kind)!.title;
  const draft: TrainingEvent = {
    id: existing?.id ?? 'draft',
    title: title.trim() || defaultTitle,
    kind,
    days: oneTime ? [] : [...days].sort((a, b) => a - b),
    date: oneTime ? date : undefined,
    startMin,
    durationMin,
    intensity,
    ...(kind === 'lift' || kind === 'conditioning' ? (workoutId ? { workoutId } : {}) : {}),
  };
  const linked = findWorkout(state, workoutId);
  const preview = buildDayPlan(today, [{ ...draft, days: [], date: today }], state.profile);
  const canSave = oneTime || days.length > 0;

  const save = () => {
    upsertEvent({ ...draft, id: existing?.id ?? newId() });
    goBack();
  };

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: existing ? 'Edit session' : 'New session' }} />

      <SectionHeader title="Type" />
      <View style={styles.chipWrap}>
        {KINDS.map((k) => (
          <Chip key={k.kind} label={k.label} selected={kind === k.kind} onPress={() => setKind(k.kind)} />
        ))}
      </View>

      <SectionHeader title="Name" />
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={defaultTitle}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        maxLength={32}
      />

      <SectionHeader title="When" />
      <View style={styles.chipWrap}>
        <Chip label="Every week" selected={!oneTime} onPress={() => setOneTime(false)} />
        <Chip label="One time" selected={oneTime} onPress={() => setOneTime(true)} />
      </View>
      {oneTime ? (
        <View style={styles.chipWrap}>
          {Array.from({ length: 14 }, (_, i) => addDays(today, i)).map((d) => (
            <Chip key={d} label={d === today ? 'Today' : formatDateShort(d).replace(/^\w+ /, '')} selected={date === d} onPress={() => setDate(d)} />
          ))}
        </View>
      ) : (
        <Row style={{ gap: 6 }}>
          {WEEKDAYS_SHORT.map((label, wd) => (
            <Chip
              key={label}
              style={{ flex: 1, paddingHorizontal: 0, alignItems: 'center' }}
              label={label.slice(0, 2)}
              selected={days.includes(wd)}
              onPress={() => setDays((ds) => (ds.includes(wd) ? ds.filter((x) => x !== wd) : [...ds, wd]))}
            />
          ))}
        </Row>
      )}
      {!canSave && <Text style={[type.small, { color: colors.danger }]}>Pick at least one day.</Text>}

      <Card style={{ gap: space.lg }}>
        <Stepper
          label="Starts at"
          value={formatClock(startMin)}
          onDec={() => setStartMin((m) => Math.max(MIN_START, m - 15))}
          onInc={() => setStartMin((m) => Math.min(MAX_START, m + 15))}
        />
        <Stepper
          label="Lasts"
          value={formatDuration(durationMin)}
          onDec={() => setDurationMin((m) => Math.max(15, m - 15))}
          onInc={() => setDurationMin((m) => Math.min(240, m + 15))}
        />
      </Card>

      <SectionHeader title="Intensity" />
      <View style={styles.chipWrap}>
        {INTENSITIES.map((i) => (
          <Chip key={i} label={i[0].toUpperCase() + i.slice(1)} selected={intensity === i} onPress={() => setIntensity(i)} />
        ))}
      </View>

      {(kind === 'lift' || kind === 'conditioning') && (
        <>
          <SectionHeader title="Workout plan" />
          <Card style={{ gap: space.sm }}>
            <Text style={type.body}>{linked ? `${linked.emoji} ${linked.name}` : 'None: Smart Coach will suggest one on the day'}</Text>
            <Row style={{ gap: space.sm }}>
              <Button label={pickWorkout ? 'Done' : 'Choose'} variant="secondary" onPress={() => setPickWorkout((v) => !v)} style={{ flex: 1, paddingVertical: 10 }} />
              {linked && <Button label="Clear" variant="ghost" onPress={() => setWorkoutId(undefined)} style={{ flex: 1, paddingVertical: 10 }} />}
            </Row>
            {pickWorkout && (
              <View style={styles.chipWrap}>
                {allWorkouts(state).map((w) => (
                  <Chip key={w.id} label={`${w.emoji} ${w.name}`} selected={workoutId === w.id} onPress={() => setWorkoutId(w.id)} />
                ))}
              </View>
            )}
          </Card>
        </>
      )}

      <SectionHeader title="Your forecast for this session" />
      <Card style={{ gap: space.md }}>
        {preview.map((w) => (
          <Row key={w.id} style={{ gap: space.md }}>
            <Ionicons name={windowIcon[w.type]} size={18} color={windowColor[w.type]} />
            <Text style={[type.body, { flex: 1 }]}>{w.title}</Text>
            <Text style={type.small}>{formatRange(w.startMin, w.endMin)}</Text>
          </Row>
        ))}
      </Card>

      <Button label={existing ? 'Save changes' : 'Add to schedule'} icon="checkmark" onPress={save} disabled={!canSave} style={{ marginTop: space.md }} />
      {existing && (
        <Button
          label={confirmDelete ? 'Tap again to delete' : 'Delete session'}
          variant="danger"
          icon="trash-outline"
          onPress={() => {
            if (!confirmDelete) return setConfirmDelete(true);
            deleteEvent(existing.id);
            goBack();
          }}
        />
      )}
    </Screen>
  );
}
