import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { askCoach, CoachError } from '@/ai/coach';
import { buildContext } from '@/ai/context';
import { getApiKey } from '@/ai/key';
import { offlineReply, QUICK_PROMPTS } from '@/ai/offline';
import { EXERCISE_BY_ID } from '@/data/exercises';
import type { Workout } from '@/data/workouts';
import { matchFood, mergeShopping } from '@/engine/shopping';
import { newId, useNow, useStore, type ChatMessage } from '@/state/store';
import { findWorkout, useRecommendation } from '@/state/useTraining';
import { Button, Card, Pill, Row, styles as ui, success, tap } from '@/ui/components';
import { colors, radius, space, type } from '@/ui/theme';

function WorkoutAttachment({ w, messageId }: { w: Workout; messageId: string }) {
  const { state, saveWorkout, patchChat } = useStore();
  // Once saved, the message remembers the saved workout's id so it's never saved twice.
  const savedId = w.id && findWorkout(state, w.id) ? w.id : null;

  const ensureSaved = () => {
    if (savedId) return savedId;
    const id = newId();
    const saved = { ...w, id };
    saveWorkout(saved);
    patchChat(messageId, { workout: saved });
    success();
    return id;
  };

  return (
    <View style={{ gap: 6, marginTop: space.sm, backgroundColor: colors.cardRaised, borderRadius: radius.md, padding: space.md }}>
      <Text style={[type.body, { fontWeight: '800' }]}>
        {w.emoji} {w.name}
      </Text>
      <Text style={type.small}>~{w.durationMin} min · {w.items.length} exercises</Text>
      {w.items.slice(0, 8).map((it, k) => (
        <Text key={k} style={type.small}>
          • {it.sets}×{it.reps}
          {EXERCISE_BY_ID[it.exerciseId]?.timed ? 's' : ''} {EXERCISE_BY_ID[it.exerciseId]?.name}
          {it.note ? ` (${it.note})` : ''}
        </Text>
      ))}
      <Row style={{ gap: space.sm, marginTop: 4 }}>
        <Button
          label={savedId ? 'Open' : 'Save'}
          icon={savedId ? 'open-outline' : 'bookmark-outline'}
          variant="secondary"
          style={{ flex: 1, paddingVertical: 10 }}
          onPress={() => router.push({ pathname: '/workout/[id]', params: { id: ensureSaved() } })}
        />
        <Button
          label="Start"
          icon="play"
          style={{ flex: 1, paddingVertical: 10 }}
          onPress={() => router.push({ pathname: '/workout/session', params: { id: ensureSaved() } })}
        />
      </Row>
    </View>
  );
}

function ShoppingAttachment({ items }: { items: string[] }) {
  const { setShopping } = useStore();
  const [added, setAdded] = useState(false);
  return (
    <View style={{ gap: 6, marginTop: space.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {items.map((i) => (
          <Pill key={i} label={`🛒 ${i}`} color={colors.text} />
        ))}
      </View>
      <Button
        label={added ? 'Added to your list ✓' : 'Add to shopping list'}
        icon="cart-outline"
        variant="secondary"
        disabled={added}
        style={{ paddingVertical: 10 }}
        onPress={() => {
          setShopping((list) =>
            mergeShopping(
              list,
              items.map((name) => ({ id: newId(), name: name.replace(/\s*×\d+$/, ''), foodId: matchFood(name.replace(/\s*×\d+$/, '')), note: name.match(/×\d+$/)?.[0], checked: false, source: 'coach' as const })),
            ),
          );
          success();
          setAdded(true);
        }}
      />
    </View>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  if (m.role === 'user') {
    return (
      <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: colors.accent, borderRadius: radius.lg, borderBottomRightRadius: 4, padding: space.md }}>
        <Text style={{ color: colors.accentInk, fontSize: 15, lineHeight: 21 }}>{m.text}</Text>
      </View>
    );
  }
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        maxWidth: '92%',
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderBottomLeftRadius: 4,
        padding: space.md,
        borderWidth: 1,
        borderColor: m.error ? colors.danger : colors.border,
      }}
    >
      <Row style={{ gap: 6, marginBottom: 4 }}>
        <Ionicons name={m.offline ? 'hardware-chip-outline' : 'sparkles'} size={12} color={m.offline ? colors.textDim : colors.recovery} />
        <Text style={[type.small, { fontSize: 11 }]}>{m.offline ? 'Smart Coach · on-device' : m.error ? 'Coach' : 'AI Coach · Claude'}</Text>
      </Row>
      <Text style={[type.body, m.error && { color: colors.danger }]}>{m.text}</Text>
      {m.workout && <WorkoutAttachment w={m.workout} messageId={m.id} />}
      {m.recipe && (
        <View style={{ gap: 4, marginTop: space.sm, backgroundColor: colors.cardRaised, borderRadius: radius.md, padding: space.md }}>
          <Text style={[type.body, { fontWeight: '800' }]}>🍳 {m.recipe.name}</Text>
          <Text style={type.small}>{m.recipe.minutes} min</Text>
          {m.recipe.ingredients.map((i) => (
            <Text key={i} style={type.small}>
              • {i}
            </Text>
          ))}
          {m.recipe.steps.map((s, k) => (
            <Text key={k} style={[type.small, { color: colors.text }]}>
              {k + 1}. {s}
            </Text>
          ))}
        </View>
      )}
      {m.shopping && m.shopping.length > 0 && <ShoppingAttachment items={m.shopping} />}
    </View>
  );
}

