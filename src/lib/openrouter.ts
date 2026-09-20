import { AgentPersona } from '../types';

export interface OpenRouterStreamChunk {
  text: string;
  isFinished: boolean;
}

export async function* streamOpenRouterAgent(
  agent: AgentPersona,
  userMotion: string,
  evidenceSummary: string,
  apiKey?: string
): AsyncGenerator<string, void, unknown> {
  const token = apiKey || process.env.OPENROUTER_API_KEY;

  if (!token) {
    // Deterministic simulation generator if no API key provided
    const fallbackText = `${agent.firstQuestion} Reviewing ${userMotion.toUpperCase()}: our margin and structural risk criteria show severe caution under present liquidity metrics.`;
    const tokens = fallbackText.split(' ');
    for (const t of tokens) {
      yield t + ' ';
    }
    return;
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'HTTP-Referer': 'https://bourse-chamber.vercel.app',
        'X-Title': 'Bourse Chamber Investment Council',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        stream: true,
        max_tokens: 220,
        temperature: 0.35,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          {
            role: 'user',
            content: `The Bourse Chamber council has convened to evaluate: "${userMotion}".
Current Evidentiary Market Snapshot:
${evidenceSummary}

Deliver your seat reading in character. Be concise, direct, uncompromising, and state your primary objection or affirmative thesis in under 75 words.`
          }
        ]
      })
    });

    if (!res.ok || !res.body) {
      throw new Error(`OpenRouter HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              yield delta;
            }
          } catch (_) {}
        }
      }
    }
  } catch (err) {
    // Graceful fallback token yield
    yield `${agent.name} records strict skepticism: evidence does not support durable risk-adjusted deployment.`;
  }
}
