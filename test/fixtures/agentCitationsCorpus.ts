import type { AgentCitation } from "../../src/helpers/agentContracts";

// Evaluation corpus for layoutAgentReply. Titles are real: The Perimeter
// Report's archive (including the live capture for project 53997) and City AM
// cards, whose titles arrive as several lines.
//
// Each reply marks where citations belong, right after the sentence that
// names them: [[key]] must be cited there, [[~key]] may be (a fair miss that
// still counts against recall). Markers sit before any URL the agent wrote.

interface CorpusCase {
  name: string;
  sources: string[];
  reply: string;
  explicit?: string[];
  fallback?: string;
  // Expected trailing citations; by default the fallback when nothing is
  // cited inline, otherwise none.
  trailing?: string[];
}

const perimeter = (slug: string) => `https://www.perimeterreport.com/${slug}/`;
const cityam = (slug: string) => `https://www.cityam.com/${slug}/`;

const ARTICLES: Record<string, AgentCitation> = {
  // The Perimeter Report
  cp35: { title: "CP26/35: FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets", url: perimeter("cp26-35-fca-proposes-minimum-redemption-terms-for-nurs-funds-heavily-invested-in-illiquid-assets") },
  prism: { title: "FCA's PRISM Taskforce sets out what open finance actually needs to work", url: perimeter("fcas-prism-taskforce-sets-out-what-open-finance-actually-needs-to-work") },
  authq1: { title: "FCA authorisations Q1 2026/27: three metrics in red as new firm and payments applications miss targets", url: perimeter("fca-authorisations-q1-2026-27-three-metrics-in-red-as-new-firm-and-payments-applications-miss-targets") },
  cp34: { title: "CP26/34: FCA consults on guidance and transitional rules for new transaction reporting regime ahead of April 2028 go-live", url: perimeter("cp26-34-fca-consults-on-guidance-and-transitional-rules-for-new-transaction-reporting-regime-ahead-of-april-2028-go-live") },
  ofmaps: { title: "FCA maps three open finance infrastructure models but stops short of picking one", url: perimeter("fca-maps-three-open-finance-infrastructure-models-but-stops-short-of-picking-one") },
  cp30: { title: "FCA consults on equity market transparency and SI regime changes (CP26/30). Responses close 16 October 2026.", url: perimeter("fca-consults-on-equity-market-transparency-and-si-regime-changes-cp26-30-responses-close-16-october-2026") },
  cp20: { title: "CP26/20: FCA consults on SIPP due diligence and asset protection rules, closing 24 August 2026", url: perimeter("cp26-20-fca-consults-on-sipp-due-diligence-and-asset-protection-rules-closing-24-august-2026") },
  cp32: { title: "FCA CP26/32: Fractional shares, crypto venue deferrals, and eight Handbook fixes open for comment until 12 October", url: perimeter("fca-cp26-32-fractional-shares-crypto-venue-deferrals-and-eight-handbook-fixes-open-for-comment-until-12-october") },
  crypto851: { title: "FCA recovers £851k for crypto fraud victims as confiscation orders land against two convicted fraudsters", url: perimeter("fca-recovers-851k-for-crypto-fraud-victims-as-confiscation-orders-land-against-two-convicted-fraudsters") },
  sequestration: { title: "FCA secures sequestration order against Scottish broker who allegedly pocketed client premiums", url: perimeter("fca-secures-sequestration-order-against-scottish-broker-who-allegedly-pocketed-client-premiums") },
  iti: { title: "ITI Capital enters special administration: Teneo appointed, clients contacted within eight weeks", url: perimeter("iti-capital-enters-special-administration-teneo-appointed-clients-contacted-within-eight-weeks") },
  cfd: { title: "FCA closes 21 CFD firms over UK authorisation misuse as two enforcement investigations begin", url: perimeter("fca-closes-21-cfd-firms-over-uk-authorisation-misuse-as-two-enforcement-investigations-begin") },
  mule: { title: "FCA money mule review: 238,000 accounts closed in 2025, cashing out peaks at the second hop", url: perimeter("fca-money-mule-review-238-000-accounts-closed-in-2025-cashing-out-peaks-at-the-second-hop") },
  boefees: { title: "Bank of England proposes 2026/27 fees for recognised payment systems, with cap rise still in Parliament's hands", url: perimeter("bank-of-england-proposes-2026-27-fees-for-recognised-payment-systems-with-cap-rise-still-in-parliaments-hands") },
  hunter: { title: "FCA takes Hunter Jones (Osborne Baldwin) to High Court over alleged unauthorised loan note sales", url: perimeter("fca-takes-hunter-jones-osborne-baldwin-to-high-court-over-alleged-unauthorised-loan-note-sales") },
  ps18: { title: "PS26/18: FCA finalises cryptoasset perimeter guidance. Application window opens 30 September 2026", url: perimeter("ps26-18-fca-finalises-cryptoasset-perimeter-guidance-application-window-opens-30-september-2026") },
  miah: { title: "FCA bans Nurul Miah after SRA finds £28m client money fraud at Kingly Solicitors", url: perimeter("fca-bans-nurul-miah-after-sra-finds-28m-client-money-fraud-at-kingly-solicitors") },
  pps: { title: "PPS Money enters liquidation: what its agent network must do now", url: perimeter("pps-money-enters-liquidation-what-its-agent-network-must-do-now") },
  odey: { title: "Upper Tribunal confirms Odey industry ban: all five FCA allegations upheld, fine cut to £1.53m", url: perimeter("upper-tribunal-confirms-odey-industry-ban-all-five-fca-allegations-upheld-fine-cut-to-1-53m") },
  gold: { title: "FCA seeks input on tokenised gold: perimeter uncertainty is the central question, bespoke regime among the options", url: perimeter("fca-seeks-input-on-tokenised-gold-perimeter-uncertainty-is-the-central-question-bespoke-regime-among-the-options") },
  gi: { title: "FCA proposes two GI value measures reporting cuts, with wider overhaul signalled for 2027", url: perimeter("fca-proposes-two-gi-value-measures-reporting-cuts-with-wider-overhaul-signalled-for-2027") },
  touchstone: { title: "Man pleads guilty to fraud and forgery over fabricated Touchstone Exploration takeover bid", url: perimeter("man-pleads-guilty-to-fraud-and-forgery-over-fabricated-touchstone-exploration-takeover-bid") },
  cp22: { title: "CP26/22: FCA consults on narrowing ICOBS and PROD 4 territorial scope and simplifying insurance disclosure rules", url: perimeter("cp26-22-fca-consults-on-narrowing-icobs-and-prod-4-territorial-scope-and-simplifying-insurance-disclosure-rules") },
  cp21: { title: "CP26/21: FCA consults on conflict-of-interest rules for listed closed-ended funds", url: perimeter("cp26-21-fca-consults-on-conflict-of-interest-rules-for-listed-closed-ended-funds") },
  cp24: { title: "CP26/24: FCA consults on aligning MiFID cost disclosures with Consumer Composite Investments regime", url: perimeter("cp26-24-fca-consults-on-aligning-mifid-cost-disclosures-with-consumer-composite-investments-regime") },
  costs: { title: "FCA consults on overhauling investment cost disclosures: action required by 21 August", url: perimeter("fca-consults-on-overhauling-investment-cost-disclosures-action-required-by-21-august") },
  remco: { title: "FCA proposes single remuneration code to replace three (CP26/27): respond by 16 September 2026", url: perimeter("fca-proposes-single-remuneration-code-to-replace-three-cp26-27-respond-by-16-september-2026") },
  rpib: { title: "RPIB opens consultation on next-generation UK retail payments infrastructure", url: perimeter("rpib-opens-consultation-on-next-generation-uk-retail-payments-infrastructure") },
  ringfence: { title: "HMT and PRA launch parallel consultations on ring-fencing reform", url: perimeter("hmt-and-pra-launch-parallel-consultations-on-ring-fencing-reform") },
  dsa: { title: "HM Treasury consults on extending Bank of England fee regime to digital settlement asset providers", url: perimeter("hm-treasury-consults-on-extending-bank-of-england-fee-regime-to-digital-settlement-asset-providers") },
  growth: { title: "Growth is now an explicit political input into FCA supervision, and the regulator says harder calls are coming", url: perimeter("growth-is-now-an-explicit-political-input-into-fca-supervision-and-the-regulator-says-harder-calls-are-coming") },

  // City AM: the first line is the headline, the rest subheadings.
  gambling: { title: "Gambling giant blames job cuts on Burnham high street crackdown\nGambling shops part of high street fabric", url: cityam("gambling-giant-blames-job-cuts-on-burnham-high-street-crackdown") },
  scaleups: { title: "UK tech scale-ups raise £3.4bn as Burnham faces test over British investment\nAI firms dominate latest UK scale-up cohort", url: cityam("uk-tech-scale-ups-raise-3-4bn-as-burnham-faces-test-over-british-investment") },
  spurs: { title: "Spurs owners take 12-month investment to £300m with fresh £120m injection\nSpurs' fresh injection", url: cityam("spurs-owners-take-12-month-investment-to-300m-with-fresh-120m-injection") },
  houseprices: { title: "London house price slowdown worsens as luxury areas lose value\nLondon suffers from 'sky-high prices'", url: cityam("london-house-price-slowdown-worsens-as-luxury-areas-lose-value") },
  winkworth: { title: "Winkworth warns on profit citing family boardroom bust-up\nFamily feud", url: cityam("winkworth-warns-on-profit-citing-family-boardroom-bust-up") },
  centralbankers: { title: "How do central bankers decide interest rates when inflation is so unpredictable?\nA political problem", url: cityam("how-do-central-bankers-decide-interest-rates-when-inflation-is-so-unpredictable") },
  bgc: { title: "BGC Group raises record amounts at charity day amidst decline in corporate giving\nDecline in UK corporate giving", url: cityam("bgc-group-raises-record-amounts-at-charity-day-amidst-decline-in-corporate-giving") },
  haldane: { title: "Haldane warns Burnham on 'tax-and-spend socialists with better TikTok videos'\nBurnham and Healey's headroom headache", url: cityam("haldane-warns-burnham-on-tax-and-spend-socialist-government") },
  wfh: { title: "Bosses made to justify why staff shouldn't work from home\nMinisters boost working from home rights", url: cityam("bosses-made-to-justify-why-staff-shouldnt-work-from-home") },
  whsmith: { title: "WH Smith warns on profit again as discounting hits margins\nWH Smith 'needs to rebuild credibility'", url: cityam("wh-smith-warns-on-profit-again-as-discounting-hits-margins") },
  barratt: { title: "Barratt Redrow trims housebuilding targets amid 'challenging' backdrop\nBarratt calls for emergency measures", url: cityam("barratt-redrow-trims-housebuilding-targets-amid-challenging-backdrop") },
  inflation: { title: "Inflation inches higher ahead of interest rates decision\nInflation outlook to unnerve Bank of England", url: cityam("inflation-inches-higher-ahead-of-interest-rates-decision") },
  ftse: { title: "FTSE 100 Live: Stocks to edge up despite ongoing pressure on oil\nHere's a few of our top headlines this morning", url: cityam("ftse-100-live-stocks-to-edge-up-despite-ongoing-pressure-on-oil") },
  fcaculture: { title: "Clean up or lawyer up: The FCA's culture war gets real\nLawyers on call for City businesses", url: cityam("clean-up-or-lawyer-up-the-fcas-culture-war-gets-real") },
  cleverly: { title: "If Conservatives can win in Enfield then James Cleverly can be Mayor of London\nCleverly knows which levers to pull", url: cityam("if-conservatives-can-win-in-enfield-then-james-cleverly-can-be-mayor-of-london") },
  shadow: { title: "Shadow Chancellor: 200,000 jobs have already been lost under Labour\nEconomic self-destruction", url: cityam("shadow-chancellor-200000-jobs-have-already-been-lost-under-labour") },
  tightrope: { title: "We're walking an economic tightrope and the wind is picking up\nWhere does Britain want to be in the future?", url: cityam("walking-an-economic-tightrope-and-the-wind-is-picking-up") },
  rayner: { title: "Rayner urged to resolve 'unwelcome' Tower of London heritage row\nMinister accused of meddling", url: cityam("rayner-urged-to-resolve-unwelcome-tower-of-london-heritage-row") },
  reform: { title: "Reform's London mayor pick: I want to design London like an iPhone\nLaila Cunningham's complaints\nReform UK's chances in London", url: cityam("reform-uk-mayor-pick-i-want-to-design-london-like-an-iphone") },
  manutd: { title: "Manchester United's new stadium could be delayed until 2035 as timeline slips\nOtro Capital now free to sell Alpine stake\nBurnley's ditched sponsor's fake reviews\nA new take on Rangers administration\nSlow and steady wins the race", url: cityam("manchester-uniteds-new-stadium-could-be-delayed-until-2035-as-timeline-slips") },
  boeraise: { title: "Bank of England predicted to raise interest rates this year\nCity banks split on interest rates", url: cityam("bank-of-england-predicted-to-raise-interest-rates-this-year") },
  lenders: { title: "Five lenders hike mortgage prices as interest rate threat looms\n'More rate moves expected in coming days'", url: cityam("five-lenders-hike-mortgage-prices-as-interest-rate-threat-looms") },
  fourhikes: { title: "Four interest rate hikes loom despite surprise economic growth\nGDP growth 'ammo for hawks'", url: cityam("four-interest-rate-hikes-loom-despite-surprise-economic-growth") },
  boepressure: { title: "Bank of England under pressure to raise interest rates or risk 'losing credibility'\nEnergy price jumps fuel interest rate hike fears", url: cityam("bank-of-england-under-pressure-to-raise-interest-rates-or-risk-losing-credibility") },
  pill: { title: "Bank of England's Pill warns against 'wait and see' interest rates approach\nBank of England decision on knife edge", url: cityam("bank-of-englands-pill-warns-against-wait-and-see-interest-rates-approach") },
  mortgagehigh: { title: "Mortgage rates at five-month high ahead of Bank of England decision\nBank of England 'could be forced' to raise rates", url: cityam("mortgage-rates-at-five-month-high-ahead-of-bank-of-england-decision") },
  expectations: { title: "Inflation expectations softer than predicted ahead of interest rate decision\nInflation and wage expectations edge up", url: cityam("inflation-expectations-softer-than-predicted-ahead-of-interest-rate-decision") },
  bondsale: { title: "Bank of England poised to slow bond sale programme\nBank of England defends bond sales", url: cityam("bank-of-england-poised-to-slow-bond-sale-programme") },
  nightmare: { title: "Mortgage nightmare as investors price in three interest rate hikes\nFirst interest rate hike 'in November'", url: cityam("mortgage-nightmare-as-investors-price-in-three-interest-rate-hikes") },
  treasury: { title: "How the Treasury got 'fed up' with the Bank of England's payments plan\nToo many cooks in the kitchen\nBreeden and the banks", url: cityam("how-the-treasury-got-fed-up-with-the-bank-of-englands-payments-plan") },
  beckham: { title: "Victoria Beckham owed £350,000 by Harvey Nichols", url: cityam("victoria-beckham") },
  nike: { title: "Nike becomes London City Lionesses sponsor as well as kit partner in world record deal", url: cityam("nike-lionesses") },
  revolut: { title: "Revolut takes step closer to US bank launch after clearing key regulatory hurdle", url: cityam("revolut-us-bank") },
  reformgilts: { title: "Reform UK chiefs ask to meet gilt holders amid bond rout", url: cityam("reform-uk") },

  // City AM-style headlines written for the corpus: short ones, and a
  // codeless twin of CP26/34.
  boehold: { title: "Bank of England holds interest rates at 4%\nMPC split six to three", url: cityam("bank-of-england-holds-interest-rates") },
  pound: { title: "Pound slides against the dollar\nSterling weakest since March", url: cityam("pound-slides-against-the-dollar") },
  oil: { title: "Oil prices surge\nBrent crude tops $90", url: cityam("oil-prices-surge") },
  ryanair: { title: "Ryanair profits soar\nO'Leary hails summer demand", url: cityam("ryanair-profits-soar") },
  txreporting: { title: "City firms face April 2028 deadline for new transaction reporting regime", url: cityam("city-firms-face-april-2028-deadline-for-new-transaction-reporting-regime") },
};

