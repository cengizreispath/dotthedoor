import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

// Every sentence passes two checks before it reaches the Dot Wall:
//   1. fast local rules (self-harm signals, contact details/links, strong language)
//   2. an optional Claude classifier, enabled when ANTHROPIC_API_KEY is set
// Anything doubtful is held for a person to read in /admin; nothing is silently dropped.

export type Screening =
  | { status: 'published'; reasons: string[] }
  | { status: 'held'; reasons: string[] }
  | { status: 'care'; reasons: string[] };

// Unicode-aware "whole word" matching (\b does not understand ç, ş, ğ, ı, ö, ü).
const words = (list: string[]) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${list.join('|')})(?![\\p{L}\\p{N}])`, 'iu');

const CARE = [
  words(['kill(?:ing)? myself', 'suicid\\p{L}*', 'end(?:ing)? (?:it all|my life)', 'want(?:ed)? to die',
    'self[- ]?harm\\p{L}*', 'cut(?:ting)? myself', 'don.?t want to (?:live|be alive|be here anymore)']),
  words(['intihar\\p{L}*', 'kendimi öldür\\p{L}*', 'ölmek istiyorum', 'yaşamak istemiyorum', 'canıma kıy\\p{L}*', 'kendime zarar\\p{L}*']),
];
const CONTACT =
  /(https?:\/\/|www\.|[\p{L}\p{N}-]+\.(?:com|net|org|io|co|tr|me|app|xyz|info|biz|dev|link)(?![\p{L}])|[\w.+-]+@[\w-]+\.\w+|(?:^|\s)@\w{2,}|\+?\d[\d\s().-]{7,}\d)/iu;
const LANGUAGE = words(['fuck\\p{L}*', 'shit\\p{L}*', 'bitch\\p{L}*', 'cunt\\p{L}*', 'whore\\p{L}*', 'slut\\p{L}*',
  'amk', 'siktir\\p{L}*', 'orospu\\p{L}*', 'piç\\p{L}*', 'yarrak\\p{L}*', 'amına']);

export function screenByRules(text: string): Screening | null {
  if (CARE.some(re => re.test(text))) return { status: 'care', reasons: ['care'] };
  if (CONTACT.test(text)) return { status: 'held', reasons: ['contact'] };
  if (LANGUAGE.test(text)) return { status: 'held', reasons: ['language'] };
  return null;
}

const SYSTEM = `You review short sentences that visitors write for "the Dot Wall", a public wall on dotthedoor.com.
People write one or a few sentences about something they are starting, deciding, letting go of, or don't know yet. Sentences can be in any language.

Decide one of:
- "publish": an honest personal sentence fit for a public wall. Sadness, grief, anger about one's own life, doubt, mild swearing and dark humour are fine.
- "hold": a person should read it first. Use for harassment or insults aimed at someone, hate, threats, sexual content, naming or exposing a private person (full names with accusations, addresses, workplaces), contact details, advertising or spam, anything illegal, or text that is not a sentence at all (keyboard mashing, code, gibberish).
- "care": the writer may be at risk of harming themselves or ending their life, even if it is said indirectly.

Reply with JSON only: {"decision": "...", "reason": "..."} where reason is a few words.`;

const FORMAT = {
  type: 'json_schema' as const,
  schema: {
    type: 'object',
    properties: {
      decision: { type: 'string', enum: ['publish', 'hold', 'care'] },
      reason: { type: 'string' },
    },
    required: ['decision', 'reason'],
    additionalProperties: false,
  },
};

let client: Anthropic | null = null;

async function classify(text: string): Promise<{ decision: 'publish' | 'hold' | 'care'; reason: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ timeout: 8_000, maxRetries: 1 });
  try {
    const res = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 2048,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: FORMAT },
      system: SYSTEM,
      messages: [{ role: 'user', content: `<sentence>\n${text}\n</sentence>` }],
    });
    if (res.stop_reason === 'refusal') return { decision: 'hold', reason: 'classifier declined' };
    const block = res.content.find(b => b.type === 'text');
    if (!block || block.type !== 'text') return null;
    const out = JSON.parse(block.text) as { decision?: string; reason?: string };
    if (out.decision !== 'publish' && out.decision !== 'hold' && out.decision !== 'care') return null;
    return { decision: out.decision, reason: String(out.reason ?? '').slice(0, 80) };
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.warn('[moderation] rate limited');
    else if (err instanceof Anthropic.APIError) console.warn(`[moderation] API error ${err.status}: ${err.message}`);
    else console.warn('[moderation] classifier unavailable', err);
    return null;
  }
}

export async function screen(text: string): Promise<Screening> {
  const byRules = screenByRules(text);
  if (byRules) return byRules;
  const ai = await classify(text);
  if (!ai) return { status: 'published', reasons: process.env.ANTHROPIC_API_KEY ? ['unscreened'] : [] };
  if (ai.decision === 'care') return { status: 'care', reasons: ['care'] };
  if (ai.decision === 'hold') return { status: 'held', reasons: [`ai: ${ai.reason}`] };
  return { status: 'published', reasons: [] };
}
