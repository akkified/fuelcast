import { Pressable, Text, View } from 'react-native';

import { tap } from './components';
import { colors, radius, space, type } from './theme';

export const ENERGY = [
  { value: 1, emoji: '😫', label: 'Drained' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Unstoppable' },
];

export function EnergyPicker({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.xs }}>
      {ENERGY.map((e) => {
        const selected = value === e.value;
        return (
          <Pressable
            key={e.value}
            accessibilityRole="button"
            accessibilityLabel={e.label}
            accessibilityState={{ selected }}
            onPress={() => {
              tap();
              onChange(e.value);
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: space.sm,
              borderRadius: radius.md,
              backgroundColor: selected ? colors.cardRaised : 'transparent',
              borderWidth: 1,
              borderColor: selected ? colors.accent : 'transparent',
            }}
          >
            <Text style={{ fontSize: 26 }}>{e.emoji}</Text>
            <Text style={[type.small, { fontSize: 10, marginTop: 2 }]}>{e.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