// Session sources, newest first, as the client accumulates them.
const PERIMETER_TURN_1 = ["cp35", "prism", "authq1", "cp34", "ofmaps"];
const PERIMETER_TURN_2 = ["cp30", "cp20", "cp32", ...PERIMETER_TURN_1];
const PERIMETER_SESSION = [
  ...PERIMETER_TURN_2, "crypto851", "sequestration", "iti", "cfd", "mule", "boefees", "hunter", "ps18", "miah", "pps",
  "odey", "gold", "gi", "touchstone", "cp22", "cp21", "cp24", "costs", "remco", "rpib", "ringfence", "dsa", "growth",
];
const CITYAM_LATEST = [
  "gambling", "scaleups", "spurs", "houseprices", "winkworth", "centralbankers", "bgc", "haldane", "wfh", "whsmith",
  "barratt", "inflation", "ftse", "fcaculture", "cleverly", "shadow", "tightrope", "rayner", "reform", "manutd",
];
const CITYAM_RATES = [
  "boeraise", "lenders", "fourhikes", "boepressure", "inflation", "pill", "mortgagehigh", "expectations", "bondsale",
  "centralbankers", "nightmare", "treasury",
];
const CITYAM_SESSION = [
  ...CITYAM_RATES, ...CITYAM_LATEST.filter((key) => !CITYAM_RATES.includes(key)), "beckham", "nike", "revolut",
  "reformgilts",
];
const CITYAM_MARKETS = ["boehold", "pound", "oil", "ryanair", "ftse", "barratt", ...CITYAM_RATES];

