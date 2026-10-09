'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setTimeout: sleep } = require('node:timers/promises');
const helper = import('../scripts/fetch-bcb-json.mjs');
const defaults = { label: 'BCB teste', logger: { info() {} }, sleepImpl: async () => {} };
const jsonResponse = () => new Response('{"value":42}', { headers: { 'content-type': 'application/json' } });

for (const status of [408, 429, 500, 502, 503, 504, 599]) {
  test(`recupera HTTP ${status} com espera progressiva e libera o corpo descartado`, async () => {
    const { fetchBcbJson } = await helper;
    const waits = [];
    const discarded = [];
    let attempts = 0;
    const result = await fetchBcbJson('https://bcb.test/', {
      ...defaults,
      sleepImpl: async (ms) => waits.push(ms),
      fetchImpl: async () => {
        attempts += 1;
        if (attempts === 3) return jsonResponse();
        const response = new Response('erro transitório', { status });
        discarded.push(response);
        return response;
      },
    });
    assert.deepEqual(result, { value: 42 });
    assert.equal(attempts, 3);
    assert.deepEqual(waits, [1000, 2000]);
    assert.ok(discarded.every((response) => response.bodyUsed));
  });
}

test('falha HTTP permanente encerra na primeira tentativa sem espera', async () => {
  const { fetchBcbJson } = await helper;
  for (const status of [400, 401, 403, 404]) {
    let attempts = 0;
    await assert.rejects(fetchBcbJson('https://bcb.test/', {
      ...defaults,
      sleepImpl: async () => assert.fail('não deve esperar'),
      fetchImpl: async () => {
        attempts += 1;
        return new Response('erro', { status });
      },
    }), new RegExp(`após 1 tentativa.*HTTP ${status}`));
    assert.equal(attempts, 1);
  }
});

test('limita erros de rede a três tentativas e não espera após a última', async () => {
  const { fetchBcbJson } = await helper;
  const waits = [];
  const logs = [];
  let attempts = 0;
  await assert.rejects(fetchBcbJson('https://bcb.test/', {
    ...defaults,
    logger: { info: (message) => logs.push(message) },
    sleepImpl: async (ms) => waits.push(ms),
    fetchImpl: async () => {
      attempts += 1;
      throw new TypeError('fetch failed');
    },
  }), /BCB teste após 3 tentativas.*fetch failed/);
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [1000, 2000]);
  assert.match(logs[0], /BCB teste.*1\/3.*fetch failed.*1s/);
  assert.match(logs[2], /3\/3.*Sem novas tentativas/);
});

test('recupera erro de rede seguido de sucesso', async () => {
  const { fetchBcbJson } = await helper;
  let attempts = 0;
  const result = await fetchBcbJson('https://bcb.test/', {
    ...defaults,
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError('fetch failed');
      return jsonResponse();
    },
  });
  assert.deepEqual(result, { value: 42 });
  assert.equal(attempts, 2);
});

for (const status of [429, 503]) {
  test(`respeita Retry-After no HTTP ${status}, com limite e espera mínima`, async () => {
    const { fetchBcbJson } = await helper;
    const now = Date.parse('2026-10-09T12:00:00Z');
    for (const [header, expected] of [
      ['5', 5000],
      ['90', 30000],
      ['0', 1000],
      ['inválido', 1000],
      ['-2', 1000],
      [new Date(now + 8000).toUTCString(), 8000],
      [new Date(now + 120000).toUTCString(), 30000],
      [new Date(now - 1000).toUTCString(), 1000],
    ]) {
      const waits = [];
      let attempts = 0;
      await fetchBcbJson('https://bcb.test/', {
        ...defaults,
        nowImpl: () => now,
        sleepImpl: async (ms) => waits.push(ms),
        fetchImpl: async () => (++attempts === 1
          ? new Response('erro', { status, headers: { 'retry-after': header } })
          : jsonResponse()),
      });
      assert.deepEqual(waits, [expected], `Retry-After: ${header}`);
    }
  });
}

test('ignora Retry-After em outros status', async () => {
  const { fetchBcbJson } = await helper;
  const waits = [];
  let attempts = 0;
  await fetchBcbJson('https://bcb.test/', {
    ...defaults,
    sleepImpl: async (ms) => waits.push(ms),
    fetchImpl: async () => (++attempts === 1
      ? new Response('erro', { status: 502, headers: { 'retry-after': '30' } })
      : jsonResponse()),
  });
  assert.deepEqual(waits, [1000]);
});

test('Retry-After não reduz a espera de dois segundos da terceira tentativa', async () => {
  const { fetchBcbJson } = await helper;
  const waits = [];
  let attempts = 0;
  await fetchBcbJson('https://bcb.test/', {
    ...defaults,
    sleepImpl: async (ms) => waits.push(ms),
    fetchImpl: async () => (++attempts < 3
      ? new Response('erro', { status: 429, headers: { 'retry-after': '1' } })
      : jsonResponse()),
  });
  assert.deepEqual(waits, [1000, 2000]);
});

