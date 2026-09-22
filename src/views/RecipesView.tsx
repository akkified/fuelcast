import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { FOOD_BY_ID } from '../data/foods';
import { RECIPES } from '../data/recipes';
import { bestWindows, rankRecipes, recipeMacros, type RecipeMatch } from '../engine/recipes';
import { matchFood } from '../engine/shopping';
import type { WindowType } from '../engine/types';
import { useStore } from '../state/store';
import { Button, Card, Chip, Pill, Row, SectionHeader, styles, success } from '../ui/components';
import { colors, space, type, windowColor } from '../ui/theme';

const FOCUS: { value: WindowType | 'any'; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'preMeal', label: 'Pre-game meal' },
  { value: 'topOff', label: 'Top-off' },
  { value: 'recovery', label: 'Recovery' },
];

const WINDOW_SHORT: Record<WindowType, string> = { preMeal: 'Pre-game', topOff: 'Top-off', during: 'In-session', recovery: 'Recovery' };

function RecipeCard({ m, weightKg }: { m: RecipeMatch; weightKg?: number }) {
  const r = m.recipe;
  const macros = recipeMacros(r);
  const fits = bestWindows(r, weightKg);
  return (
    <Card onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })} style={{ gap: 6, padding: space.md }}>
      <Row style={{ gap: space.md }}>
        <Text style={{ fontSize: 30 }}>{r.emoji}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.body, { fontWeight: '700' }]}>{r.name}</Text>
          <Text style={type.small}>
            {r.meal} · {r.minutes} min · {macros.carbs}g carbs · {macros.protein}g protein
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {fits.map((t) => (
          <Pill key={t} label={WINDOW_SHORT[t]} color={windowColor[t]} />
        ))}
      </View>
      {m.missing.length > 0 && (
        <Text style={[type.small, { color: colors.warn }]}>Need: {m.missing.map((id) => FOOD_BY_ID[id]?.name).join(', ')}</Text>
      )}
    </Card>
  );
}

export function RecipesView({ initialFocus }: { initialFocus?: WindowType }) {
  const { state, addToPantry } = useStore();
  const [focus, setFocus] = useState<WindowType | 'any'>(initialFocus ?? 'any');
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(false);

  const ranked = useMemo(
    () => rankRecipes(RECIPES, state.pantry, focus === 'any' ? undefined : focus, state.profile.weightKg),
    [state.pantry, focus, state.profile.weightKg],
  );
  const ready = ranked.filter((m) => m.status === 'ready');
  const almost = ranked.filter((m) => m.status === 'almost');
  const shop = ranked.filter((m) => m.status === 'shop');

  const addFoods = () => {
    const parts = text.split(/,|\band\b/).map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return;
    const found: string[] = [];
    const unknown: string[] = [];
    for (const p of parts) {
      const id = matchFood(p);
      if (id) found.push(id);
      else unknown.push(p);
    }
    if (found.length) {
      addToPantry(found);
      success();
    }
    setFeedback(
      [
        found.length ? `Added ${found.map((id) => FOOD_BY_ID[id].name).join(', ')} to your kitchen.` : '',
        unknown.length ? `Couldn’t match ${unknown.join(', ')}. Try the Kitchen list, or ask the Coach.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    );
    setText('');
  };

  return (
    <>
      <Card style={{ gap: space.sm }}>
        <Text style={type.h2}>What food do you have?</Text>
        <Text style={type.dim}>Type what’s in your fridge or pantry, separated by commas, and recipes update instantly.</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={addFoods}
          placeholder="e.g. eggs, tortillas, cheese, salsa"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          returnKeyType="done"
          autoCorrect={false}
        />
        <Button label="Add to my kitchen" icon="add" variant="secondary" onPress={addFoods} disabled={!text.trim()} />
        {feedback && <Text style={[type.small, { color: colors.great }]}>{feedback}</Text>}
      </Card>

      <View style={styles.chipWrap}>
        {FOCUS.map((f) => (
          <Chip key={f.value} label={f.label} selected={focus === f.value} onPress={() => setFocus(f.value)} />
        ))}
      </View>

      <SectionHeader title={`Ready to make (${ready.length})`} />
      {ready.length === 0 && <Text style={type.dim}>Nothing yet. Add a few foods above, or check “Almost there” below.</Text>}
      {ready.map((m) => (
        <RecipeCard key={m.recipe.id} m={m} weightKg={state.profile.weightKg} />
      ))}

      <SectionHeader title={`Almost there (${almost.length})`} />
      {almost.map((m) => (
        <RecipeCard key={m.recipe.id} m={m} weightKg={state.profile.weightKg} />
      ))}

      {shop.length > 0 && (
        <>
          <SectionHeader
            title={`Need a shopping trip (${shop.length})`}
            right={<Button label={showShop ? 'Hide' : 'Show'} variant="ghost" onPress={() => setShowShop((v) => !v)} style={{ paddingVertical: 2 }} />}
          />
          {showShop && shop.map((m) => <RecipeCard key={m.recipe.id} m={m} weightKg={state.profile.weightKg} />)}
        </>
      )}
    </>
  );
}
