import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OLINDA_TAXA_JUROS_BASE_URL = 'https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata';
const VEHICLE_MODALITY_FILTER = encodeURIComponent("Modalidade eq 'Aquisição de veículos - Prefixado'");

export const REAL_ESTATE_SOURCE_URL = `${OLINDA_TAXA_JUROS_BASE_URL}/TaxasJurosMensalPorMes?$format=json`;
export const VEHICLE_SOURCE_URL = `${OLINDA_TAXA_JUROS_BASE_URL}/TaxasJurosDiariaPorInicioPeriodo?$format=json&$top=500&$filter=${VEHICLE_MODALITY_FILTER}`;
export const SOURCE_URL = REAL_ESTATE_SOURCE_URL;
export const SOURCE_URLS = {
  realEstate: REAL_ESTATE_SOURCE_URL,
  vehicle: VEHICLE_SOURCE_URL,
};
export const OUTPUT_PATH = 'assets/data/bcb-credit-rates.json';

export const REAL_ESTATE_MARKET_MODALITIES = [
  {
    key: 'marketFixed',
    code: '903101',
    label: 'Prefixado',
    sourceName: 'Financiamento imobiliário com taxas de mercado - Prefixado',
  },
  {
    key: 'marketTr',
    code: '903201',
    label: 'Pós-fixado TR',
    sourceName: 'Financiamento imobiliário com taxas de mercado - Pós-fixado referenciado em TR',
  },
  {
    key: 'marketIpca',
    code: '903203',
    label: 'Pós-fixado IPCA',
    sourceName: 'Financiamento imobiliário com taxas de mercado - Pós-fixado referenciado em IPCA',
  },
];

export const VEHICLE_MODALITIES = [
  {
    key: 'vehicleFixed',
    code: '401101',
    label: 'Aquisição de veículos - Prefixado',
    sourceName: 'Aquisição de veículos - Prefixado',
  },
];

const DEFAULT_MODALITY_KEY = 'marketFixed';
const DEFAULT_INSTITUTION_LIMIT = 20;
const realEstateModalityBySourceName = new Map(REAL_ESTATE_MARKET_MODALITIES.map((modality) => [modality.sourceName, modality]));
const vehicleModalityBySourceName = new Map(VEHICLE_MODALITIES.map((modality) => [modality.sourceName, modality]));

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeComparableText(value) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeMonthPeriod(value) {
  const period = normalizeText(value);
  return /^\d{4}-\d{2}$/.test(period) ? period : null;
}

function normalizeIsoDate(value) {
  const date = normalizeText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function normalizeRate(value) {
  const rate = Number(String(value).replace(',', '.'));
  return Number.isFinite(rate) ? rate : null;
}

function normalizePosition(value) {
  const position = Number(value);
  return Number.isInteger(position) && position > 0 ? position : null;
}

function isPessoaFisica(row) {
  const segment = normalizeComparableText(row?.Segmento);
  return !segment || segment === 'pessoa fisica';
}

function sourceRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.value)) return payload.value;
  return [];
}

function normalizeInstitutionFields(row) {
  const monthlyRatePercent = normalizeRate(row?.TaxaJurosAoMes);
  const annualRatePercent = normalizeRate(row?.TaxaJurosAoAno);
  const institution = normalizeText(row?.InstituicaoFinanceira);
  const cnpj8 = normalizeText(row?.cnpj8);
  const position = normalizePosition(row?.Posicao);

  if (
    !institution
    || !cnpj8
    || !position
    || monthlyRatePercent === null
    || annualRatePercent === null
    || monthlyRatePercent <= 0
    || annualRatePercent <= 0
  ) {
    return null;
  }

  return {
    institution,
    cnpj8,
    position,
    monthlyRatePercent,
    annualRatePercent,
  };
}

