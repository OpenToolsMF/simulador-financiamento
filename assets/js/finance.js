(function exposeFinanceSimulator(globalScope) {
  'use strict';

  const GOAL_TERM = 'term';
  const GOAL_PAYMENT = 'payment';
  const GOAL_MIXED = 'mixed';

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
    const applications = rules
      .filter((rule) => ruleApplies(rule, month))
      .map((rule) => ({
        goal: rule.goal,
        requestedCents: Math.max(0, rule.valueCents || 0),
      }));
    const goals = new Set(applications.filter((application) => application.requestedCents > 0).map((application) => application.goal));
    return {
      requestedCents: applications.reduce((total, application) => total + application.requestedCents, 0),
      goal: goals.size > 1 ? GOAL_MIXED : goals.values().next().value || null,
      applications,
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

  function findMixedGoalMonths(rules, originalTerm) {
    const months = [];
    for (let month = 1; month <= originalTerm; month += 1) {
      if (extraForMonth(rules, month).goal === GOAL_MIXED) months.push(month);
    }
    return months;
  }

  function findGoalConflict(rules, originalTerm) {
    return findMixedGoalMonths(rules, originalTerm)[0] || null;
  }

  function projectPriceRemainingTerm(
    config,
    balanceCents,
    scheduleBalanceCents,
    scheduleRemaining,
    scheduledPaymentCents,
    nextMonth,
  ) {
    if (balanceCents <= 0) return 0;
    if (scheduleRemaining <= 0 || scheduledPaymentCents <= 0) return scheduleRemaining;

    let projectedBalanceCents = balanceCents;
    let projectedScheduleBalanceCents = scheduleBalanceCents;
    let projectedScheduleRemaining = scheduleRemaining;
    let projectedPaymentCents = scheduledPaymentCents;

    for (let offset = 0; offset < scheduleRemaining; offset += 1) {
      const correctionRate = correctionRateForMonth(config, nextMonth + offset);
      const correctedBalanceCents = projectedBalanceCents + roundCents(projectedBalanceCents * correctionRate);
      const interestCents = roundCents(correctedBalanceCents * config.monthlyRate);
      const scheduleCorrectedBalanceCents = projectedScheduleBalanceCents
        + roundCents(projectedScheduleBalanceCents * correctionRate);

      if (hasMonetaryCorrection(config)) {
        projectedPaymentCents = pricePaymentCents(
          scheduleCorrectedBalanceCents,
          config.monthlyRate,
          projectedScheduleRemaining,
        );
      }

      const regularPaymentCents = Math.min(projectedPaymentCents, correctedBalanceCents + interestCents);
      const regularAmortizationCents = Math.min(
        correctedBalanceCents,
        Math.max(0, regularPaymentCents - interestCents),
      );
      projectedBalanceCents = Math.max(0, correctedBalanceCents - regularAmortizationCents);

      const scheduleInterestCents = roundCents(scheduleCorrectedBalanceCents * config.monthlyRate);
      const scheduledAmortizationCents = Math.min(
        scheduleCorrectedBalanceCents,
        Math.max(0, projectedPaymentCents - scheduleInterestCents),
      );
      projectedScheduleBalanceCents = Math.max(0, scheduleCorrectedBalanceCents - scheduledAmortizationCents);
      projectedScheduleRemaining = Math.max(0, projectedScheduleRemaining - 1);

      if (projectedBalanceCents === 0) return offset + 1;
    }

    return scheduleRemaining;
  }

  function sacPaymentForNextMonth(config, balanceCents, remaining, amortizationCents, nextMonth) {
    if (balanceCents <= 0 || remaining <= 0) return 0;
    const correctionRate = correctionRateForMonth(config, nextMonth);
    const correctedBalanceCents = balanceCents + roundCents(balanceCents * correctionRate);
    const scheduledAmortizationCents = hasMonetaryCorrection(config)
      ? roundCents(correctedBalanceCents / remaining)
      : amortizationCents;
    return roundCents(correctedBalanceCents * config.monthlyRate)
      + Math.min(scheduledAmortizationCents, correctedBalanceCents);
  }

  function projectSacRemainingTerm(
    config,
    balanceCents,
    scheduleBalanceCents,
    scheduleRemaining,
    amortizationCents,
    nextMonth,
    maximumPeriods,
  ) {
    if (balanceCents <= 0) return 0;
    if (maximumPeriods <= 0 || amortizationCents <= 0) return maximumPeriods;

    let projectedBalanceCents = balanceCents;
    let projectedScheduleBalanceCents = scheduleBalanceCents;
    let projectedScheduleRemaining = scheduleRemaining;

    for (let offset = 0; offset < maximumPeriods; offset += 1) {
      const correctionRate = correctionRateForMonth(config, nextMonth + offset);
      const correctedBalanceCents = projectedBalanceCents + roundCents(projectedBalanceCents * correctionRate);
      const scheduleCorrectedBalanceCents = projectedScheduleBalanceCents
        + roundCents(projectedScheduleBalanceCents * correctionRate);
      const baseAmortizationCents = hasMonetaryCorrection(config)
        ? (projectedScheduleRemaining > 0
          ? roundCents(scheduleCorrectedBalanceCents / projectedScheduleRemaining)
          : scheduleCorrectedBalanceCents)
        : amortizationCents;
      const scheduledAmortizationCents = Math.min(baseAmortizationCents, scheduleCorrectedBalanceCents);
      const regularAmortizationCents = Math.min(scheduledAmortizationCents, correctedBalanceCents);

      projectedBalanceCents = Math.max(0, correctedBalanceCents - regularAmortizationCents);
      projectedScheduleBalanceCents = Math.max(0, scheduleCorrectedBalanceCents - scheduledAmortizationCents);
      projectedScheduleRemaining = Math.max(0, projectedScheduleRemaining - 1);

      if (projectedBalanceCents === 0) return offset + 1;
    }

    return maximumPeriods;
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
    let balanceCents = config.financedCents;
    let scheduleBalanceCents = config.financedCents;
    let targetRemaining = config.term;
    let scheduleRemaining = config.term;
    let hasAppliedTermGoal = false;
    let hasAppliedPaymentGoal = false;
    let enforceSacTargetPayoff = false;
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
          ? roundCents(scheduleCorrectedBalanceCents / scheduleRemaining)
          : sacAmortizationCents;
        scheduledAmortizationCents = Math.min(sacBaseAmortizationCents, scheduleCorrectedBalanceCents);
        const scheduleInterestCents = roundCents(scheduleCorrectedBalanceCents * config.monthlyRate);
        scheduledPaymentCents = scheduleInterestCents + scheduledAmortizationCents;
        regularAmortizationCents = Math.min(scheduledAmortizationCents, correctedBalanceCents);
        regularPaymentCents = interestCents + regularAmortizationCents;
      } else {
        if (hasMonetaryCorrection(config)) {
          priceRegularPaymentCents = pricePaymentCents(scheduleCorrectedBalanceCents, config.monthlyRate, scheduleRemaining);
        }
        regularPaymentCents = Math.min(priceRegularPaymentCents, correctedBalanceCents + interestCents);
        regularAmortizationCents = Math.min(correctedBalanceCents, Math.max(0, regularPaymentCents - interestCents));
        regularPaymentCents = interestCents + regularAmortizationCents;
        const scheduleInterestCents = roundCents(scheduleCorrectedBalanceCents * config.monthlyRate);
        scheduledAmortizationCents = Math.min(scheduleCorrectedBalanceCents, Math.max(0, priceRegularPaymentCents - scheduleInterestCents));
      }

      let balanceAfterRegularCents = correctedBalanceCents - regularAmortizationCents;
      let scheduleBalanceAfterRegularCents = Math.max(0, scheduleCorrectedBalanceCents - scheduledAmortizationCents);
      const reachesPriceTarget = config.system === 'price' && targetRemaining === 1;
      const reachesReanchoredSacTarget = config.system === 'sac'
        && enforceSacTargetPayoff
        && targetRemaining === 1;
      if ((month === config.term || reachesPriceTarget || reachesReanchoredSacTarget) && balanceAfterRegularCents > 0) {
        regularAmortizationCents += balanceAfterRegularCents;
        regularPaymentCents += balanceAfterRegularCents;
        balanceAfterRegularCents = 0;
        scheduleBalanceAfterRegularCents = 0;
      }

      targetRemaining = Math.max(0, targetRemaining - 1);
      scheduleRemaining = Math.max(0, scheduleRemaining - 1);
      const extra = extraForMonth(rules, month);
      const extraApplications = [];
      let extraPaymentCents = 0;
      balanceCents = balanceAfterRegularCents;
      scheduleBalanceCents = scheduleBalanceAfterRegularCents;

      for (let applicationIndex = 0; applicationIndex < extra.applications.length;) {
        const groupGoal = extra.applications[applicationIndex].goal;
        const groupOpeningBalanceCents = balanceCents;
        let groupAppliedCents = 0;
        let nextApplicationIndex = applicationIndex;

        while (
          nextApplicationIndex < extra.applications.length
          && extra.applications[nextApplicationIndex].goal === groupGoal
        ) {
          const application = extra.applications[nextApplicationIndex];
          const appliedCents = Math.min(application.requestedCents, balanceCents);
          balanceCents = Math.max(0, balanceCents - appliedCents);
          groupAppliedCents += appliedCents;
          extraPaymentCents += appliedCents;
          extraApplications.push({
            goal: application.goal,
            requestedCents: application.requestedCents,
            appliedCents,
          });
          nextApplicationIndex += 1;
        }

        if (groupAppliedCents > 0 && groupGoal === GOAL_TERM) {
          hasAppliedTermGoal = true;
          if (hasAppliedPaymentGoal && config.system === 'sac') enforceSacTargetPayoff = true;
        }

        if (groupAppliedCents > 0 && balanceCents > 0 && targetRemaining > 0) {
          if (groupGoal === GOAL_PAYMENT) {
            if (config.system === 'sac' && hasAppliedTermGoal) {
              targetRemaining = projectSacRemainingTerm(
                config,
                groupOpeningBalanceCents,
                scheduleBalanceCents,
                scheduleRemaining,
                sacAmortizationCents,
                month + 1,
                config.term - month,
              );
              enforceSacTargetPayoff = true;
            }
            scheduleBalanceCents = balanceCents;
            scheduleRemaining = targetRemaining;
            if (config.system === 'sac') {
              sacAmortizationCents = roundCents(balanceCents / targetRemaining);
              scheduledPaymentCents = sacPaymentForNextMonth(
                config,
                balanceCents,
                targetRemaining,
                sacAmortizationCents,
                month + 1,
              );
            } else {
              priceRegularPaymentCents = pricePaymentCents(balanceCents, config.monthlyRate, targetRemaining);
            }
          } else if (groupGoal === GOAL_TERM && config.system === 'sac') {
            const recalculatedRemaining = recalculateSacRemainingTerm(
              config,
              balanceCents,
              targetRemaining,
              scheduledPaymentCents,
              month + 1,
            );
            if (recalculatedRemaining < targetRemaining) {
              targetRemaining = recalculatedRemaining;
              scheduleRemaining = recalculatedRemaining;
              scheduleBalanceCents = balanceCents;
              sacAmortizationCents = roundCents(balanceCents / targetRemaining);
              scheduledPaymentCents = sacPaymentForNextMonth(
                config,
                balanceCents,
                targetRemaining,
                sacAmortizationCents,
                month + 1,
              );
            }
          } else if (groupGoal === GOAL_TERM && config.system === 'price') {
            targetRemaining = Math.min(
              targetRemaining,
              projectPriceRemainingTerm(
                config,
                balanceCents,
                scheduleBalanceCents,
                scheduleRemaining,
                priceRegularPaymentCents,
                month + 1,
              ),
            );
          }
        }

        if (groupAppliedCents > 0 && groupGoal === GOAL_PAYMENT) hasAppliedPaymentGoal = true;

        applicationIndex = nextApplicationIndex;
      }

      const appliedGoals = new Set(
        extraApplications.filter((application) => application.appliedCents > 0).map((application) => application.goal),
      );
      const extraGoal = appliedGoals.size > 1 ? GOAL_MIXED : appliedGoals.values().next().value || null;

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
        extraGoal,
        extraApplications,
      });

      if (balanceCents === 0) break;
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
    GOAL_MIXED,
    roundCents,
    hasMonetaryCorrection,
    monthlyRateFromPercent,
    pricePaymentCents,
    ruleApplies,
    extraForMonth,
    findGoalConflict,
    findMixedGoalMonths,
    correctionRateForMonth,
    recalculateSacRemainingTerm,
    projectPriceRemainingTerm,
    projectSacRemainingTerm,
    addMonthsClamped,
    simulate,
    simulateComparison,
  };

  globalScope.FinanceSimulator = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));
