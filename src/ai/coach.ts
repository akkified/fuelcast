// AI Coach: a chat coach powered by Claude (Anthropic Messages API).
//
// - Runs only when the athlete connects their own API key (stored in the Keychain).
// - Uses structured outputs so a reply can carry a workout (restricted to exercise
//   IDs from our library, so it can be saved and run in the planner), a recipe, and
//   shopping items, all as guaranteed-valid JSON.
// - Sends a short context summary with each message: sport, level, goal,
//   equipment, the next few days of schedule, muscle readiness, recent workouts and
//   kitchen foods. It never sends the athlete's name or body weight.
// - Calls the Messages API over HTTPS with fetch. The official TypeScript SDK
//   documents that React Native is not a supported runtime, so the app speaks the
//   REST API directly (same request shape as the SDK).

import { EXERCISE_BY_ID, EXERCISES, EQUIPMENT_LABEL } from '../data/exercises';
import { FOOD_BY_ID } from '../data/foods';
import { estimateMinutes, type Workout, type WorkoutItem } from '../data/workouts';
import type { ChatMessage, ChatRecipe } from '../state/store';

export const COACH_MODEL = 'claude-opus-5';

const EXERCISE_LIST = EXERCISES.map((e) => `${e.id}: ${e.name} (${EQUIPMENT_LABEL[e.equipment]})`).join('\n');

export const SYSTEM_PROMPT = `You are FuelCast Coach, a friendly strength, conditioning and sports-nutrition coach inside FuelCast, an iPhone app for high-school athletes (ages 14–18).

How to coach:
- Training follows youth resistance-training guidance (NSCA 2009, AAP 2020): technique first, 1–3 sets (up to 4 for experienced lifters) of 6–15 reps, 2–3 non-consecutive strength days a week, a real warm-up, and a spotter for barbell pressing.
- Respect the schedule in the athlete context: no hard leg work or conditioning the day before or the day of a game, and favor muscles the context marks as fresh.
- Fueling follows the ACSM / Academy of Nutrition and Dietetics / Dietitians of Canada position: a carb-focused meal 3–4 hours before training, a small low-fat, low-fiber carb snack 30–60 minutes before, and carbs plus 15–25 g protein within an hour after. Hydrate before, during and after.
- Never give calorie targets, weight-loss, cutting or bulking plans, or comment on body size or shape. Never recommend supplements, pre-workout or energy drinks; for questions about them, suggest asking a doctor or registered dietitian.
- If the athlete mentions pain, an injury, dizziness, chest pain, fainting or disordered eating, don't program around it. Kindly tell them to stop and talk to their athletic trainer, a parent or a doctor.
- Keep replies short and practical: under 120 words, plain language, no headings.

Output: reply with JSON matching the schema.
- "reply" is the message the athlete reads.
- Fill "workout" only when they ask for a workout or session plan. Use only exerciseId values from the list below, and only exercises their equipment allows ("Bodyweight" is always available). Otherwise set it to null.
- Fill "recipe" only when they ask for a recipe or meal idea. Build it from their kitchen foods where possible. Otherwise set it to null.
- "shopping" lists anything they'd need to buy for your suggestion (an empty array if nothing).

Exercise library (exerciseId: name (equipment)):
${EXERCISE_LIST}`;

const nullable = (schema: object) => ({ anyOf: [{ type: 'null' }, schema] });

export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    workout: nullable({
      type: 'object',
      properties: {
        name: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              exerciseId: { type: 'string', enum: EXERCISES.map((e) => e.id) },
              sets: { type: 'integer' },
              reps: { type: 'integer', description: 'Reps, or seconds for timed exercises' },
              restSec: { type: 'integer' },
              note: { type: 'string' },
            },
            required: ['exerciseId', 'sets', 'reps', 'restSec', 'note'],
            additionalProperties: false,
          },
        },
      },
      required: ['name', 'items'],
      additionalProperties: false,
    }),
    recipe: nullable({
      type: 'object',
      properties: {
        name: { type: 'string' },
        minutes: { type: 'integer' },
        ingredients: { type: 'array', items: { type: 'string' } },
        steps: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'minutes', 'ingredients', 'steps'],
      additionalProperties: false,
    }),
    shopping: { type: 'array', items: { type: 'string' } },
  },
  required: ['reply', 'workout', 'recipe', 'shopping'],
  additionalProperties: false,
} as const;

export interface CoachReply {
  reply: string;
  workout?: Workout;
  recipe?: ChatRecipe;
  shopping: string[];
  content: unknown;
}

export class CoachError extends Error {}

