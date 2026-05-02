import { MOCK_ROUTE_KPIS, MOCK_RAG_METRICS } from './mockData';

type AgentStatus = 'complete' | 'warning' | 'blocked';

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

export interface AIResponse {
  content: string;
  faithfulnessScore: number;
  sources: CitationSource[];
  recommendation?: string;
  confidence?: number;
  abstained?: boolean;
  trace?: AgentTraceStep[];
  claims?: VerifiedClaim[];
  rules?: RuleCheck[];
  objections?: string[];
  counterfactuals?: string[];
  reviewTriggers?: string[];
}

const RM_DEMO_SNAPSHOT = {
  route: 'DOH-LHR',
  flight: 'QR123',
  horizon: 'D-7',
  cabin: 'Economy',
  currentLoadFactor: 91,
  forecastLoadFactor: 96,
  bookingPickup: '+14% vs last 7-day baseline',
  lowestOpenClasses: 'K/L/M',
  competitorFreshnessHours: 2,
  corporateShare: 31,
  eventRisk: 'Moderate',
  timestamp: '2026-01-28 09:00 AST',
};

const CITES = {
  snapshot: '[Dashboard Snapshot: 2026-01-28 09:00 AST - QR123 DOH-LHR Economy]',
  policy: '[Doc: Corp_Protection_Rule_4.2.pdf section 4.2]',
  curve: '[Dashboard Snapshot: 2026-01-28 09:00 AST - booking curve]',
  market: '[Google Flights API: 2026-01-28 08:45 AST]',
  report: '[Doc: Q3_2025_Revenue_Report.pdf section Europe O&D]',
};

function detectRoute(query: string): string {
  const upper = query.toUpperCase();
  const route = upper.match(/DOH[-\s]([A-Z]{3})/);
  if (route) return `DOH-${route[1]}`;
  if (upper.includes('LHR') || upper.includes('QR123')) return 'DOH-LHR';
  const known = Object.keys(MOCK_ROUTE_KPIS).find(r => upper.includes(r));
  return known || 'DOH-LHR';
}

function sourceList(): CitationSource[] {
  return [
    { name: 'Corp_Protection_Rule_4.2.pdf', matchScore: 99, type: 'Policy', citation: CITES.policy },
    { name: 'QR123_Booking_Curve_Snapshot.json', matchScore: 97, type: 'Dashboard', citation: CITES.curve },
    { name: 'Google Flights Competitive Fares', matchScore: 94, type: 'Market', citation: CITES.market },
    { name: 'Q3_2025_Revenue_Report.pdf', matchScore: 91, type: 'Report', citation: CITES.report },
  ];
}

function buildTrace(abstained: boolean): AgentTraceStep[] {
  return [
    {
      name: 'Advisor',
      role: 'Initial RM action',
      status: abstained ? 'warning' : 'complete',
      detail: abstained
        ? 'Drafted a recommendation but marked it unsafe because a required market input is stale.'
        : 'Proposed closing K/L/M while keeping analyst approval in the loop.',
    },
    {
      name: 'Critic',
      role: 'RM objection review',
      status: 'complete',
      detail: 'Challenged whether pickup is event-driven and whether corporate protection could be harmed.',
    },
    {
      name: 'Rules Engine',
      role: 'Deterministic checks',
      status: abstained ? 'blocked' : 'complete',
      detail: abstained
        ? 'Blocked recommendation because competitor fare data exceeded the freshness threshold.'
        : 'Checked stale data, corporate protection, yield floor, and approval threshold.',
    },
    {
      name: 'Verifier',
      role: 'Claim grounding',
      status: abstained ? 'warning' : 'complete',
      detail: abstained ? 'Verified 4/5 claims; stale competitor claim withheld.' : 'Verified 5/5 claims with citations.',
    },
    {
      name: 'Synthesizer',
      role: 'Analyst response',
      status: 'complete',
      detail: abstained ? 'Returned an abstention with refresh trigger.' : 'Produced final rationale and counterfactual triggers.',
    },
  ];
}

