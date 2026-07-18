(function exposeFinanceSimulator(globalScope) {
  'use strict';

  const GOAL_TERM = 'term';
  const GOAL_PAYMENT = 'payment';

  function roundCents(value) {
    return Math.max(0, Math.round(value + Number.EPSILON));
  }

  function monthlyRateFromPercent(ratePercent, period, annualType) {
    const decimalRate = ratePercent / 100;
    if (period === 'monthly') return decimalRate;
    if (annualType === 'nominal') return decimalRate / 12;
    return Math.pow(1 + decimalRate, 1 / 12) - 1;
  }

  function pricePaymentCents(balanceCents, monthlyRate, periods) {
    if (periods <= 0) return balanceCents;
    if (monthlyRate === 0) return roundCents(balanceCents / periods);
    const factor = monthlyRate / (1 - Math.pow(1 + monthlyRate, -periods));
    return roundCents(balanceCents * factor);
  }

  function hasMonetaryCorrection(config) {
    return config.correctionMode === 'fixed' || config.correctionMode === 'custom';
  }

  function ruleApplies(rule, month) {
    if (rule.type === 'single') return rule.month === month;
    if (month < rule.startMonth) return false;
    if (rule.endMonth && month > rule.endMonth) return false;
    return (month - rule.startMonth) % rule.frequency === 0;
  }

  function extraForMonth(rules, month) {
    const applicable = rules.filter((rule) => ruleApplies(rule, month));
    if (applicable.length === 0) return { requestedCents: 0, goal: null };
    const goals = new Set(applicable.map((rule) => rule.goal));
    if (goals.size > 1) {
      const error = new Error('EXTRA_GOAL_CONFLICT');
      error.code = 'EXTRA_GOAL_CONFLICT';
      error.month = month;
      throw error;
    }
    return {
      requestedCents: applicable.reduce((total, rule) => total + rule.valueCents, 0),
      goal: applicable[0].goal,
    };
  }

  function correctionRateForMonth(config, month) {
    if (!config || config.correctionMode === 'none' || !config.correctionMode) return 0;
    if (config.correctionMode === 'fixed') return Math.max(0, config.monthlyCorrectionRate || 0);
    if (config.correctionMode !== 'custom') return 0;

    const series = Array.isArray(config.monthlyCorrectionRates) ? config.monthlyCorrectionRates : [];
    if (series.length === 0) return 0;
    return Math.max(0, series[Math.min(month - 1, series.length - 1)] || 0);
  }

  function recalculateSacRemainingTerm(config, balanceCents, contractualRemaining, scheduledPaymentCents, nextMonth) {
    if (balanceCents <= 0 || contractualRemaining <= 0 || scheduledPaymentCents <= 0) return contractualRemaining;

    const nextCorrectionRate = correctionRateForMonth(config, nextMonth);
    const projectedCorrectedBalanceCents = balanceCents + roundCents(balanceCents * nextCorrectionRate);
    const projectedInterestCents = roundCents(projectedCorrectedBalanceCents * config.monthlyRate);
    const targetAmortizationCents = scheduledPaymentCents - projectedInterestCents;
    if (targetAmortizationCents <= 0) return contractualRemaining;

    const recalculatedRemaining = Math.ceil(projectedCorrectedBalanceCents / targetAmortizationCents);
    if (!Number.isFinite(recalculatedRemaining) || recalculatedRemaining <= 0) return contractualRemaining;
    return Math.max(1, Math.min(contractualRemaining, recalculatedRemaining));
  }

  function findGoalConflict(rules, originalTerm) {
    for (let month = 1; month <= originalTerm; month += 1) {
      try {
        extraForMonth(rules, month);
      } catch (error) {
        if (error.code === 'EXTRA_GOAL_CONFLICT') return month;
        throw error;
      }
    }
    return null;
  }

  function addMonthsClamped(isoDate, offset) {
    const [year, month, day] = isoDate.split('-').map(Number);
    const targetFirst = new Date(Date.UTC(year, month - 1 + offset, 1));
    const targetYear = targetFirst.getUTCFullYear();
    const targetMonth = targetFirst.getUTCMonth();
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    const safeDay = Math.min(day, lastDay);
    return `${String(targetYear).padStart(4, '0')}-${String(targetMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
  }

  function calculateStats(financedCents, originalTerm, installments) {
    const sum = (field) => installments.reduce((total, row) => total + row[field], 0);
    const totalPaidCents = sum('totalPaymentCents');
    const totalInterestCents = sum('interestCents');
    const totalExtraCents = sum('extraPaymentCents');
    const totalMonthlyExtraCostsCents = sum('monthlyExtraCostCents');
    const totalCorrectionCents = sum('correctionCents');
    const totalRegularAmortizationCents = sum('regularAmortizationCents');
    const totalAmortizedCents = totalRegularAmortizationCents + totalExtraCents;
    const firstCorrectionAboveAmortization = installments.find((row) => row.correctionCents > row.regularAmortizationCents);
    return {
      financedCents,
      totalPaidCents,
      totalInterestCents,
      totalExtraCents,
      totalMonthlyExtraCostsCents,
      totalCorrectionCents,
      totalAmortizedCents,
      initialPaymentCents: installments[0]?.regularPaymentCents ?? 0,
      initialTotalPaymentCents: installments[0]?.totalPaymentCents ?? 0,
      finalPaymentCents: installments.at(-1)?.regularPaymentCents ?? 0,
      finalTotalPaymentCents: installments.at(-1)?.totalPaymentCents ?? 0,
      averagePaymentCents: installments.length ? roundCents(totalPaidCents / installments.length) : 0,
      highestPaymentCents: installments.reduce((highest, row) => Math.max(highest, row.totalPaymentCents), 0),
      correctionAboveAmortizationMonth: firstCorrectionAboveAmortization?.number ?? null,
      originalTerm,
      effectiveTerm: installments.length,
      reducedMonths: Math.max(0, originalTerm - installments.length),
      interestSavingsCents: 0,
    };
  }

  function simulate(config, rules = config.extraPayments || []) {
    const conflictMonth = findGoalConflict(rules, config.term);
    if (conflictMonth) {
      const error = new Error('EXTRA_GOAL_CONFLICT');
      error.code = 'EXTRA_GOAL_CONFLICT';
      error.month = conflictMonth;
      throw error;
    }

    let balanceCents = config.financedCents;
    let scheduleBalanceCents = config.financedCents;
    let contractualRemaining = config.term;
    let sacAmortizationCents = roundCents(balanceCents / config.term);
    let priceRegularPaymentCents = pricePaymentCents(balanceCents, config.monthlyRate, config.term);
    const monthlyExtraCostCents = Math.max(0, config.monthlyExtraCostCents || 0);
    const installments = [];

    for (let month = 1; balanceCents > 0 && month <= config.term; month += 1) {
      const openingBalanceCents = balanceCents;
      const scheduleOpeningBalanceCents = scheduleBalanceCents;
      const correctionRate = correctionRateForMonth(config, month);
      const correctionCents = roundCents(openingBalanceCents * correctionRate);
      const correctedBalanceCents = openingBalanceCents + correctionCents;
      const interestCents = roundCents(correctedBalanceCents * config.monthlyRate);
      const scheduleCorrectionCents = roundCents(scheduleOpeningBalanceCents * correctionRate);
      const scheduleCorrectedBalanceCents = scheduleOpeningBalanceCents + scheduleCorrectionCents;
      let regularAmortizationCents;
      let regularPaymentCents;
      let scheduledAmortizationCents;
      let scheduledPaymentCents;

      if (config.system === 'sac') {
        const sacBaseAmortizationCents = hasMonetaryCorrection(config)
          ? roundCents(scheduleCorrectedBalanceCents / contractualRemaining)
          : sacAmortizationCents;
        scheduledAmortizationCents = Math.min(sacBaseAmortizationCents, scheduleCorrectedBalanceCents);
        const scheduleInterestCents = roundCents(scheduleCorrectedBalanceCents * config.monthlyRate);
        scheduledPaymentCents = scheduleInterestCents + scheduledAmortizationCents;
        regularAmortizationCents = Math.min(scheduledAmortizationCents, correctedBalanceCents);
        regularPaymentCents = interestCents + regularAmortizationCents;
      } else {
        if (hasMonetaryCorrection(config)) {
          priceRegularPaymentCents = pricePaymentCents(scheduleCorrectedBalanceCents, config.monthlyRate, contractualRemaining);
        }
        regularPaymentCents = Math.min(priceRegularPaymentCents, correctedBalanceCents + interestCents);
        regularAmortizationCents = Math.min(correctedBalanceCents, Math.max(0, regularPaymentCents - interestCents));
        regularPaymentCents = interestCents + regularAmortizationCents;
        const scheduleInterestCents = roundCents(scheduleCorrectedBalanceCents * config.monthlyRate);
        scheduledAmortizationCents = Math.min(scheduleCorrectedBalanceCents, Math.max(0, priceRegularPaymentCents - scheduleInterestCents));
      }

      let balanceAfterRegularCents = correctedBalanceCents - regularAmortizationCents;
      let scheduleBalanceAfterRegularCents = Math.max(0, scheduleCorrectedBalanceCents - scheduledAmortizationCents);
      if (month === config.term && balanceAfterRegularCents > 0) {
        regularAmortizationCents += balanceAfterRegularCents;
        regularPaymentCents += balanceAfterRegularCents;
        balanceAfterRegularCents = 0;
        scheduleBalanceAfterRegularCents = 0;
      }

      contractualRemaining = Math.max(0, contractualRemaining - 1);
      const extra = extraForMonth(rules, month);
      const extraPaymentCents = Math.min(extra.requestedCents, balanceAfterRegularCents);
      balanceCents = Math.max(0, balanceAfterRegularCents - extraPaymentCents);
      scheduleBalanceCents = scheduleBalanceAfterRegularCents;

      installments.push({
        number: month,
        dueDate: config.firstDueDate ? addMonthsClamped(config.firstDueDate, month - 1) : null,
        openingBalanceCents,
        correctionRate,
        correctionCents,
        correctedBalanceCents,
        interestCents,
        regularAmortizationCents,
        regularPaymentCents,
        extraPaymentCents,
        monthlyExtraCostCents,
        totalPaymentCents: regularPaymentCents + extraPaymentCents + monthlyExtraCostCents,
        closingBalanceCents: balanceCents,
        extraGoal: extraPaymentCents > 0 ? extra.goal : null,
      });

      if (balanceCents === 0) break;

      if (extraPaymentCents > 0 && extra.goal === GOAL_PAYMENT && contractualRemaining > 0) {
        scheduleBalanceCents = balanceCents;
        if (config.system === 'sac') {
          sacAmortizationCents = roundCents(balanceCents / contractualRemaining);
        } else {
          priceRegularPaymentCents = pricePaymentCents(balanceCents, config.monthlyRate, contractualRemaining);
        }
      } else if (extraPaymentCents > 0 && extra.goal === GOAL_TERM && config.system === 'sac' && contractualRemaining > 0) {
        const recalculatedRemaining = recalculateSacRemainingTerm(
          config,
          balanceCents,
          contractualRemaining,
          scheduledPaymentCents,
          month + 1,
        );
        if (recalculatedRemaining < contractualRemaining) {
          contractualRemaining = recalculatedRemaining;
          scheduleBalanceCents = balanceCents;
          sacAmortizationCents = roundCents(balanceCents / contractualRemaining);
        }
      }
    }

    return {
      installments,
      stats: calculateStats(config.financedCents, config.term, installments),
    };
  }

  function simulateComparison(config) {
    const base = simulate(config, []);
    const current = simulate(config, config.extraPayments || []);
    current.stats.interestSavingsCents = Math.max(0, base.stats.totalInterestCents - current.stats.totalInterestCents);
    current.stats.reducedMonths = Math.max(0, base.stats.effectiveTerm - current.stats.effectiveTerm);
    return { base, current };
  }

  const api = {
    GOAL_TERM,
    GOAL_PAYMENT,
    roundCents,
    hasMonetaryCorrection,
    monthlyRateFromPercent,
    pricePaymentCents,
    ruleApplies,
    extraForMonth,
    findGoalConflict,
    correctionRateForMonth,
    recalculateSacRemainingTerm,
    addMonthsClamped,
    simulate,
    simulateComparison,
  };

  globalScope.FinanceSimulator = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));
