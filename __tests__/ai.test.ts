import { askCoach, askFormFeedback, CoachError, COACH_MODEL, historyToMessages, parseCoachJson } from '../src/ai/coach';
import { buildContext } from '../src/ai/context';
import { offlineReply } from '../src/ai/offline';
import { buildDemoState } from '../src/data/demo';
import { EXERCISE_BY_ID } from '../src/data/exercises';
import type { ChatMessage } from '../src/state/store';

const reply = {
  reply: 'Try this upper-body session.',
  workout: {
    name: 'Upper Pump',
    items: [
      { exerciseId: 'push-up', sets: 3, reps: 10, restSec: 60, note: '' },
      { exerciseId: 'db-row', sets: 99, reps: 10, restSec: 60, note: 'Each arm' },
    ],
  },
  recipe: null,
  shopping: ['Bananas'],
};

function fakeFetch(status: number, body: unknown, seen: { url?: string; init?: RequestInit }[] = []) {
  return (async (url: string, init: RequestInit) => {
    seen.push({ url: String(url), init });
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'request-id': 'req_test' } });
  }) as unknown as typeof fetch;
}

const message = (content: unknown[], stop_reason = 'end_turn') => ({
  id: 'msg_1',
  type: 'message',
  role: 'assistant',
  model: COACH_MODEL,
  content,
  stop_reason,
  stop_sequence: null,
  usage: { input_tokens: 10, output_tokens: 10 },
});

describe('askCoach', () => {
  it('sends a well-formed Messages API request and parses the structured reply', async () => {
    const seen: { url?: string; init?: RequestInit }[] = [];
    const content = [
      { type: 'thinking', thinking: '', signature: 'sig' },
      { type: 'text', text: JSON.stringify(reply) },
    ];
    const out = await askCoach({
      apiKey: 'sk-test',
      history: [],
      message: 'Upper body workout please',
      context: 'Sport: Soccer',
      fetch: fakeFetch(200, message(content), seen),
    });

    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.anthropic.com/v1/messages');
    expect(seen[0].init!.method).toBe('POST');
    const headers = new Headers(seen[0].init!.headers as HeadersInit);
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('x-api-key')).toBe('sk-test');
    expect(headers.get('anthropic-version')).toBe('2023-06-01');
    expect(headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01');
    const body = JSON.parse(String(seen[0].init!.body));
    expect(body.model).toBe('claude-opus-5');
    expect(body.fallbacks).toBe('default');
    expect(body.output_config.format.type).toBe('json_schema');
    expect(body.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(body.messages.at(-1).content).toContain('<athlete_context>');

    expect(out.reply).toBe('Try this upper-body session.');
    expect(out.workout?.items.map((i) => i.exerciseId)).toEqual(['push-up', 'db-row']);
    expect(out.workout?.items[1].sets).toBe(6); // clamped
    expect(out.shopping).toEqual(['Bananas']);
    expect(out.content).toEqual(content);
  });

  it('retries once on overload, then reports it', async () => {
    const seen: { url?: string; init?: RequestInit }[] = [];
    await expect(
      askCoach({ apiKey: 'k', history: [], message: 'x', context: '', fetch: fakeFetch(529, { type: 'error', error: { type: 'overloaded_error' } }, seen) }),
    ).rejects.toThrow(/overloaded/);
    expect(seen).toHaveLength(2);
  });

  it('reports network failures', async () => {
    const failing = (async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(askCoach({ apiKey: 'k', history: [], message: 'x', context: '', fetch: failing })).rejects.toThrow(/internet/);
  });

  it('turns refusals and bad keys into friendly errors', async () => {
    await expect(
      askCoach({ apiKey: 'k', history: [], message: 'x', context: '', fetch: fakeFetch(200, message([], 'refusal')) }),
    ).rejects.toThrow(/can’t help/);
    await expect(
      askCoach({
        apiKey: 'bad',
        history: [],
        message: 'x',
        context: '',
        fetch: fakeFetch(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }),
      }),
    ).rejects.toThrow(/API key didn’t work/);
  });
});

describe('parseCoachJson', () => {
  it('drops unknown exercises and rejects non-JSON', () => {
    const out = parseCoachJson(
      JSON.stringify({ reply: 'ok', workout: { name: 'X', items: [{ exerciseId: 'moon-jump', sets: 3, reps: 5, restSec: 30, note: '' }] }, recipe: null, shopping: [] }),
    );
    expect(out.workout).toBeUndefined();
    expect(() => parseCoachJson('not json')).toThrow(CoachError);
  });
});

describe('historyToMessages', () => {
  it('replays only completed Claude exchanges, in order', () => {
    const chat: ChatMessage[] = [
      { id: '1', role: 'user', text: 'offline q', offline: true, at: 0 },
      { id: '2', role: 'assistant', text: 'offline a', offline: true, at: 0 },
      { id: '3', role: 'user', text: 'hi', at: 0 },
      { id: '4', role: 'assistant', text: 'hello', content: [{ type: 'text', text: '{}' }], at: 0 },
      { id: '5', role: 'user', text: 'failed', at: 0 },
      { id: '6', role: 'assistant', text: 'error', error: true, at: 0 },
    ];
    expect(historyToMessages(chat)).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: [{ type: 'text', text: '{}' }] },
    ]);
  });
});

