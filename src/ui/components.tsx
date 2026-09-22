import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { FIT_LABEL } from '../engine/fuelFit';
import type { FitLevel, WindowType } from '../engine/types';
import { colors, fitColor, radius, space, type, windowColor, windowIcon } from './theme';

export function tap() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}

export function success() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Back if there's history (there isn't after a page reload on web), otherwise home. */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function Screen({ children, safeTop = true }: { children: ReactNode; safeTop?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={safeTop ? ['top'] : []}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}
    >
      {children}
    </Pressable>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = { primary: colors.accent, secondary: colors.cardRaised, ghost: 'transparent', danger: 'transparent' }[variant];
  const fg = { primary: colors.accentInk, secondary: colors.text, ghost: colors.textDim, danger: colors.danger }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        variant === 'danger' && { borderWidth: 1, borderColor: colors.danger },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={fg} />}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color = colors.accent,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.chip, selected && { backgroundColor: color, borderColor: color }, style]}
    >
      <Text style={[styles.chipText, selected && { color: colors.accentInk }]}>{label}</Text>
    </Pressable>
  );
}

export function Ring({
  progress,
  size = 120,
  stroke = 12,
  color = colors.accent,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function ProgressBar({ progress, color = colors.accent, height = 8 }: { progress: number; color?: string; height?: number }) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${p * 100}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={type.label}>{title}</Text>
      {right}
    </View>
  );
}

export function Pill({ label, color = colors.textDim }: { label: string; color?: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function FitBadge({ level }: { level: FitLevel }) {
  return <Pill label={FIT_LABEL[level]} color={fitColor[level]} />;
}

export function WindowBadge({ type: t, size = 40 }: { type: WindowType; size?: number }) {
  const c = windowColor[t];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${c}22`, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={windowIcon[t]} size={size * 0.5} color={c} />
    </View>
  );
}

export function Stepper({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={type.dim}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable accessibilityLabel={`Decrease ${label}`} onPress={() => { tap(); onDec(); }} style={styles.stepperBtn}>
          <Ionicons name="remove" size={20} color={colors.text} />
        </Pressable>
        <Text style={[type.h2, { minWidth: 96, textAlign: 'center' }]}>{value}</Text>
        <Pressable accessibilityLabel={`Increase ${label}`} onPress={() => { tap(); onInc(); }} style={styles.stepperBtn}>
          <Ionicons name="add" size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

export function MacroRow({ carbs, protein, fat, fiber }: { carbs: number; protein: number; fat: number; fiber: number }) {
  const items: [string, number][] = [
    ['Carbs', carbs],
    ['Protein', protein],
    ['Fat', fat],
    ['Fiber', fiber],
  ];
  return (
    <View style={styles.macroRow}>
      {items.map(([k, v]) => (
        <View key={k} style={{ alignItems: 'center', flex: 1 }}>
          <Text style={type.h2}>{Math.round(v)}g</Text>
          <Text style={type.small}>{k}</Text>
        </View>
      ))}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segment, selected && { backgroundColor: colors.cardRaised }]}
          >
            <Text numberOfLines={1} style={[styles.segmentText, selected && { color: colors.text }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ScreenTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={type.h1}>{title}</Text>
      {right}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space.lg, paddingBottom: 48, gap: space.md },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm },
  pill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '700' },
  stepper: { gap: space.sm },
  stepperControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroRow: { flexDirection: 'row', paddingVertical: space.sm },
  input: {
    backgroundColor: colors.cardRaised,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  segmented: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, padding: 3, borderWidth: 1, borderColor: colors.border },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm + 2 },
  segmentText: { color: colors.textDim, fontSize: 13, fontWeight: '700' },
});
