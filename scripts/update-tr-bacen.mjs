import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOURCE_URL = 'https://www.debit.com.br/tabelas/tr-bacen';
export const OUTPUT_PATH = 'assets/data/tr-bacen.json';

function toIsoDate(year, month) {
  return `${year}-${month}-01`;
}

function toMonth(year, month) {
  return `${year}-${month}`;
}

function normalizeRate(value) {
  const rate = Number(String(value).replace(',', '.'));
  return Number.isFinite(rate) ? rate : null;
}

export function parseTrRates(html) {
  const ratesByMonth = new Map();
  const payloadPattern = /\b(20\d{2})(0[1-9]|1[0-2])01,(-?\d+(?:[.,]\d+)?)/g;
  const tablePattern = /\b(0[1-9]|1[0-2])\/(20\d{2})\b[\s\S]{0,160}?\b(-?\d+(?:[.,]\d+)?)\s*%?/g;

  for (const match of html.matchAll(payloadPattern)) {
    const [, year, month, rawRate] = match;
    const ratePercent = normalizeRate(rawRate);
    if (ratePercent === null || ratePercent < 0 || ratePercent > 5) continue;
    ratesByMonth.set(toMonth(year, month), {
      month: toMonth(year, month),
      date: toIsoDate(year, month),
      ratePercent,
    });
  }

  for (const match of html.matchAll(tablePattern)) {
    const [, month, year, rawRate] = match;
    const ratePercent = normalizeRate(rawRate);
    if (ratePercent === null || ratePercent < 0 || ratePercent > 5) continue;
    ratesByMonth.set(toMonth(year, month), {
      month: toMonth(year, month),
      date: toIsoDate(year, month),
      ratePercent,
    });
  }

  return [...ratesByMonth.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function buildTrData(html, generatedAt = new Date().toISOString()) {
  const rates = parseTrRates(html);
  if (rates.length === 0) {
    throw new Error('Nenhuma taxa TR válida foi encontrada na página da Debit.');
  }

  return {
    sourceUrl: SOURCE_URL,
    generatedAt,
    latest: rates.at(-1),
    rates,
  };
}

export async function updateTrBacen({ fetchImpl = fetch, outputPath = OUTPUT_PATH } = {}) {
  const response = await fetchImpl(SOURCE_URL, {
    headers: {
      'user-agent': 'financiamento-static-simulator/1.0 (+https://github.com/)',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar a página da TR: HTTP ${response.status}.`);
  }

  const html = await response.text();
  const data = buildTrData(html);
  const absoluteOutputPath = resolve(outputPath);
  await mkdir(dirname(absoluteOutputPath), { recursive: true });
  await writeFile(absoluteOutputPath, `${JSON.stringify(data, null, 2)}\n`);
  return data;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isCli) {
  updateTrBacen()
    .then((data) => {
      console.log(`TR Bacen atualizada: ${data.latest.month} = ${data.latest.ratePercent}%`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