function normalizedRealEstateRows(payload) {
  return sourceRows(payload)
    .map((row) => {
      const sourceName = normalizeText(row?.Modalidade);
      const modality = realEstateModalityBySourceName.get(sourceName);
      const period = normalizeMonthPeriod(row?.anoMes);
      const institutionFields = normalizeInstitutionFields(row);
      if (!modality || !period || !isPessoaFisica(row) || !institutionFields) return null;

      return {
        modalityKey: modality.key,
        period,
        ...institutionFields,
      };
    })
    .filter(Boolean);
}

function normalizedVehicleRows(payload) {
  return sourceRows(payload)
    .map((row) => {
      const sourceName = normalizeText(row?.Modalidade);
      const modality = vehicleModalityBySourceName.get(sourceName);
      const startDate = normalizeIsoDate(row?.InicioPeriodo);
      const endDate = normalizeIsoDate(row?.FimPeriodo);
      const institutionFields = normalizeInstitutionFields(row);
      if (!modality || !startDate || !endDate || !isPessoaFisica(row) || !institutionFields) return null;

      return {
        modalityKey: modality.key,
        startDate,
        endDate,
        ...institutionFields,
      };
    })
    .filter(Boolean);
}

function roundRate(value) {
  return Number(value.toFixed(6));
}

function latestMonthPeriod(rows) {
  return rows.reduce((latest, row) => (row.period > latest ? row.period : latest), rows[0]?.period ?? '');
}

function latestDailyPeriod(rows) {
  return rows.reduce((latest, row) => {
    if (!latest) return { startDate: row.startDate, endDate: row.endDate };
    if (row.startDate > latest.startDate) return { startDate: row.startDate, endDate: row.endDate };
    if (row.startDate === latest.startDate && row.endDate > latest.endDate) return { startDate: row.startDate, endDate: row.endDate };
    return latest;
  }, null);
}

function sortInstitutions(left, right) {
  return (
    left.monthlyRatePercent - right.monthlyRatePercent
    || left.annualRatePercent - right.annualRatePercent
    || left.institution.localeCompare(right.institution, 'pt-BR')
  );
}

function buildDefaultInterestRate(modalities, referencePeriod) {
  const defaultModality = modalities.find((modality) => modality.key === DEFAULT_MODALITY_KEY);
  const institutions = defaultModality?.institutions.slice(0, DEFAULT_INSTITUTION_LIMIT) ?? [];
  if (institutions.length === 0) {
    throw new Error('Nenhuma taxa prefixada de mercado válida foi encontrada para calcular o default.');
  }

  const monthlyRatePercent = institutions.reduce((sum, institution) => sum + institution.monthlyRatePercent, 0) / institutions.length;
  const annualEquivalentRatePercent = ((1 + (monthlyRatePercent / 100)) ** 12 - 1) * 100;

  return {
    creditType: 'realEstate',
    modalityKey: DEFAULT_MODALITY_KEY,
    method: 'average-lowest-20-market-fixed-monthly',
    referencePeriod,
    institutionCount: institutions.length,
    monthlyRatePercent: roundRate(monthlyRatePercent),
    annualEquivalentRatePercent: roundRate(annualEquivalentRatePercent),
  };
}

function buildRealEstateCreditType(payload) {
  const relevantRows = normalizedRealEstateRows(payload);
  if (relevantRows.length === 0) {
    throw new Error('Nenhuma taxa imobiliária de mercado válida foi encontrada na resposta do BCB.');
  }

  const referencePeriod = latestMonthPeriod(relevantRows);
  const rows = relevantRows.filter((row) => row.period === referencePeriod);

  const modalities = REAL_ESTATE_MARKET_MODALITIES.map((modality) => {
    const institutions = rows
      .filter((row) => row.modalityKey === modality.key)
      .sort(sortInstitutions)
      .map((row) => ({
        institution: row.institution,
        cnpj8: row.cnpj8,
        position: row.position,
        monthlyRatePercent: row.monthlyRatePercent,
        annualRatePercent: row.annualRatePercent,
      }));

    return {
      key: modality.key,
      code: modality.code,
      label: modality.label,
      sourceName: modality.sourceName,
      institutions,
    };
  }).filter((modality) => modality.institutions.length > 0);

  if (modalities.length === 0) {
    throw new Error('Nenhuma modalidade imobiliária de mercado válida foi encontrada no período mais recente do BCB.');
  }

  return {
    key: 'realEstate',
    label: 'Financiamento imobiliário',
    referencePeriod,
    modalities,
  };
}

