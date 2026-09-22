import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { FOOD_BY_ID } from '@/data/foods';
import { energyInsight, GOOD_DAY, isEventFueled, streak, topFoods } from '@/engine/insights';
import { addDays, dateKey, minutesOfDay, WEEKDAYS_SHORT, weekdayOf } from '@/engine/time';
import type { DayLog, WindowType } from '@/engine/types';
import { useNow, useStore } from '@/state/store';
import { computeDay } from '@/state/useDay';
import { Card, ProgressBar, Row, SectionHeader } from '@/ui/components';
import { colors, space, type, windowColor } from '@/ui/theme';

const WINDOW_LABEL: Record<WindowType, string> = {
  preMeal: 'Pre-meal',
  topOff: 'Top-off',
  during: 'In-session',
  recovery: 'Recovery',
};

export function InsightsView() {
  const { state } = useStore();
  const now = useNow();
  const today = dateKey(now);
  const nowMin = minutesOfDay(now);

  const data = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => computeDay(state, addDays(today, i - 13)));
    const week = days.slice(7);
    const byDate = new Map(days.map((d) => [d.date, d]));

    const hits: Record<WindowType, { done: number; total: number }> = {
      preMeal: { done: 0, total: 0 },
      topOff: { done: 0, total: 0 },
      during: { done: 0, total: 0 },
      recovery: { done: 0, total: 0 },
    };
    for (const d of week) {
      for (const w of d.plan) {
        if (d.date === today && w.endMin > nowMin) continue;
        hits[w.type].total++;
        if (d.log?.windows[w.id]?.status === 'done') hits[w.type].done++;
      }
    }

    const energyEntries = days.flatMap((d) =>
      d.events
        .filter((e) => d.log?.energy[e.id] !== undefined)
        .map((e) => ({ fueled: isEventFueled(e.id, d.plan, d.log), energy: d.log!.energy[e.id] })),
    );

    const waterPct = week.reduce((s, d) => s + Math.min(1, (d.log?.waterMl ?? 0) / d.goalMl), 0) / week.length;
    const pastWeek = week.filter((d) => d.date !== today);

    return {
      week,
      hits,
      waterPct,
      avgScore: pastWeek.length ? Math.round(pastWeek.reduce((s, d) => s + d.score, 0) / pastWeek.length) : 0,
      energy: energyInsight(energyEntries),
      ratedCount: energyEntries.length,
      streak: streak(today, (k) => byDate.get(k)?.score ?? computeDay(state, k).score),
      top: topFoods(days.map((d) => d.log).filter((l): l is DayLog => !!l)),
    };
  }, [state, today, nowMin]);

  const types = (Object.keys(data.hits) as WindowType[]).filter((t) => data.hits[t].total > 0);
  const weakest = [...types].sort((a, b) => data.hits[a].done / data.hits[a].total - data.hits[b].done / data.hits[b].total)[0];

  return (
    <>

      <Row style={{ gap: space.md }}>
        <Card style={{ flex: 1, gap: 4 }}>
          <Ionicons name="flame" size={22} color={colors.preMeal} />
          <Text style={type.hero}>{data.streak}</Text>
          <Text style={type.small}>day streak (Fuel Score {GOOD_DAY}+)</Text>
        </Card>
        <Card style={{ flex: 1, gap: 4 }}>
          <Ionicons name="speedometer-outline" size={22} color={colors.accent} />
          <Text style={type.hero}>{data.avgScore}</Text>
          <Text style={type.small}>avg Fuel Score, last 6 days</Text>
        </Card>
      </Row>

      <SectionHeader title="This week" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: space.sm }}>
          {data.week.map((d) => (
            <View key={d.date} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <Text style={[type.small, { fontSize: 11 }]}>{d.score}</Text>
              <View
                style={{
                  width: '100%',
                  height: Math.max(4, d.score * 1.0),
                  borderRadius: 6,
                  backgroundColor: d.score >= GOOD_DAY ? colors.accent : colors.border,
                  opacity: d.date === today ? 0.6 : 1,
                }}
              />
              <Text style={[type.small, d.date === today && { color: colors.accent, fontWeight: '700' }]}>
                {d.date === today ? 'Today' : WEEKDAYS_SHORT[weekdayOf(d.date)]}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Fuel vs. energy" />
      <Card style={{ gap: space.md }}>
        {data.energy ? (
          <>
            <Text style={type.h2}>
              {data.energy.fueledAvg - data.energy.unfueledAvg >= 0.3
                ? `You rate your energy ${Math.round((data.energy.fueledAvg - data.energy.unfueledAvg) * 10) / 10} points higher when you fuel before training.`
                : 'So far, fueling hasn’t changed your energy ratings much. Keep logging to see the trend.'}
            </Text>
            <View style={{ gap: space.sm }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={type.body}>Fueled ({data.energy.fueledCount} sessions)</Text>
                <Text style={[type.body, { fontWeight: '700', color: colors.great }]}>{data.energy.fueledAvg} / 5</Text>
              </Row>
              <ProgressBar progress={data.energy.fueledAvg / 5} color={colors.great} />
              <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
                <Text style={type.body}>Not fueled ({data.energy.unfueledCount} sessions)</Text>
                <Text style={[type.body, { fontWeight: '700', color: colors.avoid }]}>{data.energy.unfueledAvg} / 5</Text>
              </Row>
              <ProgressBar progress={data.energy.unfueledAvg / 5} color={colors.avoid} />
            </View>
            <Text style={type.small}>Based on your own session check-ins over the last 14 days.</Text>
          </>
        ) : (
          <>
            <Text style={type.h2}>Rate how your sessions feel</Text>
            <Text style={type.dim}>
              After each practice or game, tap how you felt. Once you have a few fueled and unfueled sessions ({data.ratedCount} rated so far), FuelCast
              shows how fueling changes your energy.
            </Text>
          </>
        )}
      </Card>

      <SectionHeader title="Windows hit this week" />
      <Card style={{ gap: space.md }}>
        {types.length === 0 && <Text style={type.dim}>No fuel windows yet this week. Add sessions on the Schedule tab.</Text>}
        {types.map((t) => {
          const h = data.hits[t];
          return (
            <View key={t} style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={type.body}>{WINDOW_LABEL[t]}</Text>
                <Text style={type.dim}>
                  {h.done}/{h.total}
                </Text>
              </Row>
              <ProgressBar progress={h.done / h.total} color={windowColor[t]} />
            </View>
          );
        })}
        {weakest && data.hits[weakest].done < data.hits[weakest].total && (
          <Text style={type.small}>
            Biggest opportunity: {WINDOW_LABEL[weakest].toLowerCase()}. Stock a go-to option in your bag so it’s automatic.
          </Text>
        )}
        <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
          <Text style={type.body}>Hydration goal met</Text>
          <Text style={type.dim}>{Math.round(data.waterPct * 100)}%</Text>
        </Row>
        <ProgressBar progress={data.waterPct} color={colors.water} />
      </Card>

      {data.top.length > 0 && (
        <>
          <SectionHeader title="Your go-to fuel" />
          <Card style={{ gap: space.sm }}>
            {data.top.map(({ id, count }) => {
              const f = FOOD_BY_ID[id];
              if (!f) return null;
              return (
                <Row key={id} style={{ gap: space.md }}>
                  <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                  <Text style={[type.body, { flex: 1 }]}>{f.name}</Text>
                  <Text style={type.dim}>{count}×</Text>
                </Row>
              );
            })}
          </Card>
        </>
      )}
    </>
  );
}