function buildClaims(abstained: boolean): VerifiedClaim[] {
  return [
    {
      claim: 'QR123 DOH-LHR is inside the D-7 decision window.',
      citation: CITES.snapshot,
      grounded: true,
    },
    {
      claim: 'Forecast load factor is above the analyst target band.',
      citation: CITES.snapshot,
      grounded: true,
    },
    {
      claim: 'Recent pickup is stronger than the last 7-day baseline.',
      citation: CITES.curve,
      grounded: true,
    },
    {
      claim: 'Corporate protection must be preserved before closing lower classes.',
      citation: CITES.policy,
      grounded: true,
    },
    {
      claim: abstained ? 'Competitor fares are current enough for a pricing action.' : 'Competitor fares were refreshed within the freshness window.',
      citation: abstained ? 'null - stale market feed' : CITES.market,
      grounded: !abstained,
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

export async function getAIResponse(
  userMessage: string,
  _conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AIResponse> {
  const query = userMessage.toLowerCase();
  const route = detectRoute(userMessage);
  const isKnownDemoRoute = route === 'DOH-LHR' || Boolean(MOCK_ROUTE_KPIS[route]);
  const staleRequested = query.includes('stale') || query.includes('outdated') || query.includes('missing competitor');

  await new Promise(resolve => setTimeout(resolve, 350));

  if (!isKnownDemoRoute) {
    return {
      content: `I do not have a grounded snapshot for ${route}, so I would not make an RM recommendation yet. Refresh the route snapshot, booking curve, policy context, and competitor feed first.`,
      recommendation: 'Abstain pending route data refresh',
      confidence: 0,
      abstained: true,
      faithfulnessScore: 100,
      sources: MOCK_RAG_METRICS.sources,
      trace: buildTrace(true),
      claims: [],
      rules: [{ name: 'Route coverage', status: 'blocked', detail: `${route} is not present in the current cited snapshot set.` }],
      objections: ['A recommendation without route-level evidence would look overconfident to analysts.'],
      counterfactuals: ['If a current route snapshot is loaded, rerun the Advisor/Critic/Verifier pipeline.'],
      reviewTriggers: ['Route data becomes available', 'Competitor feed refresh completes'],
    };
  }

  const abstained = staleRequested;
  const kpi = MOCK_ROUTE_KPIS[route];
  const snapshotText = route === 'DOH-LHR'
    ? `${RM_DEMO_SNAPSHOT.flight} ${RM_DEMO_SNAPSHOT.route} ${RM_DEMO_SNAPSHOT.horizon}`
    : `${route} with ${kpi.loadFactor}% load factor versus ${kpi.targetLoadFactor}% target`;

  if (abstained) {
    return {
      content: `Recommendation withheld. The Advisor would normally evaluate whether to close K/L/M on ${snapshotText}, but the Verifier cannot ground the competitor-fare claim because the market feed is stale. Refresh the fare feed, then rerun the decision.`,
      recommendation: 'Abstain until competitor fares refresh',
      confidence: 0.61,
      abstained: true,
      faithfulnessScore: 80,
      sources: sourceList(),
      trace: buildTrace(true),
      claims: buildClaims(true),
      rules: buildRules(true),
      objections: [
        'Recent pickup could be event-driven rather than durable demand.',
        'Closing low buckets without fresh competitor fares could overprice against the market.',
      ],
      counterfactuals: [
        'If Google Flights refreshes inside the freshness window and QR remains below the market ceiling, rerun closure recommendation.',
        'If competitor fares drop more than 5%, keep L open and review again in 2 hours.',
      ],
      reviewTriggers: ['Competitor feed refresh', 'Pickup normalizes for two snapshots', 'Analyst overrides corporate protection rule'],
    };
  }

  return {
    content: `Recommendation: close K/L/M for ${snapshotText}, subject to analyst approval. The rationale is that forecast load is above target, recent pickup is running hot, and the yield-floor/corporate-protection checks pass. The Critic's main objection is valid: if pickup is event-driven or competitor fares fall, this should flip to a hold instead of an automatic closure.`,
    recommendation: 'Close K/L/M with analyst approval',
    confidence: 0.86,
    abstained: false,
    faithfulnessScore: 100,
    sources: sourceList(),
    trace: buildTrace(false),
    claims: buildClaims(false),
    rules: buildRules(false),
    objections: [
      'Recent pickup may be event-driven, so do not treat it as durable demand without the next snapshot.',
      'Corporate demand needs protected availability; avoid closing higher corporate classes.',
    ],
    counterfactuals: [
      'Flip to hold if competitor fares drop more than 5%.',
      'Reopen M if pickup falls below baseline for two consecutive snapshots.',
      'Escalate approval if forecast load factor crosses 98%.',
    ],
    reviewTriggers: ['Competitor fare move >5%', 'Forecast load changes by 2 points', 'New group request above 12 seats', 'Policy override requested'],
  };
}
