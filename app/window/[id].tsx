import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FOOD_BY_ID, FOODS } from '@/data/foods';
import { windowPhase } from '@/engine/forecast';
import { bestCombos } from '@/engine/fuelFit';
import { formatFluid } from '@/engine/hydration';
import { dateKey, formatClock, formatRange, minutesOfDay } from '@/engine/time';
import type { FitLevel, PlateResult, Targets } from '@/engine/types';
import { useNow, useStore } from '@/state/store';
import { useDay } from '@/state/useDay';
import { Button, Card, Pill, ProgressBar, Row, Screen, SectionHeader, WindowBadge, goBack, success, tap } from '@/ui/components';
import { EnergyPicker } from '@/ui/EnergyCheckIn';
import { colors, fitColor, radius, space, type, windowColor } from '@/ui/theme';

const scoreLevel = (s: number): FitLevel => (s >= 85 ? 'great' : s >= 65 ? 'ok' : 'avoid');

function targetPills(t: Targets, perHour: boolean): string[] {
  const range = (min: number, max: number) => (min > 0 ? `${min}–${max} g` : `≤${max} g`);
  const suffix = perHour ? '/hr' : '';
  return [
    `Carbs ${range(t.carbs.min, t.carbs.max)}${suffix}`,
    `Protein ${range(t.protein.min, t.protein.max)}`,
    `Fat ≤${t.fatMax} g`,
    `Fiber ≤${t.fiberMax} g`,
  ];
}

export default function WindowDetail() {
  const params = useLocalSearchParams<{ id: string; date?: string }>();
  const now = useNow();
  const date = params.date ?? dateKey(now);
  const { state, logWindow, clearWindow, setEnergy } = useStore();
  const { plan, log } = useDay(date);
  const w = plan.find((x) => x.id === params.id);
  const [picked, setPicked] = useState(0);

  const pantryFoods = useMemo(() => state.pantry.map((id) => FOOD_BY_ID[id]).filter(Boolean), [state.pantry]);
  const kitchenCombos = useMemo(() => (w ? bestCombos(pantryFoods, w.type, w.targets) : []), [w, pantryFoods]);
  const fallback = kitchenCombos.length === 0;
  const combos = useMemo(() => (w && fallback ? bestCombos(FOODS, w.type, w.targets) : kitchenCombos), [w, fallback, kitchenCombos]);

  if (!w) {
    return (
      <Screen safeTop={false}>
        <Text style={type.h2}>This window isn’t in your plan anymore.</Text>
        <Button label="Back to today" onPress={() => goBack()} />
      </Screen>
    );
  }

  const c = windowColor[w.type];
  const entry = log?.windows[w.id];
  const isToday = date === dateKey(now);
  const phase = isToday ? windowPhase(w, minutesOfDay(now)) : null;
  const choice: PlateResult | undefined = combos[picked];

  const record = (status: 'done' | 'skipped') => {
    success();
    logWindow(date, w.id, status, status === 'done' ? choice?.foods.map((f) => f.id) : undefined);
    if (w.type !== 'recovery') goBack();
  };

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: w.title }} />
      <Row style={{ gap: space.md }}>
        <WindowBadge type={w.type} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.h1, { color: c }]}>{w.title}</Text>
          <Text style={type.dim}>
            {formatRange(w.startMin, w.endMin)} · {w.eventTitle}
          </Text>
        </View>
        {phase === 'now' && <Pill label="Now" color={c} />}
      </Row>

      <Card style={{ gap: space.sm }}>
        <Text style={type.label}>Why it matters</Text>
        <Text style={type.body}>{w.why}</Text>
        {w.tip && <Text style={[type.dim, { marginTop: 4 }]}>💡 {w.tip}</Text>}
      </Card>

      <SectionHeader title="Your targets" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {targetPills(w.targets, w.type === 'during').map((p) => (
          <Pill key={p} label={p} color={colors.text} />
        ))}
        {w.fluidMl !== undefined && (
          <Pill label={`Water ~${formatFluid(w.fluidMl, state.profile.units)}${w.type === 'during' ? '/hr' : ''}`} color={colors.water} />
        )}
      </View>

      <SectionHeader title={fallback ? 'Popular picks' : 'Best picks from your kitchen'} />
      {fallback && (
        <Card style={{ gap: space.sm }}>
          <Text style={type.dim}>Nothing in your kitchen fits this window yet. Add a few foods and FuelCast will build combos from them.</Text>
          <Button label="Stock my kitchen" variant="secondary" icon="basket" onPress={() => router.push('/kitchen')} />
        </Card>
      )}
      {combos.map((combo, i) => {
        const level = scoreLevel(combo.score);
        const selected = i === picked && !entry;
        return (
          <Pressable
            key={combo.foods.map((f) => f.id).join('+')}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            disabled={!!entry}
            onPress={() => {
              tap();
              setPicked(i);
            }}
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              padding: space.lg,
              gap: space.sm,
              borderWidth: 2,
              borderColor: selected ? colors.accent : colors.border,
            }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={[type.body, { fontWeight: '700', flex: 1 }]}>
                {combo.foods.map((f) => `${f.emoji} ${f.name}`).join('  +  ')}
              </Text>
              <Text style={[type.h2, { color: fitColor[level] }]}>{combo.score}</Text>
            </Row>
            <ProgressBar progress={combo.score / 100} color={fitColor[level]} height={6} />
            <Text style={type.small}>
              {Math.round(combo.totals.carbs)}g carbs · {Math.round(combo.totals.protein)}g protein · {Math.round(combo.totals.fat)}g fat ·{' '}
              {Math.round(combo.totals.fiber)}g fiber
            </Text>
            <Text style={[type.small, { color: colors.textDim }]}>{combo.notes.join(' · ')}</Text>
          </Pressable>
        );
      })}

      {entry ? (
        <Card style={{ gap: space.sm, borderColor: entry.status === 'done' ? colors.great : colors.border }}>
          <Text style={type.h2}>{entry.status === 'done' ? '✅ Fueled' : '⏭️ Skipped'}</Text>
          {entry.status === 'done' && entry.foodIds && entry.foodIds.length > 0 && (
            <Text style={type.dim}>{entry.foodIds.map((id) => FOOD_BY_ID[id]?.name ?? id).join(', ')}</Text>
          )}
          {entry.at > 0 && <Text style={type.small}>Logged at {formatClock(minutesOfDay(new Date(entry.at)))}</Text>}
          <Button label="Undo" variant="ghost" onPress={() => clearWindow(date, w.id)} />
        </Card>
      ) : (
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          <Button label={choice ? 'I ate this' : 'I fueled'} icon="checkmark" onPress={() => record('done')} />
          <Button label="Skip this one" variant="ghost" onPress={() => record('skipped')} />
        </View>
      )}

      {w.type === 'recovery' && (
        <>
          <SectionHeader title="Session check-in" />
          <Card style={{ gap: space.md }}>
            <Text style={type.h2}>How did {w.eventTitle.toLowerCase()} feel?</Text>
            <EnergyPicker value={log?.energy[w.eventId]} onChange={(v) => { success(); setEnergy(date, w.eventId, v); }} />
            <Text style={type.small}>FuelCast compares this with how you fueled to find what works for you.</Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
