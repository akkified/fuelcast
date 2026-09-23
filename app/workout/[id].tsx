import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { EQUIPMENT_LABEL, EXERCISE_BY_ID, MUSCLE_LABEL, type Muscle } from '@/data/exercises';
import { GOAL_LABEL, LEVEL_LABEL, workoutEquipment } from '@/data/workouts';
import { displayWeight, readiness, suggestLoad, workoutReadiness } from '@/engine/coach';
import { movementForExercise } from '@/engine/form';
import { dateKey } from '@/engine/time';
import { newId, useNow, useStore } from '@/state/store';
import { findWorkout } from '@/state/useTraining';
import { Button, Card, Pill, ProgressBar, Row, Screen, SectionHeader, goBack, tap } from '@/ui/components';
import { colors, space, type } from '@/ui/theme';

const readyColor = (r: number) => (r >= 0.7 ? colors.great : r >= 0.4 ? colors.warn : colors.avoid);

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, saveWorkout, deleteWorkout } = useStore();
  const now = useNow();
  const w = findWorkout(state, id);
  const [open, setOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!w) {
    return (
      <Screen safeTop={false}>
        <Text style={type.h2}>This workout was deleted.</Text>
        <Button label="Back" onPress={goBack} />
      </Screen>
    );
  }

  const r = readiness(state.workoutLogs, state.events, dateKey(now), now.getTime());
  const muscles = [...new Set(w.items.flatMap((it) => EXERCISE_BY_ID[it.exerciseId]?.muscles ?? []))] as Muscle[];
  const ready = workoutReadiness(w, r);
  const equipment = workoutEquipment(w);

  const customize = () => {
    const copy = { ...w, id: newId(), name: `${w.name} (my version)`, custom: true, source: undefined, items: w.items.map((i) => ({ ...i })) };
    saveWorkout(copy);
    router.replace({ pathname: '/workout/edit', params: { id: copy.id } });
  };

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: w.name }} />
      <Row style={{ gap: space.md }}>
        <Text style={{ fontSize: 44 }}>{w.emoji}</Text>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={type.h1}>{w.name}</Text>
          <Text style={type.dim}>
            {GOAL_LABEL[w.goal]} · {LEVEL_LABEL[w.level]} · ~{w.durationMin} min
          </Text>
        </View>
      </Row>
      <Text style={type.body}>{w.description}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {equipment.map((e) => (
          <Pill key={e} label={EQUIPMENT_LABEL[e]} color={colors.text} />
        ))}
      </View>

      <Card style={{ gap: space.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={type.label}>Readiness for this workout</Text>
          <Text style={[type.h2, { color: readyColor(ready) }]}>{Math.round(ready * 100)}%</Text>
        </Row>
        <ProgressBar progress={ready} color={readyColor(ready)} />
        <Text style={type.small}>
          {muscles.map((m) => `${MUSCLE_LABEL[m]} ${Math.round(r[m] * 100)}%`).join(' · ')}
        </Text>
      </Card>

      <Button label="Start workout" icon="play" onPress={() => router.push({ pathname: '/workout/session', params: { id: w.id } })} />

      <SectionHeader title={`${w.items.length} exercises`} />
      {w.items.map((it, idx) => {
        const ex = EXERCISE_BY_ID[it.exerciseId];
        if (!ex) return null;
        const load = suggestLoad(ex.id, state.workoutLogs, state.profile.units);
        const key = `${it.exerciseId}-${idx}`;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            onPress={() => {
              tap();
              setOpen(open === key ? null : key);
            }}
          >
            <Card style={{ gap: 4, padding: space.md }}>
              <Row style={{ justifyContent: 'space-between', gap: space.sm }}>
                <Text style={[type.body, { fontWeight: '700', flex: 1 }]}>
                  {idx + 1}. {ex.name}
                </Text>
                <Text style={[type.body, { color: colors.accent, fontWeight: '700' }]}>
                  {it.sets} × {it.reps}
                  {ex.timed ? 's' : ''}
                </Text>
              </Row>
              <Text style={type.small}>
                {ex.muscles.map((m) => MUSCLE_LABEL[m]).join(', ')} · rest {it.restSec}s{it.note ? ` · ${it.note}` : ''}
              </Text>
              {load && (
                <Text style={[type.small, { color: colors.great }]}>
                  Suggested: {displayWeight(load.weightKg, state.profile.units)}. {load.note}
                </Text>
              )}
              {open === key && <Text style={[type.dim, { marginTop: 4 }]}>💡 {ex.cue}</Text>}
              {movementForExercise(ex.id) && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Check my ${ex.name} form`}
                  hitSlop={8}
                  onPress={() => router.push({ pathname: '/form', params: { movement: movementForExercise(ex.id)!.id } })}
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                >
                  <Text style={[type.small, { color: colors.accent, fontWeight: '700' }]}>📸 Check my form</Text>
                </Pressable>
              )}
            </Card>
          </Pressable>
        );
      })}
      <Text style={type.small}>Tap an exercise for coaching cues. Warm up for 5–10 minutes first, and stop if anything hurts.</Text>

      <View style={{ gap: space.sm, marginTop: space.md }}>
        <Button
          label="Add to my schedule"
          icon="calendar"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/event',
              params: { kind: w.goal === 'conditioning' ? 'conditioning' : 'lift', workoutId: w.id, title: w.name },
            })
          }
        />
        {w.custom ? (
          <>
            <Button label="Edit workout" icon="pencil" variant="secondary" onPress={() => router.push({ pathname: '/workout/edit', params: { id: w.id } })} />
            <Button
              label={confirmDelete ? 'Tap again to delete' : 'Delete workout'}
              icon="trash-outline"
              variant="danger"
              onPress={() => {
                if (!confirmDelete) return setConfirmDelete(true);
                deleteWorkout(w.id);
                goBack();
              }}
            />
          </>
        ) : (
          <Button label="Customize a copy" icon="copy-outline" variant="secondary" onPress={customize} />
        )}
      </View>
    </Screen>
  );
}
