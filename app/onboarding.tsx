import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { formatFluid, toKg } from '@/engine/hydration';
import { minutesOfDay, dateKey } from '@/engine/time';
import type { Sport, Units } from '@/engine/types';
import { DEFAULT_PROFILE, useStore } from '@/state/store';
import { Button, Card, Chip, Screen, styles } from '@/ui/components';
import { colors, space, type } from '@/ui/theme';

const SPORTS: Sport[] = [
  'Soccer', 'Basketball', 'Football', 'Track & XC', 'Swimming', 'Volleyball', 'Baseball & Softball', 'Tennis', 'Lacrosse', 'Other',
];

const BOTTLES: Record<Units, number[]> = { imperial: [500, 710, 946], metric: [500, 750, 1000] };

export default function Onboarding() {
  const { state, completeOnboarding, loadDemo } = useStore();
  const params = useLocalSearchParams<{ demo?: string }>();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [sport, setSport] = useState<Sport>(DEFAULT_PROFILE.sport);
  const [units, setUnits] = useState<Units>('imperial');
  const [bottleMl, setBottleMl] = useState(710);
  const [weight, setWeight] = useState('');

  const weightNum = Number(weight);
  const weightKg = weight.trim() === '' ? undefined : toKg(weightNum, units);
  const weightInvalid = weightKg !== undefined && (!Number.isFinite(weightKg) || weightKg < 27 || weightKg > 180);

  const finish = () => {
    completeOnboarding({ name: name.trim() || 'Athlete', sport, units, bottleMl, weightKg: weightInvalid ? undefined : weightKg });
    router.replace('/');
  };

  const demo = () => {
    const now = new Date();
    loadDemo(dateKey(now), minutesOfDay(now));
    router.replace('/');
  };

  // Presenter shortcut: /onboarding?demo=1 opens straight into the sample athlete on a fresh install.
  useEffect(() => {
    if (params.demo === '1' && !state.onboarded) demo();
  }, [params.demo]);

  if (step === 0) {
    return (
      <Screen>
        <View style={{ paddingTop: 48, gap: space.xl }}>
          <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flash" size={40} color={colors.accentInk} />
          </View>
          <View style={{ gap: space.sm }}>
            <Text style={type.hero}>FuelCast</Text>
            <Text style={[type.h2, { color: colors.textDim, fontWeight: '600' }]}>Your fuel forecast for game day.</Text>
          </View>
          <View style={{ gap: space.lg }}>
            {[
              ['calendar', 'Add your practices and games once.'],
              ['time-outline', 'Get a timeline of exactly when to eat and drink.'],
              ['basket', 'See the best combos from food you already have.'],
              ['stats-chart', 'Learn how fueling changes the way you feel.'],
            ].map(([icon, text]) => (
              <View key={text} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
                <Ionicons name={icon as 'calendar'} size={22} color={colors.accent} />
                <Text style={[type.body, { flex: 1 }]}>{text}</Text>
              </View>
            ))}
          </View>
          <Card style={{ backgroundColor: colors.cardRaised }}>
            <Text style={type.dim}>
              No calorie counting, and no accounts. Everything stays on your phone. FuelCast is education, not medical advice.
            </Text>
          </Card>
          <View style={{ gap: space.sm }}>
            <Button label="Get started" icon="arrow-forward" onPress={() => setStep(1)} />
            <Button label="Explore with a sample athlete" variant="ghost" onPress={demo} />
          </View>
        </View>
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen>
        <View style={{ paddingTop: 24, gap: space.lg }}>
          <Text style={type.label}>Step 1 of 2</Text>
          <Text style={type.h1}>What should we call you?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="First name"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
            maxLength={24}
          />
          <Text style={type.h1}>Your main sport</Text>
          <View style={styles.chipWrap}>
            {SPORTS.map((s) => (
              <Chip key={s} label={s} selected={sport === s} onPress={() => setSport(s)} />
            ))}
          </View>
          <Button label="Next" icon="arrow-forward" onPress={() => setStep(2)} style={{ marginTop: space.lg }} />
          <Button label="Back" variant="ghost" onPress={() => setStep(0)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ paddingTop: 24, gap: space.lg }}>
        <Text style={type.label}>Step 2 of 2</Text>
        <Text style={type.h1}>Units</Text>
        <View style={styles.chipWrap}>
          <Chip label="oz / lb" selected={units === 'imperial'} onPress={() => { setUnits('imperial'); setBottleMl(710); }} />
          <Chip label="mL / kg" selected={units === 'metric'} onPress={() => { setUnits('metric'); setBottleMl(750); }} />
        </View>

        <Text style={type.h1}>Your water bottle</Text>
        <View style={styles.chipWrap}>
          {BOTTLES[units].map((ml) => (
            <Chip key={ml} label={formatFluid(ml, units)} selected={bottleMl === ml} onPress={() => setBottleMl(ml)} color={colors.water} />
          ))}
        </View>

        <Text style={type.h1}>Body weight (optional)</Text>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder={units === 'imperial' ? 'lb' : 'kg'}
          placeholderTextColor={colors.textFaint}
          keyboardType="decimal-pad"
          style={styles.input}
          maxLength={5}
        />
        {weightInvalid && <Text style={[type.small, { color: colors.danger }]}>That doesn’t look right. Leave it blank or fix it.</Text>}
        <Text style={type.dim}>
          Only used to size your fuel and fluid targets and for the sweat test. It never leaves this phone, and FuelCast never sets weight goals.
        </Text>

        <Button label="Build my forecast" icon="flash" onPress={finish} disabled={weightInvalid} style={{ marginTop: space.lg }} />
        <Button label="Back" variant="ghost" onPress={() => setStep(1)} />
      </View>
    </Screen>
  );
}
