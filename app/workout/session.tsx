import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { EXERCISE_BY_ID, type Equipment } from '@/data/exercises';
import { displayWeight, suggestLoad } from '@/engine/coach';
import { LB_PER_KG } from '@/engine/hydration';
import { dateKey } from '@/engine/time';
import type { SetLog, Units } from '@/engine/types';
import { newId, useNow, useStore } from '@/state/store';
import { findWorkout } from '@/state/useTraining';
import { Button, Card, ProgressBar, Row, Screen, goBack, success, tap } from '@/ui/components';
import { colors, radius, space, type } from '@/ui/theme';

const WEIGHTED: Equipment[] = ['dumbbells', 'barbell', 'machine', 'kettlebell'];

function weightStep(eq: Equipment, units: Units): number {
  if (units === 'imperial') return (eq === 'barbell' || eq === 'machine' ? 5 : 2.5) / LB_PER_KG;
  return eq === 'barbell' || eq === 'machine' ? 2.5 : 1;
}

function startWeight(eq: Equipment, units: Units): number {
  const lb: Record<Equipment, number> = { dumbbells: 10, barbell: 45, machine: 50, kettlebell: 15, bands: 0, bodyweight: 0 };
  const kg: Record<Equipment, number> = { dumbbells: 5, barbell: 20, machine: 20, kettlebell: 8, bands: 0, bodyweight: 0 };
  return units === 'imperial' ? lb[eq] / LB_PER_KG : kg[eq];
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Mini({ label, onPress, icon }: { label: string; onPress: () => void; icon: 'add' | 'remove' }) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      hitSlop={6}
      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.cardRaised, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={icon} size={15} color={colors.text} />
    </Pressable>
  );
}

