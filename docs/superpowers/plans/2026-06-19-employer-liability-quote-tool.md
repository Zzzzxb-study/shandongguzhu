# Employer Liability Quote Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the simplest usable quotation tool for the Shandong non-Qingdao employer liability insurance product from the local clauses and rate tables.

**Architecture:** Use one Excel workbook as the first version. Keep rate data in editable tables, keep customer inputs on one sheet, calculate the premium on one protected calculation sheet, and show the business-facing result plus review flags on one quote sheet.

**Tech Stack:** Microsoft Excel formulas first; optional Python only to generate the initial workbook from the local `.docx` rate tables.

---

## Product Scope

This plan covers the files already in `E:\Work\shandongguzhu`:

- Main product: `长江财产保险股份有限公司山东省（不含青岛地区）雇主责任保险（2026）条款.docx`
- Main rate table: `长江财产保险股份有限公司山东省（不含青岛地区）雇主责任保险（2026）费率表.docx`
- Add-on: commuting traffic accident liability
- Add-on: disability compensation ratio adjustment
- Add-on: high-altitude work extension
- Add-on: sudden death liability
- Add-on: lost-work expense adjustment

The first version should not include account login, customer database, policy issuance, approval workflow, or external system integration.

## Simplest User Flow

1. Open Excel workbook.
2. Fill in one row of quote inputs.
3. Select occupation class and optional high-risk job.
4. Enter number of insured employees, death/disability limit, medical limit, lost-work setting, period, elderly ratio, historical loss ratio, and add-ons.
5. Read the calculated quote: main premium, add-on premiums, total premium, and manual-review flags.

## Workbook Structure

Create: `E:\Work\shandongguzhu\山东雇主责任险报价工具.xlsx`

Sheets:

- `输入`: all fields the salesperson or underwriter fills in.
- `费率表`: editable source rates and coefficient ranges copied from the official rate tables.
- `计算`: protected formula sheet; can be hidden after validation.
- `报价单`: final customer-facing and internal-review output.
- `说明`: short rule notes, data source, version date, and boundaries.

## Minimum Input Fields

Sheet `输入` should contain these fields only:

- 投保单位名称
- 行业/主营业务
- 职业类别: 一类职业、二类职业、三类职业、四类职业、五类职业、六类职业
- 高危岗位: 无、搬运装卸、玻璃陶瓷搪瓷、船舶制造维修、打磨抛光、电梯安装维修、电线架设、钢骨结构/工业安装、道路清洁、井下作业、木制品加工、采伐及木材初加工、骑手、石材生产加工、筑路、砖瓦、肉制品加工、营业货车驾驶员、近海养殖、渔业捕捞
- 投保人数
- 每人死亡伤残责任限额
- 每人医疗费用责任限额
- 每次事故医疗费用免赔: 0、200元、200元后90%赔付、200元后85%赔付、200元后80%赔付、200元后70%赔付
- 误工费用标准: 基础、100元/天、150元/天、200元/天、300元/天
- 高龄人员占比
- 历史赔付率
- 保险期间: 1-12个月
- 是否附加伤残赔偿比例调整
- 是否附加扩展高处作业
- 高处作业人数
- 是否附加上下班途中交通事故
- 上下班途中限额比例: 100%、50%、20%
- 是否附加猝死责任
- 猝死责任限额
- 猝死年龄段: 小于50、50至65、65及以上
- 猝死岗位: 保安/保洁/道路清洁、货车司机、其他

## Rating Logic

### Main Premium

Formula:

`每人主险保费 = (每人死亡伤残责任限额 * 死亡伤残基准费率 + 医疗费用基准保费 * 医疗限额系数 * 医疗免赔系数 + 误工费用基准保费) * 高危岗位系数 * 投保人数系数 * 高龄人员占比系数 * 历史赔付系数 * 保险期间系数`

`主险总保费 = 每人主险保费 * 投保人数`

Known fixed rates from the main rate table:

