(function () {
  const C = {
    schemeNames: ["\u65b9\u6848\u4e00", "\u65b9\u6848\u4e8c", "\u65b9\u6848\u4e09", "\u65b9\u6848\u56db", "\u65b9\u6848\u4e94", "\u65b9\u6848\u516d", "\u65b9\u6848\u4e03", "\u65b9\u6848\u516b"],
    company: "\u5c71\u4e1c\u67d0\u5236\u9020\u6709\u9650\u516c\u53f8",
    business: "\u8bbe\u5907\u5b89\u88c5\u4e0e\u7ef4\u4fee",
    class3: "\u4e09\u7c7b\u804c\u4e1a",
    class5: "\u4e94\u7c7b\u804c\u4e1a",
    elevator: "\u7535\u68af\u5b89\u88c5\u7ef4\u4fee",
    age65: "65\u5468\u5c81\u53ca\u4ee5\u4e0a",
    truck: "\u8d27\u8f66\u53f8\u673a",
    noReview: "\u6682\u65e0\u5f3a\u5236\u590d\u6838\u63d0\u793a",
  };
  const form = document.querySelector("#quoteForm");
  const schemesContainer = document.querySelector("#schemesContainer");
  const totalEmployeeInput = document.querySelector("#totalEmployeeCount");
  const totalPremium = document.querySelector("#totalPremium");
  const mobileTotalPremium = document.querySelector("#mobileTotalPremium");
  const reviewStatus = document.querySelector("#reviewStatus");
  const premiumList = document.querySelector("#premiumList");
  const schemeResultList = document.querySelector("#schemeResultList");
  const reviewList = document.querySelector("#reviewList");
  const factorList = document.querySelector("#factorList");
  const resultPanel = document.querySelector(".result-panel");
  const periodRateNote = document.querySelector("#periodRateNote");

  function formatMoney(value) { return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 2 }).format(value); }
  function formatRange(item) { return item.min === item.max ? formatMoney(item.max) : `${formatMoney(item.min)} - ${formatMoney(item.max)}`; }
  function formatPerPersonRange(total, count) { const people = Number(count) || 0; return people > 0 ? formatRange({ min: total.min / people, max: total.max / people }) : "\u672a\u586b\u5199\u4eba\u6570"; }
  function formatCoeff(item) { return item.min === item.max ? String(item.max) : `${item.min} - ${item.max}`; }
  function formatPercent(value) { return `${Math.round(value * 100)}%`; }
  function options(values, selected) { return values.map((value) => `<option value="${value}"${value === selected ? " selected" : ""}>${value}</option>`).join(""); }
  function datalistOptions(values) { return values.map((value) => `<option value="${value}"></option>`).join(""); }
  function addOptions(name, values) { const select = form.elements[name]; values.forEach((value) => { const option = document.createElement("option"); option.value = String(value); option.textContent = String(value); select.appendChild(option); }); }
  function updatePeriodRateNote() { const months = form.elements.periodMonths.value || "12"; const coefficient = window.RATE_DATA.periodCoefficients[months] || 1; periodRateNote.textContent = `\u5f53\u524d\u9009\u62e9\uff1a${months}\u4e2a\u6708\uff0c\u6309\u5e74\u5316\u4fdd\u8d39\u7684${formatPercent(coefficient)}\u8ba1\u6536\u3002`; }

  function addonItem(title, field, checked, body = "") {
    return `<div class="addon-item"><label class="switch-row addon-name"><span>${title}</span><input data-field="${field}" type="checkbox" ${checked ? "checked" : ""} /></label><div class="addon-body">${body || `<span class="addon-empty">\u65e0\u9700\u989d\u5916\u5f55\u5165</span>`}</div></div>`;
  }

  function schemeTemplate(index, data = {}) {
    const rate = window.RATE_DATA;
    const name = data.schemeName || C.schemeNames[index] || `\u65b9\u6848${index + 1}`;
    const occupation = data.occupation || "";
    const commuteBody = `<label><span>\u4e0a\u4e0b\u73ed\u9014\u4e2d\u9650\u989d\u6bd4\u4f8b</span><select data-field="commuteLimitRatio">${options(Object.keys(rate.commuteLimitCoefficients), data.commuteLimitRatio || "100%")}</select></label>`;
    const suddenDeathBody = `<div class="field-grid"><label><span>\u731d\u6b7b\u8d23\u4efb\u9650\u989d\uff08\u5143\uff09</span><input data-field="suddenDeathLimit" type="number" min="0" step="10000" value="${data.suddenDeathLimit ?? 100000}" /></label><label><span>\u731d\u6b7b\u5e74\u9f84\u6bb5</span><select data-field="suddenDeathAgeBand">${options(Object.keys(rate.suddenDeathAgeCoefficients), data.suddenDeathAgeBand || Object.keys(rate.suddenDeathAgeCoefficients)[0])}</select></label></div><label><span>\u731d\u6b7b\u5c97\u4f4d</span><select data-field="suddenDeathJob">${options(Object.keys(rate.suddenDeathJobCoefficients), data.suddenDeathJob || Object.keys(rate.suddenDeathJobCoefficients)[2])}</select></label>`;
    return `<article class="scheme-card" data-scheme-index="${index}"><div class="scheme-card-header"><label><span>\u65b9\u6848\u540d\u79f0</span><input data-field="schemeName" list="schemeNameOptions-${index}" value="${name}" /><datalist id="schemeNameOptions-${index}">${datalistOptions(C.schemeNames)}</datalist></label><label><span>\u804c\u4e1a</span><input data-field="occupation" type="text" value="${occupation}" placeholder="\u4f8b\u5982\uff1a\u710a\u5de5\u3001\u53f8\u673a\u3001\u5b89\u88c5\u5de5" /></label><button class="ghost-button remove-scheme-button" type="button">\u5220\u9664</button></div><div class="scheme-subsection"><h3>\u4e3b\u9669\u8d23\u4efb</h3><div class="field-grid"><label><span>\u88ab\u4fdd\u9669\u4eba\u6570</span><input data-field="employeeCount" type="number" min="0" step="1" value="${data.employeeCount ?? 100}" /></label><label><span>\u804c\u4e1a\u7c7b\u522b</span><select data-field="occupationClass">${options(Object.keys(rate.occupationRates), data.occupationClass || Object.keys(rate.occupationRates)[2])}</select></label></div><div class="field-grid"><label><span>\u9ad8\u5371\u5c97\u4f4d</span><select data-field="highRiskJob">${options(Object.keys(rate.highRiskJobs), data.highRiskJob || Object.keys(rate.highRiskJobs)[0])}</select></label><label><span>\u533b\u7597\u514d\u8d54</span><select data-field="medicalDeductible">${options(Object.keys(rate.deductibleCoefficients), data.medicalDeductible || Object.keys(rate.deductibleCoefficients)[2])}</select></label></div><div class="field-grid"><label><span>\u6bcf\u4eba\u6b7b\u4ea1\u4f24\u6b8b\u9650\u989d\uff08\u5143\uff09</span><input data-field="deathDisabilityLimit" type="number" min="0" step="10000" value="${data.deathDisabilityLimit ?? 500000}" /></label><label><span>\u6bcf\u4eba\u533b\u7597\u9650\u989d\uff08\u5143\uff09</span><input data-field="medicalLimit" type="number" min="0" step="1000" value="${data.medicalLimit ?? 10000}" /></label></div><label><span>\u8bef\u5de5\u8d39\u7528\u6807\u51c6</span><select data-field="lostWorkStandard">${options(Object.keys(rate.lostWorkAdjustmentCoefficients), data.lostWorkStandard || Object.keys(rate.lostWorkAdjustmentCoefficients)[0])}</select></label></div><div class="scheme-subsection addon-section"><h3>\u9644\u52a0\u9669\u8d23\u4efb</h3><div class="addon-grid">${addonItem("\u9644\u52a0\u4f24\u6b8b\u8d54\u507f\u6bd4\u4f8b\u8c03\u6574\u4fdd\u9669", "addonDisability", data.addonDisability)}${addonItem("\u9644\u52a0\u6269\u5c55\u9ad8\u5904\u4f5c\u4e1a\u4fdd\u9669", "addonHighAltitude", data.addonHighAltitude)}${addonItem("\u9644\u52a0\u4e0a\u4e0b\u73ed\u9014\u4e2d\u4ea4\u901a\u4e8b\u6545\u8d23\u4efb\u4fdd\u9669", "addonCommute", data.addonCommute, commuteBody)}${addonItem("\u9644\u52a0\u731d\u6b7b\u8d23\u4efb\u4fdd\u9669", "addonSuddenDeath", data.addonSuddenDeath, suddenDeathBody)}${addonItem("\u9644\u52a0\u8bef\u5de5\u8d39\u7528\u8c03\u6574\u4fdd\u9669", "addonLostWork", data.addonLostWork || (data.lostWorkStandard && data.lostWorkStandard !== Object.keys(rate.lostWorkAdjustmentCoefficients)[0]))}</div></div></article>`;
  }

  function addScheme(data) { schemesContainer.insertAdjacentHTML("beforeend", schemeTemplate(schemesContainer.children.length, data)); updateRemoveButtons(); renderQuote(); }
  function updateRemoveButtons() { schemesContainer.querySelectorAll(".remove-scheme-button").forEach((button) => { button.disabled = schemesContainer.children.length <= 1; }); }
  function getSchemes() { return [...schemesContainer.querySelectorAll(".scheme-card")].map((card) => { const item = {}; card.querySelectorAll("[data-field]").forEach((el) => { item[el.dataset.field] = el.type === "checkbox" ? el.checked : el.value; }); return item; }); }
  function syncLostWorkAddon(target) { if (!target || target.dataset.field !== "lostWorkStandard") return; const standard = Object.keys(window.RATE_DATA.lostWorkAdjustmentCoefficients)[0]; const card = target.closest(".scheme-card"); const addon = card?.querySelector('[data-field="addonLostWork"]'); if (addon) addon.checked = target.value !== standard; }
  function totalEmployees(schemes) { return schemes.reduce((sum, scheme) => sum + (Number(scheme.employeeCount) || 0), 0); }
  function getFormInput() { const data = new FormData(form); const schemes = getSchemes(); return { companyName: data.get("companyName"), business: data.get("business"), periodMonths: data.get("periodMonths"), elderlyBand: data.get("elderlyBand"), lossBand: data.get("lossBand"), schemes }; }
  function renderDl(target, rows) { target.innerHTML = rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join(""); }
  function renderFactorRows(rows) { return rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join(""); }
  function schemeFactorRows(item) {
    const rows = [];
    const rate = window.RATE_DATA;
    rows.push(["\u6b7b\u4ea1\u4f24\u6b8b\u57fa\u51c6\u8d39\u7387", `${(item.coefficients.occupationRate * 1000).toFixed(2)}\u2030`]);
    rows.push(["\u533b\u7597\u57fa\u51c6\u4fdd\u8d39", `${item.coefficients.medicalBasePremium}\u5143`]);
    rows.push(["\u6bcf\u4eba\u533b\u7597\u8d39\u7528\u9650\u989d\u7cfb\u6570", `${formatCoeff(item.coefficients.medicalLimit)}\uff08${item.coefficients.medicalLimit.display}\uff09`]);
    rows.push(["\u6bcf\u6b21\u4e8b\u6545\u533b\u7597\u8d39\u7528\u514d\u8d54\u7cfb\u6570", item.coefficients.deductible.toFixed(2)]);
    rows.push(["\u9ad8\u5371\u5c97\u4f4d\u7cfb\u6570", item.coefficients.highRisk.toFixed(2)]);
    if (item.scheme.addonDisability) rows.push(["\u9644\u52a0\u4f24\u6b8b\u8d54\u507f\u6bd4\u4f8b\u8c03\u6574\u57fa\u51c6\u8d39\u7387", "30%"]);
    if (item.scheme.addonHighAltitude) rows.push(["\u9644\u52a0\u6269\u5c55\u9ad8\u5904\u4f5c\u4e1a\u57fa\u51c6\u8d39\u7387", "20%"]);
    if (item.scheme.addonCommute) {
      rows.push(["\u9644\u52a0\u4e0a\u4e0b\u73ed\u9014\u4e2d\u4ea4\u901a\u4e8b\u6545\u57fa\u51c6\u8d39\u7387", "10%"]);
      rows.push(["\u4e0a\u4e0b\u73ed\u9014\u4e2d\u9650\u989d\u6bd4\u4f8b\u7cfb\u6570", (rate.commuteLimitCoefficients[item.scheme.commuteLimitRatio] || 1).toFixed(2)]);
    }
    if (item.scheme.addonSuddenDeath) {
      const age = rate.suddenDeathAgeCoefficients[item.scheme.suddenDeathAgeBand] || rate.suddenDeathAgeCoefficients[Object.keys(rate.suddenDeathAgeCoefficients)[0]];
      rows.push(["\u9644\u52a0\u731d\u6b7b\u8d23\u4efb\u57fa\u51c6\u8d39\u7387", "0.014%"]);
      rows.push(["\u731d\u6b7b\u5e74\u9f84\u7cfb\u6570", `${age.minValue} - ${age.maxValue}\uff08${age.display}\uff09`]);
      rows.push(["\u731d\u6b7b\u5c97\u4f4d\u7cfb\u6570", (rate.suddenDeathJobCoefficients[item.scheme.suddenDeathJob] || 1).toFixed(2)]);
    }
    if (item.scheme.addonLostWork) {
      rows.push(["\u9644\u52a0\u8bef\u5de5\u8d39\u7528\u8c03\u6574\u57fa\u51c6\u8d39\u7387", "10%"]);
      rows.push(["\u8bef\u5de5\u8d39\u7528\u6807\u51c6\u8c03\u6574\u7cfb\u6570", (rate.lostWorkAdjustmentCoefficients[item.scheme.lostWorkStandard] || 0).toFixed(2)]);
    }
    return rows;
  }
  function renderFactorGroups(target, quote) {
    const wholeRows = [
      ["\u4fdd\u9669\u671f\u95f4\u7cfb\u6570", quote.periodCoefficient.toFixed(2)],
      ["\u6295\u4fdd\u4eba\u6570\u7cfb\u6570", `${formatCoeff(quote.wholeCoefficients.people.value)}\uff08${quote.wholeCoefficients.people.value.display}\uff09`],
      ["\u9ad8\u9f84\u5360\u6bd4\u7cfb\u6570", `${formatCoeff(quote.wholeCoefficients.elderly.value)}\uff08${quote.wholeCoefficients.elderly.value.display}\uff09`],
      ["\u5386\u53f2\u8d54\u4ed8\u7cfb\u6570", `${formatCoeff(quote.wholeCoefficients.loss.value)}\uff08${quote.wholeCoefficients.loss.value.display}\uff09`],
    ];
    const groups = [`<section class="factor-group factor-group-whole"><h3>\u6574\u5355\u7cfb\u6570</h3><dl>${renderFactorRows(wholeRows)}</dl></section>`];
    quote.schemeResults.forEach((item) => {
      groups.push(`<section class="factor-group"><h3>${item.scheme.schemeName}</h3><dl>${renderFactorRows(schemeFactorRows(item))}</dl></section>`);
    });
    target.innerHTML = groups.join("");
  }  function renderQuote() { updatePeriodRateNote(); const input = getFormInput(); totalEmployeeInput.value = totalEmployees(input.schemes); const quote = window.QUOTE_CALCULATOR.calculateQuote(input, window.RATE_DATA); totalPremium.textContent = formatRange(quote.parts.totalPremium); mobileTotalPremium.textContent = formatRange(quote.parts.totalPremium); const needsReview = quote.reviewFlags.length > 0; reviewStatus.textContent = needsReview ? "\u9700\u4eba\u5de5\u590d\u6838" : "\u53ef\u521d\u6b65\u62a5\u4ef7"; reviewStatus.classList.toggle("warning", needsReview); const premiumRows = [["\u4e3b\u9669\u603b\u4fdd\u8d39", formatRange(quote.parts.mainPremium)]]; if (quote.addons.disabilityAddon.max > 0) premiumRows.push(["\u4f24\u6b8b\u8d54\u507f\u6bd4\u4f8b\u8c03\u6574", formatRange(quote.addons.disabilityAddon)]); if (quote.addons.highAltitudeAddon.max > 0) premiumRows.push(["\u6269\u5c55\u9ad8\u5904\u4f5c\u4e1a", formatRange(quote.addons.highAltitudeAddon)]); if (quote.addons.commuteAddon.max > 0) premiumRows.push(["\u4e0a\u4e0b\u73ed\u9014\u4e2d\u4ea4\u901a\u4e8b\u6545", formatRange(quote.addons.commuteAddon)]); if (quote.addons.suddenDeathAddon.max > 0) premiumRows.push(["\u731d\u6b7b\u8d23\u4efb", formatRange(quote.addons.suddenDeathAddon)]); if (quote.addons.lostWorkAddon.max > 0) premiumRows.push(["\u8bef\u5de5\u8d39\u7528\u8c03\u6574", formatRange(quote.addons.lostWorkAddon)]); renderDl(premiumList, premiumRows); schemeResultList.innerHTML = quote.schemeResults.map((item) => `<div class="scheme-result-item"><strong>${item.scheme.schemeName}</strong><span>${item.scheme.employeeCount}\u4eba / ${item.scheme.occupation ? `${item.scheme.occupation} / ` : ""}${item.scheme.occupationClass}</span><span class="scheme-per-person">\u6bcf\u4eba\u4fdd\u8d39\uff1a${formatPerPersonRange(item.parts.totalPremium, item.scheme.employeeCount)}</span><b>${formatRange(item.parts.totalPremium)}</b></div>`).join(""); reviewList.innerHTML = quote.reviewFlags.length ? quote.reviewFlags.map((flag) => `<li>${flag}</li>`).join("") : `<li>${C.noReview}</li>`; renderFactorGroups(factorList, quote); }
  function initOptions() { addOptions("periodMonths", Object.keys(window.RATE_DATA.periodCoefficients)); form.elements.periodMonths.value = "12"; addOptions("elderlyBand", window.RATE_DATA.rangeTables.elderlyRatio.map((row) => row.display)); addOptions("lossBand", window.RATE_DATA.rangeTables.lossRatio.map((row) => row.display)); }
  function loadSample() { form.elements.companyName.value = C.company; form.elements.business.value = C.business; form.elements.periodMonths.value = 12; form.elements.elderlyBand.value = window.RATE_DATA.rangeTables.elderlyRatio[1].display; form.elements.lossBand.value = window.RATE_DATA.rangeTables.lossRatio[0].display; schemesContainer.innerHTML = ""; addScheme({ schemeName: C.schemeNames[0], occupation: "\u7535\u68af\u5b89\u88c5\u5de5", employeeCount: 8, occupationClass: C.class5, highRiskJob: C.elevator, deathDisabilityLimit: 800000, medicalLimit: 50000, addonHighAltitude: true }); addScheme({ schemeName: C.schemeNames[1], occupation: "\u8d27\u8f66\u53f8\u673a", employeeCount: 60, occupationClass: C.class3, deathDisabilityLimit: 500000, medicalLimit: 20000, addonSuddenDeath: true, suddenDeathLimit: 100000, suddenDeathAgeBand: C.age65, suddenDeathJob: C.truck }); renderQuote(); }

  document.querySelectorAll(".section-toggle").forEach((button) => button.addEventListener("click", () => { const section = button.closest(".form-section"); const collapsed = section.classList.toggle("collapsed"); button.setAttribute("aria-expanded", String(!collapsed)); }));
  schemesContainer.addEventListener("input", renderQuote);
  schemesContainer.addEventListener("change", (event) => { syncLostWorkAddon(event.target); renderQuote(); });
  schemesContainer.addEventListener("click", (event) => { if (event.target.closest(".remove-scheme-button")) { event.target.closest(".scheme-card").remove(); updateRemoveButtons(); renderQuote(); } });
  initOptions();
  addScheme({ schemeName: C.schemeNames[0] });
  form.addEventListener("input", renderQuote);
  form.addEventListener("change", renderQuote);
  document.querySelector("#addSchemeButton").addEventListener("click", () => addScheme({ schemeName: C.schemeNames[schemesContainer.children.length] }));
  document.querySelector("#loadSampleButton").addEventListener("click", loadSample);
  document.querySelector("#printButton").addEventListener("click", () => window.print());
  document.querySelector("#scrollResultButton").addEventListener("click", () => resultPanel.scrollIntoView({ behavior: "smooth", block: "start" }));
  renderQuote();
})();
