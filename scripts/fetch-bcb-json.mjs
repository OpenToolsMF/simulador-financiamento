import { setTimeout as sleep } from 'node:timers/promises';

export const FETCH_TIMEOUT_MS = 10_000;
export const FETCH_ATTEMPTS = 3;
const MAX_RETRY_AFTER_MS = 30_000;

class ResponseError extends Error {
  constructor(message, { retryable = true, retryAfterMs = 0 } = {}) {
    super(message);
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

function retryAfterMilliseconds(value, now) {
  if (!value) return 0;
  const text = value.trim();
  const milliseconds = /^\d+$/.test(text)
    ? Number(text) * 1000
    : Date.parse(text) - now;
  return Number.isFinite(milliseconds)
    ? Math.min(MAX_RETRY_AFTER_MS, Math.max(0, milliseconds))
    : 0;
}

async function fetchAttempt(url, { fetchImpl, timeoutMs, nowImpl }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  let completed = false;

  try {
    response = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'mapa-das-parcelas/1.0 (+https://mapadasparcelas.com.br/)',
      },
    });

    if (!response.ok) {
      const status = response.status;
      throw new ResponseError(`HTTP ${status}`, {
        retryable: status === 408 || status === 429 || (status >= 500 && status <= 599),
        retryAfterMs: status === 429 || status === 503
          ? retryAfterMilliseconds(response.headers?.get('retry-after'), nowImpl())
          : 0,
      });
    }

    const contentType = response.headers?.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (contentType && contentType !== 'application/json' && !/^[^\s/]+\/[^\s/]+\+json$/.test(contentType)) {
      throw new ResponseError('resposta com tipo de conteúdo diferente de JSON');
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') throw error;
      // SyntaxError pode incluir o corpo HTML/XML; não o exponha nos logs.
      throw new ResponseError('resposta JSON inválida ou vazia');
    }
    completed = true;
    return payload;
  } catch (error) {
    if (controller.signal.aborted || error?.name === 'AbortError') {
      throw new ResponseError(`tempo limite de ${timeoutMs / 1000}s excedido`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (!completed) {
      controller.abort();
      try {
        await response?.body?.cancel();
      } catch {
        // O abort já libera streams bloqueados pela leitura do corpo.
      }
    }
  }
}

export async function fetchBcbJson(url, {
  label,
  fetchImpl = fetch,
  sleepImpl = sleep,
  timeoutMs = FETCH_TIMEOUT_MS,
  nowImpl = Date.now,
  logger = console,
} = {}) {
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      return await fetchAttempt(url, { fetchImpl, timeoutMs, nowImpl });
    } catch (error) {
      const cause = error?.message || String(error);
      const retry = error?.retryable !== false && attempt < FETCH_ATTEMPTS;
      const waitMs = retry ? Math.max(attempt * 1000, error?.retryAfterMs || 0) : 0;
      logger.info?.(`${label}: tentativa ${attempt}/${FETCH_ATTEMPTS}: ${cause}. ${retry ? `Próxima tentativa em ${waitMs / 1000}s.` : 'Sem novas tentativas.'}`);
      if (!retry) {
        throw new Error(`Falha ao baixar ${label} após ${attempt} ${attempt === 1 ? 'tentativa' : 'tentativas'}. Última causa: ${cause}.`);
      }
      await sleepImpl(waitMs);
    }
  }
}