- 死亡伤残基准费率: 一类 0.28‰, 二类 0.38‰, 三类 0.57‰, 四类 0.94‰, 五类 1.36‰, 六类 1.79‰
- 医疗费用基准保费: 一类 58, 二类 62, 三类 74, 四类 85, 五类 107, 六类 135
- 误工费用基准保费: 5元

For coefficient ranges, version 1 should use a conservative default:

- If a table gives a range, use the upper bound for automatic quotation.
- Show the range on `报价单` so an underwriter can manually reduce it when justified.
- Flag every range-based coefficient as `可人工调整`.

### Add-On Premiums

Disability compensation ratio adjustment:

`保费 = 主险总保费 * 30%`

High-altitude work extension:

`保费 = 高处作业人员对应主险每人保费合计 * 20%`

Commuting traffic accident:

`保费 = 主险总保费 * 10% * 上下班途中限额比例系数`

Limit ratio coefficients:

- 100%: 1.00
- 50%: 0.75
- 20%: 0.50

Sudden death liability:

`保费 = 猝死责任限额 * 0.014% * 年龄系数 * 岗位系数 * 投保人数`

Use the upper bound for age ranges:

- 小于50: 2.00
- 50至65: 4.00
- 65及以上: 7.00

岗位系数:

- 保安/保洁/道路清洁: 1.40
- 货车司机: 1.20
- 其他: 1.00

Lost-work expense adjustment:

`保费 = 主险总保费 * 10% * 误工费用调整系数`

Adjustment coefficients:

- 100元/天: 1.00
- 150元/天: 1.10
- 200元/天: 1.20
- 300元/天: 1.35

## Review Flags

Sheet `报价单` should show `需人工复核` if any condition is true:

- 职业类别为五类或六类
- 高危岗位不是无
- 投保人数小于或等于10
- 高龄人员占比大于或等于20%
- 历史赔付率大于或等于70%
- 每人医疗费用责任限额大于或等于10万元
- 选择附加扩展高处作业
- 选择附加猝死责任且年龄段为65及以上
- 高处作业人数大于投保人数
- 保险期间小于12个月但客户要求年度口径报价

## Files

- Create: `E:\Work\shandongguzhu\山东雇主责任险报价工具.xlsx`
- Create: `E:\Work\shandongguzhu\docs\superpowers\plans\2026-06-19-employer-liability-quote-tool.md`
- Optional create: `E:\Work\shandongguzhu\tools\build_quote_workbook.py`

## Task 1: Confirm The Minimum Rating Model

- [ ] **Step 1: Reconcile input fields against the rate tables**

Open all six local `费率表.docx` files and confirm that every required rating factor is present in the `Minimum Input Fields` section.

Expected result:

- No new field is added unless a formula cannot run without it.
- Any missing clause-only condition is recorded in `说明`, not added to the quote input form.

- [ ] **Step 2: Decide coefficient default policy**

Use this rule for version 1:

`区间系数自动取上限，报价单展示原始区间，并提示可人工调整。`

Expected result:

- Tool is simple enough for immediate use.
- Quote is conservative by default.
- Underwriter can still override outside the tool if required.

## Task 2: Build The Workbook Skeleton

- [ ] **Step 1: Create workbook sheets**

Create `山东雇主责任险报价工具.xlsx` with these sheets:

- `输入`
- `费率表`
- `计算`
- `报价单`
- `说明`

- [ ] **Step 2: Add input controls**

On `输入`, use dropdowns for:

- 职业类别
- 高危岗位
- 每次事故医疗费用免赔
- 保险期间
- 附加险 yes/no fields
- 上下班途中限额比例
- 猝死年龄段
- 猝死岗位

Expected result:

- A user can complete one quote without typing rate names manually.

## Task 3: Enter Rate Tables

- [ ] **Step 1: Add fixed base rates**

On `费率表`, create tables for:

- 死亡伤残基准费率
- 医疗费用基准保费
- 误工费用基准保费
- 医疗免赔系数
- 高危岗位系数
- 保险期间系数
- 附加险固定费率

- [ ] **Step 2: Add range coefficient tables**

On `费率表`, create tables for:

- 医疗费用限额系数
- 投保人数系数
- 高龄人员占比系数
- 历史赔付系数
- 猝死年龄系数

