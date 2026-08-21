(function exposeFinancingChartData(globalScope) {
  'use strict';

  function numericValue(value) {
    return Number.isFinite(value) ? value : 0;
  }

  function rowsByMonth(result) {
    const rows = Array.isArray(result?.installments) ? result.installments : [];
    return new Map(rows.map((row) => [row.number, row]));
  }

  function resultTerm(result) {
    const rows = Array.isArray(result?.installments) ? result.installments : [];
    return Math.max(
      numericValue(result?.stats?.originalTerm),
      numericValue(result?.stats?.effectiveTerm),
      numericValue(rows.at(-1)?.number),
      rows.length,
    );
  }

  function monthlySeries(months, rows, field) {
    return months.map((month) => {
      if (month === 0) return null;
      const row = rows.get(month);
      return row ? numericValue(row[field]) : null;
    });
  }

  function debtSeries(months, rows, financedCents) {
    return months.map((month) => {
      if (month === 0) return numericValue(financedCents);
      return numericValue(rows.get(month)?.closingBalanceCents);
    });
  }

  function cumulativeSeries(months, rows, field) {
    let total = 0;
    return months.map((month) => {
      if (month === 0) return 0;
      const row = rows.get(month);
      if (row) total += numericValue(row[field]);
      return total;
    });
  }

  function sumTooltipItems(items) {
    return (Array.isArray(items) ? items : []).reduce((total, item) => {
      const value = item?.parsed?.y ?? item?.parsed;
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function build(comparison) {
    const base = comparison?.base || {};
    const current = comparison?.current || {};
    const baseRows = rowsByMonth(base);
    const currentRows = rowsByMonth(current);
    const horizon = Math.max(resultTerm(base), resultTerm(current));
    const months = Array.from({ length: horizon + 1 }, (_, month) => month);

    return {
      horizon,
      months,
      debt: {
        base: debtSeries(months, baseRows, base.stats?.financedCents),
        current: debtSeries(months, currentRows, current.stats?.financedCents),
      },
      payment: {
        base: monthlySeries(months, baseRows, 'totalPaymentCents'),
        current: monthlySeries(months, currentRows, 'totalPaymentCents'),
        extras: monthlySeries(months, currentRows, 'extraPaymentCents'),
      },
      composition: {
        interest: monthlySeries(months, currentRows, 'interestCents'),
        regularAmortization: monthlySeries(months, currentRows, 'regularAmortizationCents'),
        correction: monthlySeries(months, currentRows, 'correctionCents'),
        extraAmortization: monthlySeries(months, currentRows, 'extraPaymentCents'),
        monthlyExtraCosts: monthlySeries(months, currentRows, 'monthlyExtraCostCents'),
      },
      costs: {
        interest: cumulativeSeries(months, currentRows, 'interestCents'),
        correction: cumulativeSeries(months, currentRows, 'correctionCents'),
        monthlyExtraCosts: cumulativeSeries(months, currentRows, 'monthlyExtraCostCents'),
        totalPaid: cumulativeSeries(months, currentRows, 'totalPaymentCents'),
      },
    };
  }

  const api = { build, sumTooltipItems };

  globalScope.FinancingChartData = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));
