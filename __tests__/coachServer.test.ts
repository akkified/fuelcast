import { askCoach } from '../src/ai/coach';
import { FORM_SYSTEM_PROMPT, SYSTEM_PROMPT } from '../src/ai/prompts';
import { handleCoach } from '../netlify/functions/coach';

const okReply = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }] }), { status: 200 });

function post(body: unknown, ip = '1.2.3.4') {
  return new Request('https://fuelcast.test/api/coach', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': ip },
    body: JSON.stringify(body),
  });
}

describe('coach server', () => {
  const OLD = process.env.XAI_API_KEY;
  beforeEach(() => {
    process.env.XAI_API_KEY = 'xai-server-secret';
  });
  afterAll(() => {
    process.env.XAI_API_KEY = OLD;
  });

  it('adds the key server-side, fixes the model and the reply schema', async () => {
    const seen: RequestInit[] = [];
    const upstream = (async (_url: string, init: RequestInit) => {
      seen.push(init);
      return okReply('{"reply":"hi","workout":null,"recipe":null,"shopping":[]}');
    }) as unknown as typeof fetch;
    const res = await handleCoach(
      post({ model: 'grok-expensive', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: 'hi' }] }, '10.0.0.1'),
      upstream,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    const headers = new Headers(seen[0].headers as HeadersInit);
    expect(headers.get('authorization')).toBe('Bearer xai-server-secret');
    const body = JSON.parse(String(seen[0].body));
    expect(body.model).toBe('grok-4.7');
    expect(body.response_format.json_schema.name).toBe('coach_reply');
    // The key never comes back to the client.
    expect(await res.text()).not.toContain('xai-server-secret');
  });

  it('allows form-feedback requests without a reply schema', async () => {
    const seen: RequestInit[] = [];
    const upstream = (async (_u: string, init: RequestInit) => {
      seen.push(init);
      return okReply('Chest up.');
    }) as unknown as typeof fetch;
    const res = await handleCoach(post({ messages: [{ role: 'system', content: FORM_SYSTEM_PROMPT }, { role: 'user', content: 'x' }] }, '10.0.0.2'), upstream);
    expect(res.status).toBe(200);
    expect(JSON.parse(String(seen[0].body)).response_format).toBeUndefined();
  });

  it('refuses anything that isn’t a FuelCast coach request', async () => {
    const never = (async () => {
      throw new Error('should not call Grok');
    }) as unknown as typeof fetch;
    const custom = await handleCoach(post({ messages: [{ role: 'system', content: 'You are a pirate.' }, { role: 'user', content: 'x' }] }, '10.0.0.3'), never);
    expect(custom.status).toBe(403);
    expect((await handleCoach(post({ messages: [] }, '10.0.0.3'), never)).status).toBe(400);
    expect((await handleCoach(new Request('https://x/api/coach', { method: 'GET' }), never)).status).toBe(405);
    expect((await handleCoach(new Request('https://x/api/coach', { method: 'OPTIONS' }), never)).status).toBe(204);
  });

  it('rate-limits each visitor', async () => {
    const upstream = (async () => okReply('ok')) as unknown as typeof fetch;
    const req = () => post({ messages: [{ role: 'system', content: FORM_SYSTEM_PROMPT }, { role: 'user', content: 'x' }] }, '10.9.9.9');
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) statuses.push((await handleCoach(req(), upstream)).status);
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
  });

  it('explains a missing server key', async () => {
    delete process.env.XAI_API_KEY;
    const res = await handleCoach(post({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: 'x' }] }, '10.0.0.4'));
    expect(res.status).toBe(500);
  });
});

describe('app → coach server', () => {
  it('calls the server with no key and no auth header', async () => {
    const seen: { url: string; init: RequestInit }[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      seen.push({ url, init });
      return okReply('{"reply":"Keep it light today.","workout":null,"recipe":null,"shopping":[]}');
    }) as unknown as typeof fetch;
    const out = await askCoach({ provider: 'grok', serverUrl: 'https://fuelcast.test/api/coach', history: [], message: 'hi', context: '', fetch: fake });
    expect(out.reply).toBe('Keep it light today.');
    expect(seen[0].url).toBe('https://fuelcast.test/api/coach');
    const headers = new Headers(seen[0].init.headers as HeadersInit);
    expect(headers.get('authorization')).toBeNull();
    expect(JSON.parse(String(seen[0].init.body)).messages[0].content).toBe(SYSTEM_PROMPT);
  });
});