const CORPUS: CorpusCase[] = [
  // The live capture, turn 1: a verbatim five-headline rundown.
  {
    name: "capture turn 1: verbatim rundown, one headline per paragraph",
    sources: PERIMETER_TURN_1,
    reply: "Here are the latest headlines from The Perimeter Report:\n\nCP26/35: FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets[[cp35]]\n\nFCA's PRISM Taskforce sets out what open finance actually needs to work[[prism]]\n\nFCA authorisations Q1 2026/27: three metrics in red as new firm and payments applications miss targets[[authq1]]\n\nCP26/34: FCA consults on guidance and transitional rules for new transaction reporting regime ahead of April 2028 go-live[[cp34]]\n\nFCA maps three open finance infrastructure models but stops short of picking one[[ofmaps]]\n\nLet me know if you'd like more detail on any of these, or the full text of one.",
  },
  // The live capture, turn 2: paraphrased, citing two stories from turn 1.
  {
    name: "capture turn 2: paraphrase naming codes, two from the previous turn",
    sources: PERIMETER_TURN_2,
    reply: "Based on today's date of 9 October 2026, here's what's genuinely still open from the coverage I have, plus the two newest consultations which didn't come up with closing dates in that search:\n\nCP26/32 on fractional shares, crypto venue deferrals, and eight Handbook fixes closes 12 October 2026, so it's open for just a few more days.[[cp32]]\n\nCP26/30 on equity market transparency and the SI regime closes 16 October 2026, also still open.[[cp30]]\n\nThe SIPP due diligence consultation, CP26/20, closed back on 24 August 2026, so that one's shut.[[cp20]]\n\nThere are also two very recent ones from this week, CP26/35 on minimum redemption terms for NURS funds, and CP26/34 on transaction reporting guidance, both published this month.[[cp35,cp34]] Would you like me to check their closing dates for you?",
  },
  { name: "bridge: pull up the latest", sources: PERIMETER_TURN_2, reply: "I'll pull up the latest stories for you." },
  { name: "bridge: check the consultation coverage", sources: PERIMETER_TURN_2, reply: "Let me check the consultation-related coverage for you." },
  { name: "bridge: broaden the search", sources: PERIMETER_SESSION, reply: "Let me broaden that search a bit." },
  { name: "bridge: topics list", sources: PERIMETER_SESSION, reply: "Let me check the topics list for consultations and policy coverage." },
  { name: "bridge: have a look", sources: CITYAM_SESSION, reply: "Let me have a look at the latest on interest rates." },
  {
    name: "screenshot 2: spoken ordinals, one story per paragraph",
    sources: PERIMETER_TURN_1,
    reply: "Here's a quick rundown of the latest regulatory developments.\n\nFirst, CP26/35: the FCA proposes minimum redemption terms for NURS funds that are heavily invested in illiquid assets.[[cp35]]\n\nNext, the FCA's PRISM Taskforce sets out what open finance actually needs to work.[[prism]]\n\nAnd last, CP26/34: the FCA consults on guidance and transitional rules for a new transaction reporting regime ahead of an April 2028 go-live.[[cp34]]\n\nWant me to go deeper on any of these?",
  },
  {
    name: "screenshot 1: two stories in one paragraph",
    sources: PERIMETER_SESSION,
    reply: "There are two consultations out this month. The first is CP26/35, where the FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets, published October 8, 2026.[[cp35]] The second is CP26/34, where the FCA consults on guidance and transitional rules for a new transaction reporting regime ahead of an April 2028 go-live, published October 2, 2026.[[cp34]] Would you like more detail on either?",
  },
  {
    name: "voice: figures as words, no codes",
    sources: PERIMETER_TURN_1,
    reply: "Here are the three latest stories. First, the FCA is proposing minimum redemption terms for NURS funds that are heavily invested in illiquid assets.[[cp35]] Next, the FCA's PRISM Taskforce has set out what open finance needs in order to work.[[prism]] And last, the FCA's authorisation figures for the first quarter show three metrics in red, with new firm and payments applications missing their targets.[[authq1]] Would you like to hear more about any of them?",
  },
  {
    name: "voice: codes spoken with slash",
    sources: PERIMETER_SESSION,
    reply: "First, CP twenty-six slash thirty-five, the FCA's proposal on minimum redemption terms for NURS funds.[[cp35]] Next, CP twenty-six slash thirty-four, on transaction reporting guidance before the April twenty twenty-eight go-live.[[cp34]] And last, CP twenty-six slash thirty-two, on fractional shares and crypto venue deferrals, which is open for comment until the twelfth of October.[[cp32]]",
  },
  {
    name: "voice: codes spoken without slash, two in one sentence",
    sources: PERIMETER_SESSION,
    reply: "The two newest consultations are CP twenty-six thirty-five on NURS fund redemption terms and CP twenty-six thirty-four on transaction reporting.[[cp35,cp34]] Both were published this month.",
  },
  {
    name: "voice: enforcement rundown with spoken figures",
    sources: PERIMETER_SESSION,
    reply: "First, the FCA has recovered eight hundred and fifty-one thousand pounds for victims of a crypto fraud, after confiscation orders against two convicted fraudsters.[[crypto851]] Next, a Scottish insurance broker who allegedly pocketed client premiums now faces a sequestration order secured by the FCA.[[sequestration]] And last, ITI Capital has gone into special administration, with Teneo appointed and clients to be contacted within eight weeks.[[iti]]",
  },
  {
    name: "voice: City AM paraphrase with spoken money",
    sources: CITYAM_SESSION,
    reply: "First, Spurs' owners have taken their investment over twelve months to three hundred million pounds with a fresh one hundred and twenty million pound injection.[[~spurs]] Next, the shadow chancellor argues two hundred thousand jobs have already been lost under Labour.[[shadow]] And last, Manchester United's new stadium could be delayed until twenty thirty-five as the timeline slips.[[manutd]]",
  },
  {
    name: "summary of one article without its title, PRISM",
    sources: PERIMETER_TURN_2,
    fallback: "prism",
    reply: "The FCA has published the outcomes report from its PRISM Taskforce, which identifies the conditions industry says must be in place before open finance can deliver at scale.[[~prism]] It's about a three-minute listen. Would you like me to read it to you?",
  },
  {
    name: "summary of one article without its title, transaction reporting",
    sources: PERIMETER_TURN_2,
    fallback: "cp34",
    reply: "Investment firms, trading venue operators and approved reporting mechanisms have until 6 November 2026 to respond. The FCA wants views on guidance and transitional rules for the new transaction reporting regime, which goes live in April 2028.[[~cp34]] Shall I read you the full article?",
  },
  {
    name: "summary of one article that never names it",
    sources: CITYAM_SESSION,
    fallback: "winkworth",
    reply: "The estate agency has cut its profit outlook, blaming a family dispute in the boardroom.[[~winkworth]] The company says trading in its franchise network has otherwise held up. Would you like the full article?",
  },
  {
    name: "author only: should not cite",
    sources: PERIMETER_SESSION,
    reply: "All of the recent coverage is written by Eleanor Vance. Her most recent piece was published on 8 October 2026. Would you like me to list her latest articles?",
  },
  {
    name: "date only: should not cite",
    sources: PERIMETER_SESSION,
    reply: "The newest article was published on 8 October, and the one before that on 7 October. Do you want the headlines?",
  },
  {
    name: "author and topic only: should not cite",
    sources: PERIMETER_SESSION,
    reply: "There's also a piece from Eleanor Vance on 2 October about authorisations. Shall I find it for you?",
  },
  {
    name: "near duplicates: two open finance stories",
    sources: PERIMETER_SESSION,
    reply: "There are two pieces on open finance. One covers the PRISM Taskforce's view of what open finance actually needs to work.[[prism]] The other looks at the three infrastructure models the FCA has mapped without picking one.[[ofmaps]]",
  },
  {
    name: "near duplicates: open finance offered as a choice",
    sources: PERIMETER_SESSION,
    reply: "Yes, there are two. Which would you like first: the PRISM Taskforce outcomes, or the FCA's three open finance infrastructure models?[[~prism,~ofmaps]]",
  },
  {
    name: "near duplicates: two Bank of England rate stories",
    sources: CITYAM_SESSION,
    reply: "The Bank of England is under pressure to raise interest rates or risk losing credibility, as energy price jumps fuel fears of a hike.[[boepressure]] Separately, the Bank's Huw Pill has warned against a wait-and-see approach to interest rates.[[pill]]",
  },
  {
    name: "near duplicates: verbatim rate headlines, one per line",
    sources: CITYAM_SESSION,
    reply: "Here are the latest stories on interest rates:\n\nBank of England predicted to raise interest rates this year[[boeraise]]\nBank of England under pressure to raise interest rates or risk 'losing credibility'[[boepressure]]\nMortgage rates at five-month high ahead of Bank of England decision[[mortgagehigh]]\n\nWould you like me to go into any of them?",
  },
  {
    name: "near duplicates: inflation and rate hikes",
    sources: CITYAM_SESSION,
    reply: "Inflation has inched higher ahead of the interest rate decision.[[inflation]] And investors now expect four interest rate hikes despite surprise economic growth.[[fourhikes]]",
  },
  {
    name: "near duplicates: two cost disclosure consultations",
    sources: PERIMETER_SESSION,
    reply: "CP26/24 proposes aligning MiFID cost disclosures with the Consumer Composite Investments regime.[[cp24]] A second piece looks at what the overhaul of investment cost disclosures means for platforms and advisers, with action required by 21 August.[[costs]]",
  },
  {
    name: "near duplicates: Bank of England fee regimes",
    sources: PERIMETER_SESSION,
    reply: "The Bank of England has proposed its 2026/27 fees for recognised payment systems, though a rise in the cap is still in Parliament's hands.[[boefees]] HM Treasury is also consulting on extending the Bank's fee regime to digital settlement asset providers.[[dsa]]",
  },
  {
    name: "near duplicates: two London mayoral pieces",
    sources: CITYAM_SESSION,
    reply: "Reform's pick for London mayor says she wants to design London like an iPhone.[[reform]] Meanwhile, Alys Denby argues that if the Conservatives can win in Enfield, James Cleverly can be Mayor of London.[[cleverly]]",
  },
  {
    name: "property: three stories in three sentences",
    sources: CITYAM_SESSION,
    reply: "London house prices are slowing further, with luxury areas losing value.[[houseprices]] Barratt Redrow has trimmed its housebuilding targets, citing a challenging backdrop.[[barratt]] And mortgage rates have hit a five-month high ahead of the Bank of England's decision.[[mortgagehigh]]",
  },
  {
    name: "City AM: verbatim first lines of multi-line titles",
    sources: CITYAM_SESSION,
    reply: "Here are the latest headlines from City AM:\n\nGambling giant blames job cuts on Burnham high street crackdown[[gambling]]\nUK tech scale-ups raise £3.4bn as Burnham faces test over British investment[[scaleups]]\nSpurs owners take 12-month investment to £300m with fresh £120m injection[[spurs]]\nLondon house price slowdown worsens as luxury areas lose value[[houseprices]]\nWinkworth warns on profit citing family boardroom bust-up[[winkworth]]\n\nWant me to read any of these?",
  },
  {
    name: "City AM: spoken ordinals paraphrase",
    sources: CITYAM_SESSION,
    reply: "First, a gambling giant has blamed job cuts on Burnham's high street crackdown.[[gambling]] Next, UK tech scale-ups have raised £3.4bn, as Burnham faces a test over British investment.[[scaleups]] And last, WH Smith has warned on profit again as discounting hits its margins.[[whsmith]]",
  },
  {
    name: "curly quotes and apostrophes",
    sources: CITYAM_SESSION,
    reply: "Andy Haldane has warned Burnham about “tax-and-spend socialists with better TikTok videos”.[[haldane]] And Rayner has been urged to resolve an ‘unwelcome’ Tower of London heritage row.[[rayner]]",
  },
  {
    name: "pound figures paraphrased in text",
    sources: CITYAM_SESSION,
    reply: "Spurs' owners have put in a fresh £120m, taking their 12-month investment to £300m.[[spurs]] Victoria Beckham is owed £350,000 by Harvey Nichols.[[beckham]]",
  },
  {
    name: "question-mark headline followed by a sentence",
    sources: CITYAM_SESSION,
    reply: "How do central bankers decide interest rates when inflation is so unpredictable?[[centralbankers]] That's the question Helen Thomas asks in an opinion piece today.",
  },
  {
    name: "Markdown bold headlines from streamed parts",
    sources: CITYAM_SESSION,
    reply: "**Barratt Redrow trims housebuilding targets amid 'challenging' backdrop**[[barratt]]\n**WH Smith warns on profit again as discounting hits margins**[[whsmith]]\n\nShall I go on?",
  },
  {
    name: "multi-line title named by its first line",
    sources: CITYAM_SESSION,
    reply: "The sport business story today: Manchester United's new stadium could be delayed until 2035 as timeline slips.[[manutd]]",
  },
  {
    name: "title spanning two sentences, verbatim",
    sources: PERIMETER_TURN_2,
    reply: "Here are the open consultations:\n\nFCA consults on equity market transparency and SI regime changes (CP26/30). Responses close 16 October 2026.[[cp30]]\nFCA CP26/32: Fractional shares, crypto venue deferrals, and eight Handbook fixes open for comment until 12 October[[cp32]]",
  },
  {
    name: "title spanning two sentences, paraphrased",
    sources: PERIMETER_SESSION,
    reply: "The FCA is consulting on equity market transparency and changes to the SI regime.[[cp30]] Responses close on 16 October 2026, so there's still time.",
  },
  {
    name: "policy statement title with a full stop",
    sources: PERIMETER_SESSION,
    reply: "PS26/18: FCA finalises cryptoasset perimeter guidance. Application window opens 30 September 2026[[ps18]]\n\nThat one needs action if you carry on cryptoasset activities.",
  },
  {
    name: "code-only intro then a paragraph per consultation",
    sources: PERIMETER_SESSION,
    reply: "I found three open consultations: CP26/32, CP26/30 and CP26/34.\n\nCP26/32 covers fractional shares, crypto venue deferrals and eight Handbook fixes, and closes on 12 October.[[cp32]]\n\nCP26/30, on equity market transparency and the SI regime, closes on 16 October.[[cp30]]\n\nCP26/34, on transaction reporting guidance, closes on 6 November.[[cp34]]",
  },
  {
    name: "verbatim enforcement rundown",
    sources: PERIMETER_SESSION,
    reply: "Here are the latest enforcement stories:\n\nFCA recovers £851k for crypto fraud victims as confiscation orders land against two convicted fraudsters[[crypto851]]\n\nFCA secures sequestration order against Scottish broker who allegedly pocketed client premiums[[sequestration]]\n\nITI Capital enters special administration: Teneo appointed, clients contacted within eight weeks[[iti]]",
  },
  {
    name: "single sentence naming two stories",
    sources: PERIMETER_SESSION,
    reply: "The FCA has closed 21 CFD firms that misused UK authorisation, with two enforcement investigations now under way, while its money mule review found 238,000 accounts were closed in 2025.[[cfd,mule]]",
  },
  {
    name: "enforcement paraphrases with names and figures",
    sources: PERIMETER_SESSION,
    reply: "The Upper Tribunal has confirmed Crispin Odey's industry ban, upholding all five FCA allegations but cutting his fine to £1.53m.[[odey]] Separately, the FCA has banned Nurul Miah after the SRA found a £28m client money fraud at Kingly Solicitors.[[miah]] The FCA is also taking Hunter Jones, trading as Osborne Baldwin, to the High Court over alleged unauthorised loan note sales.[[hunter]]",
  },
  {
    name: "short headlines paraphrased",
    sources: PERIMETER_SESSION,
    reply: "PPS Money has gone into liquidation, leaving its agent network with questions to answer.[[pps]] A man has pleaded guilty to fraud and forgery over a fabricated takeover bid for Touchstone Exploration.[[touchstone]] And the FCA is seeking input on tokenised gold, with perimeter uncertainty the central question.[[gold]]",
  },
  {
    name: "growth and supervision paraphrase",
    sources: PERIMETER_SESSION,
    reply: "The government has made growth an explicit political input into FCA supervision, and the regulator says harder calls are coming.[[growth]] Would you like the full piece?",
  },
  {
    name: "offer of a nearby subject after an empty search",
    sources: PERIMETER_SESSION,
    reply: "The Perimeter Report hasn't covered stablecoin custody yet. I can tell you about cryptoasset perimeter guidance instead, if that helps.",
  },
  {
    name: "greeting",
    sources: PERIMETER_SESSION,
    reply: "Hi, I'm the AI assistant for The Perimeter Report. I can catch you up on the latest regulatory news, explore a subject, or read an article to you. What would you like?",
  },
  {
    name: "follow-up about a deadline, no story named",
    sources: PERIMETER_SESSION,
    reply: "That one closes on 12 October, so there are only a few days left to respond. Would you like the other open consultations?",
  },
  {
    name: "full article read-out names its headline once",
    sources: PERIMETER_SESSION,
    reply: "CP26/35: FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets, by Eleanor Vance.[[cp35]]\n\nAuthorised Fund Managers running Non-UCITS Retail Schemes (NURS) with significant illiquid asset exposure need to act on this one.\n\nThe FCA has published CP26/35, a consultation proposing that NURS funds with at least 50% of scheme property in inherently illiquid assets must offer minimum redemption notice periods.\n\nShall I keep going?",
  },
  {
    name: "Markdown link to a known source",
    sources: PERIMETER_SESSION,
    reply: "Here's the one you asked about: [CP26/35: FCA proposes minimum redemption terms for NURS funds heavily invested in illiquid assets](https://www.perimeterreport.com/cp26-35-fca-proposes-minimum-redemption-terms-for-nurs-funds-heavily-invested-in-illiquid-assets/).[[cp35]]",
  },
  {
    name: "bare URL lines under shortened titles",
    sources: CITYAM_SESSION,
    reply: "Here are two articles:\n\nBank of England’s Pill warns against ‘wait and see’ interest rates approach[[pill]]\nhttps://www.cityam.com/bank-of-englands-pill-warns-against-wait-and-see-interest-rates-approach/\nNike becomes London City Lionesses sponsor in world record deal[[nike]]\nhttps://www.cityam.com/nike-lionesses/",
  },
  {
    name: "bare URL after a quoted title",
    sources: CITYAM_SESSION,
    reply: "The newest article is titled \"Victoria Beckham owed £350,000 by Harvey Nichols\".[[beckham]] You can find it at https://www.cityam.com/victoria-beckham/",
  },
  {
    name: "numbered list with bare URLs and no tool sources",
    sources: [],
    reply: "Here are five of the latest articles from City AM:\n\n1. Victoria Beckham owed £350,000 by Harvey Nichols[[beckham]] https://www.cityam.com/victoria-beckham/\n2. Bank of England’s Pill warns against ‘wait and see’ interest rates approach[[pill]] https://www.cityam.com/bank-of-englands-pill-warns-against-wait-and-see-interest-rates-approach/\n3. Nike becomes London City Lionesses sponsor as well as kit partner in world record deal[[nike]] https://www.cityam.com/nike-lionesses/\n4. Revolut takes step closer to US bank launch after clearing key regulatory hurdle[[revolut]] https://www.cityam.com/revolut-us-bank/\n5. Reform UK chiefs ask to meet gilt holders amid bond rout[[reformgilts]] https://www.cityam.com/reform-uk/",
  },
  // Harder cases: few sources (weak word weights), short headlines, a code
  // shared by meaning but not by title, and topic words in closers.
  {
    name: "small search: three Bank of England rate stories",
    sources: ["boeraise", "boepressure", "pill"],
    reply: "The Bank of England is under pressure to raise interest rates or risk losing credibility.[[boepressure]] Its chief economist, Huw Pill, has warned against a wait-and-see approach.[[pill]]",
  },
  {
    name: "small search: two open finance stories",
    sources: ["prism", "ofmaps"],
    reply: "The FCA's PRISM Taskforce sets out what open finance actually needs to work.[[prism]] It doesn't pick an infrastructure model, though.",
  },
  {
    name: "small search: lenders and mortgage rates in one sentence",
    sources: ["lenders", "mortgagehigh", "nightmare"],
    reply: "Mortgage rates have hit a five-month high, and five lenders have hiked prices as the interest rate threat looms.[[mortgagehigh,lenders]]",
  },
  {
    name: "short headlines named in full",
    sources: CITYAM_MARKETS,
    reply: "Oil prices have surged, with Brent crude topping $90.[[oil]] Ryanair's profits have soared on summer demand.[[ryanair]] And the Bank of England held interest rates at 4%.[[boehold]]",
  },
  {
    name: "short headline words inside another story",
    sources: CITYAM_MARKETS,
    reply: "The FTSE 100 is set to edge up despite ongoing pressure from oil prices.[[ftse]] Sterling's slide against the dollar adds to the pressure.[[~pound]]",
  },
  {
    name: "loose paraphrase among Bank of England stories",
    sources: CITYAM_MARKETS,
    reply: "The Bank of England is under pressure to raise interest rates.[[boepressure]] Mortgage rates are already at a five-month high.[[~mortgagehigh]]",
  },
  {
    name: "FTSE 100 mentioned in another story",
    sources: CITYAM_MARKETS,
    reply: "Barratt Redrow shares fell on the FTSE 100 after it trimmed its housebuilding targets.[[barratt]]",
  },
  {
    name: "closer and bridge made of topic words",
    sources: ["boehold"],
    reply: "Let me look for more on Bank of England interest rates. Would you like more on Bank of England interest rates?",
  },
  {
    name: "closer made of topic words after a rundown",
    sources: CITYAM_MARKETS,
    reply: "The Bank of England has held interest rates at 4%, with the MPC split six to three.[[boehold]]\n\nWould you like more on oil prices or the pound?",
  },
  {
    name: "a code names one story; a codeless twin shares its words",
    sources: ["cp34", "txreporting", ...PERIMETER_TURN_1.filter((key) => key !== "cp34")],
    reply: "CP26/34 covers the new transaction reporting regime that City firms face.[[cp34]] Separately, City firms face an April 2028 deadline for the new transaction reporting regime.[[txreporting]]",
  },
  {
    name: "a code names one story; its codeless twin is not mentioned",
    sources: ["cp34", "txreporting", ...PERIMETER_TURN_1.filter((key) => key !== "cp34")],
    reply: "CP26/34 covers the new transaction reporting regime that City firms face.[[cp34]] Responses close on 6 November.",
  },
  {
    name: "subheading only, not the headline",
    sources: CITYAM_RATES,
    reply: "City banks are split on interest rates, according to one report.[[~boeraise]]",
  },
  {
    name: "topics list reply",
    sources: PERIMETER_SESSION,
    reply: "The Perimeter Report covers enforcement, policy, conduct, consultations, financial crime, payments, authorisation, pensions, governance, operational resilience and prudential regulation. Which would you like?",
  },
  {
    name: "FCA activity in general, no story named",
    sources: PERIMETER_SESSION,
    reply: "The FCA has been busy on enforcement this month, with several cases against firms and individuals. Want me to run through them?",
  },
  // Review findings: links whose label names nothing, closers that repeat a
  // code, question paraphrases, comparisons across a code, abbreviations
  // before dates, and general knowledge about a story's subject.
  {
    name: "links the agent wrote with labels that name nothing",
    sources: PERIMETER_TURN_1,
    reply: `Here are three stories from today:\n\nThe FCA proposes minimum redemption terms for NURS funds (read it [here](${ARTICLES.cp35.url})).[[cp35]]\n\nThe PRISM Taskforce sets out what open finance needs to work (read it [here](${ARTICLES.prism.url})).[[prism]]\n\nThe FCA maps three open finance infrastructure models (read it [here](${ARTICLES.ofmaps.url})).[[ofmaps]]`,
  },
  {
    name: "closing question repeats the codes of paraphrased stories",
    sources: PERIMETER_SESSION,
    reply: "The FCA wants minimum redemption terms for NURS funds that hold lots of illiquid assets.[[cp35]]\n\nIt is also consulting on guidance and transitional rules for the new transaction reporting regime.[[cp34]]\n\nWould you like more detail on CP26/35 or CP26/34?",
  },
  {
    name: "a question headline paraphrased as a question",
    sources: CITYAM_SESSION,
    reply: "There's also an opinion piece: how do central bankers set rates when inflation is so unpredictable?[[centralbankers]]",
  },
  {
    name: "a story named in words beside another story's code",
    sources: PERIMETER_TURN_1,
    reply: "Unlike CP26/34, the PRISM Taskforce paper looks at what open finance needs.[[cp34,prism]] It doesn't pick an infrastructure model.",
  },
  {
    name: "abbreviations before dates and page numbers",
    sources: PERIMETER_SESSION,
    reply: "The Upper Tribunal confirmed the Odey industry ban and cut the fine to £1.53m on Aug. 12, 2026.[[odey]] Separately, the FCA banned Nurul Miah after the SRA found a £28m client money fraud at Kingly Solicitors (see p. 4 of the notice).[[miah]]",
  },
  {
    name: "general knowledge about a story's subject: should not cite",
    sources: ["boehold", "pound", "oil", "ryanair", "ftse", "barratt"],
    reply: "The Bank of England sets interest rates eight times a year, through its Monetary Policy Committee. Mortgage rates have been rising even though the Bank of England is expected to cut later this year.",
  },
  {
    name: "general knowledge among Bank of England stories: should not cite",
    sources: CITYAM_MARKETS,
    reply: "The Bank of England sets interest rates eight times a year, through its Monetary Policy Committee.",
  },
  {
    name: "explicit citation the reply never names stays trailing",
    sources: [],
    explicit: ["prism"],
    reply: "Here's the article you asked for. It's about a three-minute listen.",
    trailing: ["prism"],
  },
  {
    name: "explicit citations named inline, one left trailing",
    sources: [],
    explicit: ["gambling", "whsmith", "winkworth"],
    reply: "A gambling giant has blamed job cuts on Burnham's high street crackdown.[[gambling]] WH Smith has warned on profit again as discounting hits margins.[[whsmith]]",
    trailing: ["winkworth"],
  },
];

export type { CorpusCase };
export { ARTICLES, CORPUS };