Each range row must include:

- 起始值
- 结束值
- 展示区间
- 自动报价系数
- 是否区间系数

Expected result:

- The workbook can calculate with one numeric coefficient while still showing the official range.

## Task 4: Implement Calculation Sheet

- [ ] **Step 1: Calculate main premium**

On `计算`, add formulas for:

- 死亡伤残保费
- 医疗费用保费
- 误工费用保费
- 主险每人保费
- 主险总保费

Expected result:

- Changing occupation class, limits,人数, period, or coefficients changes the main premium.

- [ ] **Step 2: Calculate add-on premiums**

On `计算`, add formulas for:

- 附加伤残赔偿比例调整保费
- 附加扩展高处作业保费
- 附加上下班途中交通事故保费
- 附加猝死责任保费
- 附加误工费用调整保费
- 总保费

Expected result:

- Unselected add-ons return zero.
- Selected add-ons are visible as separate premium lines.

## Task 5: Build Quote Output

- [ ] **Step 1: Create business-facing quote summary**

On `报价单`, show:

- 投保单位名称
- 方案摘要
- 主险保费
- 附加险分项保费
- 总保费
- 保险期间
- 关键责任限额

- [ ] **Step 2: Create internal review summary**

On `报价单`, show:

- 报价使用的区间系数
- 人工复核原因
- 数据来源版本: `山东省（不含青岛地区）雇主责任保险（2026）`
- 生成日期

Expected result:

- Sales can copy the quote summary.
- Underwriting can see why the result needs review.

## Task 6: Validate With Three Sample Quotes

- [ ] **Step 1: Low-risk sample**

Input:

- 职业类别: 一类职业
- 投保人数: 100
- 每人死亡伤残责任限额: 500000
- 每人医疗费用责任限额: 10000
- 保险期间: 12个月
- No add-ons

Expected result:

- Tool returns main premium only.
- Review flag should be empty unless a range coefficient is being manually reviewed.

- [ ] **Step 2: Small high-risk sample**

Input:

- 职业类别: 五类职业
- 高危岗位: 电梯安装维修
- 投保人数: 8
- 每人死亡伤残责任限额: 800000
- 每人医疗费用责任限额: 50000
- 保险期间: 12个月
- Add high-altitude work extension

Expected result:

- Tool returns main premium plus high-altitude add-on.
- Review flag includes 五类职业, 高危岗位, 投保人数小于或等于10, and 扩展高处作业.

- [ ] **Step 3: Sudden-death add-on sample**

Input:

- 职业类别: 三类职业
- 投保人数: 60
- 每人死亡伤残责任限额: 500000
- 每人医疗费用责任限额: 20000
- Add sudden death liability
- 猝死责任限额: 100000
- 猝死年龄段: 65及以上
- 猝死岗位: 货车司机

Expected result:

- Tool returns main premium plus sudden-death add-on.
- Review flag includes 猝死责任65及以上.

## Task 7: Keep The Tool Simple

- [ ] **Step 1: Protect calculation cells**

Protect `计算`, but do not password-lock the workbook.

Expected result:

- Accidental formula edits are reduced.
- Business users can still inspect and maintain the workbook.

- [ ] **Step 2: Add one-page notes**

On `说明`, write:

`本工具仅用于山东省不含青岛地区雇主责任保险（2026）初步报价。区间系数默认取上限。涉及五六类职业、高危岗位、高龄人员占比较高、历史赔付率较高、扩展高处作业、65周岁及以上猝死责任等情形，应提交人工复核。最终报价以核保确认和公司有效条款费率为准。`

Expected result:

- Tool boundary is clear.
- Users are not encouraged to treat the workbook as an automatic approval system.

## Recommended First Version

Build only `山东雇主责任险报价工具.xlsx`.

Do not build a web app unless:

- Multiple people need simultaneous access.
- Quote history must be stored centrally.
- Branches need permissions or audit logs.
- Rates must be updated by an administrator without sending a new file.

For the current request, Excel is the lowest-friction option and matches the product's rate-table structure.
