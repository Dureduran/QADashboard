import {
  MOCK_BOOKING_CURVES,
  MOCK_COMPETITOR_DATA,
  MOCK_ELASTICITY,
  MOCK_NOSHOW_BY_ROUTE,
  MOCK_OVERBOOKING,
  MOCK_PRICING_BY_ROUTE,
  MOCK_RAG_METRICS,
  MOCK_ROUTE_KPIS,
  MOCK_UNCONSTRAINING_BY_ROUTE,
  MOCK_WATERFALL_DATA,
} from './mockData';

type AgentStatus = 'complete' | 'warning' | 'blocked';
type RecommendationStatus = 'verified' | 'withheld';
type RecommendationMode = 'verified' | 'hold' | 'stimulate' | 'selective' | 'portfolio' | 'stale' | 'unknown';

export interface CitationSource {
  name: string;
  matchScore: number;
  type: string;
  citation?: string;
}

export interface AgentTraceStep {
  name: string;
  role: string;
  status: AgentStatus;
  detail: string;
}

export interface AgentRun extends AgentTraceStep {
  id: string;
  shortName: string;
  accent: string;
  auditEvents: string[];
}

export interface VerifiedClaim {
  claim: string;
  citation: string;
  grounded: boolean;
}

export interface RuleCheck {
  name: string;
  status: 'pass' | 'warning' | 'blocked';
  detail: string;
}

export interface VerifiedRecommendation {
  status: RecommendationStatus;
  action: string;
  rationale: string;
  confidence: number;
  groundingScore: number;
  evidence: string[];
  risks: string[];
  triggers: string[];
}

export interface AIResponse {
  content: string;
  faithfulnessScore: number;
  sources: CitationSource[];
  recommendation?: string;
  confidence?: number;
  abstained?: boolean;
  trace?: AgentTraceStep[];
  agentRuns?: AgentRun[];
  auditEvents?: string[];
  verifiedRecommendation?: VerifiedRecommendation;
  claims?: VerifiedClaim[];
  rules?: RuleCheck[];
  objections?: string[];
  counterfactuals?: string[];
  reviewTriggers?: string[];
}

const CITES = {
  snapshot: '[Dashboard Snapshot: 2026-01-28 09:00 AST - dashboard route KPI]',
  policy: '[Doc: Corp_Protection_Rule_4.2.pdf section 4.2]',
  curve: '[Dashboard Snapshot: 2026-01-28 09:00 AST - dashboard booking curve]',
  market: '[Google Flights API: 2026-01-28 08:45 AST]',
  report: '[Doc: Q3_2025_Revenue_Report.pdf section Europe O&D]',
};

const AGENT_META = [
  {
    id: 'rm-advisor',
    name: 'RM Advisor',
    shortName: 'A1',
    role: 'Inventory and revenue action',
    accent: 'from-sky-500 to-cyan-300',
  },
  {
    id: 'competitor-fares',
    name: 'Competitor Fares',
    shortName: 'A2',
    role: 'Market fare freshness',
    accent: 'from-violet-500 to-fuchsia-300',
  },
  {
    id: 'policy-verifier',
    name: 'Policy Verifier',
    shortName: 'A3',
    role: 'Rules and citations',
    accent: 'from-emerald-500 to-lime-300',
  },
  {
    id: 'synthesizer',
    name: 'Synthesizer',
    shortName: 'A4',
    role: 'Verified RM response',
    accent: 'from-amber-500 to-orange-300',
  },
];

function detectRoute(query: string): string {
  const upper = query.toUpperCase();
  const route = upper.match(/DOH[-\s]([A-Z]{3})/);
  if (route) return `DOH-${route[1]}`;
  const known = Object.keys(MOCK_ROUTE_KPIS).find(r => upper.includes(r));
  return known || 'DOH-SFO';
}

function sourceList(): CitationSource[] {
  return [
    { name: 'Corp_Protection_Rule_4.2.pdf', matchScore: 99, type: 'Policy', citation: CITES.policy },
    { name: 'Dashboard_Route_KPI_Snapshot.json', matchScore: 97, type: 'Dashboard', citation: CITES.snapshot },
    { name: 'Google Flights Competitive Fares', matchScore: 94, type: 'Market', citation: CITES.market },
    { name: 'Q3_2025_Revenue_Report.pdf', matchScore: 91, type: 'Report', citation: CITES.report },
  ];
}