test('aceita JSON, +json e cabeçalho ausente sem repetir nem esperar', async () => {
  const { fetchBcbJson } = await helper;
  for (const type of ['application/json; charset=utf-8', 'application/problem+json', null]) {
    const response = jsonResponse();
    if (type) response.headers.set('content-type', type);
    else response.headers.delete('content-type');
    const result = await fetchBcbJson('https://bcb.test/', {
      ...defaults,
      sleepImpl: async () => assert.fail('não deve esperar'),
      fetchImpl: async () => response,
    });
    assert.deepEqual(result, { value: 42 });
  }
});

for (const [type, body] of [
  ['text/html', '<html>conteúdo que não deve aparecer nos logs</html>'],
  ['application/xml', '<?xml version="1.0"?><erro/>'],
  ['application/json', ''],
  ['application/json', '<html>conteúdo que não deve aparecer nos logs</html>'],
  ['application/json', '{"value":'],
]) {
  test(`recupera resposta inválida (${type}, ${body ? 'não vazia' : 'vazia'}) sem expor o corpo`, async () => {
    const { fetchBcbJson } = await helper;
    const logs = [];
    let attempts = 0;
    const result = await fetchBcbJson('https://bcb.test/', {
      ...defaults,
      logger: { info: (message) => logs.push(message) },
      fetchImpl: async () => (++attempts === 1
        ? new Response(body, { headers: { 'content-type': type } })
        : jsonResponse()),
    });
    assert.deepEqual(result, { value: 42 });
    assert.equal(attempts, 2);
    assert.ok(!logs.join('\n').includes(body || 'SyntaxError'));
  });
}

for (const phase of ['fetch', 'body']) {
  test(`timeout durante ${phase} aborta a tentativa e permite recuperação`, async () => {
    const { fetchBcbJson } = await helper;
    const signals = [];
    const logs = [];
    const waits = [];
    let cancelled = 0;
    const result = await fetchBcbJson('https://bcb.test/', {
      ...defaults,
      timeoutMs: 10,
      sleepImpl: async (ms) => waits.push(ms),
      logger: { info: (message) => logs.push(message) },
      fetchImpl: async (url, { signal }) => {
        signals.push(signal);
        if (signals.length === 2) return jsonResponse();
        const stalled = () => new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
        });
        return phase === 'fetch' ? stalled() : {
          ok: true,
          json: stalled,
          body: { cancel: async () => { cancelled += 1; } },
        };
      },
    });
    assert.deepEqual(result, { value: 42 });
    assert.equal(signals[0].aborted, true);
    assert.deepEqual(waits, [1000]);
    assert.match(logs[0], /tempo limite de 0.01s excedido/);
    assert.equal(cancelled, phase === 'body' ? 1 : 0);
    await sleep(25);
    assert.equal(signals[1].aborted, false, 'timer da tentativa bem-sucedida foi removido');
  });
}

test('remove timers e libera corpo mesmo se cancel rejeitar', async (t) => {
  const { fetchBcbJson } = await helper;
  const startTimer = global.setTimeout;
  const stopTimer = global.clearTimeout;
  const timers = [];
  const cleared = [];
  t.mock.method(global, 'setTimeout', (...args) => {
    const timer = startTimer(...args);
    timers.push(timer);
    return timer;
  });
  t.mock.method(global, 'clearTimeout', (timer) => {
    cleared.push(timer);
    stopTimer(timer);
  });
  let attempts = 0;
  let cancellations = 0;
  await fetchBcbJson('https://bcb.test/', {
    ...defaults,
    fetchImpl: async () => (++attempts === 1 ? {
      ok: false,
      status: 502,
      body: { cancel: async () => { cancellations += 1; throw new Error('locked'); } },
    } : jsonResponse()),
  });
  assert.equal(cancellations, 1);
  assert.equal(timers.length, 2);
  assert.deepEqual(cleared, timers);
});

test('erro HTTP permanente também remove o timer e cancela o corpo', async (t) => {
  const { fetchBcbJson, FETCH_TIMEOUT_MS } = await helper;
  const startTimer = global.setTimeout;
  const stopTimer = global.clearTimeout;
  let timer;
  let cleared = false;
  let cancelled = false;
  t.mock.method(global, 'setTimeout', (callback, ms) => {
    assert.equal(ms, FETCH_TIMEOUT_MS);
    timer = startTimer(callback, ms);
    return timer;
  });
  t.mock.method(global, 'clearTimeout', (value) => {
    assert.equal(value, timer);
    cleared = true;
    stopTimer(value);
  });
  await assert.rejects(fetchBcbJson('https://bcb.test/', {
    ...defaults,
    fetchImpl: async () => ({ ok: false, status: 400, body: { cancel: async () => { cancelled = true; } } }),
  }), /HTTP 400/);
  assert.ok(cleared);
  assert.ok(cancelled);
});
