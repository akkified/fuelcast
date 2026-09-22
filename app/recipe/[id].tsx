import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FOOD_BY_ID } from '@/data/foods';
import { RECIPE_BY_ID } from '@/data/recipes';
import { nextWindow } from '@/engine/forecast';
import { bestWindows, ingredientAmount, matchRecipe, recipeFit, recipeMacros } from '@/engine/recipes';
import { mergeShopping, recipeShopping } from '@/engine/shopping';
import { dateKey, formatClock, minutesOfDay } from '@/engine/time';
import { newId, useNow, useStore } from '@/state/store';
import { useDay } from '@/state/useDay';
import { Button, Card, MacroRow, Pill, Row, Screen, SectionHeader, goBack, success, tap } from '@/ui/components';
import { colors, space, type, windowColor } from '@/ui/theme';

const WINDOW_NAME = { preMeal: 'Pre-game meal', topOff: 'Top-off snack', during: 'In-session', recovery: 'Recovery' } as const;

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, togglePantry, setShopping, logWindow } = useStore();
  const now = useNow();
  const today = dateKey(now);
  const { plan, log } = useDay(today);
  const [added, setAdded] = useState(false);
  const [logged, setLogged] = useState<string | null>(null);
  const recipe = RECIPE_BY_ID[id];

  if (!recipe) {
    return (
      <Screen safeTop={false}>
        <Text style={type.h2}>Recipe not found.</Text>
        <Button label="Back" onPress={goBack} />
      </Screen>
    );
  }

  const pantry = new Set(state.pantry);
  const match = matchRecipe(recipe, pantry);
  const macros = recipeMacros(recipe);
  const fits = bestWindows(recipe, state.profile.weightKg);
  const next = nextWindow(plan, minutesOfDay(now), (wid) => !!log?.windows[wid]);
  const nextFit = next ? recipeFit(recipe, next.type, state.profile.weightKg) : 0;

  const addMissing = () => {
    setShopping((list) => mergeShopping(list, recipeShopping(recipe, match.missing, newId)));
    success();
    setAdded(true);
  };

  const logIt = () => {
    if (!next) return;
    logWindow(today, next.id, 'done', recipe.ingredients.filter((i) => !i.optional).map((i) => i.foodId));
    success();
    setLogged(next.title);
  };

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: recipe.name }} />
      <Row style={{ gap: space.md }}>
        <Text style={{ fontSize: 48 }}>{recipe.emoji}</Text>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={type.h1}>{recipe.name}</Text>
          <Text style={type.dim}>
            {recipe.meal} · {recipe.minutes} min · 1 serving
          </Text>
        </View>
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {fits.map((t) => (
          <Pill key={t} label={`Great for ${WINDOW_NAME[t]}`} color={windowColor[t]} />
        ))}
      </View>

      <Card>
        <MacroRow {...macros} />
        <Text style={[type.small, { textAlign: 'center' }]}>Per serving, estimated from USDA data (optional items not included)</Text>
      </Card>

      <SectionHeader title={`Ingredients · ${match.have.length}/${match.have.length + match.missing.length} in your kitchen`} />
      <Card style={{ gap: space.sm }}>
        {recipe.ingredients.map((i) => {
          const f = FOOD_BY_ID[i.foodId];
          const have = pantry.has(i.foodId);
          return (
            <Pressable
              key={i.foodId}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: have }}
              accessibilityLabel={`${f.name}, ${have ? 'in your kitchen' : 'not in your kitchen'}`}
              onPress={() => {
                tap();
                togglePantry(i.foodId);
              }}
            >
              <Row style={{ gap: space.md }}>
                <Ionicons name={have ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={have ? colors.great : i.optional ? colors.textFaint : colors.warn} />
                <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>
                    {f.name}
                    {i.optional ? <Text style={type.small}> (optional)</Text> : null}
                  </Text>
                  <Text style={type.small}>{ingredientAmount(i.servings, f.serving)}</Text>
                </View>
              </Row>
            </Pressable>
          );
        })}
        <Text style={type.small}>Tap an ingredient to mark it as in (or out of) your kitchen.</Text>
      </Card>
      {match.missing.length > 0 && (
        <Button
          label={added ? 'Added to your shopping list ✓' : `Add ${match.missing.length} missing to shopping list`}
          icon="cart-outline"
          variant="secondary"
          disabled={added}
          onPress={addMissing}
        />
      )}

      <SectionHeader title="Steps" />
      <Card style={{ gap: space.md }}>
        {recipe.steps.map((s, k) => (
          <Row key={k} style={{ gap: space.md, alignItems: 'flex-start' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.cardRaised, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[type.small, { color: colors.text, fontWeight: '700' }]}>{k + 1}</Text>
            </View>
            <Text style={[type.body, { flex: 1 }]}>{s}</Text>
          </Row>
        ))}
      </Card>

      {logged ? (
        <Card style={{ borderColor: colors.great }}>
          <Text style={[type.h2, { color: colors.great }]}>✅ Logged for your {logged.toLowerCase()}</Text>
        </Card>
      ) : next && (
        <Card style={{ gap: space.sm, borderColor: windowColor[next.type] }}>
          <Text style={type.label}>Your next fuel window</Text>
          <Text style={[type.h2, { color: windowColor[next.type] }]}>
            {next.title} · {formatClock(next.startMin)}
          </Text>
          <Text style={type.dim}>
            This recipe scores {nextFit}/100 for it.{nextFit < 65 ? ' Another option may fit better. Check the combos on that window.' : ''}
          </Text>
          <Button label={`I made this for my ${next.title.toLowerCase()}`} icon="checkmark" onPress={logIt} />
        </Card>
      )}
    </Screen>
  );
}