interface RouteVisualSnapshot {
  route: string;
  loadFactor: number;
  targetLoadFactor: number;
  loadGap: number;
  rask: number;
  raskTrend: number;
  yieldValue: number;
  yieldTrend: number;
  avgOurFare: number;
  avgCompetitorFare: number;
  fareGap: number;
  bestElasticityMove: string;
  bestElasticityRevenue: number;
  bestOverbooking: string;
  bestOverbookingValue: number;
  highNoShowRisk: number;
  netProfit: number;
  totalDeniedDemand: number;
  latestActualBookings: number;
  latestForecastBookings: number;
  peakOptimalFare: number;
}

interface RouteDecision {
  route: string;
  mode: RecommendationMode;
  action: string;
  rationale: string;
  confidence: number;
  evidence: string[];
  risks: string[];
  triggers: string[];
  rules: RuleCheck[];
  claims: VerifiedClaim[];
  sources: CitationSource[];
  counterfactuals: string[];
}

function buildAgentRuns(mode: RecommendationMode, routeLabel: string): AgentRun[] {
  const stale = mode === 'stale';
  const unknown = mode === 'unknown';
  const hold = mode === 'hold';
  const stimulate = mode === 'stimulate';
  const selective = mode === 'selective';
  const portfolio = mode === 'portfolio';

  return [
    {
      ...AGENT_META[0],
      status: unknown ? 'blocked' : stale ? 'warning' : 'complete',
      detail: unknown
        ? `No grounded route snapshot found for ${routeLabel}.`
        : portfolio
          ? 'Ranked all dashboard routes into sensible RM actions using the visual KPIs.'
        : stale
          ? `Prepared an inventory action for ${routeLabel}, then marked it review-only until market freshness is restored.`
          : hold
            ? `Rejected K/L/M closure for ${routeLabel} because load is still below target.`
            : stimulate
              ? `Prioritized demand stimulation for ${routeLabel} because the load gap is too large for closure.`
              : selective
                ? `Recommended selective controls for ${routeLabel}, not blanket K/L/M closure.`
            : `Recommended closing K/L/M on ${routeLabel} because load and pickup are above the protected threshold.`,
      auditEvents: unknown
        ? [
            `Searched active route snapshots for ${routeLabel}.`,
            'No booking curve, load factor, or inventory ladder found for this route.',
            'Stopped before generating an inventory action.',
          ]
        : portfolio
          ? [
              'Read KPI cards for DOH-SFO, DOH-JFK, DOH-LOS, DOH-PVG, and DOH-ZAG.',
              'Compared each route load factor against its target band.',
              'Mapped each route to hold, stimulate, selective protect, or monitor actions.',
            ]
        : hold
          ? [
              `Read dashboard KPI for ${routeLabel}.`,
              'Compared current load factor against the route target.',
              'Kept low inventory open because the route still needs demand capture.',
            ]
          : stimulate
            ? [
                `Read dashboard visuals for ${routeLabel}.`,
                'Found a large load-factor gap versus target.',
                'Recommended demand stimulation before any inventory restriction.',
              ]
            : selective
              ? [
                  `Read dashboard visuals for ${routeLabel}.`,
                  'Found load close enough to target for monitoring but not blanket closure.',
                  'Recommended selective fare-class protection with clear review triggers.',
                ]
          : [
            `Read dashboard KPI and booking visuals for ${routeLabel}.`,
            'Compared current load factor against target band and booking pace.',
            'Flagged only route-appropriate inventory actions.',
          ],
    },
    {
      ...AGENT_META[1],
      status: unknown ? 'blocked' : stale ? 'blocked' : 'complete',
      detail: unknown
        ? 'No competitor fare feed can be attached without a covered route.'
        : portfolio
          ? 'Compared competitor fare posture across the visible dashboard routes.'
        : stale
          ? 'Blocked the action because competitor fares are outside the freshness window.'
          : hold
            ? 'Checked market context for stimulation risk instead of closure support.'
            : stimulate
              ? 'Checked whether fare stimulation should be tactical rather than broad discounting.'
              : selective
                ? 'Checked competitor posture before recommending selective protection.'
            : 'Confirmed competitor fares are recent enough to support a pricing action.',
      auditEvents: unknown
        ? [
            'Skipped market comparison because route coverage failed.',
            'Marked competitor evidence as unavailable.',
          ]
        : portfolio
          ? [
              'Compared QR fare levels with competitor averages for each route.',
              'Flagged routes where demand capture matters more than fare-class closure.',
            ]
        : stale
          ? [
              'Checked Google Flights fare feed timestamp.',
              'Detected stale market feed beyond the accepted freshness window.',
              'Raised blocker: do not close inventory without fresh competitor context.',
            ]
          : hold
            ? [
                'Checked whether pricing action should protect share while load is below target.',
                'No fare-freshness blocker changes the inventory conclusion.',
                'Recommended monitoring competitor moves before raising fences.',
              ]
            : stimulate
              ? [
                  'Checked competitor fare gap and elasticity visual.',
                  'Recommended tactical stimulation only where elasticity supports it.',
                  'Kept fare integrity language for high-yield routes.',
                ]
              : selective
                ? [
                    'Checked competitor fare gap and current RASK trend.',
                    'Recommended route-specific monitoring before low-bucket closure.',
                  ]
            : [
              'Checked Google Flights fare feed timestamp for the dashboard route.',
              'Confirmed competitor freshness inside the dashboard route review window.',
              'No competitor undercut large enough to keep low buckets open.',
            ],
    },
    {
      ...AGENT_META[2],
      status: unknown ? 'blocked' : stale ? 'warning' : 'complete',
      detail: unknown
        ? 'Blocked verification because route-level claims cannot be cited.'
        : portfolio
          ? 'Verified each route recommendation against the existing dashboard visual datasets.'
        : stale
          ? 'Verified route and policy claims, but rejected the stale market claim.'
          : hold
            ? 'Verified that the load-factor claim argues against closure.'
            : stimulate
              ? 'Verified that the load gap and demand visuals support stimulation.'
              : selective
                ? 'Verified selective controls against load, yield, and risk visuals.'
            : 'Verified route, policy, market, and approval claims with citations.',
      auditEvents: unknown
        ? [
            'Applied route coverage rule.',
            'Blocked uncited claims from entering the final answer.',
          ]
        : portfolio
          ? [
              'Checked KPI, elasticity, overbooking, no-show, and unconstraining visuals.',
              'Blocked one-size-fits-all K/L/M closure logic.',
              'Verified route-specific actions instead.',
            ]
        : stale
          ? [
              'Checked corporate protection rule 4.2.',
              'Confirmed yield-floor and analyst approval checks still apply.',
              'Withheld one market claim because source freshness failed.',
            ]
          : hold
            ? [
                'Checked target-band logic before approving any closure language.',
                'Verified that current load is below target.',
                'Blocked the close-bucket recommendation as commercially inconsistent.',
              ]
            : stimulate
              ? [
                  'Verified that current load is materially below target.',
                  'Checked that the recommended action does not restrict demand prematurely.',
                  'Kept review triggers for when protection becomes reasonable.',
                ]
              : selective
                ? [
                    'Verified load is near, but still below, target.',
                    'Allowed selective protection language only with monitoring triggers.',
                  ]
            : [
              'Checked corporate protection rule 4.2.',
              'Confirmed yield floor remains protected after K/L/M closure.',
              'Verified 5/5 claims against cited sources.',
            ],
    },
    {
      ...AGENT_META[3],
      status: unknown || stale ? 'warning' : 'complete',
      detail: unknown
        ? 'Returned an abstention with the exact data refresh needed.'
        : portfolio
          ? 'Returned a portfolio action table for all visible dashboard routes.'
        : stale
          ? 'Returned a withheld recommendation and refresh trigger.'
          : hold
            ? 'Returned a verified hold/open recommendation instead of an over-restrictive action.'
            : stimulate
              ? 'Returned a demand-stimulation recommendation with route-specific controls.'
              : selective
                ? 'Returned a selective-protect recommendation with clear review gates.'
            : 'Merged the agent findings into a verified RM action card.',
      auditEvents: unknown
        ? [
            'Composed analyst-safe abstention.',
            'Listed required refreshes: route snapshot, booking curve, policy context, competitor feed.',
          ]
        : portfolio
          ? [
              'Synthesized one action per dashboard route.',
              'Kept each action aligned to the route visuals instead of a generic closure rule.',
            ]
        : stale
          ? [
              'Preserved useful RM rationale without authorizing the action.',
              'Added trigger to rerun after competitor feed refresh.',
            ]
          : hold
            ? [
                'Synthesized a demand-capture recommendation.',
                'Added triggers for when closure would become reasonable.',
              ]
            : stimulate
              ? [
                  'Synthesized open-inventory, stimulation, and monitoring actions.',
                  'Added review gates for target-band recovery.',
                ]
              : selective
                ? [
                    'Synthesized selective protection and monitoring actions.',
                    'Avoided blanket closure while route remains below target.',
                  ]
            : [
              'Synthesized action, rationale, risks, and reversal triggers.',
              'Kept analyst approval as a required final control.',
            ],
    },
  ];
}

