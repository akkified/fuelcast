import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { EventKind, FitLevel, WindowType } from '../engine/types';

export const colors = {
  bg: '#0B0F14',
  card: '#151B23',
  cardRaised: '#1C2430',
  border: '#263040',
  text: '#F2F5F8',
  textDim: '#9AA7B6',
  textFaint: '#667385',
  accent: '#C6F432',
  accentInk: '#10160A',
  danger: '#FF5C5C',
  warn: '#FFC53D',
  water: '#3BA7FF',
  preMeal: '#FF8A3D',
  topOff: '#FFC53D',
  during: '#3BA7FF',
  recovery: '#A78BFA',
  great: '#4ADE80',
  ok: '#FFC53D',
  avoid: '#FF6B6B',
};

export const windowColor: Record<WindowType, string> = {
  preMeal: colors.preMeal,
  topOff: colors.topOff,
  during: colors.during,
  recovery: colors.recovery,
};

type IconName = ComponentProps<typeof Ionicons>['name'];

export const windowIcon: Record<WindowType, IconName> = {
  preMeal: 'restaurant',
  topOff: 'flash',
  during: 'water',
  recovery: 'refresh',
};

export const kindIcon: Record<EventKind, IconName> = {
  practice: 'football',
  game: 'trophy-outline',
  lift: 'barbell',
  conditioning: 'speedometer-outline',
};

export const fitColor: Record<FitLevel, string> = { great: colors.great, ok: colors.ok, avoid: colors.avoid };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export const type = {
  hero: { fontSize: 30, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  dim: { fontSize: 14, color: colors.textDim, lineHeight: 20 },
  small: { fontSize: 12, color: colors.textDim },
  label: { fontSize: 12, fontWeight: '700' as const, color: colors.textDim, letterSpacing: 0.8, textTransform: 'uppercase' as const },
};
