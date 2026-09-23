import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, Row, Screen, tap } from '@/ui/components';
import { colors, space, type } from '@/ui/theme';

type Icon = 'today' | 'nutrition' | 'barbell' | 'body' | 'restaurant' | 'sparkles' | 'stats-chart' | 'shield-checkmark';

const SECTIONS: { icon: Icon; color: string; title: string; body: string[] }[] = [
  {
    icon: 'today',
    color: colors.accent,
    title: 'Today: your fuel forecast',
    body: [
      'Add your practices and games once (Train → Plan → Add). FuelCast times four “fuel windows” around each one: a meal 3–4 hours before, a small snack 30–60 minutes before, fuel during long sessions, and recovery within an hour after.',
      'The ring is your Fuel Score: 80% for windows you hit, 20% for water.',
    ],
  },
  {
    icon: 'nutrition',
    color: colors.preMeal,
    title: 'Fuel: kitchen, recipes, list, water',
    body: [
      'Kitchen: tap the foods you have. Every window scores the best 1–3 food combos from them (0–100).',
      'Recipes: type what’s in your fridge. You’ll see what you can make now and what fits each window.',
      'List: a shopping list planned from your week, plus missing recipe ingredients. Checked items move into your kitchen.',
      'Water: a daily goal that grows with training, plus a sweat test to personalize it.',
    ],
  },
  {
    icon: 'barbell',
    color: colors.water,
    title: 'Train: Smart Coach and workouts',
    body: [
      'Smart Coach estimates how recovered each muscle group is from your lifts, practices and games, then recommends a workout and tells you why. With a game tomorrow, it keeps things light.',
      'Pick from 20 starter workouts, build your own, or tap “Build me a workout.” During a workout, it suggests weights and times your rest.',
    ],
  },
  {
    icon: 'body',
    color: colors.preMeal,
    title: 'Form Check',
    body: [
      'Film 2–3 reps (up to 10 seconds). An on-device AI model finds 33 body points in each frame, and FuelCast measures your joint angles at the key moment (like the bottom of a squat).',
      'Film squats, hinges, lunges, push-ups and planks from the SIDE; film jump landings from the FRONT. Keep your whole body in frame with good light.',
      'Your video never leaves your phone. It’s a coaching aid from 2D video, not a medical test.',
    ],
  },
  {
    icon: 'sparkles',
    color: colors.recovery,
    title: 'Coach',
    body: [
      'Without setup, Smart Coach answers the common requests on your phone.',
      'Connect Claude in Settings for open-ended coaching. Each message sends a short summary (sport, schedule, readiness, recent workouts, kitchen), never your name or weight.',
    ],
  },
  {
    icon: 'stats-chart',
    color: colors.great,
    title: 'Progress',
    body: [
      'After each session, rate how you felt. FuelCast compares your energy on days you fueled vs. days you didn’t, and tracks strength days, muscle readiness and streaks.',
    ],
  },
  {
    icon: 'shield-checkmark',
    color: colors.warn,
    title: 'Built for teens, safely',
    body: [
      'No calorie counting and no weight goals. Training follows youth guidelines (NSCA, American Academy of Pediatrics). No supplements or energy drinks.',
      'FuelCast is education, not medical advice. If something hurts, stop and talk to your athletic trainer, parent or doctor.',
    ],
  },
];

export default function Help() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen safeTop={false}>
      <Text style={type.dim}>Tap a topic to learn how it works.</Text>
      {SECTIONS.map((s, i) => (
        <Pressable
          key={s.title}
          accessibilityRole="button"
          accessibilityState={{ expanded: open === i }}
          onPress={() => {
            tap();
            setOpen(open === i ? null : i);
          }}
        >
          <Card style={{ gap: space.sm }}>
            <Row style={{ gap: space.md }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${s.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[type.h2, { flex: 1 }]}>{s.title}</Text>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textFaint} />
            </Row>
            {open === i && s.body.map((b) => <Text key={b} style={type.body}>{b}</Text>)}
          </Card>
        </Pressable>
      ))}
      <Button label="See the science and sources" variant="secondary" icon="book-outline" onPress={() => router.push('/settings')} />
    </Screen>
  );
}
