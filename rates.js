(function (root) {
  const occupationRates = {
    "一类职业": { deathDisabilityRate: 0.00028, medicalBasePremium: 58 },
    "二类职业": { deathDisabilityRate: 0.00038, medicalBasePremium: 62 },
    "三类职业": { deathDisabilityRate: 0.00057, medicalBasePremium: 74 },
    "四类职业": { deathDisabilityRate: 0.00094, medicalBasePremium: 85 },
    "五类职业": { deathDisabilityRate: 0.00136, medicalBasePremium: 107 },
    "六类职业": { deathDisabilityRate: 0.00179, medicalBasePremium: 135 },
  };
  const highRiskJobs = { "无": 1, "搬运、装卸工": 1.17, "玻璃、陶瓷、搪瓷制造加工": 1.25, "船舶制造维修": 1.51, "打磨抛光": 1.3, "电梯安装维修": 1.22, "电线架设": 1.3, "钢骨结构工人、工业安装": 1.3, "道路清洁工": 1.25, "井下作业人员": 1.95, "木制品生产加工": 1.35, "采伐及木材初加工": 1.4, "网约配送员(骑手)": 1.25, "石材生产加工": 1.25, "筑路": 1.3, "砖瓦": 1.45, "肉制品加工": 1.25, "营业货车驾驶员": 1.2, "近海养殖": 1.7, "渔业捕捞": 2.55 };
  const deductibleCoefficients = { "0": 1.15, "200元": 1.1, "200元后90%赔付": 1, "200元后85%赔付": 0.95, "200元后80%赔付": 0.9, "200元后70%赔付": 0.8 };
  const periodCoefficients = { 1: 0.1, 2: 0.2, 3: 0.3, 4: 0.4, 5: 0.5, 6: 0.6, 7: 0.7, 8: 0.8, 9: 0.85, 10: 0.9, 11: 0.95, 12: 1 };
  const commuteLimitCoefficients = { "100%": 1, "50%": 0.75, "20%": 0.5 };
  const suddenDeathAgeCoefficients = { "小于50周岁": { minValue: 1, maxValue: 2, display: "[1.00,2.00)" }, "50-65周岁": { minValue: 2, maxValue: 4, display: "[2.00,4.00)" }, "65周岁及以上": { minValue: 4, maxValue: 7, display: "[4.00,7.00]" } };
  const suddenDeathJobCoefficients = { "保安、保洁、道路清洁": 1.4, "货车司机": 1.2, "其他": 1 };
  const lostWorkAdjustmentCoefficients = { "基础（公司标准）": 0, "100元/天": 1, "150元/天": 1.1, "200元/天": 1.2, "300元/天": 1.35 };
  const rangeTables = {
    medicalLimit: [{ min: -Infinity, max: 5000, display: "每人医疗费用责任限额＜0.5万元", minValue: 0.8, maxValue: 0.9 }, { min: 5000, max: 10000, display: "0.5万元≤限额＜1万元", minValue: 0.9, maxValue: 1 }, { min: 10000, max: 20000, display: "1万元≤限额＜2万元", minValue: 1, maxValue: 1.35 }, { min: 20000, max: 30000, display: "2万元≤限额＜3万元", minValue: 1.35, maxValue: 1.48 }, { min: 30000, max: 50000, display: "3万元≤限额＜5万元", minValue: 1.48, maxValue: 1.6 }, { min: 50000, max: 80000, display: "5万元≤限额＜8万元", minValue: 1.6, maxValue: 1.78 }, { min: 80000, max: 100000, display: "8万元≤限额＜10万元", minValue: 1.78, maxValue: 1.85 }, { min: 100000, max: Infinity, display: "10万元≤限额", minValue: 1.85, maxValue: 2.6 }],
    people: [{ min: -Infinity, max: 10, display: "投保人数≤10", minValue: 1.25, maxValue: 1.45 }, { min: 10, max: 50, display: "10＜投保人数≤50", minValue: 1.15, maxValue: 1.25 }, { min: 50, max: 100, display: "50＜投保人数≤100", minValue: 1, maxValue: 1.15 }, { min: 100, max: 200, display: "100＜投保人数≤200", minValue: 0.96, maxValue: 1 }, { min: 200, max: 500, display: "200＜投保人数≤500", minValue: 0.92, maxValue: 0.96 }, { min: 500, max: 1000, display: "500＜投保人数≤1000", minValue: 0.88, maxValue: 0.92 }, { min: 1000, max: 3000, display: "1000＜投保人数≤3000", minValue: 0.85, maxValue: 0.88 }, { min: 3000, max: Infinity, display: "3000＜投保人数", minValue: 0.7, maxValue: 0.85 }],
    elderlyRatio: [{ min: -Infinity, max: 5, display: "高龄人员占比＜5%", minValue: 0.9, maxValue: 1 }, { min: 5, max: 20, display: "5%≤高龄人员占比＜20%", minValue: 1, maxValue: 1.15 }, { min: 20, max: 50, display: "20%≤高龄人员占比＜50%", minValue: 1.15, maxValue: 1.35 }, { min: 50, max: Infinity, display: "50%≤高龄人员占比", minValue: 1.35, maxValue: 2 }],
    lossRatio: [{ min: -Infinity, max: 40, display: "累计满期赔付率＜40%", minValue: 0.9, maxValue: 1 }, { min: 40, max: 70, display: "40%≤累计满期赔付率＜70%", minValue: 1, maxValue: 1.2 }, { min: 70, max: 100, display: "70%≤累计满期赔付率＜100%", minValue: 1.2, maxValue: 1.6 }, { min: 100, max: Infinity, display: "100%≤累计满期赔付率", minValue: 1.6, maxValue: 5 }]
  };
  const rateData = { occupationRates, highRiskJobs, deductibleCoefficients, periodCoefficients, commuteLimitCoefficients, suddenDeathAgeCoefficients, suddenDeathJobCoefficients, lostWorkAdjustmentCoefficients, rangeTables, constants: { lostWorkBasePremium: 5, disabilityAddonRate: 0.3, highAltitudeAddonRate: 0.2, commuteAddonRate: 0.1, suddenDeathBaseRate: 0.00014, lostWorkAddonRate: 0.1 } };
  root.RATE_DATA = rateData;
  if (typeof module !== "undefined") module.exports = rateData;
})(typeof window !== "undefined" ? window : globalThis);