const clampInt = (n: unknown, lo: number, hi: number, fallback: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;

/** Validate and normalize the model's JSON (the schema guarantees the shape; this guards the numbers). */
export function parseCoachJson(text: string): Omit<CoachReply, 'content'> {
  let data: {
    reply?: unknown;
    workout?: { name?: unknown; items?: unknown[] } | null;
    recipe?: { name?: unknown; minutes?: unknown; ingredients?: unknown[]; steps?: unknown[] } | null;
    shopping?: unknown[];
  };
  try {
    data = JSON.parse(text);
  } catch {
    throw new CoachError('The coach sent a reply I couldn’t read. Try again.');
  }
  const reply = typeof data.reply === 'string' && data.reply.trim() ? data.reply.trim() : 'Here you go.';

  let workout: Workout | undefined;
  if (data.workout && Array.isArray(data.workout.items)) {
    const items: WorkoutItem[] = data.workout.items
      .map((raw) => raw as Record<string, unknown>)
      .filter((it) => typeof it.exerciseId === 'string' && EXERCISE_BY_ID[it.exerciseId])
      .slice(0, 12)
      .map((it) => {
        const timed = !!EXERCISE_BY_ID[it.exerciseId as string].timed;
        const note = typeof it.note === 'string' && it.note.trim() ? it.note.trim() : undefined;
        return {
          exerciseId: it.exerciseId as string,
          sets: clampInt(it.sets, 1, 6, 3),
          reps: clampInt(it.reps, 1, timed ? 600 : 30, timed ? 30 : 10),
          restSec: clampInt(it.restSec, 0, 300, 60),
          ...(note ? { note } : {}),
        };
      });
    if (items.length > 0) {
      const name = typeof data.workout.name === 'string' && data.workout.name.trim() ? data.workout.name.trim() : 'Coach Workout';
      workout = {
        id: '',
        name: name.slice(0, 40),
        emoji: '🤖',
        goal: 'general',
        level: 'beginner',
        durationMin: estimateMinutes(items),
        description: 'Designed by FuelCast AI Coach.',
        items,
        custom: true,
        source: 'coach',
      };
    }
  }

  let recipe: ChatRecipe | undefined;
  if (data.recipe && typeof data.recipe.name === 'string') {
    const strings = (xs: unknown[] | undefined) => (xs ?? []).filter((x): x is string => typeof x === 'string' && !!x.trim());
    recipe = {
      name: data.recipe.name,
      minutes: clampInt(data.recipe.minutes, 1, 240, 15),
      ingredients: strings(data.recipe.ingredients),
      steps: strings(data.recipe.steps),
    };
  }

  const shopping = (data.shopping ?? []).filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, 20);
  return { reply, workout, recipe, shopping };
}

export interface ApiMessage {
  role: 'user' | 'assistant';
  content: string | unknown[];
}

/** Rebuild API history from saved chat: only completed user → assistant exchanges with Claude. */
export function historyToMessages(chat: ChatMessage[]): ApiMessage[] {
  const out: ApiMessage[] = [];
  for (let i = 0; i < chat.length - 1; i++) {
    const u = chat[i];
    const a = chat[i + 1];
    if (u.role === 'user' && !u.offline && a.role === 'assistant' && !a.offline && !a.error && a.content) {
      out.push({ role: 'user', content: u.text });
      out.push({ role: 'assistant', content: a.content as unknown[] });
      i++;
    }
  }
  return out.slice(-16);
}

export interface AskOptions {
  apiKey: string;
  history: ChatMessage[];
  message: string;
  context: string;
  /** For tests. */
  fetch?: typeof fetch;
}

export const API_URL = 'https://api.anthropic.com/v1/messages';

interface ApiResponse {
  content: { type: string; text?: string }[];
  stop_reason: string | null;
}

interface ApiErrorBody {
  error?: { type?: string; message?: string };
}

function errorFor(status: number, body: ApiErrorBody | null): CoachError {
  const type = body?.error?.type;
  if (status === 401 || type === 'authentication_error') return new CoachError('That API key didn’t work. Check it in Settings → AI Coach.');
  if (status === 402 || type === 'billing_error') return new CoachError('This API key’s account is out of credits.');
  if (status === 403 || type === 'permission_error') return new CoachError('This API key doesn’t have access to the coach model.');
  if (status === 429 || type === 'rate_limit_error') return new CoachError('The coach is busy right now. Try again in a minute.');
  if (status === 529 || type === 'overloaded_error') return new CoachError('The coach is overloaded right now. Try again in a minute.');
  return new CoachError(`The coach hit an error (${status}). Try again.`);
}

const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

export async function askCoach({ apiKey, history, message, context, fetch: fetchImpl = fetch }: AskOptions): Promise<CoachReply> {
  const body = JSON.stringify({
    model: COACH_MODEL,
    max_tokens: 16000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [
      ...historyToMessages(history),
      { role: 'user', content: `<athlete_context>\n${context}\n</athlete_context>\n\n${message}` },
    ],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
    fallbacks: 'default',
  });
  const headers = {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'server-side-fallback-2026-07-01',
    // Needed for the web build; the athlete supplies their own key, so direct access is intended.
    'anthropic-dangerous-direct-browser-access': 'true',
  };

  let res: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    try {
      res = await fetchImpl(API_URL, { method: 'POST', headers, body, signal: controller.signal });
    } catch {
      res = undefined;
    } finally {
      clearTimeout(timer);
    }
    if (res && !RETRYABLE.has(res.status)) break;
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
  }

  if (!res) throw new CoachError('Can’t reach the coach. Check your internet connection.');
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw errorFor(res.status, err);
  }

  let data: ApiResponse;
  try {
    data = (await res.json()) as ApiResponse;
  } catch {
    throw new CoachError('The coach sent a reply I couldn’t read. Try again.');
  }

  if (data.stop_reason === 'refusal') {
    throw new CoachError('The coach can’t help with that one. For anything medical, talk to your athletic trainer or doctor.');
  }
  if (data.stop_reason === 'max_tokens') throw new CoachError('That answer ran long and got cut off. Try a more specific question.');

  const text = (data.content ?? [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('');
  return { ...parseCoachJson(text), content: data.content };
}

/** Kitchen foods as names for the context summary. */
export const pantryNames = (ids: string[]) => ids.map((id) => FOOD_BY_ID[id]?.name).filter(Boolean).join(', ');