export default function Session() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, addWorkoutLog } = useStore();
  const units = state.profile.units;
  const w = findWorkout(state, id);
  const startedAt = useRef(Date.now());
  const now = useNow(1000).getTime();

  const [sets, setSets] = useState<SetLog[]>(() =>
    (w?.items ?? []).flatMap((it) => {
      const ex = EXERCISE_BY_ID[it.exerciseId];
      const weighted = ex && WEIGHTED.includes(ex.equipment);
      const load = weighted ? suggestLoad(it.exerciseId, state.workoutLogs, units) : null;
      return Array.from({ length: it.sets }, () => ({
        exerciseId: it.exerciseId,
        targetReps: it.reps,
        reps: it.reps,
        ...(weighted ? { weightKg: load?.weightKg ?? startWeight(ex.equipment, units) } : {}),
        done: false,
      }));
    }),
  );
  const [restEnd, setRestEnd] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);

  if (!w) {
    return (
      <Screen safeTop={false}>
        <Text style={type.h2}>Workout not found.</Text>
        <Button label="Back" onPress={goBack} />
      </Screen>
    );
  }

  const doneCount = sets.filter((s) => s.done).length;
  const volumeKg = sets.filter((s) => s.done).reduce((v, s) => v + (s.weightKg ?? 0) * s.reps, 0);
  const update = (i: number, patch: Partial<SetLog>) => setSets((xs) => xs.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  const toggle = (i: number, restSec: number) => {
    const willBeDone = !sets[i].done;
    update(i, { done: willBeDone });
    if (willBeDone) {
      success();
      setRestEnd(restSec > 0 ? Date.now() + restSec * 1000 : 0);
    }
  };

  const save = () => {
    addWorkoutLog({
      id: newId(),
      workoutId: w.id,
      name: w.name,
      date: dateKey(new Date(startedAt.current)),
      startedAt: startedAt.current,
      finishedAt: Date.now(),
      ...(rpe ? { rpe } : {}),
      sets,
    });
    success();
    setSaved(true);
  };

  if (saved) {
    return (
      <Screen safeTop={false}>
        <Stack.Screen options={{ title: 'Nice work' }} />
        <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xl }}>
          <Text style={{ fontSize: 64 }}>💪</Text>
          <Text style={type.h1}>Workout saved</Text>
          <Text style={type.dim}>
            {doneCount} {doneCount === 1 ? 'set' : 'sets'} · {mmss(Date.now() - startedAt.current)}
            {volumeKg > 0 ? ` · ${displayWeight(volumeKg, units)} lifted` : ''}
          </Text>
        </View>
        <Card style={{ gap: space.sm, borderColor: colors.recovery }}>
          <Text style={[type.h2, { color: colors.recovery }]}>Refuel within the hour</Text>
          <Text style={type.dim}>Carbs plus 15–25 g of protein helps your muscles repair. Check Fuel → Recipes for recovery ideas.</Text>
          <Button label="Recovery recipes" variant="secondary" icon="restaurant" onPress={() => router.replace({ pathname: '/fuel', params: { tab: 'recipes', focus: 'recovery' } })} />
        </Card>
        <Button label="Done" onPress={goBack} />
      </Screen>
    );
  }

  let setIndex = 0;
  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: w.name }} />
      <Card style={{ gap: space.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={type.h2}>⏱ {mmss(now - startedAt.current)}</Text>
          <Text style={type.dim}>
            {doneCount}/{sets.length} sets
          </Text>
        </Row>
        <ProgressBar progress={sets.length ? doneCount / sets.length : 0} />
      </Card>

      {restEnd > now && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', borderColor: colors.water, gap: space.md }}>
          <Ionicons name="hourglass-outline" size={22} color={colors.water} />
          <Text style={[type.h2, { color: colors.water, flex: 1 }]}>Rest {mmss(restEnd - now)}</Text>
          <Button label="Skip" variant="ghost" onPress={() => setRestEnd(0)} style={{ paddingVertical: 6 }} />
        </Card>
      )}

      {w.items.map((it, itemIdx) => {
        const ex = EXERCISE_BY_ID[it.exerciseId];
        if (!ex) return null;
        const first = setIndex;
        setIndex += it.sets;
        const weighted = WEIGHTED.includes(ex.equipment);
        const load = weighted ? suggestLoad(ex.id, state.workoutLogs, units) : null;
        return (
          <Card key={`${ex.id}-${itemIdx}`} style={{ gap: space.sm, padding: space.md }}>
            <Text style={[type.body, { fontWeight: '800' }]}>{ex.name}</Text>
            <Text style={type.small}>
              {it.sets} × {it.reps}
              {ex.timed ? ' sec' : ' reps'} · rest {it.restSec}s{it.note ? ` · ${it.note}` : ''}
            </Text>
            {load && <Text style={[type.small, { color: colors.great }]}>{load.note}</Text>}
            <Text style={[type.small, { color: colors.textFaint }]}>💡 {ex.cue}</Text>
            {Array.from({ length: it.sets }, (_, k) => {
              const i = first + k;
              const s = sets[i];
              return (
                <Row key={i} style={{ gap: space.sm, paddingVertical: 4, opacity: s.done ? 0.6 : 1 }}>
                  <Text style={[type.small, { width: 38 }]}>Set {k + 1}</Text>
                  <Mini label="Fewer" icon="remove" onPress={() => update(i, { reps: Math.max(0, s.reps - (ex.timed ? 5 : 1)) })} />
                  <Text style={[type.body, { minWidth: 38, textAlign: 'center', fontWeight: '700' }]}>
                    {s.reps}
                    {ex.timed ? 's' : ''}
                  </Text>
                  <Mini label="More" icon="add" onPress={() => update(i, { reps: s.reps + (ex.timed ? 5 : 1) })} />
                  {weighted && s.weightKg !== undefined ? (
                    <>
                      <Mini label="Lighter" icon="remove" onPress={() => update(i, { weightKg: Math.max(0, s.weightKg! - weightStep(ex.equipment, units)) })} />
                      <Text style={[type.small, { minWidth: 50, textAlign: 'center', color: colors.text, fontWeight: '700' }]}>
                        {displayWeight(s.weightKg, units)}
                      </Text>
                      <Mini label="Heavier" icon="add" onPress={() => update(i, { weightKg: s.weightKg! + weightStep(ex.equipment, units) })} />
                    </>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: s.done }}
                    accessibilityLabel={`Set ${k + 1} done`}
                    onPress={() => toggle(i, it.restSec)}
                    hitSlop={8}
                    style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: radius.sm, backgroundColor: s.done ? colors.great : colors.cardRaised, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="checkmark" size={22} color={s.done ? colors.accentInk : colors.textFaint} />
                  </Pressable>
                </Row>
              );
            })}
          </Card>
        );
      })}

      {finishing ? (
        <Card style={{ gap: space.md }}>
          <Text style={type.h2}>How hard was that?</Text>
          <Text style={type.small}>1 = very easy, 10 = everything you had. This helps Smart Coach plan your next session.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => (
              <Pressable
                key={n}
                accessibilityRole="radio"
                accessibilityLabel={`Effort ${n} of 10`}
                accessibilityState={{ selected: rpe === n }}
                onPress={() => {
                  tap();
                  setRpe(n);
                }}
                style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: rpe === n ? colors.accent : colors.cardRaised }}
              >
                <Text style={{ color: rpe === n ? colors.accentInk : colors.text, fontWeight: '700' }}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Button label="Save workout" icon="checkmark" onPress={save} disabled={doneCount === 0} />
          {doneCount === 0 && <Text style={[type.small, { color: colors.warn }]}>Check off at least one set to save.</Text>}
        </Card>
      ) : (
        <Button label="Finish workout" icon="flag" onPress={() => setFinishing(true)} style={{ marginTop: space.sm }} />
      )}
      <Button
        label={confirmQuit ? 'Tap again to discard' : 'Discard workout'}
        variant="ghost"
        onPress={() => {
          if (!confirmQuit) return setConfirmQuit(true);
          goBack();
        }}
      />
    </Screen>
  );
}
