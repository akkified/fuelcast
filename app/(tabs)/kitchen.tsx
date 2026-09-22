import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CATEGORY_LABEL, FOODS } from '@/data/foods';
import { itemFit } from '@/engine/fuelFit';
import type { Food, WindowType } from '@/engine/types';
import { useStore } from '@/state/store';
import { Chip, FitBadge, Pill, Row, Screen, styles, tap } from '@/ui/components';
import { colors, fitColor, radius, space, type, windowColor } from '@/ui/theme';

const WINDOWS: { type: WindowType; label: string }[] = [
  { type: 'preMeal', label: 'Pre-meal' },
  { type: 'topOff', label: 'Top-off' },
  { type: 'during', label: 'In-session' },
  { type: 'recovery', label: 'Recovery' },
];

type CategoryFilter = Food['category'] | 'all' | 'mine';

export default function Kitchen() {
  const { state, togglePantry } = useStore();
  const [windowType, setWindowType] = useState<WindowType>('topOff');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');

  const foods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FOODS.filter(
      (f) =>
        (category === 'all' || (category === 'mine' ? state.pantry.includes(f.id) : f.category === category)) &&
        (!q || f.name.toLowerCase().includes(q)),
    );
  }, [query, category, state.pantry]);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={type.h1}>My Kitchen</Text>
        <Pill label={`${state.pantry.length} items`} color={colors.accent} />
      </Row>
      <Text style={type.dim}>Tap what you have at home or in your bag. FuelCast builds your combos only from these foods.</Text>

      <Text style={type.label}>Check fit for</Text>
      <View style={styles.chipWrap}>
        {WINDOWS.map((w) => (
          <Chip key={w.type} label={w.label} selected={windowType === w.type} onPress={() => setWindowType(w.type)} color={windowColor[w.type]} />
        ))}
      </View>

      <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 0 }]}>
        <Ionicons name="search" size={18} color={colors.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search foods"
          placeholderTextColor={colors.textFaint}
          style={{ flex: 1, minWidth: 0, color: colors.text, fontSize: 16, paddingVertical: 12 }}
          autoCorrect={false}
        />
      </View>

      <View style={styles.chipWrap}>
        <Chip label="All" selected={category === 'all'} onPress={() => setCategory('all')} />
        <Chip label="In my kitchen" selected={category === 'mine'} onPress={() => setCategory('mine')} />
        {(Object.keys(CATEGORY_LABEL) as Food['category'][]).map((c) => (
          <Chip key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>

      {foods.length === 0 && <Text style={[type.dim, { textAlign: 'center', marginTop: space.lg }]}>No foods match.</Text>}

      {foods.map((f) => {
        const have = state.pantry.includes(f.id);
        const fit = itemFit(f, windowType);
        return (
          <Pressable
            key={f.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: have }}
            accessibilityLabel={`${f.name}, ${have ? 'in your kitchen' : 'not in your kitchen'}`}
            onPress={() => {
              tap();
              togglePantry(f.id);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              padding: space.md,
              borderWidth: 1,
              borderColor: have ? colors.accent : colors.border,
            }}
          >
            <Text style={{ fontSize: 28 }}>{f.emoji}</Text>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[type.body, { fontWeight: '700' }]}>{f.name}</Text>
              <Text style={type.small}>
                {f.serving} · {Math.round(f.carbs)}g carbs · {Math.round(f.protein)}g protein
              </Text>
              <Row style={{ gap: space.sm, flexWrap: 'wrap' }}>
                <FitBadge level={fit.level} />
                <Text style={[type.small, { color: fitColor[fit.level], flexShrink: 1 }]}>{fit.reason}</Text>
              </Row>
              {f.caution && <Text style={[type.small, { color: colors.avoid }]}>{f.caution}</Text>}
            </View>
            <Ionicons name={have ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={have ? colors.accent : colors.textFaint} />
          </Pressable>
        );
      })}
    </Screen>
  );
}
