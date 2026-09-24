// FuelCast coach server (Netlify Function), reached at /api/coach.
//
// Holds ONE shared xAI (Grok) key in the server environment variable XAI_API_KEY,
// so every FuelCast user can use the AI Coach without a key of their own, and the
// key is never shipped inside the app or the website.
//
// It only forwards FuelCast's own requests: the system prompt must be one of the
// app's prompts, the model is fixed, and each visitor is rate-limited. That makes
// the endpoint useless as a free general-purpose Grok proxy.

import { FORM_SYSTEM_PROMPT, GROK_MODEL, RESPONSE_SCHEMA, SYSTEM_PROMPT } from '../../src/ai/prompts';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const MAX_BODY_BYTES = 1_500_000; // a form frame is ~30 KB; chat history is small
const MAX_MESSAGES = 20;
const LIMIT = 20; // requests per visitor…
const WINDOW_MS = 10 * 60_000; // …per 10 minutes (per server instance; best effort)

const hits = new Map<string, number[]>();

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS } });

function rateLimited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

interface Msg {
  role?: unknown;
  content?: unknown;
}

/** The request handler. `fetchImpl` is injectable for tests. */
export async function handleCoach(req: Request, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'Use POST.' });

  const key = process.env.XAI_API_KEY;
  if (!key) return json(500, { error: 'The coach server has no XAI_API_KEY set.' });

  const ip = req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip, Date.now())) return json(429, { error: 'Too many coach requests. Try again in a few minutes.' });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'Request too large.' });
  let body: { messages?: Msg[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'Invalid JSON.' });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length < 2 || messages.length > MAX_MESSAGES) return json(400, { error: 'Invalid messages.' });
  const system = messages[0];
  const isChat = system?.role === 'system' && system.content === SYSTEM_PROMPT;
  const isForm = system?.role === 'system' && system.content === FORM_SYSTEM_PROMPT;
  if (!isChat && !isForm) return json(403, { error: 'Only FuelCast coach requests are allowed.' });
  if (messages.slice(1).some((m) => m.role !== 'user' && m.role !== 'assistant')) return json(400, { error: 'Invalid roles.' });

  // The server, not the client, decides the model and the reply format.
  const upstream = {
    model: GROK_MODEL,
    messages,
    ...(isChat ? { response_format: { type: 'json_schema', json_schema: { name: 'coach_reply', strict: true, schema: RESPONSE_SCHEMA } } } : {}),
  };

  let res: Response;
  try {
    res = await fetchImpl(XAI_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(upstream),
    });
  } catch {
    return json(502, { error: 'Couldn’t reach Grok.' });
  }
  // Pass Grok's reply (or error) straight through; the app already knows how to read both.
  return new Response(await res.text(), { status: res.status, headers: { 'content-type': 'application/json', ...CORS } });
}

// Netlify calls the default export with (request, context).
export default (req: Request) => handleCoach(req);
