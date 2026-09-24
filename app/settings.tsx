import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Text, TextInput, View } from 'react-native';

import { COACH_MODEL, GROK_MODEL } from '@/ai/coach';
import { getAiProvider, getProviderKey, maskKey, PROVIDER_NAME, setAiProvider, setProviderKey, type AiProvider, type ProviderKey } from '@/ai/key';
import { EQUIPMENT_LABEL, type Equipment } from '@/data/exercises';
import { GOAL_LABEL, LEVEL_LABEL, type Goal, type Level } from '@/data/workouts';
import { formatFluid, formatWeight, LB_PER_KG, ML_PER_OZ, toKg } from '@/engine/hydration';
import { dateKey, minutesOfDay } from '@/engine/time';
import type { Units } from '@/engine/types';
import { useStore } from '@/state/store';
import { Button, Card, Chip, Row, Screen, SectionHeader, Stepper, goBack, styles, success } from '@/ui/components';
import { colors, space, type } from '@/ui/theme';

const SOURCES: [string, string][] = [
  ['ACSM / AND / DC: Nutrition and Athletic Performance (2016)', 'https://pubmed.ncbi.nlm.nih.gov/26891166/'],
  ['ACSM: Exercise and Fluid Replacement (2007)', 'https://pubmed.ncbi.nlm.nih.gov/17277604/'],
  ['NATA: Fluid Replacement for the Physically Active (2017)', 'https://pubmed.ncbi.nlm.nih.gov/28985128/'],
  ['AAP: Sports Drinks and Energy Drinks for Children and Adolescents (2011)', 'https://pubmed.ncbi.nlm.nih.gov/21624882/'],
  ['NSCA: Youth Resistance Training Position Statement (2009)', 'https://pubmed.ncbi.nlm.nih.gov/19620931/'],
  ['AAP: Resistance Training for Children and Adolescents (2020)', 'https://pubmed.ncbi.nlm.nih.gov/32457216/'],
  ['Google MediaPipe Pose Landmarker (on-device pose model)', 'https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker'],
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
  const [provider, setProvider] = useState<AiProvider>('claude');
  const [savedKey, setSavedKey] = useState<ProviderKey | null>(null);
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    getAiProvider().then(setProvider);
  }, []);
  useEffect(() => {
    getProviderKey(provider).then(setSavedKey);
  }, [provider]);

  const chooseProvider = async (p: AiProvider) => {
    setProvider(p);
    setKeyInput('');
    await setAiProvider(p);
  };

  const saveKey = async () => {
    const k = keyInput.trim();
    if (!k) return;
    await setProviderKey(provider, k);
    setSavedKey({ key: k, source: 'saved' });
    setKeyInput('');
    success();
  };

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

      <SectionHeader title="Training" />
      <Card style={{ gap: space.md }}>
        <Text style={type.small}>Goal</Text>
        <View style={styles.chipWrap}>
          {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
            <Chip key={g} label={GOAL_LABEL[g]} selected={profile.goal === g} onPress={() => updateProfile({ goal: g })} />
          ))}
        </View>
        <Text style={type.small}>Experience</Text>
        <View style={styles.chipWrap}>
          {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
            <Chip key={l} label={LEVEL_LABEL[l]} selected={profile.level === l} onPress={() => updateProfile({ level: l })} />
          ))}
        </View>
        <Text style={type.small}>Equipment (bodyweight is always included)</Text>
        <View style={styles.chipWrap}>
          {(Object.keys(EQUIPMENT_LABEL) as Equipment[])
            .filter((e) => e !== 'bodyweight')
            .map((e) => (
              <Chip
                key={e}
                label={EQUIPMENT_LABEL[e]}
                selected={profile.equipment.includes(e)}
                onPress={() =>
                  updateProfile({ equipment: profile.equipment.includes(e) ? profile.equipment.filter((x) => x !== e) : [...profile.equipment, e] })
                }
              />
            ))}
        </View>
        <Stepper
          label="Usual workout length"
          value={`${profile.sessionMin} min`}
          onDec={() => updateProfile({ sessionMin: Math.max(15, profile.sessionMin - 5) })}
          onInc={() => updateProfile({ sessionMin: Math.min(90, profile.sessionMin + 5) })}
        />
      </Card>

      <SectionHeader title="AI Coach" />
      <Card style={{ gap: space.sm }}>
        <Text style={type.dim}>
          Smart Coach works on your phone with no setup. Connect an AI to unlock open-ended coaching chat and feedback on Form Check frames.
        </Text>
        <Text style={type.small}>Which AI?</Text>
        <View style={styles.chipWrap}>
          {(['grok', 'claude'] as AiProvider[]).map((p) => (
            <Chip key={p} label={`${PROVIDER_NAME[p]} (${p === 'grok' ? GROK_MODEL : COACH_MODEL})`} selected={provider === p} onPress={() => chooseProvider(p)} />
          ))}
        </View>
        <Text style={type.small}>
          Each coach message sends your question plus a short summary: sport, level, goal, equipment, the next few days of your schedule,
          muscle readiness, recent workouts and kitchen foods. Your name and body weight are never sent. Keys are stored in your phone’s
          secure keychain. Ask a parent or guardian before connecting a paid account.
        </Text>
        {savedKey ? (
          <>
            <Text style={[type.body, { color: colors.great }]}>
              ✓ {PROVIDER_NAME[provider]} connected (key {maskKey(savedKey.key)}
              {savedKey.source === 'dev' ? ', from .env.local in this development build' : ''})
            </Text>
            {savedKey.source === 'saved' && (
              <Button
                label="Disconnect"
                variant="danger"
                onPress={async () => {
                  await setProviderKey(provider, null);
                  setSavedKey(await getProviderKey(provider));
                }}
              />
            )}
          </>
        ) : (
          <>
            <TextInput
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder={provider === 'grok' ? 'xai-…' : 'sk-ant-…'}
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Button label="Connect" icon="sparkles" onPress={saveKey} disabled={!keyInput.trim()} />
            <Text
              style={[type.small, { color: colors.accent }]}
              onPress={() => Linking.openURL(provider === 'grok' ? 'https://console.x.ai' : 'https://console.anthropic.com/settings/keys')}
            >
              Get a key at {provider === 'grok' ? 'console.x.ai' : 'console.anthropic.com'}
            </Text>
          </>
        )}
      </Card>

      <SectionHeader title="Data" />
      <Card style={{ gap: space.sm }}>
        <Text style={type.dim}>
          Everything is stored only on this device. FuelCast has no accounts and no ads. The only network use is the optional AI Coach above, plus a one-time download of the Form Check pose model. Videos are analyzed on the phone.
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

      <Button label="How FuelCast works" icon="help-circle-outline" variant="secondary" onPress={() => router.push('/help')} />

      <SectionHeader title="The science" />
      <Card style={{ gap: space.md }}>
        <Text style={type.dim}>
          FuelCast’s fueling, hydration and training rules come from these position statements. It’s education, not medical advice. Talk to your athletic
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
      <Text style={[type.small, { textAlign: 'center', marginTop: space.lg }]}>FuelCast 3.0 · Built for the 2026 GATSA App Development Pitch</Text>
    </Screen>
  );
}
