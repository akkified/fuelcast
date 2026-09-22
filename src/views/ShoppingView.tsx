import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Share, Text, TextInput, View } from 'react-native';

import { FOOD_BY_ID } from '../data/foods';
import { buildDayPlan } from '../engine/forecast';
import { matchFood, mergeShopping, weekSuggestions, type ShoppingItem } from '../engine/shopping';
import { addDays, dateKey } from '../engine/time';
import { newId, useNow, useStore } from '../state/store';
import { Button, Card, Row, SectionHeader, styles, success, tap } from '../ui/components';
import { colors, space, type } from '../ui/theme';

export function ShoppingView() {
  const { state, setShopping, moveCheckedToKitchen } = useStore();
  const today = dateKey(useNow());
  const [text, setText] = useState('');

  const suggestions = useMemo(() => {
    const week = Array.from({ length: 7 }, (_, i) => buildDayPlan(addDays(today, i), state.events, state.profile)).flat();
    const onList = new Set(state.shopping.filter((i) => !i.checked).map((i) => i.foodId));
    return weekSuggestions(week, state.pantry).filter((s) => !onList.has(s.foodId));
  }, [today, state.events, state.profile, state.pantry, state.shopping]);

  const open = state.shopping.filter((i) => !i.checked);
  const checked = state.shopping.filter((i) => i.checked);

  const addItems = (items: ShoppingItem[]) => {
    setShopping((list) => mergeShopping(list, items));
    success();
  };

  const addTyped = () => {
    const names = text.split(',').map((t) => t.trim()).filter(Boolean);
    if (!names.length) return;
    addItems(names.map((name) => ({ id: newId(), name, foodId: matchFood(name), checked: false, source: 'manual' })));
    setText('');
  };

  const share = async () => {
    const lines = open.map((i) => `• ${i.name}${i.note ? ` (${i.note})` : ''}`).join('\n');
    try {
      await Share.share({ message: `FuelCast shopping list\n${lines}` });
    } catch {
      // Sharing isn't available on every platform (e.g. some browsers).
    }
  };

  const toggle = (id: string) => {
    tap();
    setShopping((list) => list.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };
  const remove = (id: string) => setShopping((list) => list.filter((i) => i.id !== id));

  return (
    <>
      {suggestions.length > 0 && (
        <Card style={{ gap: space.sm, borderColor: colors.accent }}>
          <Row style={{ gap: space.sm }}>
            <Ionicons name="sparkles" size={18} color={colors.accent} />
            <Text style={type.h2}>For this week’s schedule</Text>
          </Row>
          <Text style={type.dim}>So every fuel window this week has a great option in your kitchen:</Text>
          {suggestions.map((s) => {
            const f = FOOD_BY_ID[s.foodId];
            return (
              <Row key={s.foodId} style={{ gap: space.md }}>
                <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>
                    {f.name} ×{s.qty}
                  </Text>
                  <Text style={type.small}>{s.reason}</Text>
                </View>
                <Pressable
                  accessibilityLabel={`Add ${f.name}`}
                  onPress={() => addItems([{ id: newId(), name: f.name, foodId: f.id, note: `×${s.qty}`, checked: false, source: 'plan' }])}
                  hitSlop={8}
                >
                  <Ionicons name="add-circle" size={28} color={colors.accent} />
                </Pressable>
              </Row>
            );
          })}
          <Button
            label="Add all"
            variant="secondary"
            onPress={() =>
              addItems(
                suggestions.map((s) => ({
                  id: newId(),
                  name: FOOD_BY_ID[s.foodId].name,
                  foodId: s.foodId,
                  note: `×${s.qty}`,
                  checked: false,
                  source: 'plan' as const,
                })),
              )
            }
          />
        </Card>
      )}

      <Row style={{ gap: space.sm }}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={addTyped}
          placeholder="Add items (comma-separated)"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, { flex: 1, minWidth: 0 }]}
          returnKeyType="done"
        />
        <Button label="Add" onPress={addTyped} disabled={!text.trim()} style={{ paddingVertical: 12 }} />
      </Row>

      <SectionHeader
        title={`To buy (${open.length})`}
        right={open.length > 0 ? <Button label="Share" icon="share-outline" variant="ghost" onPress={share} style={{ paddingVertical: 2 }} /> : undefined}
      />
      {open.length === 0 && <Text style={type.dim}>Your list is empty. Add suggestions above, or missing ingredients from a recipe.</Text>}
      {open.map((i) => (
        <ItemRow key={i.id} item={i} onToggle={() => toggle(i.id)} onRemove={() => remove(i.id)} />
      ))}

      {checked.length > 0 && (
        <>
          <SectionHeader title={`In the cart (${checked.length})`} />
          {checked.map((i) => (
            <ItemRow key={i.id} item={i} onToggle={() => toggle(i.id)} onRemove={() => remove(i.id)} />
          ))}
          <Button
            label="Put bought items in my kitchen"
            icon="basket"
            onPress={() => {
              moveCheckedToKitchen();
              success();
            }}
          />
        </>
      )}
    </>
  );
}

function ItemRow({ item, onToggle, onRemove }: { item: ShoppingItem; onToggle: () => void; onRemove: () => void }) {
  const f = item.foodId ? FOOD_BY_ID[item.foodId] : undefined;
  return (
    <Row style={{ gap: space.md, backgroundColor: colors.card, borderRadius: 14, padding: space.md, borderWidth: 1, borderColor: colors.border }}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.checked }} accessibilityLabel={item.name} onPress={onToggle} hitSlop={8}>
        <Ionicons name={item.checked ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={item.checked ? colors.great : colors.textFaint} />
      </Pressable>
      <Text style={{ fontSize: 20 }}>{f?.emoji ?? '🛒'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[type.body, item.checked && { textDecorationLine: 'line-through', color: colors.textDim }]}>{item.name}</Text>
        {item.note && <Text style={type.small}>{item.note}</Text>}
      </View>
      <Pressable accessibilityLabel={`Remove ${item.name}`} onPress={onRemove} hitSlop={8}>
        <Ionicons name="close" size={20} color={colors.textFaint} />
      </Pressable>
    </Row>
  );
}
