import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOURCE_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
export const OUTPUT_PATH = 'assets/data/selic-bcb.json';

function normalizeRate(value) {
  const rate = Number(String(value).replace(',', '.'));
  return Number.isFinite(rate) ? rate : null;
}

function normalizeDate(value) {
  const rawValue = String(value || '').trim();
  const match = rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function parseSelicRate(payload) {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const latest = payload[0];
  const date = normalizeDate(latest?.data);
  const ratePercent = normalizeRate(latest?.valor);

  if (!date || ratePercent === null || ratePercent < 0 || ratePercent > 100) return null;
  return { date, ratePercent };
}

export function buildSelicData(payload, generatedAt = new Date().toISOString()) {
  const latest = parseSelicRate(payload);
  if (!latest) {
    throw new Error('Nenhuma taxa Selic válida foi encontrada na resposta do BCB.');
  }

  return {
    sourceUrl: SOURCE_URL,
    generatedAt,
    latest,
  };
}

export async function updateSelicBcb({ fetchImpl = fetch, outputPath = OUTPUT_PATH } = {}) {
  const response = await fetchImpl(SOURCE_URL, {
    headers: {
      'user-agent': 'financiamento-static-simulator/1.0 (+https://github.com/)',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar a Selic do BCB: HTTP ${response.status}.`);
  }

  const payload = await response.json();
  const data = buildSelicData(payload);
  const absoluteOutputPath = resolve(outputPath);
  await mkdir(dirname(absoluteOutputPath), { recursive: true });
  await writeFile(absoluteOutputPath, `${JSON.stringify(data, null, 2)}\n`);
  return data;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isCli) {
  updateSelicBcb()
    .then((data) => {
      console.log(`Selic BCB atualizada: ${data.latest.date} = ${data.latest.ratePercent}%`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
