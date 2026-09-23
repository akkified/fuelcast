import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { MOVEMENT_BY_ID, MOVEMENTS } from '../engine/form';
import { formatDateShort } from '../engine/time';
import { useStore } from '../state/store';
import { Card, Row, SectionHeader } from '../ui/components';
import { colors, space, type } from '../ui/theme';

const scoreColor = (s: number) => (s >= 85 ? colors.great : s >= 65 ? colors.warn : colors.avoid);

export function FormView() {
  const { state } = useStore();
  return (
    <>
      <Card style={{ gap: space.sm, borderColor: colors.accent }}>
        <Row style={{ gap: space.sm }}>
          <Ionicons name="body-outline" size={20} color={colors.accent} />
          <Text style={type.h2}>Form Check</Text>
        </Row>
        <Text style={type.dim}>
          Film a few reps and FuelCast finds 33 body points with on-device AI, measures your joint angles, and tells you the one thing to fix.
          Your video never leaves your phone.
        </Text>
      </Card>

      <SectionHeader title="Pick a movement" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {MOVEMENTS.map((m) => {
          const last = state.formChecks.find((c) => c.movement === m.id);
          return (
            <Card
              key={m.id}
              onPress={() => router.push({ pathname: '/form', params: { movement: m.id } })}
              style={{ width: '48%', gap: 4, padding: space.md }}
            >
              <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
              <Text style={[type.body, { fontWeight: '700' }]}>{m.name}</Text>
              <Text style={type.small}>{m.view === 'side' ? 'Film from the side' : 'Film from the front'}</Text>
              {last && <Text style={[type.small, { color: scoreColor(last.score), fontWeight: '700' }]}>Last: {last.score}/100</Text>}
            </Card>
          );
        })}
      </View>

      {state.formChecks.length > 0 && (
        <>
          <SectionHeader title="Recent checks" />
          {state.formChecks.slice(0, 8).map((c) => (
            <Card
              key={c.id}
              onPress={() => router.push({ pathname: '/form', params: { movement: c.movement } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md }}
            >
              <Text style={[type.h2, { color: scoreColor(c.score), width: 44, textAlign: 'center' }]}>{c.score}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { fontWeight: '700' }]}>
                  {MOVEMENT_BY_ID[c.movement].emoji} {MOVEMENT_BY_ID[c.movement].name}
                </Text>
                <Text style={type.small} numberOfLines={2}>
                  {formatDateShort(c.date)} · {c.topCue}
                </Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
