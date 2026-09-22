import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GOAL_LABEL, type Goal } from '@/data/workouts';
import { availableEquipment, canDo, displayWeight, FOCUS_LABEL, generateWorkout, type Focus } from '@/engine/coach';
import { addDays, dateKey, formatDateShort } from '@/engine/time';
import { newId, useNow, useStore } from '@/state/store';
import { allWorkouts, useRecommendation } from '@/state/useTraining';
import { Button, Card, Chip, Pill, Row, Screen, ScreenTitle, SectionHeader, Segmented, Stepper, styles, success } from '@/ui/components';
import { colors, space, type } from '@/ui/theme';
import { SmartCoachCard, WorkoutCard } from '@/ui/WorkoutCard';
import { ScheduleView } from '@/views/ScheduleView';

type Tab = 'plan' | 'workouts' | 'history';
const FOCI: Focus[] = ['full', 'upper', 'lower', 'power', 'core', 'conditioning', 'mobility'];

function Builder() {
  const { state, saveWorkout } = useStore();
  const [focus, setFocus] = useState<Focus>('full');
  const [minutes, setMinutes] = useState(state.profile.sessionMin);
  const now = useNow();
  const rec = useRecommendation(now);

  const build = () => {
    const w = generateWorkout({ focus, minutes, profile: state.profile, readiness: rec.readiness, seed: now.getTime() / 1000 });
    const saved = { ...w, id: newId() };
    saveWorkout(saved);
    success();
    router.push({ pathname: '/workout/[id]', params: { id: saved.id } });
  };

  return (
    <Card style={{ gap: space.md }}>
      <Text style={type.h2}>✨ Build me a workout</Text>
      <Text style={type.dim}>Smart Coach picks exercises for your equipment and level, favoring muscles that are recovered.</Text>
      <View style={styles.chipWrap}>
        {FOCI.map((f) => (
          <Chip key={f} label={FOCUS_LABEL[f]} selected={focus === f} onPress={() => setFocus(f)} />
        ))}
      </View>
      <Stepper
        label="Time"
        value={`${minutes} min`}
        onDec={() => setMinutes((m) => Math.max(10, m - 5))}
        onInc={() => setMinutes((m) => Math.min(90, m + 5))}
      />
      <Button label="Build it" icon="sparkles" onPress={build} />
    </Card>
  );
}

function Library() {
  const { state } = useStore();
  const [goal, setGoal] = useState<Goal | 'all' | 'mine'>('all');
  const [onlyCanDo, setOnlyCanDo] = useState(true);
  const equipment = availableEquipment(state.profile);
  const list = useMemo(
    () =>
      allWorkouts(state).filter(
        (w) =>
          (goal === 'all' || (goal === 'mine' ? w.custom : w.goal === goal)) && (!onlyCanDo || canDo(w, equipment)),
      ),
    [state, goal, onlyCanDo, equipment],
  );

  return (
    <>
      <Button label="Create a custom workout" icon="add" variant="secondary" onPress={() => router.push('/workout/edit')} />
      <View style={styles.chipWrap}>
        <Chip label="All" selected={goal === 'all'} onPress={() => setGoal('all')} />
        <Chip label={`Mine (${state.customWorkouts.length})`} selected={goal === 'mine'} onPress={() => setGoal('mine')} />
        {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
          <Chip key={g} label={GOAL_LABEL[g]} selected={goal === g} onPress={() => setGoal(g)} />
        ))}
      </View>
      <Pressable onPress={() => setOnlyCanDo((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: onlyCanDo }}>
        <Text style={[type.small, { color: onlyCanDo ? colors.accent : colors.textDim }]}>
          {onlyCanDo ? '☑︎' : '☐'} Only workouts I have the equipment for
        </Text>
      </Pressable>
      {list.length === 0 && <Text style={[type.dim, { textAlign: 'center', marginTop: space.lg }]}>No workouts match these filters.</Text>}
      {list.map((w) => (
        <WorkoutCard key={w.id} w={w} compact />
      ))}
    </>
  );
}

function History() {
  const { state } = useStore();
  const today = dateKey(useNow());
  const weekStart = addDays(today, -6);
  const thisWeek = state.workoutLogs.filter((l) => l.date >= weekStart);
  const units = state.profile.units;

  return (
    <>
      <Row style={{ gap: space.md }}>
        <Card style={{ flex: 1, gap: 2 }}>
          <Text style={type.hero}>{thisWeek.length}</Text>
          <Text style={type.small}>workouts in the last 7 days</Text>
        </Card>
        <Card style={{ flex: 1, gap: 2 }}>
          <Text style={type.hero}>{thisWeek.reduce((n, l) => n + l.sets.filter((s) => s.done).length, 0)}</Text>
          <Text style={type.small}>sets completed</Text>
        </Card>
      </Row>
      {state.workoutLogs.length === 0 && (
        <Card>
          <Text style={type.dim}>No workouts logged yet. Start one from the Plan or Workouts tab.</Text>
        </Card>
      )}
      {state.workoutLogs.slice(0, 30).map((l) => {
        const done = l.sets.filter((s) => s.done);
        const volumeKg = done.reduce((v, s) => v + (s.weightKg ?? 0) * s.reps, 0);
        const minutes = Math.max(1, Math.round((l.finishedAt - l.startedAt) / 60_000));
        return (
          <Card
            key={l.id}
            onPress={() => router.push({ pathname: '/workout/[id]', params: { id: l.workoutId } })}
            style={{ gap: 4, padding: space.md }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={[type.body, { fontWeight: '700', flex: 1 }]} numberOfLines={1}>
                {l.name}
              </Text>
              {l.rpe !== undefined && <Pill label={`Effort ${l.rpe}/10`} color={colors.warn} />}
            </Row>
            <Text style={type.small}>
              {formatDateShort(l.date)} · {minutes} min · {done.length} sets
              {volumeKg > 0 ? ` · ${displayWeight(volumeKg, units).replace(/(lb|kg)$/, '$1 lifted')}` : ''}
            </Text>
          </Card>
        );
      })}
    </>
  );
}

export default function Train() {
  const [tab, setTab] = useState<Tab>('plan');
  const now = useNow();
  const rec = useRecommendation(now);

  return (
    <Screen>
      <ScreenTitle title="Train" />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'plan', label: 'Plan' },
          { value: 'workouts', label: 'Workouts' },
          { value: 'history', label: 'History' },
        ]}
      />
      {tab === 'plan' && (
        <>
          <SmartCoachCard rec={rec} />
          <Builder />
          <SectionHeader title="Your week" />
          <ScheduleView />
        </>
      )}
      {tab === 'workouts' && <Library />}
      {tab === 'history' && <History />}
    </Screen>
  );
}
