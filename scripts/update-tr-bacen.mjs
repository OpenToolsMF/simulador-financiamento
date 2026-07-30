import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SERIES_CODE = 226;
export const SOURCE_URL = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${SERIES_CODE}/dados`;
export const OUTPUT_PATH = 'assets/data/tr-bacen.json';

function isoDateFromBcb(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function lastDayOfMonth(date) {
  const [year, month] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function dateFromBcb(value) {
  const isoDate = isoDateFromBcb(value);
  return isoDate || null;
}

function bcbDateFromDate(date) {
  const iso = date.toISOString().slice(0, 10);
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

export function sourceUrlForDate(now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  return `${SOURCE_URL}?formato=json&dataInicial=${bcbDateFromDate(start)}&dataFinal=${bcbDateFromDate(end)}`;
}

function normalizeRate(value) {
  const rate = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(rate) && rate >= 0 && rate <= 5 ? rate : null;
}

export function parseTrRates(payload) {
  if (!Array.isArray(payload)) return [];

  const byStartDate = new Map();
  payload.forEach((row) => {
    const startDate = isoDateFromBcb(row?.data);
    const ratePercent = normalizeRate(row?.valor);
    if (!startDate || ratePercent === null) return;
    byStartDate.set(startDate, {
      startDate,
      endDate: dateFromBcb(row?.dataFim) || lastDayOfMonth(startDate),
      ratePercent,
    });
  });

  const sorted = [...byStartDate.values()]
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
  if (sorted.length === 0) return [];

  const latest = new Date(`${sorted.at(-1).startDate}T00:00:00Z`);
  latest.setUTCFullYear(latest.getUTCFullYear() - 1);
  const threshold = latest.toISOString().slice(0, 10);
  return sorted.filter((rate) => rate.startDate >= threshold);
}

export function buildTrData(payload, generatedAt = new Date().toISOString()) {
  const rates = parseTrRates(payload);
  if (rates.length === 0) {
    throw new Error('Nenhuma observação válida da série SGS 226 foi encontrada.');
  }

  return {
    version: 2,
    seriesCode: SERIES_CODE,
    sourceUrl: SOURCE_URL,
    generatedAt,
    latest: rates.at(-1),
    rates,
  };
}

function semanticData(data) {
  if (!data || typeof data !== 'object') return null;
  const { generatedAt, ...comparable } = data;
  return comparable;
}

async function readPreviousData(outputPath) {
  try {
    return JSON.parse(await readFile(outputPath, 'utf8'));
  } catch {
    return null;
  }
}

export async function updateTrBacen({
  fetchImpl = fetch,
  outputPath = OUTPUT_PATH,
  now = new Date(),
} = {}) {
  const requestUrl = sourceUrlForDate(now);
  const response = await fetchImpl(requestUrl, {
    headers: {
      'user-agent': 'mapa-das-parcelas/1.0 (+https://mapadasparcelas.com.br/)',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar a série SGS 226 da TR: HTTP ${response.status}.`);
  }

  const absoluteOutputPath = resolve(outputPath);
  const previous = await readPreviousData(absoluteOutputPath);
  const generated = buildTrData(await response.json());
  const unchanged = previous
    && JSON.stringify(semanticData(previous)) === JSON.stringify(semanticData(generated));
  const data = unchanged ? previous : generated;

  if (!unchanged) {
    await mkdir(dirname(absoluteOutputPath), { recursive: true });
    await writeFile(absoluteOutputPath, `${JSON.stringify(data, null, 2)}\n`);
  }

  return {
    data,
    changed: !unchanged,
  };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isCli) {
  updateTrBacen()
    .then(({ data, changed }) => {
      const status = changed ? 'atualizada' : 'sem alterações';
      console.log(`TR SGS 226 ${status}: ${data.latest.startDate} a ${data.latest.endDate} = ${data.latest.ratePercent}%`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
