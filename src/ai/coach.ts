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
import type { AiProvider } from './key';

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

/**
 * Rebuild API history from saved chat: only completed user → assistant exchanges
 * with the same provider (Claude replays content blocks; Grok replays the JSON text).
 */
export function historyToMessages(chat: ChatMessage[], provider: AiProvider = 'claude'): ApiMessage[] {
  const out: ApiMessage[] = [];
  for (let i = 0; i < chat.length - 1; i++) {
    const u = chat[i];
    const a = chat[i + 1];
    const sameProvider = (a.provider ?? 'claude') === provider;
    if (u.role === 'user' && !u.offline && a.role === 'assistant' && !a.offline && !a.error && a.content && sameProvider) {
      out.push({ role: 'user', content: u.text });
      out.push({ role: 'assistant', content: a.content as string | unknown[] });
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
  provider?: AiProvider;
  /** For tests. */
  fetch?: typeof fetch;
}

export const API_URL = 'https://api.anthropic.com/v1/messages';
export const GROK_URL = 'https://api.x.ai/v1/chat/completions';
export const GROK_MODEL = 'grok-4.7';

interface ApiResponse {
  content: { type: string; text?: string }[];
  stop_reason: string | null;
}

interface ApiErrorBody {
  error?: { type?: string; message?: string } | string;
  code?: string;
}

function errorFor(status: number, body: ApiErrorBody | null): CoachError {
  const type = typeof body?.error === 'object' ? body.error.type : undefined;
  const text = `${typeof body?.error === 'string' ? body.error : (body?.error?.message ?? '')} ${body?.code ?? ''}`.toLowerCase();
  if (/credit|license|billing|balance/.test(text) || status === 402 || type === 'billing_error')
    return new CoachError('This AI account has no credits yet. Add credits to it (for Grok: console.x.ai), then try again.');
  if (status === 401 || type === 'authentication_error' || /api key/.test(text)) return new CoachError('That API key didn’t work. Check it in Settings → AI Coach.');
  if (status === 403 || type === 'permission_error') return new CoachError('This API key doesn’t have access to the coach model.');
  if (status === 429 || type === 'rate_limit_error') return new CoachError('The coach is busy right now. Try again in a minute.');
  if (status === 529 || type === 'overloaded_error') return new CoachError('The coach is overloaded right now. Try again in a minute.');
  return new CoachError(`The coach hit an error (${status}). Try again.`);
}

const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

/** POST JSON with a timeout, one retry on transient failures, and friendly errors. */
async function postJson<T>(url: string, headers: Record<string, string>, payload: object, fetchImpl: typeof fetch): Promise<T> {
  const body = JSON.stringify(payload);
  let res: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    try {
      res = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body, signal: controller.signal });
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
  try {
    return (await res.json()) as T;
  } catch {
    throw new CoachError('The coach sent a reply I couldn’t read. Try again.');
  }
}

const REFUSED = 'The coach can’t help with that one. For anything medical, talk to your athletic trainer or doctor.';
const CUT_OFF = 'That answer ran long and got cut off. Try a more specific question.';

/** Claude Messages API. */
async function callClaude(apiKey: string, payload: object, fetchImpl: typeof fetch): Promise<ApiResponse> {
  const data = await postJson<ApiResponse>(
    API_URL,
    {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
      // Needed for the web build; the athlete supplies their own key, so direct access is intended.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    { model: COACH_MODEL, max_tokens: 16000, fallbacks: 'default', ...payload },
    fetchImpl,
  );
  if (data.stop_reason === 'refusal') throw new CoachError(REFUSED);
  if (data.stop_reason === 'max_tokens') throw new CoachError(CUT_OFF);
  return data;
}

interface GrokResponse {
  choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[];
}

/** xAI Grok, via its OpenAI-compatible chat completions endpoint. Returns the reply text. */
async function callGrok(apiKey: string, payload: object, fetchImpl: typeof fetch): Promise<string> {
  const data = await postJson<GrokResponse>(GROK_URL, { authorization: `Bearer ${apiKey}` }, { model: GROK_MODEL, ...payload }, fetchImpl);
  const choice = data.choices?.[0];
  if (choice?.message?.refusal) throw new CoachError(REFUSED);
  if (choice?.finish_reason === 'length') throw new CoachError(CUT_OFF);
  const text = choice?.message?.content ?? '';
  if (!text.trim()) throw new CoachError('The coach didn’t send a reply. Try again.');
  return text;
}

const textOf = (data: ApiResponse) =>
  (data.content ?? [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('');

const userTurn = (context: string, message: string) => `<athlete_context>\n${context}\n</athlete_context>\n\n${message}`;

export async function askCoach({ apiKey, history, message, context, provider = 'claude', fetch: fetchImpl = fetch }: AskOptions): Promise<CoachReply> {
  if (provider === 'grok') {
    const text = await callGrok(
      apiKey,
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...historyToMessages(history, 'grok'),
          { role: 'user', content: userTurn(context, message) },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'coach_reply', strict: true, schema: RESPONSE_SCHEMA } },
      },
      fetchImpl,
    );
    return { ...parseCoachJson(text), content: text };
  }
  const data = await callClaude(
    apiKey,
    {
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [...historyToMessages(history, 'claude'), { role: 'user', content: userTurn(context, message) }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
    },
    fetchImpl,
  );
  return { ...parseCoachJson(textOf(data)), content: data.content };
}

export const FORM_SYSTEM_PROMPT = `You are FuelCast Coach reviewing a high-school athlete's exercise form from one still frame. The app has already measured joint angles on the phone; the skeleton overlay on the image shows what it detected.
- Give 2–4 short, specific, encouraging coaching cues in plain language (under 90 words total), most important first.
- Base them on what the image and the measurements show. If the image is unclear, say so instead of guessing.
- Never diagnose injuries or comment on body size or shape. If anything suggests pain or injury risk, advise stopping and checking with an athletic trainer.`;

/** Ask the AI Coach to explain a form-check result, using the annotated key frame (JPEG data URL). */
export async function askFormFeedback(opts: {
  apiKey: string;
  movementName: string;
  summary: string;
  imageDataUrl: string;
  provider?: AiProvider;
  fetch?: typeof fetch;
}): Promise<string> {
  const m = opts.imageDataUrl.match(/^data:(image\/(?:jpeg|png));base64,(.+)$/);
  if (!m) throw new CoachError('That frame couldn’t be sent to the coach.');
  const prompt = `Movement: ${opts.movementName}\nOn-device measurements:\n${opts.summary}\n\nWhat should I focus on?`;
  if (opts.provider === 'grok') {
    const text = await callGrok(
      opts.apiKey,
      {
        messages: [
          { role: 'system', content: FORM_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: opts.imageDataUrl, detail: 'high' } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      },
      opts.fetch ?? fetch,
    );
    return text.trim();
  }
  const data = await callClaude(
    opts.apiKey,
    {
      max_tokens: 4000,
      system: FORM_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      output_config: { effort: 'low' },
    },
    opts.fetch ?? fetch,
  );
  const text = textOf(data).trim();
  if (!text) throw new CoachError('The coach didn’t send any feedback. Try again.');
  return text;
}

/** Kitchen foods as names for the context summary. */
export const pantryNames = (ids: string[]) => ids.map((id) => FOOD_BY_ID[id]?.name).filter(Boolean).join(', ');
