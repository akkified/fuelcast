import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, TextInput, View } from 'react-native';

import { formatFluid, formatWeight, LB_PER_KG, ML_PER_OZ, toKg } from '@/engine/hydration';
import { dateKey, minutesOfDay } from '@/engine/time';
import type { Units } from '@/engine/types';
import { useStore } from '@/state/store';
import { Button, Card, Chip, Row, Screen, SectionHeader, goBack, styles } from '@/ui/components';
import { colors, space, type } from '@/ui/theme';

const SOURCES: [string, string][] = [
  ['ACSM / AND / DC: Nutrition and Athletic Performance (2016)', 'https://pubmed.ncbi.nlm.nih.gov/26891166/'],
  ['ACSM: Exercise and Fluid Replacement (2007)', 'https://pubmed.ncbi.nlm.nih.gov/17277604/'],
  ['NATA: Fluid Replacement for the Physically Active (2017)', 'https://pubmed.ncbi.nlm.nih.gov/28985128/'],
  ['AAP: Sports Drinks and Energy Drinks for Children and Adolescents (2011)', 'https://pubmed.ncbi.nlm.nih.gov/21624882/'],
  ['USDA FoodData Central', 'https://fdc.nal.usda.gov/'],
];

export default function Settings() {
  const { state, updateProfile, loadDemo, resetAll } = useStore();
  const { profile } = state;
  const [name, setName] = useState(profile.name);
  const [weight, setWeight] = useState(
    profile.weightKg ? String(Math.round((profile.units === 'imperial' ? profile.weightKg * LB_PER_KG : profile.weightKg) * 10) / 10) : '',
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const saveWeight = () => {
    if (weight.trim() === '') return updateProfile({ weightKg: undefined });
    const kg = toKg(Number(weight), profile.units);
    if (Number.isFinite(kg) && kg >= 27 && kg <= 180) updateProfile({ weightKg: Math.round(kg * 10) / 10 });
  };

  const setUnits = (units: Units) => {
    if (units === profile.units) return;
    updateProfile({ units });
    if (profile.weightKg) {
      setWeight(String(Math.round((units === 'imperial' ? profile.weightKg * LB_PER_KG : profile.weightKg) * 10) / 10));
    }
  };

  const bottles = profile.units === 'imperial' ? [500, 710, 946] : [500, 750, 1000];

  return (
    <Screen safeTop={false}>
      <SectionHeader title="Profile" />
      <Card style={{ gap: space.md }}>
        <Text style={type.small}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={() => updateProfile({ name: name.trim() || 'Athlete' })}
          style={styles.input}
          maxLength={24}
          placeholderTextColor={colors.textFaint}
        />
        <Text style={type.small}>Units</Text>
        <View style={styles.chipWrap}>
          <Chip label="oz / lb" selected={profile.units === 'imperial'} onPress={() => setUnits('imperial')} />
          <Chip label="mL / kg" selected={profile.units === 'metric'} onPress={() => setUnits('metric')} />
        </View>
        <Text style={type.small}>Water bottle</Text>
        <View style={styles.chipWrap}>
          {bottles.map((ml) => (
            <Chip
              key={ml}
              label={formatFluid(ml, profile.units)}
              selected={profile.bottleMl === ml}
              onPress={() => updateProfile({ bottleMl: ml })}
              color={colors.water}
            />
          ))}
        </View>
        <Text style={type.small}>Body weight (optional, stays on this phone)</Text>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          onBlur={saveWeight}
          keyboardType="decimal-pad"
          placeholder={profile.units === 'imperial' ? 'lb' : 'kg'}
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          maxLength={5}
        />
        <Text style={type.small}>
          {profile.weightKg ? `Using ${formatWeight(profile.weightKg, profile.units)} to size targets.` : 'Not set: FuelCast uses standard teen targets.'}
          {profile.sweatRateLph
            ? ` Sweat rate: ${profile.units === 'imperial' ? `${Math.round((profile.sweatRateLph * 1000) / ML_PER_OZ)} oz/hr` : `${profile.sweatRateLph} L/hr`}.`
            : ''}
        </Text>
        {profile.sweatRateLph !== undefined && (
          <Button label="Clear sweat rate" variant="ghost" onPress={() => updateProfile({ sweatRateLph: undefined })} />
        )}
      </Card>

      <SectionHeader title="Data" />
      <Card style={{ gap: space.sm }}>
        <Text style={type.dim}>
          Everything is stored only on this device. FuelCast has no accounts, no ads, and sends nothing to a server.
        </Text>
        <Button
          label="Load sample athlete (demo)"
          variant="secondary"
          onPress={() => {
            const now = new Date();
            loadDemo(dateKey(now), minutesOfDay(now));
            goBack();
          }}
        />
        <Button
          label={confirmReset ? 'Tap again to erase everything' : 'Reset all data'}
          variant="danger"
          onPress={() => {
            if (!confirmReset) return setConfirmReset(true);
            resetAll();
            router.replace('/onboarding');
          }}
        />
      </Card>

      <SectionHeader title="The science" />
      <Card style={{ gap: space.md }}>
        <Text style={type.dim}>
          FuelCast’s timing and targets come from these position statements. It’s education, not medical advice. Talk to your athletic
          trainer, doctor, or a registered dietitian about your own needs.
        </Text>
        {SOURCES.map(([label, url]) => (
          <Row key={url}>
            <Text style={[type.body, { color: colors.accent, flex: 1 }]} onPress={() => Linking.openURL(url)} accessibilityRole="link">
              {label}
            </Text>
          </Row>
        ))}
      </Card>
      <Text style={[type.small, { textAlign: 'center', marginTop: space.lg }]}>FuelCast 1.0 · Built for the 2026 GATSA App Development Pitch</Text>
    </Screen>
  );
}
