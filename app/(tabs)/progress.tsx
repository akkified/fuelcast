import { Text, View } from 'react-native';

import { MUSCLE_LABEL } from '@/data/exercises';
import { dayContext, MUSCLES } from '@/engine/coach';
import { dateKey } from '@/engine/time';
import { useNow, useStore } from '@/state/store';
import { useRecommendation } from '@/state/useTraining';
import { Card, Pill, ProgressBar, Row, Screen, ScreenTitle, SectionHeader } from '@/ui/components';
import { colors, space, type } from '@/ui/theme';
import { InsightsView } from '@/views/InsightsView';

const readyColor = (r: number) => (r >= 0.7 ? colors.great : r >= 0.4 ? colors.warn : colors.avoid);

function TrainingProgress() {
  const { state } = useStore();
  const now = useNow();
  const rec = useRecommendation(now);
  const ctx = dayContext(dateKey(now), state.events, state.workoutLogs);

  return (
    <>
      <SectionHeader title="Training" />
      <Card style={{ gap: space.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={type.body}>Strength days this week</Text>
          <Text style={[type.h2, { color: ctx.strengthDays7 >= 2 && ctx.strengthDays7 <= 3 ? colors.great : colors.text }]}>
            {ctx.strengthDays7} / 2–3
          </Text>
        </Row>
        <ProgressBar progress={Math.min(1, ctx.strengthDays7 / 3)} />
        <Text style={type.small}>Youth guidelines: 2–3 strength sessions a week on non-consecutive days.</Text>
      </Card>

      <SectionHeader title="Muscle readiness" />
      <Card style={{ gap: space.sm }}>
        {MUSCLES.map((m) => {
          const r = rec.readiness[m];
          return (
            <View key={m} style={{ gap: 4 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={type.body}>{MUSCLE_LABEL[m]}</Text>
                <Text style={[type.small, { color: readyColor(r) }]}>{r >= 0.7 ? 'Fresh' : r >= 0.4 ? 'Recovering' : 'Tired'} · {Math.round(r * 100)}%</Text>
              </Row>
              <ProgressBar progress={r} color={readyColor(r)} height={6} />
            </View>
          );
        })}
        <Text style={type.small}>Based on your logged workouts, practices and games. Fatigue fades by about half each day.</Text>
      </Card>
    </>
  );
}

export default function Progress() {
  const { state } = useStore();
  return (
    <Screen>
      <ScreenTitle title="Progress" />
      {state.demo && <Pill label="Sample athlete · demo data" color={colors.warn} />}
      <InsightsView />
      <TrainingProgress />
    </Screen>
  );
}