function buildVehicleCreditType(payload) {
  const relevantRows = normalizedVehicleRows(payload);
  if (relevantRows.length === 0) {
    throw new Error('Nenhuma taxa veicular válida foi encontrada na resposta do BCB.');
  }

  const referencePeriod = latestDailyPeriod(relevantRows);
  const rows = relevantRows.filter((row) => (
    row.startDate === referencePeriod.startDate
    && row.endDate === referencePeriod.endDate
  ));

  const modalities = VEHICLE_MODALITIES.map((modality) => {
    const institutions = rows
      .filter((row) => row.modalityKey === modality.key)
      .sort(sortInstitutions)
      .map((row) => ({
        institution: row.institution,
        cnpj8: row.cnpj8,
        position: row.position,
        monthlyRatePercent: row.monthlyRatePercent,
        annualRatePercent: row.annualRatePercent,
      }));

    return {
      key: modality.key,
      code: modality.code,
      label: modality.label,
      sourceName: modality.sourceName,
      institutions,
    };
  }).filter((modality) => modality.institutions.length > 0);

  if (modalities.length === 0) {
    throw new Error('Nenhuma modalidade veicular válida foi encontrada no período mais recente do BCB.');
  }

  return {
    key: 'vehicle',
    label: 'Financiamento veicular',
    referencePeriod,
    modalities,
  };
}

export function buildBcbCreditRatesData(realEstatePayload, vehiclePayload, generatedAt = new Date().toISOString()) {
  const realEstate = buildRealEstateCreditType(realEstatePayload);
  const vehicle = buildVehicleCreditType(vehiclePayload);

  return {
    sourceUrl: REAL_ESTATE_SOURCE_URL,
    sourceUrls: SOURCE_URLS,
    generatedAt,
    referencePeriod: realEstate.referencePeriod,
    defaultInterestRate: buildDefaultInterestRate(realEstate.modalities, realEstate.referencePeriod),
    creditTypes: {
      realEstate,
      vehicle,
    },
  };
}

async function fetchBcbJson(fetchImpl, url, label) {
  const response = await fetchImpl(url, {
    headers: {
      'user-agent': 'mapa-das-parcelas/1.0 (+https://mapadasparcelas.com.br/)',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar taxas médias BCB (${label}): HTTP ${response.status}.`);
  }

  return response.json();
}

export async function updateBcbCreditRates({ fetchImpl = fetch, outputPath = OUTPUT_PATH } = {}) {
  const [realEstatePayload, vehiclePayload] = await Promise.all([
    fetchBcbJson(fetchImpl, REAL_ESTATE_SOURCE_URL, 'imobiliário'),
    fetchBcbJson(fetchImpl, VEHICLE_SOURCE_URL, 'veicular'),
  ]);

  const data = buildBcbCreditRatesData(realEstatePayload, vehiclePayload);
  const absoluteOutputPath = resolve(outputPath);
  await mkdir(dirname(absoluteOutputPath), { recursive: true });
  await writeFile(absoluteOutputPath, `${JSON.stringify(data, null, 2)}\n`);
  return data;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isCli) {
  updateBcbCreditRates()
    .then((data) => {
      const vehicleCount = data.creditTypes.vehicle.modalities.reduce((sum, modality) => sum + modality.institutions.length, 0);
      console.log(`Taxas médias BCB atualizadas: imobiliário ${data.referencePeriod}, veicular ${data.creditTypes.vehicle.referencePeriod.startDate} a ${data.creditTypes.vehicle.referencePeriod.endDate}, ${vehicleCount} taxas veiculares.`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