export default function Coach() {
  const { state, addChat, clearChat } = useStore();
  const now = useNow();
  const rec = useRecommendation(now);
  const [apiKey, setKey] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const scroll = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      getApiKey().then(setKey);
    }, []),
  );

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [state.chat.length, busy]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    tap();
    setInput('');
    const at = Date.now();
    addChat([{ id: newId(), role: 'user', text, at, offline: !apiKey }]);

    if (!apiKey) {
      const reply = offlineReply(text, state, new Date(), at);
      addChat([{ ...reply, id: newId(), at: Date.now() }]);
      return;
    }

    setBusy(true);
    try {
      const res = await askCoach({ apiKey, history: state.chat, message: text, context: buildContext(state, new Date()) });
      addChat([
        {
          id: newId(),
          role: 'assistant',
          text: res.reply,
          content: res.content,
          workout: res.workout,
          recipe: res.recipe,
          shopping: res.shopping,
          at: Date.now(),
        },
      ]);
    } catch (e) {
      addChat([
        { id: newId(), role: 'assistant', text: e instanceof CoachError ? e.message : 'Something went wrong. Try again.', error: true, at: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm, gap: space.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.h1}>Coach</Text>
            <Row style={{ gap: space.md }}>
              <Pill label={apiKey ? 'Claude connected' : 'Offline mode'} color={apiKey ? colors.recovery : colors.textDim} />
              {state.chat.length > 0 && (
                <Pressable
                  accessibilityLabel={confirmClear ? 'Tap again to clear chat' : 'Clear chat'}
                  hitSlop={10}
                  onPress={() => {
                    if (!confirmClear) {
                      setConfirmClear(true);
                      setTimeout(() => setConfirmClear(false), 3000);
                      return;
                    }
                    clearChat();
                    setConfirmClear(false);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={confirmClear ? colors.danger : colors.textDim} />
                </Pressable>
              )}
            </Row>
          </Row>
        </View>

        <ScrollView ref={scroll} contentContainerStyle={{ padding: space.lg, gap: space.md, paddingTop: space.sm }} keyboardShouldPersistTaps="handled">
          {state.chat.length === 0 && (
            <>
              <Card style={{ gap: space.sm }}>
                <Text style={type.h2}>Hey{state.profile.name ? `, ${state.profile.name}` : ''} 👋</Text>
                <Text style={type.body}>
                  Ask me to plan today’s training, build a workout for your equipment, turn what’s in your kitchen into a recipe, or make your
                  shopping list. I know your schedule, how recovered your muscles are, and what food you have.
                </Text>
                <Text style={type.small}>I’m a coach, not a doctor. For pain, injuries or medical questions, talk to your athletic trainer.</Text>
              </Card>
              <Card onPress={() => router.push('/train')} style={{ gap: 4, borderColor: colors.accent }}>
                <Text style={type.label}>Smart Coach · today</Text>
                <Text style={type.h2}>{rec.headline}</Text>
                <Text style={type.dim}>{rec.reasons[0]}</Text>
              </Card>
              {!apiKey && (
                <Card style={{ gap: space.sm }}>
                  <Text style={type.body}>
                    You’re in offline mode: Smart Coach answers on your phone. Connect Claude for open-ended coaching conversations.
                  </Text>
                  <Button label="Connect Claude" icon="sparkles" variant="secondary" onPress={() => router.push('/settings')} />
                </Card>
              )}
            </>
          )}
          {state.chat.map((m) => (
            <Bubble key={m.id} m={m} />
          ))}
          {busy && (
            <Row style={{ gap: space.sm }}>
              <ActivityIndicator color={colors.recovery} />
              <Text style={type.dim}>Coach is thinking…</Text>
            </Row>
          )}
        </ScrollView>

        <View style={{ paddingHorizontal: space.lg, paddingVertical: space.sm, gap: space.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} keyboardShouldPersistTaps="handled">
            {QUICK_PROMPTS.map((q) => (
              <Pressable key={q} onPress={() => send(q)} disabled={busy} style={[ui.chip, { opacity: busy ? 0.5 : 1 }]}>
                <Text style={ui.chipText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Row style={{ gap: space.sm }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send(input)}
              placeholder={apiKey ? 'Ask your coach anything…' : 'Ask about workouts, recipes, shopping…'}
              placeholderTextColor={colors.textFaint}
              style={[ui.input, { flex: 1, minWidth: 0 }]}
              returnKeyType="send"
              editable={!busy}
              maxLength={500}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              onPress={() => send(input)}
              disabled={busy || !input.trim()}
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: input.trim() && !busy ? colors.accent : colors.cardRaised, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-up" size={22} color={input.trim() && !busy ? colors.accentInk : colors.textFaint} />
            </Pressable>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
