import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { FOOD_BY_ID } from '@/data/foods';
import { RECIPES } from '@/data/recipes';
import { eventsOn, nextWindow, windowPhase } from '@/engine/forecast';
import { rankRecipes } from '@/engine/recipes';
import { bottlesFor, formatFluid } from '@/engine/hydration';
import { addDays, dateKey, formatClock, formatDateLong, formatDuration, formatRange, minutesOfDay } from '@/engine/time';
import type { FuelWindow } from '@/engine/types';
import { useNow, useStore } from '@/state/store';
import { useDay } from '@/state/useDay';
import { findWorkout, useRecommendation } from '@/state/useTraining';
import { Button, Card, Pill, ProgressBar, Ring, Row, Screen, SectionHeader, WindowBadge, success } from '@/ui/components';
import { EnergyPicker } from '@/ui/EnergyCheckIn';
import { colors, space, type, windowColor } from '@/ui/theme';

function greeting(min: number) {
  if (min < 12 * 60) return 'Good morning';
  if (min < 17 * 60) return 'Good afternoon';
  return 'Good evening';
}

export default function Today() {
  const { state, addWater, setEnergy } = useStore();
  const now = useNow();
  const today = dateKey(now);
  const nowMin = minutesOfDay(now);
  const { plan, events, goalMl, log, score } = useDay(today);
  const { profile } = state;

  const isDone = (id: string) => !!log?.windows[id];
  const next = nextWindow(plan, nowMin, isDone);
  const water = log?.waterMl ?? 0;
  const bottleGoal = bottlesFor(goalMl, profile.bottleMl);
  const bottlesDrunk = Math.round((water / profile.bottleMl) * 10) / 10;
  const needsCheckIn = events.filter((e) => e.startMin + e.durationMin <= nowMin && log?.energy[e.id] === undefined);
  const missed = plan.filter((w) => windowPhase(w, nowMin) === 'past' && !isDone(w.id)).length;
  const tomorrow = eventsOn(addDays(today, 1), state.events)[0];

  const openWindow = (w: FuelWindow) => router.push({ pathname: '/window/[id]', params: { id: w.id, date: today } });

  // Training: today's scheduled workout, or Smart Coach's pick.
  const rec = useRecommendation(now);
  const doneToday = state.workoutLogs.find((l) => l.date === today);
  const scheduled = events.map((e) => findWorkout(state, e.workoutId)).find(Boolean);
  const trainPick = scheduled ?? rec.picks[0]?.workout;

  // Cooking: the best recipe you can make now for your next window.
  const recipeFocus = next && next.type !== 'during' ? next.type : 'recovery';
  const cook = rankRecipes(RECIPES, state.pantry, recipeFocus, profile.weightKg).find((m) => m.status !== 'shop');

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={type.dim}>{formatDateLong(today)}</Text>
          <Text style={type.h1}>
            {greeting(nowMin)}, {profile.name}
          </Text>
        </View>
        <Pressable accessibilityLabel="Settings" onPress={() => router.push('/settings')} hitSlop={12}>
          <Ionicons name="settings-outline" size={24} color={colors.textDim} />
        </Pressable>
      </Row>
      {state.demo && <Pill label="Sample athlete · demo data" color={colors.warn} />}

      <Card style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}>
        <Ring progress={score / 100} size={104} stroke={10}>
          <Text style={[type.h1, { fontSize: 28 }]}>{score}</Text>
          <Text style={type.small}>Fuel Score</Text>
        </Ring>
        <View style={{ flex: 1, gap: 6 }}>
          {next ? (
            <>
              <Text style={type.label}>{windowPhase(next, nowMin) === 'now' ? 'Right now' : 'Up next'}</Text>
              <Text style={[type.h2, { color: windowColor[next.type] }]}>{next.title}</Text>
              <Text style={type.dim}>
                {windowPhase(next, nowMin) === 'now'
                  ? `${formatDuration(next.endMin - nowMin)} left`
                  : `in ${formatDuration(next.startMin - nowMin)} · ${formatClock(next.startMin)}`}
              </Text>
              <Button label="Plan it" onPress={() => openWindow(next)} style={{ paddingVertical: 10, marginTop: 4 }} />
            </>
          ) : state.events.length === 0 ? (
            <>
              <Text style={type.label}>Welcome</Text>
              <Text style={type.h2}>Let’s build your forecast</Text>
              <Text style={type.dim}>Add a practice or game below to get started.</Text>
            </>
          ) : plan.length > 0 ? (
            <>
              <Text style={type.label}>All set</Text>
              <Text style={type.h2}>No more fuel windows today</Text>
              <Text style={type.dim}>
                {missed > 0
                  ? `Missed ${missed === 1 ? 'a window' : `${missed} windows`}? Tap ${missed === 1 ? 'it' : 'them'} below to log what you ate.`
                  : 'Keep sipping water and get to bed on time. Sleep is recovery too.'}
              </Text>
            </>
          ) : (
            <>
              <Text style={type.label}>Rest day</Text>
              <Text style={type.h2}>Recover and refill</Text>
              <Text style={type.dim}>
                {tomorrow ? `Tomorrow: ${tomorrow.title} at ${formatClock(tomorrow.startMin)}. ` : ''}Eat balanced meals and keep sipping.
              </Text>
            </>
          )}
        </View>
      </Card>

      {state.events.length === 0 && (
        <Card style={{ gap: space.md }}>
          <Text style={type.h2}>Add your first practice or game</Text>
          <Text style={type.dim}>FuelCast builds your forecast from your schedule. It takes about 20 seconds.</Text>
          <Button label="Add a session" icon="add" onPress={() => router.push('/event')} />
        </Card>
      )}

      {needsCheckIn.map((e) => (
        <Card key={e.id} style={{ gap: space.md, borderColor: colors.accent }}>
          <Text style={type.h2}>How did {e.title.toLowerCase()} feel?</Text>
          <EnergyPicker onChange={(v) => { success(); setEnergy(today, e.id, v); }} />
        </Card>
      ))}

      {plan.length > 0 && <SectionHeader title="Fuel forecast" />}
      {plan.map((w, i) => {
        const phase = windowPhase(w, nowMin);
        const entry = log?.windows[w.id];
        const c = windowColor[w.type];
        return (
          <View key={w.id} style={{ flexDirection: 'row', gap: space.md, paddingLeft: 4 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 2, height: space.lg + 4, backgroundColor: i === 0 ? 'transparent' : colors.border }} />
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: entry?.status === 'done' ? c : colors.bg, borderWidth: 2, borderColor: c }} />
              <View style={{ width: 2, flex: 1, backgroundColor: i === plan.length - 1 ? 'transparent' : colors.border }} />
            </View>
            <Card
              onPress={() => openWindow(w)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderColor: phase === 'now' && !entry ? c : colors.border, opacity: phase === 'past' && !entry ? 0.6 : 1 }}
            >
              <WindowBadge type={w.type} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { fontWeight: '700' }]}>{w.title}</Text>
                <Text style={type.small} numberOfLines={1}>
                  {formatRange(w.startMin, w.endMin)} · {w.eventTitle}
                </Text>
              </View>
              {entry?.status === 'done' ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.great} />
              ) : entry?.status === 'skipped' ? (
                <Ionicons name="play-skip-forward" size={20} color={colors.textFaint} />
              ) : phase === 'now' ? (
                <Pill label="Now" color={c} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
              )}
            </Card>
          </View>
        );
      })}

      <SectionHeader title="Training" />
      {doneToday ? (
        <Card style={{ gap: 4, borderColor: colors.great }}>
          <Text style={[type.h2, { color: colors.great }]}>✅ {doneToday.name}</Text>
          <Text style={type.dim}>Workout done. Refuel within an hour and get good sleep tonight.</Text>
        </Card>
      ) : trainPick ? (
        <Card style={{ gap: space.sm }}>
          <Text style={type.label}>{scheduled ? 'On your schedule' : `Smart Coach · ${rec.headline.toLowerCase()}`}</Text>
          <Row style={{ gap: space.md }}>
            <Text style={{ fontSize: 28 }}>{trainPick.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={type.h2}>{trainPick.name}</Text>
              <Text style={type.small}>~{trainPick.durationMin} min · {trainPick.items.length} exercises</Text>
            </View>
          </Row>
          <Row style={{ gap: space.sm }}>
            <Button label="View" variant="secondary" onPress={() => router.push({ pathname: '/workout/[id]', params: { id: trainPick.id } })} style={{ flex: 1, paddingVertical: 10 }} />
            <Button label="Start" icon="play" onPress={() => router.push({ pathname: '/workout/session', params: { id: trainPick.id } })} style={{ flex: 1, paddingVertical: 10 }} />
          </Row>
        </Card>
      ) : null}

      {cook && (
        <>
          <SectionHeader title="Cook something" />
          <Card onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: cook.recipe.id } })} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Text style={{ fontSize: 32 }}>{cook.recipe.emoji}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.body, { fontWeight: '700' }]}>{cook.recipe.name}</Text>
              <Text style={type.small}>
                {cook.status === 'ready'
                  ? `You have everything · ${cook.recipe.minutes} min`
                  : `Just need ${cook.missing.map((id) => FOOD_BY_ID[id]?.name).join(' + ')}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </Card>
        </>
      )}

      <SectionHeader title="Hydration" />
      <Card style={{ gap: space.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Text style={type.h2}>
              {bottlesDrunk} / {bottleGoal} bottles
            </Text>
            <Text style={type.small}>
              {formatFluid(water, profile.units)} of {formatFluid(goalMl, profile.units)} today
            </Text>
          </View>
          <Button label="+1 bottle" icon="water" variant="secondary" onPress={() => { success(); addWater(today, profile.bottleMl); }} style={{ paddingVertical: 10 }} />
        </Row>
        <ProgressBar progress={water / goalMl} color={colors.water} />
      </Card>
    </Screen>
  );
}