describe('context + offline coach', () => {
  const state = buildDemoState('2026-09-22', 900);
  const now = new Date(2026, 8, 22, 15, 0);

  it('builds a context without the athlete’s name or weight', () => {
    const ctx = buildContext(state, now);
    expect(ctx).toContain('Sport: Soccer');
    expect(ctx).toContain('Muscle readiness');
    expect(ctx).not.toContain('Maya');
    expect(ctx).not.toMatch(/56\.7|125(\.0)? ?lb|kg\b/);
  });

  it('answers the quick prompts on-device', () => {
    const w = offlineReply('Build me a 30-min upper body workout', state, now, 1);
    expect(w.workout?.items.every((i) => EXERCISE_BY_ID[i.exerciseId])).toBe(true);
    expect(w.workout?.durationMin).toBeLessThanOrEqual(35);
    expect(offlineReply('What can I cook with my kitchen?', state, now, 1).recipe).toBeDefined();
    expect(offlineReply('What should I do today?', state, now, 1).text.length).toBeGreaterThan(10);
    expect(offlineReply('Make my shopping list for the week', state, now, 1).text).toBeTruthy();
  });
});

describe('askFormFeedback', () => {
  it('sends the annotated frame as an image block and returns the text', async () => {
    const seen: { url?: string; init?: RequestInit }[] = [];
    const text = await askFormFeedback({
      apiKey: 'k',
      movementName: 'Squat',
      summary: 'Depth: good (92°)',
      imageDataUrl: 'data:image/jpeg;base64,QUJD',
      fetch: fakeFetch(200, message([{ type: 'text', text: 'Great depth. Keep your chest up.' }]), seen),
    });
    expect(text).toBe('Great depth. Keep your chest up.');
    const body = JSON.parse(String(seen[0].init!.body));
    expect(body.model).toBe('claude-opus-5');
    expect(body.max_tokens).toBe(4000);
    const [img, prompt] = body.messages[0].content;
    expect(img).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' } });
    expect(prompt.text).toContain('Depth: good');
  });
  it('rejects non-image input', async () => {
    await expect(askFormFeedback({ apiKey: 'k', movementName: 'x', summary: '', imageDataUrl: 'blob:abc' })).rejects.toBeInstanceOf(CoachError);
  });
});

describe('Grok provider', () => {
  const grokReply = (content: string, finish = 'stop') => ({
    id: 'c1',
    object: 'chat.completion',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: finish }],
  });

  it('sends an OpenAI-compatible request with a JSON schema and parses the reply', async () => {
    const seen: { url?: string; init?: RequestInit }[] = [];
    const json = JSON.stringify({ reply: 'Light day. Stretch.', workout: null, recipe: null, shopping: [] });
    const out = await askCoach({
      apiKey: 'xai-test',
      provider: 'grok',
      history: [
        { id: '1', role: 'user', text: 'old claude q', at: 0 },
        { id: '2', role: 'assistant', text: 'a', content: [{ type: 'text', text: '{}' }], at: 0 },
        { id: '3', role: 'user', text: 'old grok q', at: 0 },
        { id: '4', role: 'assistant', provider: 'grok', text: 'b', content: '{"reply":"b"}', at: 0 },
      ],
      message: 'What now?',
      context: 'Sport: Soccer',
      fetch: fakeFetch(200, grokReply(json), seen),
    });
    expect(seen[0].url).toBe('https://api.x.ai/v1/chat/completions');
    const headers = new Headers(seen[0].init!.headers as HeadersInit);
    expect(headers.get('authorization')).toBe('Bearer xai-test');
    const body = JSON.parse(String(seen[0].init!.body));
    expect(body.model).toBe('grok-4.7');
    expect(body.response_format.type).toBe('json_schema');
    expect(body.response_format.json_schema.strict).toBe(true);
    // System prompt first; only the earlier Grok exchange is replayed.
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(['system', 'user', 'assistant', 'user']);
    expect(body.messages[1].content).toBe('old grok q');
    expect(body.messages[3].content).toContain('<athlete_context>');
    expect(out.reply).toBe('Light day. Stretch.');
    expect(out.content).toBe(json);
  });

  it('explains an account with no credits', async () => {
    await expect(
      askCoach({
        apiKey: 'xai-test',
        provider: 'grok',
        history: [],
        message: 'x',
        context: '',
        fetch: fakeFetch(403, { code: 'permission-denied', error: "Your newly created team doesn't have any credits or licenses yet." }),
      }),
    ).rejects.toThrow(/no credits/);
  });

  it('sends form frames as image_url parts', async () => {
    const seen: { url?: string; init?: RequestInit }[] = [];
    const text = await askFormFeedback({
      apiKey: 'xai-test',
      provider: 'grok',
      movementName: 'Squat',
      summary: 'Depth: good',
      imageDataUrl: 'data:image/jpeg;base64,QUJD',
      fetch: fakeFetch(200, grokReply('Chest up, nice depth.'), seen),
    });
    expect(text).toBe('Chest up, nice depth.');
    const body = JSON.parse(String(seen[0].init!.body));
    expect(body.messages[1].content[0]).toEqual({ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,QUJD', detail: 'high' } });
  });

  it('reports cut-off replies', async () => {
    await expect(
      askCoach({ apiKey: 'k', provider: 'grok', history: [], message: 'x', context: '', fetch: fakeFetch(200, grokReply('{"rep', 'length')) }),
    ).rejects.toThrow(/cut off/);
  });
});
