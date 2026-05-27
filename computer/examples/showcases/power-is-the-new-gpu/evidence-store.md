# Evidence Store

## Evidence Confidence Legend

- High: primary source, current, directly relevant, and specific.
- Medium: credible but scenario-based, company-framed, or not fully specific to AI/data centers.
- Low: weak source, indirect inference, or needs verification before use.

## Atomic Evidence Items

| ID | Evidence | Source | Confidence | Caveat |
|---|---|---|---|---|
| E1 | U.S. data center electricity use reached 176 TWh in 2023, representing 4.4% of total U.S. electricity consumption. | DOE/LBNL, `2024 United States Data Center Energy Usage Report`, p. 5-6 and p. 51. URL: https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report.pdf | High | Total data centers, not AI-only. |
| E2 | LBNL presents a 2028 U.S. data-center electricity range of 325-580 TWh, representing 6.7%-12.0% of total U.S. electricity consumption. | DOE/LBNL report, p. 51. | High | Scenario range depends on accelerator shipments, utilization, and cooling assumptions. |
| E3 | LBNL states U.S. data-center electricity demand after 2023 is uncertain because AI hardware and operational practices are changing rapidly. | DOE/LBNL report, executive summary and methodology sections. | High | Supports caveating forecasts. |
| E4 | IEA says there is "no AI without energy" and frames data centers as the main electricity interface between AI and the energy system. | IEA, `Energy and AI`, 2025. URL: https://www.iea.org/reports/energy-and-ai | High | Rhetorical framing, not itself a bottleneck proof. |
| E5 | IEA reports global data centers consumed around 1.5% of global electricity in 2024. | IEA, `Understanding the energy-AI nexus`. URL: https://www.iea.org/reports/energy-and-ai/understanding-the-energy-ai-nexus | High | Global share can look small while regional concentration is severe. |
| E6 | IEA says a conventional data center may be around 10-25 MW, while a hyperscale AI-focused data center can be 100 MW or more; the largest planned/under-construction sites can be much larger. | IEA, `Understanding the energy-AI nexus`. | High | Household-equivalent comparisons are illustrative. |
| E7 | IEA reports that data centers can be highly concentrated; Ireland's data centers consume around 20% of metered supply and Virginia leads U.S. states at around 25% in the IEA dataset. | IEA, `Understanding the energy-AI nexus`. | Medium-high | Uses IEA/Omdia methodology; verify definitions before using as precise jurisdictional statistic. |
| E8 | IEA's high-efficiency and headwinds cases show that efficiency, AI adoption, and bottlenecks can materially change total data-center electricity outcomes. | IEA, `Energy demand from AI`. URL: https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai | High | Scenario framing, not deterministic. |
| E9 | IEA projects natural gas and renewables as major sources of additional U.S. data-center electricity supply to 2030, with nuclear becoming more meaningful after 2030. | IEA, `Energy supply for AI`. URL: https://www.iea.org/reports/energy-and-ai/energy-supply-for-ai | Medium-high | Supply mix is modeled and technology timing remains uncertain. |
| E10 | EIA expects U.S. electricity use to grow 1% in 2026 and 3% in 2027, with data centers/large computing facilities a major driver of the strongest four-year demand growth since 2000. | EIA, January 2026 STEO press release. URL: https://www.eia.gov/pressroom/releases/press582.php | High | Short-term aggregate forecast, not AI-only. |
| E11 | DOE says data-center deployment, partly driven by AI, is a significant factor in near-term electricity demand growth and needs a portfolio approach including generation, storage, grid infrastructure, efficiency, demand resources, tariffs, and interconnection reform. | DOE, `Clean Energy Resources to Meet Data Center Electricity Demand`. URL: https://www.energy.gov/oe/clean-energy-resources-meet-data-center-electricity-demand | High | Policy framing, not a company forecast. |
| E12 | NERC's LTRA methodology is a bottom-up reliability assessment based on industry-submitted forecasts and is not a prediction. | NERC, `2024 Long-Term Reliability Assessment`, p. 3-4. URL: https://www.nerc.com/globalassets/our-work/assessments/2024-ltra_corrected_july_2025.pdf | High | Useful caveat for reliability claims. |
| E13 | FERC initiated PJM-focused action on co-location of large loads such as AI-enabled data centers because PJM tariff clarity, reliability, and consumer-cost allocation were unresolved. | FERC, 2025 co-location order news release. URL: https://ferc.gov/news-events/news/ferc-orders-action-co-location-issues-related-data-centers-running-ai | High | PJM-specific proceeding. |
| E14 | FERC's 2025 State of the Markets says data centers have characteristics unlike traditional loads, including larger size, faster interconnection desire, and potential flexibility. | FERC, `2025 State of the Markets`, p. 8-12. URL: https://www.ferc.gov/sites/default/files/2026-03/26_State-of-the-Market_0324_1430.pdf | High | Some capacity figures rely on third-party data. |
| E15 | FERC staff analysis estimated data centers with more than 50 GW of collective capacity in service at end-2025. | FERC, `2025 State of the Markets`, p. 8. | Medium-high | Definition of "capacity" depends on Yes Energy project database; not actual average electricity use. |
| E16 | AEP Ohio says pre-tariff data-center requests exceeded 30,000 MW, but study requests and binding contracts were much lower after tariff requirements. | AEP Ohio PUCO update, 2026-02-13. URL: https://www.aepohio.com/company/news/view?releaseID=10753 | Medium-high | Company claim; excellent example of request attrition but not national evidence. |
| E17 | AEP Ohio's Data Center Tariff uses load-study fees, collateral, long contract terms, and minimum demand charges for data centers 25 MW and above. | AEP Ohio Data Center Tariff page. URL: https://www.aepohio.com/company/about/rates/data-center-tariff/ | High | Tariff details should be checked against commission order for legal precision. |
| E18 | Microsoft says it operates more than 400 data centers in 70 regions and added more than 2 GW of new capacity in FY2025; it also says data centers depend on permitted/buildable land and predictable energy. | Microsoft 2025 Annual Report. URL: https://www.microsoft.com/investor/reports/ar25/ | High | Company capacity is not actual energy use. |
| E19 | Alphabet says AI technical infrastructure capex increased sharply and operating infrastructure costs including depreciation, energy, equipment, and network capacity are expected to significantly increase. | Alphabet 2025 Form 10-K. URL: https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm | High | Company disclosure; no stock conclusion. |
| E20 | Meta says AI deployment depends on technical and physical infrastructure, including processing hardware, network capacity, computing power, and energy requirements, and that data-center operation includes energy and bandwidth costs. | Meta 2025 Form 10-K. URL: https://www.sec.gov/Archives/edgar/data/1326801/000162828026003942/meta-20251231.htm | High | Company disclosure; not site-level energy data. |
| E21 | Constellation and Microsoft announced a 20-year PPA to support restarting Three Mile Island Unit 1 as Crane Clean Energy Center, adding about 835 MW of carbon-free energy to the grid if completed. | Constellation release, 2024-09-20. URL: https://investors.constellationenergy.com/news-releases/news-release-details/constellation-launch-crane-clean-energy-center-restoring-jobs/ | High for announcement | Requires NRC/state/local approvals and restart execution; not online yet. |
| E22 | Grid Strategies' 2025 report aggregates utility forecasts and estimates 166 GW of five-year nationwide summer peak growth, with about 90 GW linked to data centers, while warning that forecasts may overstate timing/magnitude. | Grid Strategies, `Power Demand Forecasts Revised Up`. URL: https://gridstrategiesllc.com/wp-content/uploads/Grid-Strategies-National-Load-Growth-Report-2025.pdf | Medium | Consulting report; useful for load-forecast uncertainty and overcounting risk. |
| E23 | NextEra investor materials identify data centers and large loads as a major development opportunity, with roughly 10.5 GW serving tech/data-center customers in operating portfolio and backlog as of July 2025. | NextEra Energy investor deck, Sept. 2025. URL: https://www.investor.nexteraenergy.com/~/media/Files/N/NEE-IR/news-and-events/events-and-presentations/2025/2025-09-02%20September%20Investor%20Deck.pdf | Medium | Company investor material; use for ecosystem signal, not recommendation. |
| E24 | Cooling and water are real constraints: LBNL models PUE/WUE, cooling system types, and shows site water use rising with hyperscale/colocation and liquid-cooled systems under some scenarios. | DOE/LBNL report, cooling/water sections. | High | Site-specific water stress varies; liquid cooling may reduce or increase water use depending on design. |
| E25 | Renewable matching claims by hyperscalers should not be treated as proof of 24/7 local carbon-free energy unless the company discloses hourly/local matching. | Inference across company sustainability disclosures and IEA/DOE framing. | Medium-high | This is a caveat, not a single-source fact. |

## Pattern Evidence

### Strongly Supported

- Data-center electricity demand has moved from a flat/slow-growth assumption into a visible electricity planning driver in the United States.
- The bottleneck is regional and temporal: power availability, interconnection, transmission, distribution, cooling, and permitting matter more than national annual electricity availability.
- Hyperscalers now treat energy procurement and data-center physical infrastructure as strategic constraints.
- Utility and grid regulators are responding with special tariffs, co-location proceedings, and reliability studies.

### Supported But Requires Caveats

- AI is the main driver of all new data-center electricity demand. Evidence supports AI as a major driver, but sources often mix AI, cloud, crypto, enterprise, and industrial loads.
- Data-center load will translate cleanly into utility or power-company upside. Regulatory cost allocation, forecast attrition, and affordability politics complicate this.
- Nuclear/SMRs will solve the 2026-2030 bottleneck. Existing nuclear and restarts matter earlier; SMRs are mostly post-2030 optionality.

### Weak Or Avoid

- Any claim that a specific stock is a winner or loser.
- Any claim that electricity alone determines AI stock performance.
- Any claim that all announced data-center MW will be built and energized on schedule.
- Any single-point forecast for AI data-center electricity demand without scenario caveats.
