import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { EXERCISE_BY_ID, EXERCISES, MUSCLE_LABEL, type Muscle } from '@/data/exercises';
import { estimateMinutes, GOAL_LABEL, LEVEL_LABEL, type Goal, type Level, type Workout, type WorkoutItem } from '@/data/workouts';
import { newId, useStore } from '@/state/store';
import { Button, Card, Chip, Row, Screen, SectionHeader, goBack, styles, success, tap } from '@/ui/components';
import { colors, radius, space, type } from '@/ui/theme';

const EMOJIS = ['💪', '🏋️', '⚡', '🔥', '🏃', '🧘', '🦵', '🎯', '🛡️', '⚽', '🏀', '🏈'];
const MUSCLES: Muscle[] = ['chest', 'back', 'shoulders', 'arms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'cardio'];

function SmallStepper({ value, onDec, onInc, label }: { value: string; onDec: () => void; onInc: () => void; label: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2, flex: 1 }}>
      <Text style={[type.small, { fontSize: 11 }]}>{label}</Text>
      <Row style={{ gap: 6 }}>
        <Pressable accessibilityLabel={`Less ${label}`} onPress={() => { tap(); onDec(); }} style={stepBtn} hitSlop={6}>
          <Ionicons name="remove" size={16} color={colors.text} />
        </Pressable>
        <Text style={[type.body, { fontWeight: '700', minWidth: 34, textAlign: 'center' }]}>{value}</Text>
        <Pressable accessibilityLabel={`More ${label}`} onPress={() => { tap(); onInc(); }} style={stepBtn} hitSlop={6}>
          <Ionicons name="add" size={16} color={colors.text} />
        </Pressable>
      </Row>
    </View>
  );
}
const stepBtn = { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.cardRaised, alignItems: 'center' as const, justifyContent: 'center' as const };