function flattenAuditEvents(agentRuns: AgentRun[]): string[] {
  return agentRuns.flatMap(agent => agent.auditEvents.map(event => `${agent.name}: ${event}`));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getBestByValue<T extends { value: number }>(items: T[]): T {
  return items.reduce((best, item) => item.value > best.value ? item : best, items[0]);
}

function getRouteVisualSnapshot(route: string): RouteVisualSnapshot {
  const kpi = MOCK_ROUTE_KPIS[route];
  const competitorData = MOCK_COMPETITOR_DATA[route] || [];
  const elasticity = MOCK_ELASTICITY[route] || MOCK_ELASTICITY.DEFAULT;
  const overbooking = MOCK_OVERBOOKING[route] || MOCK_OVERBOOKING.DEFAULT;
  const noShow = MOCK_NOSHOW_BY_ROUTE[route] || MOCK_NOSHOW_BY_ROUTE.DEFAULT;
  const unconstraining = MOCK_UNCONSTRAINING_BY_ROUTE[route] || MOCK_UNCONSTRAINING_BY_ROUTE.DEFAULT;
  const waterfall = MOCK_WATERFALL_DATA[route] || MOCK_WATERFALL_DATA.DEFAULT;
  const bookingCurve = MOCK_BOOKING_CURVES[route] || [];
  const pricing = MOCK_PRICING_BY_ROUTE[route] || MOCK_PRICING_BY_ROUTE.DEFAULT;
  const bestElasticity = elasticity.reduce((best, item) => item.y > best.y ? item : best, elasticity[0]);
  const bestOverbooking = getBestByValue(overbooking);
  const netProfit = waterfall.find(item => item.name === 'Net Profit')?.value || 0;
  const latestCurve = bookingCurve[bookingCurve.length - 1];
  const peakOptimalFare = Math.max(...pricing.forecast.map(point => point.optimal));

  return {
    route,
    loadFactor: kpi.loadFactor,
    targetLoadFactor: kpi.targetLoadFactor,
    loadGap: kpi.targetLoadFactor - kpi.loadFactor,
    rask: kpi.rask,
    raskTrend: kpi.raskTrend,
    yieldValue: kpi.yield,
    yieldTrend: kpi.yieldTrend,
    avgOurFare: average(competitorData.map(item => item.ourPrice)),
    avgCompetitorFare: average(competitorData.map(item => item.compPrice)),
    fareGap: average(competitorData.map(item => item.ourPrice)) - average(competitorData.map(item => item.compPrice)),
    bestElasticityMove: `${bestElasticity.x > 0 ? '+' : ''}${bestElasticity.x}% price`,
    bestElasticityRevenue: bestElasticity.y,
    bestOverbooking: bestOverbooking.name,
    bestOverbookingValue: bestOverbooking.value,
    highNoShowRisk: noShow.risk.find(item => item.name === 'High Risk')?.value || 0,
    netProfit,
    totalDeniedDemand: unconstraining.reduce((sum, item) => sum + item.denial, 0),
    latestActualBookings: latestCurve?.actual || 0,
    latestForecastBookings: latestCurve?.forecast || 0,
    peakOptimalFare,
  };
}

function routeSources(route: string): CitationSource[] {
  return [
    { name: `${route}_Route_KPI_Snapshot.json`, matchScore: 99, type: 'Dashboard', citation: `[Dashboard KPI: ${route}]` },
    { name: `${route}_Elasticity_Visual.json`, matchScore: 96, type: 'Visual', citation: `[Visual E: ${route} price elasticity]` },
    { name: `${route}_Overbooking_Visual.json`, matchScore: 95, type: 'Visual', citation: `[Visual F: ${route} overbooking optimizer]` },
    { name: `${route}_NoShow_Profile.json`, matchScore: 93, type: 'Visual', citation: `[No-show visual: ${route} risk profile]` },
    { name: `${route}_Competitor_Fares.json`, matchScore: 90, type: 'Market', citation: `[Competitor tracker: ${route}]` },
  ];
}

function buildVisualClaims(snapshot: RouteVisualSnapshot, policyClaim: string): VerifiedClaim[] {
  return [
    {
      claim: `${snapshot.route} load factor is ${snapshot.loadFactor}% versus ${snapshot.targetLoadFactor}% target.`,
      citation: `[Dashboard KPI: ${snapshot.route}]`,
      grounded: true,
    },
    {
      claim: `${snapshot.route} RASK is ${snapshot.rask}c with ${snapshot.raskTrend > 0 ? '+' : ''}${snapshot.raskTrend}% trend; yield is ${snapshot.yieldValue}c with ${snapshot.yieldTrend > 0 ? '+' : ''}${snapshot.yieldTrend}% trend.`,
      citation: `[Dashboard KPI: ${snapshot.route} RASK/Yield]`,
      grounded: true,
    },
    {
      claim: `Elasticity visual favors ${snapshot.bestElasticityMove}, modeled at ${snapshot.bestElasticityRevenue > 0 ? '+' : ''}${snapshot.bestElasticityRevenue}% revenue response.`,
      citation: `[Visual E: ${snapshot.route} price elasticity]`,
      grounded: true,
    },
    {
      claim: `Overbooking visual peaks at ${snapshot.bestOverbooking} with $${snapshot.bestOverbookingValue.toLocaleString()} net value.`,
      citation: `[Visual F: ${snapshot.route} overbooking optimizer]`,
      grounded: true,
    },
    {
      claim: policyClaim,
      citation: CITES.policy,
      grounded: true,
    },
  ];
}

function buildRouteRules(snapshot: RouteVisualSnapshot, mode: RecommendationMode): RuleCheck[] {
  const targetStatus = snapshot.loadGap > 0 ? 'blocked' : 'pass';
  const targetDetail = snapshot.loadGap > 0
    ? `${snapshot.route} is ${snapshot.loadGap} points below target; do not use blanket K/L/M closure.`
    : `${snapshot.route} is at or above target; selective protection can be reviewed.`;
  const demandStatus = mode === 'stimulate' ? 'warning' : 'pass';

  return [
    { name: 'Target-band check', status: targetStatus, detail: targetDetail },
    { name: 'Elasticity check', status: demandStatus, detail: `Best modeled move is ${snapshot.bestElasticityMove} with ${snapshot.bestElasticityRevenue > 0 ? '+' : ''}${snapshot.bestElasticityRevenue}% response.` },
    { name: 'No-show / overbooking', status: snapshot.highNoShowRisk >= 45 ? 'warning' : 'pass', detail: `High-risk no-show share is ${snapshot.highNoShowRisk}%; best overbooking point is ${snapshot.bestOverbooking}.` },
    { name: 'Competitive fare watch', status: Math.abs(snapshot.fareGap) > 40 ? 'warning' : 'pass', detail: `Average QR fare is $${snapshot.avgOurFare}; competitor average is $${snapshot.avgCompetitorFare}.` },
  ];
}

function buildRouteDecision(route: string): RouteDecision {
  const snapshot = getRouteVisualSnapshot(route);
  const largeGap = snapshot.loadGap >= 10;
  const nearTarget = snapshot.loadGap > 0 && snapshot.loadGap <= 5;
  const highNoShow = snapshot.highNoShowRisk >= 45;
  const negativeYield = snapshot.yieldTrend < 0 || snapshot.raskTrend < 0;

  let mode: RecommendationMode = 'hold';
  let action = `Do not close K/L/M for ${route}; keep low buckets open and stimulate demand`;
  let rationale = `${route} is ${snapshot.loadGap} points below target load factor, so blanket closure would suppress demand before the route reaches its booking band.`;
  let confidence = 0.82;
  let evidence = [
    `${route} load factor is ${snapshot.loadFactor}% versus ${snapshot.targetLoadFactor}% target.`,
    `Best price-elasticity scenario is ${snapshot.bestElasticityMove}, modeled at ${snapshot.bestElasticityRevenue > 0 ? '+' : ''}${snapshot.bestElasticityRevenue}% revenue response.`,
    `Overbooking visual peaks at ${snapshot.bestOverbooking} with $${snapshot.bestOverbookingValue.toLocaleString()} value.`,
  ];
  let risks = [
    'Leaving low buckets open can dilute yield if late high-fare demand appears.',
    'Competitor fare moves should be monitored before changing fare fences.',
  ];
  let triggers = ['Load factor reaches target band', 'Pickup exceeds baseline for two snapshots', 'Competitor fare move >5%'];
  let counterfactuals = [
    'Switch to closure review only if load reaches the target band with sustained pickup.',
    'Protect higher fare classes if late demand appears, but do not close K/L/M at the current load factor.',
  ];
  let policyClaim = 'Inventory restriction should wait until target-band or displacement evidence supports it.';

  if (largeGap) {
    mode = 'stimulate';
    action = `${route}: keep K/L/M open, stimulate demand, and review pricing before inventory restriction`;
    rationale = `${route} is ${snapshot.loadGap} points below target, so the commercially sensible action is to fill the plane first while protecting yield with monitored tactical pricing.`;
    confidence = 0.84;
    evidence = [
      `${route} load factor is ${snapshot.loadFactor}% versus ${snapshot.targetLoadFactor}% target.`,
      `The pricing visual shows ${snapshot.bestElasticityMove} as the best response at ${snapshot.bestElasticityRevenue > 0 ? '+' : ''}${snapshot.bestElasticityRevenue}%.`,
      `Unconstraining visual shows ${snapshot.totalDeniedDemand} denied-demand seats across price points.`,
      `Net profit visual shows $${snapshot.netProfit.toLocaleString()} contribution, so stimulation should stay yield-aware.`,
    ];
    risks = [
      negativeYield ? 'Yield/RASK trend is soft, so stimulation should be targeted rather than a broad fare cut.' : 'Growth is positive, but deep discounts could train the market down.',
      highNoShow ? `High no-show risk is ${snapshot.highNoShowRisk}%, so pair stimulation with overbooking controls.` : 'Demand stimulation still needs competitor-fare monitoring.',
    ];
    triggers = ['Load gap narrows below 5 points', 'Pickup exceeds forecast for two snapshots', 'Yield trend turns negative after stimulation'];
    counterfactuals = [
      'If pickup accelerates and load enters the target band, shift from stimulation to selective protection.',
      'If competitor fares drop sharply, protect share through fare response rather than closing buckets.',
    ];
    policyClaim = 'Large load gaps favor demand stimulation and monitored pricing rather than inventory closure.';
  } else if (nearTarget) {
    mode = 'selective';
    action = `${route}: do not blanket-close K/L/M; selectively protect the lowest bucket and monitor pickup`;
    rationale = `${route} is only ${snapshot.loadGap} points below target, so RM should watch pickup closely and protect fare integrity selectively without shutting all low buckets.`;
    confidence = 0.8;
    evidence = [
      `${route} load factor is ${snapshot.loadFactor}% versus ${snapshot.targetLoadFactor}% target.`,
      `RASK trend is ${snapshot.raskTrend > 0 ? '+' : ''}${snapshot.raskTrend}% and yield trend is ${snapshot.yieldTrend > 0 ? '+' : ''}${snapshot.yieldTrend}%.`,
      `Best overbooking visual point is ${snapshot.bestOverbooking} with $${snapshot.bestOverbookingValue.toLocaleString()} value.`,
      `Competitor tracker averages QR at $${snapshot.avgOurFare} versus competitors at $${snapshot.avgCompetitorFare}.`,
    ];
    risks = [
      'Closing too early could leave the route short of target load.',
      'Keeping every low bucket open too long could dilute yield if late premium demand appears.',
    ];
    triggers = ['Load reaches target band', 'Pickup exceeds forecast for two snapshots', 'Competitor fare move >5%', 'Group request appears'];
    counterfactuals = [
      'If load reaches target with strong pickup, close only the lowest bucket first.',
      'If pickup weakens, reopen low inventory and use tactical stimulation.',
    ];
    policyClaim = 'Near-target routes can use selective protection, but blanket low-bucket closure needs stronger displacement evidence.';
  }

  if (route === 'DOH-LOS') {
    action = 'DOH-LOS: keep low buckets open, protect high-yield demand, and use overbooking controls';
    rationale = 'LOS is far below target but high-yield and high no-show, so the answer is not closure; it is controlled demand capture plus overbooking discipline.';
    risks = [
      `High no-show risk is ${snapshot.highNoShowRisk}%, so unconstrained demand must be converted carefully.`,
      'Yield and RASK trends are negative, so do not chase load with undisciplined discounting.',
    ];
    triggers = ['High-risk no-show share changes by 5 points', 'Yield trend stabilizes', 'Load gap narrows below 6 points'];
  }

  return {
    route,
    mode,
    action,
    rationale,
    confidence,
    evidence,
    risks,
    triggers,
    rules: buildRouteRules(snapshot, mode),
    claims: buildVisualClaims(snapshot, policyClaim),
    sources: routeSources(route),
    counterfactuals,
  };
}

function buildDashboardRouteClaims(route: string, loadFactor: number, targetLoadFactor: number): VerifiedClaim[] {
  return [
    {
      claim: `${route} current load factor is ${loadFactor}%.`,
      citation: `[Dashboard KPI: ${route} load factor]`,
      grounded: true,
    },
    {
      claim: `${route} target load factor is ${targetLoadFactor}%.`,
      citation: `[Dashboard KPI: ${route} target load factor]`,
      grounded: true,
    },
    {
      claim: 'Current load is below target, so closing low buckets would risk suppressing needed demand.',
      citation: `[RM rule: load factor ${loadFactor}% < target ${targetLoadFactor}%]`,
      grounded: true,
    },
    {
      claim: 'Low buckets should remain available unless forward pickup, event demand, or displacement risk justifies restriction.',
      citation: CITES.policy,
      grounded: true,
    },
  ];
}

function buildRules(abstained: boolean): RuleCheck[] {
  return [
    { name: 'Stale-data check', status: abstained ? 'blocked' : 'pass', detail: abstained ? 'Competitor feed is stale; refresh before recommending inventory closure.' : 'All cited dashboard and market inputs are within freshness thresholds.' },
    { name: 'Yield floor', status: 'pass', detail: 'Recommended action avoids selling below protected yield floor.' },
    { name: 'Corporate protection', status: 'pass', detail: 'J/C/D and corporate allotment remain open; only K/L/M are affected.' },
    { name: 'Analyst approval', status: 'warning', detail: 'Action is material enough to require analyst review before filing.' },
  ];
}

function buildHoldRules(route: string, loadFactor: number, targetLoadFactor: number): RuleCheck[] {
  return [
    { name: 'Target-band check', status: 'blocked', detail: `${route} is at ${loadFactor}% load factor versus ${targetLoadFactor}% target; do not close low buckets on load factor alone.` },
    { name: 'Demand capture', status: 'pass', detail: 'Keep lower classes available to continue building load unless pickup accelerates materially.' },
    { name: 'Fare monitoring', status: 'warning', detail: 'Monitor competitor fare moves and pickup pace before raising fences.' },
    { name: 'Analyst approval', status: 'pass', detail: 'No restrictive inventory action is being filed.' },
  ];
}

function buildVerifiedRecommendation(
  status: RecommendationStatus,
  action: string,
  rationale: string,
  confidence: number,
  groundingScore: number,
  evidence: string[],
  risks: string[],
  triggers: string[],
): VerifiedRecommendation {
  return {
    status,
    action,
    rationale,
    confidence,
    groundingScore,
    evidence,
    risks,
    triggers,
  };
}

function attachTrace(response: Omit<AIResponse, 'trace' | 'auditEvents'> & { agentRuns: AgentRun[] }): AIResponse {
  return {
    ...response,
    trace: response.agentRuns.map(({ name, role, status, detail }) => ({ name, role, status, detail })),
    auditEvents: flattenAuditEvents(response.agentRuns),
  };
}

export async function getAIResponse(
  userMessage: string,
  _conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AIResponse> {
  const query = userMessage.toLowerCase();
  const wantsPortfolio = query.includes('all routes') || query.includes('all the routes') || query.includes('dashboard routes') || query.includes('portfolio');
  const route = detectRoute(userMessage);
  const isKnownDemoRoute = Boolean(MOCK_ROUTE_KPIS[route]);
  const staleRequested = query.includes('stale') || query.includes('outdated') || query.includes('missing competitor');

  await new Promise(resolve => setTimeout(resolve, 250));

  if (wantsPortfolio) {
    const routeDecisions = Object.keys(MOCK_ROUTE_KPIS).map(buildRouteDecision);
    const agentRuns = buildAgentRuns('portfolio', 'all dashboard routes');
    const summaryLines = routeDecisions.map(decision => decision.action);
    const verifiedRecommendation = buildVerifiedRecommendation(
      'verified',
      'Use route-specific RM actions; do not apply one blanket K/L/M closure rule',
      'The dashboard routes have different load gaps, yield trends, elasticity, no-show risk, and overbooking profiles, so each route needs its own RM action.',
      0.87,
      100,
      summaryLines,
      [
        'A one-size closure rule would suppress demand on below-target routes.',
        'Stimulation actions need yield and competitor monitoring to avoid dilution.',
      ],
      ['Route reaches target load band', 'Competitor fare move >5%', 'Pickup changes for two snapshots', 'No-show risk changes by 5 points'],
    );

    return attachTrace({
      content: `Verified portfolio recommendation: ${verifiedRecommendation.action}. ${summaryLines.join(' ')}`,
      recommendation: verifiedRecommendation.action,
      confidence: verifiedRecommendation.confidence,
      abstained: false,
      faithfulnessScore: verifiedRecommendation.groundingScore,
      sources: Object.keys(MOCK_ROUTE_KPIS).map(routeCode => ({
        name: `${routeCode}_Dashboard_Visuals.json`,
        matchScore: 96,
        type: 'Dashboard',
        citation: `[Dashboard visuals: ${routeCode}]`,
      })),
      agentRuns,
      verifiedRecommendation,
      claims: routeDecisions.flatMap(decision => decision.claims.slice(0, 2)),
      rules: [
        { name: 'Portfolio segmentation', status: 'pass', detail: 'Each route receives its own action based on target gap, yield/RASK trend, elasticity, and risk visuals.' },
        { name: 'Blanket closure guardrail', status: 'blocked', detail: 'Do not close K/L/M across all dashboard routes because every route is currently below its target load factor.' },
        { name: 'Visual grounding', status: 'pass', detail: 'Actions use KPI, pricing, elasticity, overbooking, no-show, competitor, and unconstraining visuals.' },
      ],
      objections: verifiedRecommendation.risks,
      counterfactuals: routeDecisions.map(decision => `${decision.route}: ${decision.counterfactuals[0]}`),
      reviewTriggers: verifiedRecommendation.triggers,
    });
  }

  if (!isKnownDemoRoute) {
    const agentRuns = buildAgentRuns('unknown', route);
    const verifiedRecommendation = buildVerifiedRecommendation(
      'withheld',
      'Abstain pending route data refresh',
      `I do not have a grounded snapshot for ${route}, so I would not make an RM recommendation yet.`,
      0,
      100,
      ['Route coverage check failed before any uncited recommendation was produced.'],
      ['A recommendation without route-level evidence would look overconfident to analysts.'],
      ['Refresh route snapshot', 'Refresh booking curve', 'Attach competitor feed'],
    );

    return attachTrace({
      content: `${verifiedRecommendation.action}. Refresh the route snapshot, booking curve, policy context, and competitor feed first.`,
      recommendation: verifiedRecommendation.action,
      confidence: verifiedRecommendation.confidence,
      abstained: true,
      faithfulnessScore: verifiedRecommendation.groundingScore,
      sources: MOCK_RAG_METRICS.sources,
      agentRuns,
      verifiedRecommendation,
      claims: [],
      rules: [{ name: 'Route coverage', status: 'blocked', detail: `${route} is not present in the current cited snapshot set.` }],
      objections: verifiedRecommendation.risks,
      counterfactuals: ['If a current route snapshot is loaded, rerun the RM Advisor, Competitor Fares, Policy Verifier, and Synthesizer pipeline.'],
      reviewTriggers: verifiedRecommendation.triggers,
    });
  }

  const abstained = staleRequested;
  const kpi = MOCK_ROUTE_KPIS[route];
  const snapshotText = `${route} with ${kpi.loadFactor}% load factor versus ${kpi.targetLoadFactor}% target`;

  if (!abstained) {
    const decision = buildRouteDecision(route);
    const agentRuns = buildAgentRuns(decision.mode, snapshotText);
    const verifiedRecommendation = buildVerifiedRecommendation(
      'verified',
      decision.action,
      decision.rationale,
      decision.confidence,
      100,
      decision.evidence,
      decision.risks,
      decision.triggers,
    );

    return attachTrace({
      content: `Verified recommendation: ${verifiedRecommendation.action}. ${verifiedRecommendation.rationale}`,
      recommendation: verifiedRecommendation.action,
      confidence: verifiedRecommendation.confidence,
      abstained: false,
      faithfulnessScore: verifiedRecommendation.groundingScore,
      sources: decision.sources,
      agentRuns,
      verifiedRecommendation,
      claims: decision.claims,
      rules: decision.rules,
      objections: verifiedRecommendation.risks,
      counterfactuals: decision.counterfactuals,
      reviewTriggers: verifiedRecommendation.triggers,
    });
  }

  if (abstained) {
    const decision = buildRouteDecision(route);
    const agentRuns = buildAgentRuns('stale', snapshotText);
    const verifiedRecommendation = buildVerifiedRecommendation(
      'withheld',
      'Recommendation withheld until competitor fares refresh',
      `The RM Advisor can evaluate ${route} using the dashboard visuals, but the Policy Verifier cannot ground the competitor-fare claim because the market feed is stale.`,
      0.61,
      80,
      [
        `${route} load, target, elasticity, overbooking, and no-show claims are grounded.`,
        'The market-fare freshness rule failed and blocks the action.',
      ],
      [
        ...decision.risks.slice(0, 1),
        'Any inventory or pricing action without fresh competitor fares could misread market position.',
      ],
      ['Competitor feed refresh', ...decision.triggers.slice(0, 2)],
    );

    return attachTrace({
      content: `${verifiedRecommendation.action}. Refresh the fare feed, then rerun the decision.`,
      recommendation: 'Abstain until competitor fares refresh',
      confidence: verifiedRecommendation.confidence,
      abstained: true,
      faithfulnessScore: verifiedRecommendation.groundingScore,
      sources: decision.sources,
      agentRuns,
      verifiedRecommendation,
      claims: [
        ...decision.claims.slice(0, 4),
        {
          claim: 'Competitor fares are current enough for a pricing action.',
          citation: 'null - stale market feed',
          grounded: false,
        },
      ],
      rules: [
        { name: 'Stale-data check', status: 'blocked', detail: `${route} competitor fare feed is stale; refresh before filing any inventory or pricing action.` },
        ...decision.rules.slice(0, 3),
      ],
      objections: verifiedRecommendation.risks,
      counterfactuals: [
        `If ${route} competitor fares refresh inside the freshness window, rerun the route-specific recommendation.`,
        ...decision.counterfactuals.slice(0, 2),
      ],
      reviewTriggers: verifiedRecommendation.triggers,
    });
  }
}
