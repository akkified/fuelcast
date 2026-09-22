import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Svg, { ClipPath, Defs, Rect } from 'react-native-svg';

import { eventsOn } from '@/engine/forecast';
import { bottlesFor, formatFluid, goalBreakdown, ML_PER_OZ, sweatTest, toKg, toMl, type SweatTestResult } from '@/engine/hydration';
import { dateKey } from '@/engine/time';
import { useNow, useStore } from '@/state/store';
import { useDay } from '@/state/useDay';
import { Button, Card, Row, Screen, SectionHeader, Stepper, styles, success } from '@/ui/components';
import { colors, space, type } from '@/ui/theme';

function Bottle({ progress }: { progress: number }) {
  const p = Math.max(0, Math.min(1, progress));
  const h = 150;
  const w = 76;
  return (
    <Svg width={w} height={h + 16}>
      <Defs>
        <ClipPath id="bottle">
          <Rect x={4} y={16} width={w - 8} height={h - 4} rx={18} />
        </ClipPath>
      </Defs>
      <Rect x={24} y={0} width={w - 48} height={16} rx={4} fill={colors.border} />
      <Rect x={4} y={16} width={w - 8} height={h - 4} rx={18} fill={colors.cardRaised} stroke={colors.border} strokeWidth={2} />
      <Rect x={4} y={16 + (h - 4) * (1 - p)} width={w - 8} height={(h - 4) * p} fill={colors.water} clipPath="url(#bottle)" />
    </Svg>
  );
}

function NumberField({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
      <Text style={type.small}>{label}</Text>
      <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textFaint}
          style={{ flex: 1, minWidth: 0, width: '100%', color: colors.text, fontSize: 16, paddingVertical: 12 }}
          maxLength={6}
        />
        <Text style={type.dim}>{unit}</Text>
      </View>
    </View>
  );
}

export default function Hydrate() {
  const { state, addWater, updateProfile } = useStore();
  const today = dateKey(useNow());
  const { goalMl, log } = useDay(today);
  const { profile } = state;
  const u = profile.units;
  const water = log?.waterMl ?? 0;
  const breakdown = goalBreakdown(profile, eventsOn(today, state.events));

  const [pre, setPre] = useState('');
  const [post, setPost] = useState('');
  const [drank, setDrank] = useState('');
  const [minutes, setMinutes] = useState(90);
  const [result, setResult] = useState<SweatTestResult | null>(null);

  const weightUnit = u === 'imperial' ? 'lb' : 'kg';
  const fluidUnit = u === 'imperial' ? 'oz' : 'mL';
  const lph = (l: number) => (u === 'imperial' ? `${Math.round((l * 1000) / ML_PER_OZ)} oz/hr` : `${l.toFixed(2)} L/hr`);

  const run = () => {
    const r = sweatTest({
      preKg: toKg(Number(pre), u),
      postKg: toKg(Number(post), u),
      fluidMl: drank.trim() === '' ? 0 : toMl(Number(drank), u),
      urineMl: 0,
      minutes,
    });
    if (r.ok) success();
    setResult(r);
  };

  return (
    <Screen>
      <Text style={type.h1}>Hydrate</Text>

      <Card style={{ flexDirection: 'row', gap: space.xl, alignItems: 'center' }}>
        <Bottle progress={water / goalMl} />
        <View style={{ flex: 1, gap: space.sm }}>
          <Text style={type.label}>Today</Text>
          <Text style={[type.hero, { color: colors.water }]}>{formatFluid(water, u)}</Text>
          <Text style={type.dim}>
            of {formatFluid(goalMl, u)} · {bottlesFor(goalMl, profile.bottleMl)} bottles
          </Text>
          <Row style={{ gap: space.sm }}>
            <Button label="−" variant="secondary" onPress={() => addWater(today, -profile.bottleMl)} style={{ flex: 1, paddingVertical: 10 }} />
            <Button label="+1 bottle" onPress={() => { success(); addWater(today, profile.bottleMl); }} style={{ flex: 3, paddingVertical: 10 }} />
          </Row>
        </View>
      </Card>

      <SectionHeader title="How your goal is set" />
      <Card style={{ gap: space.sm }}>
        {breakdown.map((item, i) => (
          <Row key={`${item.label}-${i}`} style={{ justifyContent: 'space-between' }}>
            <Text style={type.body}>{i === 0 ? item.label : `+ ${item.label}`}</Text>
            <Text style={type.body}>{formatFluid(item.ml, u)}</Text>
          </Row>
        ))}
        <Text style={[type.small, { marginTop: 4 }]}>
          {profile.sweatRateLph
            ? `Training fluid uses your measured sweat rate (${lph(profile.sweatRateLph)}).`
            : 'Training fluid uses a typical sweat rate. Take the sweat test below to personalize it.'}
        </Text>
      </Card>

      <SectionHeader title="Sweat test" />
      <Card style={{ gap: space.md }}>
        <Text style={type.body}>Find out how much you really sweat. This is the method sports scientists and athletic trainers recommend.</Text>
        <Text style={type.dim}>
          1. Weigh yourself right before practice.{'\n'}2. Track how much you drink during it.{'\n'}3. Towel off and weigh yourself right after,
          before using the bathroom.
        </Text>
        <Row style={{ gap: space.md }}>
          <NumberField label="Weight before" value={pre} onChange={setPre} unit={weightUnit} />
          <NumberField label="Weight after" value={post} onChange={setPost} unit={weightUnit} />
        </Row>
        <NumberField label="Fluid you drank during" value={drank} onChange={setDrank} unit={fluidUnit} />
        <Stepper
          label="Session length"
          value={`${minutes} min`}
          onDec={() => setMinutes((m) => Math.max(15, m - 15))}
          onInc={() => setMinutes((m) => Math.min(300, m + 15))}
        />
        <Button label="Calculate my sweat rate" icon="beaker-outline" onPress={run} disabled={!pre || !post} />

        {result && !result.ok && <Text style={[type.body, { color: colors.danger }]}>{result.error}</Text>}
        {result?.ok && (
          <View style={{ gap: space.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md }}>
            <Text style={type.label}>Your sweat rate</Text>
            <Text style={[type.hero, { color: colors.water }]}>{lph(result.sweatRateLph)}</Text>
            <Text style={type.body}>You lost {result.lossPct}% of your body weight as sweat this session.</Text>
            <Text style={type.body}>• Next time, drink about {formatFluid(result.perHourMl, u)} per hour while you train.</Text>
            {result.replaceMl.max > 0 && (
              <Text style={type.body}>
                • Over the next few hours, drink {formatFluid(result.replaceMl.min, u)}–{formatFluid(result.replaceMl.max, u)} to replace what you lost.
              </Text>
            )}
            {result.warning && <Text style={[type.body, { color: colors.warn }]}>⚠️ {result.warning}</Text>}
            <Button
              label={profile.sweatRateLph === result.sweatRateLph ? 'Saved to your profile' : 'Use this in my plan'}
              variant="secondary"
              icon="checkmark"
              disabled={profile.sweatRateLph === result.sweatRateLph}
              onPress={() => updateProfile({ sweatRateLph: result.sweatRateLph })}
            />
          </View>
        )}
      </Card>
    </Screen>
  );
}