export default function EditWorkout() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, saveWorkout } = useStore();
  const existing = state.customWorkouts.find((w) => w.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '💪');
  const [goal, setGoal] = useState<Goal>(existing?.goal ?? state.profile.goal);
  const [level, setLevel] = useState<Level>(existing?.level ?? state.profile.level);
  const [items, setItems] = useState<WorkoutItem[]>(existing?.items.map((i) => ({ ...i })) ?? []);
  const [picking, setPicking] = useState(!existing);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => (muscle === 'all' || e.muscles.includes(muscle)) && (!q || e.name.toLowerCase().includes(q)));
  }, [query, muscle]);

  const update = (idx: number, patch: Partial<WorkoutItem>) => setItems((xs) => xs.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const move = (idx: number, dir: -1 | 1) =>
    setItems((xs) => {
      const j = idx + dir;
      if (j < 0 || j >= xs.length) return xs;
      const copy = [...xs];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });

  const add = (exerciseId: string) => {
    const ex = EXERCISE_BY_ID[exerciseId];
    tap();
    setItems((xs) => [
      ...xs,
      ex.timed
        ? { exerciseId, sets: 2, reps: 30, restSec: 30 }
        : ex.type === 'mobility'
          ? { exerciseId, sets: 1, reps: 8, restSec: 0 }
          : { exerciseId, sets: 3, reps: ex.type === 'power' ? 5 : 10, restSec: ex.type === 'core' ? 30 : 75 },
    ]);
  };

  const canSave = items.length > 0;
  const save = () => {
    const w: Workout = {
      id: existing?.id ?? newId(),
      name: name.trim() || 'My Workout',
      emoji,
      goal,
      level,
      durationMin: estimateMinutes(items),
      description: existing?.description ?? 'A custom workout.',
      items,
      custom: true,
      ...(existing?.source ? { source: existing.source } : {}),
    };
    saveWorkout(w);
    success();
    if (existing) goBack();
    else router.replace({ pathname: '/workout/[id]', params: { id: w.id } });
  };

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: existing ? 'Edit workout' : 'New workout' }} />
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Workout name"
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        maxLength={40}
      />
      <View style={styles.chipWrap}>
        {EMOJIS.map((e) => (
          <Chip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />
        ))}
      </View>
      <SectionHeader title="Goal" />
      <View style={styles.chipWrap}>
        {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
          <Chip key={g} label={GOAL_LABEL[g]} selected={goal === g} onPress={() => setGoal(g)} />
        ))}
      </View>
      <SectionHeader title="Level" />
      <View style={styles.chipWrap}>
        {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
          <Chip key={l} label={LEVEL_LABEL[l]} selected={level === l} onPress={() => setLevel(l)} />
        ))}
      </View>

      <SectionHeader title={`Exercises (${items.length}) · ~${estimateMinutes(items)} min`} />
      {items.length === 0 && <Text style={type.dim}>Add exercises from the library below.</Text>}
      {items.map((it, idx) => {
        const ex = EXERCISE_BY_ID[it.exerciseId];
        return (
          <Card key={`${it.exerciseId}-${idx}`} style={{ gap: space.sm, padding: space.md }}>
            <Row style={{ gap: space.sm }}>
              <Text style={[type.body, { fontWeight: '700', flex: 1 }]} numberOfLines={1}>
                {idx + 1}. {ex.name}
              </Text>
              <Pressable accessibilityLabel="Move up" onPress={() => move(idx, -1)} hitSlop={8}>
                <Ionicons name="chevron-up" size={20} color={idx === 0 ? colors.border : colors.textDim} />
              </Pressable>
              <Pressable accessibilityLabel="Move down" onPress={() => move(idx, 1)} hitSlop={8}>
                <Ionicons name="chevron-down" size={20} color={idx === items.length - 1 ? colors.border : colors.textDim} />
              </Pressable>
              <Pressable accessibilityLabel={`Remove ${ex.name}`} onPress={() => setItems((xs) => xs.filter((_, i) => i !== idx))} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={colors.avoid} />
              </Pressable>
            </Row>
            <Row>
              <SmallStepper label="Sets" value={String(it.sets)} onDec={() => update(idx, { sets: Math.max(1, it.sets - 1) })} onInc={() => update(idx, { sets: Math.min(8, it.sets + 1) })} />
              <SmallStepper
                label={ex.timed ? 'Seconds' : 'Reps'}
                value={String(it.reps)}
                onDec={() => update(idx, { reps: Math.max(1, it.reps - (ex.timed ? 5 : 1)) })}
                onInc={() => update(idx, { reps: Math.min(ex.timed ? 600 : 30, it.reps + (ex.timed ? 5 : 1)) })}
              />
              <SmallStepper label="Rest (s)" value={String(it.restSec)} onDec={() => update(idx, { restSec: Math.max(0, it.restSec - 15) })} onInc={() => update(idx, { restSec: Math.min(300, it.restSec + 15) })} />
            </Row>
          </Card>
        );
      })}

      <Button label={picking ? 'Hide exercise library' : 'Add exercises'} icon={picking ? 'chevron-up' : 'add'} variant="secondary" onPress={() => setPicking((p) => !p)} />
      {picking && (
        <Card style={{ gap: space.sm }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCorrect={false}
          />
          <View style={styles.chipWrap}>
            <Chip label="All" selected={muscle === 'all'} onPress={() => setMuscle('all')} />
            {MUSCLES.map((m) => (
              <Chip key={m} label={MUSCLE_LABEL[m]} selected={muscle === m} onPress={() => setMuscle(m)} />
            ))}
          </View>
          {results.map((e) => (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={`Add ${e.name}`}
              onPress={() => add(e.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                padding: space.sm,
                borderRadius: radius.sm,
                backgroundColor: pressed ? colors.cardRaised : 'transparent',
              })}
            >
              <Ionicons name="add-circle" size={22} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={type.body}>{e.name}</Text>
                <Text style={type.small}>
                  {e.muscles.map((m) => MUSCLE_LABEL[m]).join(', ')} · {e.equipment}
                </Text>
              </View>
            </Pressable>
          ))}
        </Card>
      )}

      <Button label="Save workout" icon="checkmark" onPress={save} disabled={!canSave} style={{ marginTop: space.md }} />
    </Screen>
  );
}
