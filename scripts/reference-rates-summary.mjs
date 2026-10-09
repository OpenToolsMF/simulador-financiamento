import { appendFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function updateStatus(outcome) {
  if (outcome === 'success') return 'Consulta e validação concluídas';
  if (outcome === 'failure') return 'Falha; referência local não confirmada nesta execução';
  if (outcome === 'cancelled') return 'Cancelada; referência local não confirmada nesta execução';
  return 'Não executada; referência local não confirmada nesta execução';
}

function safeCell(value) {
  return String(value || 'Indisponível').replace(/[|\r\n]/g, ' ');
}

export function renderReferenceRatesSummary({
  tr,
  credit,
  trOutcome,
  creditOutcome,
  commitOutcome,
  commitChanged,
  vehiclePreserved,
} = {}) {
  const vehiclePeriod = credit?.creditTypes?.vehicle?.referencePeriod;
  const vehicleStatus = creditOutcome === 'success' && vehiclePreserved
    ? 'Preservada do JSON anterior; API veicular indisponível'
    : updateStatus(creditOutcome);
  const publication = commitOutcome === 'success'
    ? (commitChanged ? 'Commit criado. A publicação é executada em um job separado.' : 'Sem mudanças semânticas; nenhum commit ou deploy necessário.')
    : 'Nenhum commit confirmado por esta execução; nenhum novo deploy solicitado por ela.';

  return [
    '## Atualização das referências BCB',
    '',
    '| Fonte | Resultado | Referência disponível no arquivo local |',
    '| --- | --- | --- |',
    `| TR SGS 226 | ${updateStatus(trOutcome)} | ${safeCell(tr?.latest?.startDate)} |`,
    `| Taxas imobiliárias | ${updateStatus(creditOutcome)} | ${safeCell(credit?.referencePeriod)} |`,
    `| Taxas veiculares | ${vehicleStatus} | ${safeCell(vehiclePeriod ? `${vehiclePeriod.startDate} a ${vehiclePeriod.endDate}` : null)} |`,
    '',
    'As datas acima identificam os dados locais; uma consulta bem-sucedida pode não trazer observações novas. Dados preservados ou não confirmados não representam uma nova atualização da fonte.',
    '',
    publication,
    '',
  ].join('\n');
}

async function readData(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isCli) {
  const [tr, credit] = await Promise.all([
    readData('assets/data/tr-bacen.json'),
    readData('assets/data/bcb-credit-rates.json'),
  ]);
  const summary = renderReferenceRatesSummary({
    tr,
    credit,
    trOutcome: process.env.TR_OUTCOME,
    creditOutcome: process.env.CREDIT_OUTCOME,
    commitOutcome: process.env.COMMIT_OUTCOME,
    commitChanged: process.env.COMMIT_CHANGED === 'true',
    vehiclePreserved: process.env.VEHICLE_PRESERVED === 'true',
  });
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  } else {
    console.log(summary);
  }
}
