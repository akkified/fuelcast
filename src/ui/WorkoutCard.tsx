import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { EQUIPMENT_LABEL } from '../data/exercises';
import { GOAL_LABEL, LEVEL_LABEL, workoutEquipment, type Workout } from '../data/workouts';
import type { Recommendation } from '../engine/coach';
import { Button, Card, Pill, Row } from './components';
import { colors, space, type } from './theme';

export function WorkoutCard({ w, why, compact }: { w: Workout; why?: string[]; compact?: boolean }) {
  const equipment = workoutEquipment(w).filter((e) => e !== 'bodyweight');
  return (
    <Card
      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: w.id } })}
      style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', padding: compact ? space.md : space.lg }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.cardRaised, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>{w.emoji}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Row style={{ gap: space.sm }}>
          <Text style={[type.body, { fontWeight: '700', flexShrink: 1 }]} numberOfLines={1}>
            {w.name}
          </Text>
          {w.source === 'coach' && <Pill label="AI" color={colors.recovery} />}
          {w.source === 'smart' && <Pill label="Smart" color={colors.accent} />}
          {w.custom && !w.source && <Pill label="Mine" color={colors.water} />}
        </Row>
        <Text style={type.small} numberOfLines={1}>
          {GOAL_LABEL[w.goal]} · {LEVEL_LABEL[w.level]} · {w.durationMin} min
          {equipment.length ? ` · ${equipment.map((e) => EQUIPMENT_LABEL[e]).join(', ')}` : ' · No equipment'}
        </Text>
        {why?.map((r) => (
          <Text key={r} style={[type.small, { color: colors.great }]}>
            ✓ {r}
          </Text>
        ))}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
    </Card>
  );
}

export function SmartCoachCard({ rec, limit = 3 }: { rec: Recommendation; limit?: number }) {
  const top = rec.picks[0];
  return (
    <View style={{ gap: space.sm }}>
      <Card style={{ gap: space.sm, borderColor: colors.accent }}>
        <Row style={{ gap: space.sm }}>
          <Ionicons name="sparkles" size={18} color={colors.accent} />
          <Text style={type.label}>Smart Coach</Text>
        </Row>
        <Text style={type.h2}>{rec.headline}</Text>
        {rec.reasons.map((r) => (
          <Text key={r} style={type.dim}>
            {r}
          </Text>
        ))}
        {top && (
          <Button
            label={`Start ${top.workout.name}`}
            icon="play"
            onPress={() => router.push({ pathname: '/workout/session', params: { id: top.workout.id } })}
            style={{ marginTop: 4 }}
          />
        )}
      </Card>
      {rec.picks.slice(0, limit).map((p) => (
        <WorkoutCard key={p.workout.id} w={p.workout} why={p.why} compact />
      ))}
    </View>
  );
}
