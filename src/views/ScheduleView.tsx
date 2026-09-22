import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { eventsOn } from '@/engine/forecast';
import { addDays, dateKey, formatDateShort, formatDuration, formatRange } from '@/engine/time';
import type { TrainingEvent } from '@/engine/types';
import { useNow, useStore } from '@/state/store';
import { findWorkout } from '@/state/useTraining';
import { Button, Card, Pill, Row } from '@/ui/components';
import { colors, kindIcon, space, type } from '@/ui/theme';

const INTENSITY_COLOR = { light: colors.great, moderate: colors.warn, hard: colors.preMeal };

function EventCard({ e }: { e: TrainingEvent }) {
  const { state } = useStore();
  const plan = findWorkout(state, e.workoutId);
  return (
    <Card
      onPress={() => router.push({ pathname: '/event', params: { id: e.id } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardRaised, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={kindIcon[e.kind]} size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { fontWeight: '700' }]}>{e.title}</Text>
        <Text style={type.small}>
          {formatRange(e.startMin, e.startMin + e.durationMin)} · {formatDuration(e.durationMin)}
        </Text>
        {plan && (
          <Text style={[type.small, { color: colors.accent }]} numberOfLines={1}>
            {plan.emoji} {plan.name}
          </Text>
        )}
      </View>
      <Pill label={e.intensity[0].toUpperCase() + e.intensity.slice(1)} color={INTENSITY_COLOR[e.intensity]} />
    </Card>
  );
}

export function ScheduleView() {
  const { state } = useStore();
  const today = dateKey(useNow());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={[type.dim, { flex: 1 }]}>Your next 7 days. FuelCast plans fuel and training around these sessions.</Text>
        <Button label="Add" icon="add" onPress={() => router.push('/event')} style={{ paddingVertical: 8 }} />
      </Row>

      {days.map((d, i) => {
        const events = eventsOn(d, state.events);
        return (
          <View key={d} style={{ gap: space.sm, marginTop: space.sm }}>
            <Text style={[type.label, i === 0 && { color: colors.accent }]}>{i === 0 ? `Today · ${formatDateShort(d)}` : formatDateShort(d)}</Text>
            {events.length === 0 ? (
              <Text style={[type.small, { color: colors.textFaint, paddingLeft: 2 }]}>Rest day</Text>
            ) : (
              events.map((e) => <EventCard key={e.id} e={e} />)
            )}
          </View>
        );
      })}
    </>
  );
}
