(function (root) {
  const TEXT = {
    plan: "\u65b9\u6848",
    class3: "\u4e09\u7c7b\u804c\u4e1a",
    class5: "\u4e94\u7c7b\u804c\u4e1a",
    class6: "\u516d\u7c7b\u804c\u4e1a",
    none: "\u65e0",
    deductible90: "200\u5143\u540e90%\u8d54\u4ed8",
    standardLostWork: "\u57fa\u7840\uff08\u516c\u53f8\u6807\u51c6\uff09",
    ageUnder50: "\u5c0f\u4e8e50\u5468\u5c81",
    other: "\u5176\u4ed6",
    age65: "65\u5468\u5c81\u53ca\u4ee5\u4e0a",
  };
  function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
  function money(value) { return Math.max(0, Math.round((number(value) + Number.EPSILON) * 100) / 100); }
  function range(min, max) { return { min: money(min), max: money(max) }; }
  function addRange(a, b) { return range((a?.min || 0) + (b?.min || 0), (a?.max || 0) + (b?.max || 0)); }
  function pickRange(rows, value, mode = "rightClosed") { const numeric = number(value); if (mode === "leftClosed") return rows.find((row) => numeric >= row.min && numeric < row.max) || rows[rows.length - 1]; return rows.find((row) => numeric > row.min && numeric <= row.max) || rows[rows.length - 1]; }
  function pickByDisplay(rows, display) { return rows.find((row) => row.display === display) || rows[0]; }
  function coefficientRange(row) { return { min: row.minValue, max: row.maxValue, display: row.display }; }
  function normalizeScheme(raw, index) { return { schemeName: raw.schemeName || `${TEXT.plan}${index + 1}`, occupation: raw.occupation || "", employeeCount: Math.max(0, number(raw.employeeCount, 0)), occupationClass: raw.occupationClass || TEXT.class3, highRiskJob: raw.highRiskJob || TEXT.none, deathDisabilityLimit: Math.max(0, number(raw.deathDisabilityLimit, 0)), medicalLimit: Math.max(0, number(raw.medicalLimit, 0)), medicalDeductible: raw.medicalDeductible || TEXT.deductible90, lostWorkStandard: raw.lostWorkStandard || TEXT.standardLostWork, addonDisability: Boolean(raw.addonDisability), addonHighAltitude: Boolean(raw.addonHighAltitude), addonCommute: Boolean(raw.addonCommute), commuteLimitRatio: raw.commuteLimitRatio || "100%", addonSuddenDeath: Boolean(raw.addonSuddenDeath), suddenDeathLimit: Math.max(0, number(raw.suddenDeathLimit, 0)), suddenDeathAgeBand: raw.suddenDeathAgeBand || TEXT.ageUnder50, suddenDeathJob: raw.suddenDeathJob || TEXT.other, addonLostWork: Boolean(raw.addonLostWork) }; }
  function normalizeInput(raw) { const schemes = Array.isArray(raw.schemes) && raw.schemes.length ? raw.schemes : [raw]; const normalizedSchemes = schemes.map(normalizeScheme); const totalEmployeeCount = normalizedSchemes.reduce((sum, scheme) => sum + scheme.employeeCount, 0); return { companyName: raw.companyName || "", business: raw.business || "", periodMonths: Math.min(12, Math.max(1, Math.round(number(raw.periodMonths, 12)))), elderlyBand: raw.elderlyBand || "", lossBand: raw.lossBand || "", totalEmployeeCount, schemes: normalizedSchemes }; }
  function buildPolicyFlags(input, wholeCoefficients) { const flags = []; if (input.totalEmployeeCount <= 10) flags.push("\u6574\u5355\uff1a\u6295\u4fdd\u4eba\u6570\u5c0f\u4e8e\u6216\u7b49\u4e8e10\u4eba"); if (wholeCoefficients.elderly.row.min >= 20) flags.push("\u6574\u5355\uff1a\u9ad8\u9f84\u4eba\u5458\u5360\u6bd4\u5927\u4e8e\u6216\u7b49\u4e8e20%"); if (wholeCoefficients.loss.row.min >= 70) flags.push("\u6574\u5355\uff1a\u5386\u53f2\u8d54\u4ed8\u7387\u5927\u4e8e\u6216\u7b49\u4e8e70%"); flags.push("\u6574\u5355\uff1a\u62a5\u4ef7\u4e3a\u8d39\u7387\u533a\u95f4\u6d4b\u7b97\uff0c\u6700\u7ec8\u53d6\u503c\u9700\u6838\u4fdd\u786e\u8ba4"); return flags; }
  function buildSchemeFlags(scheme) { const flags = []; if (scheme.occupationClass === TEXT.class5 || scheme.occupationClass === TEXT.class6) flags.push("\u804c\u4e1a\u7c7b\u522b\u4e3a\u4e94\u7c7b\u6216\u516d\u7c7b\uff0c\u9700\u4eba\u5de5\u590d\u6838"); if (scheme.highRiskJob !== TEXT.none) flags.push(`\u9ad8\u5371\u5c97\u4f4d\uff1a${scheme.highRiskJob}`); if (scheme.medicalLimit >= 100000) flags.push("\u6bcf\u4eba\u533b\u7597\u8d39\u7528\u8d23\u4efb\u9650\u989d\u5927\u4e8e\u6216\u7b49\u4e8e10\u4e07\u5143"); if (scheme.addonHighAltitude) flags.push("\u9009\u62e9\u9644\u52a0\u6269\u5c55\u9ad8\u5904\u4f5c\u4e1a\u4fdd\u9669"); if (scheme.addonSuddenDeath && scheme.suddenDeathAgeBand === TEXT.age65) flags.push("\u731d\u6b7b\u8d23\u4efb\u5e74\u9f84\u6bb5\u4e3a65\u5468\u5c81\u53ca\u4ee5\u4e0a"); return flags; }
  function calculateScheme(scheme, rates, periodCoefficient, wholeCoefficients) {
    const occupation = rates.occupationRates[scheme.occupationClass] || rates.occupationRates[TEXT.class3];
    const medicalLimit = coefficientRange(pickRange(rates.rangeTables.medicalLimit, scheme.medicalLimit, "leftClosed"));
    const fixed = { occupationRate: occupation.deathDisabilityRate, medicalBasePremium: occupation.medicalBasePremium, deductible: rates.deductibleCoefficients[scheme.medicalDeductible] || 1, highRisk: rates.highRiskJobs[scheme.highRiskJob] || 1, period: periodCoefficient };
    const coefficients = { ...fixed, medicalLimit, people: wholeCoefficients.people.value, elderly: wholeCoefficients.elderly.value, loss: wholeCoefficients.loss.value, rangeBased: [{ name: "\u533b\u7597\u9650\u989d\u7cfb\u6570", ...medicalLimit }, { name: "\u6295\u4fdd\u4eba\u6570\u7cfb\u6570", ...wholeCoefficients.people.value }, { name: "\u9ad8\u9f84\u4eba\u5458\u5360\u6bd4\u7cfb\u6570", ...wholeCoefficients.elderly.value }, { name: "\u5386\u53f2\u8d54\u4ed8\u7cfb\u6570", ...wholeCoefficients.loss.value }] };
    const deathDisabilityPremium = scheme.deathDisabilityLimit * fixed.occupationRate;
    const medicalPremiumMin = fixed.medicalBasePremium * medicalLimit.min * fixed.deductible;
    const medicalPremiumMax = fixed.medicalBasePremium * medicalLimit.max * fixed.deductible;
    const lostWorkPremium = rates.constants.lostWorkBasePremium;
    const mainPerPersonMin = (deathDisabilityPremium + medicalPremiumMin + lostWorkPremium) * fixed.highRisk * coefficients.people.min * coefficients.elderly.min * coefficients.loss.min * fixed.period;
    const mainPerPersonMax = (deathDisabilityPremium + medicalPremiumMax + lostWorkPremium) * fixed.highRisk * coefficients.people.max * coefficients.elderly.max * coefficients.loss.max * fixed.period;
    const mainPremium = range(mainPerPersonMin * scheme.employeeCount, mainPerPersonMax * scheme.employeeCount);
    const disabilityAddon = scheme.addonDisability ? range(mainPremium.min * rates.constants.disabilityAddonRate, mainPremium.max * rates.constants.disabilityAddonRate) : range(0, 0);
    const highAltitudeAddon = scheme.addonHighAltitude ? range(mainPremium.min * rates.constants.highAltitudeAddonRate, mainPremium.max * rates.constants.highAltitudeAddonRate) : range(0, 0);
    const commuteCoefficient = rates.commuteLimitCoefficients[scheme.commuteLimitRatio] || 1;
    const commuteAddon = scheme.addonCommute ? range(mainPremium.min * rates.constants.commuteAddonRate * commuteCoefficient, mainPremium.max * rates.constants.commuteAddonRate * commuteCoefficient) : range(0, 0);
    const suddenAge = rates.suddenDeathAgeCoefficients[scheme.suddenDeathAgeBand] || rates.suddenDeathAgeCoefficients[TEXT.ageUnder50];
    const suddenJob = rates.suddenDeathJobCoefficients[scheme.suddenDeathJob] || 1;
    const suddenDeathAddon = scheme.addonSuddenDeath ? range(scheme.suddenDeathLimit * rates.constants.suddenDeathBaseRate * suddenAge.minValue * suddenJob * scheme.employeeCount, scheme.suddenDeathLimit * rates.constants.suddenDeathBaseRate * suddenAge.maxValue * suddenJob * scheme.employeeCount) : range(0, 0);
    const lostWorkCoefficient = rates.lostWorkAdjustmentCoefficients[scheme.lostWorkStandard] || 0;
    const lostWorkAddon = scheme.addonLostWork ? range(mainPremium.min * rates.constants.lostWorkAddonRate * lostWorkCoefficient, mainPremium.max * rates.constants.lostWorkAddonRate * lostWorkCoefficient) : range(0, 0);
    const addons = { disabilityAddon, highAltitudeAddon, commuteAddon, suddenDeathAddon, lostWorkAddon };
    const totalAddonPremium = Object.values(addons).reduce(addRange, range(0, 0));
    const totalPremium = addRange(mainPremium, totalAddonPremium);
    const parts = { mainPerPersonPremium: range(mainPerPersonMin, mainPerPersonMax), mainPremium, totalAddonPremium, totalPremium };
    return { scheme, parts, addons, coefficients, reviewFlags: buildSchemeFlags(scheme) };
  }
  function calculateQuote(rawInput, rates) {
    const input = normalizeInput(rawInput);
    const periodCoefficient = rates.periodCoefficients[input.periodMonths] || 1;
    const wholeCoefficients = { people: { row: pickRange(rates.rangeTables.people, input.totalEmployeeCount) }, elderly: { row: pickByDisplay(rates.rangeTables.elderlyRatio, input.elderlyBand) }, loss: { row: pickByDisplay(rates.rangeTables.lossRatio, input.lossBand) } };
    wholeCoefficients.people.value = coefficientRange(wholeCoefficients.people.row); wholeCoefficients.elderly.value = coefficientRange(wholeCoefficients.elderly.row); wholeCoefficients.loss.value = coefficientRange(wholeCoefficients.loss.row);
    const schemeResults = input.schemes.map((scheme) => calculateScheme(scheme, rates, periodCoefficient, wholeCoefficients));
    const total = schemeResults.reduce((acc, item) => ({ mainPremium: addRange(acc.mainPremium, item.parts.mainPremium), disabilityAddon: addRange(acc.disabilityAddon, item.addons.disabilityAddon), highAltitudeAddon: addRange(acc.highAltitudeAddon, item.addons.highAltitudeAddon), commuteAddon: addRange(acc.commuteAddon, item.addons.commuteAddon), suddenDeathAddon: addRange(acc.suddenDeathAddon, item.addons.suddenDeathAddon), lostWorkAddon: addRange(acc.lostWorkAddon, item.addons.lostWorkAddon), totalAddonPremium: addRange(acc.totalAddonPremium, item.parts.totalAddonPremium), totalPremium: addRange(acc.totalPremium, item.parts.totalPremium) }), { mainPremium: range(0, 0), disabilityAddon: range(0, 0), highAltitudeAddon: range(0, 0), commuteAddon: range(0, 0), suddenDeathAddon: range(0, 0), lostWorkAddon: range(0, 0), totalAddonPremium: range(0, 0), totalPremium: range(0, 0) });
    const policyFlags = buildPolicyFlags(input, wholeCoefficients);
    const schemeFlags = schemeResults.flatMap((item) => item.reviewFlags.map((flag) => `${item.scheme.schemeName}\uff1a${flag}`));
    return { input, periodCoefficient, wholeCoefficients, schemeResults, parts: { mainPremium: total.mainPremium, totalAddonPremium: total.totalAddonPremium, totalPremium: total.totalPremium }, addons: { disabilityAddon: total.disabilityAddon, highAltitudeAddon: total.highAltitudeAddon, commuteAddon: total.commuteAddon, suddenDeathAddon: total.suddenDeathAddon, lostWorkAddon: total.lostWorkAddon }, reviewFlags: [...policyFlags, ...schemeFlags], generatedAt: new Date().toLocaleString("zh-CN", { hour12: false }) };
  }
  root.QUOTE_CALCULATOR = { calculateQuote, normalizeInput, pickRange };
  if (typeof module !== "undefined") module.exports = root.QUOTE_CALCULATOR;
})(typeof window !== "undefined" ? window : globalThis);