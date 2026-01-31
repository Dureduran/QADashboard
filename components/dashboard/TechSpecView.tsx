
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, ComposedChart, Area, ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { AlertCircle, ArrowUp, ArrowDown, CheckCircle2, FileText, Lightbulb, Zap } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

interface SpecData {
  title: string;
  description: string;
  question: string;
  data: string[];
  model: string[];
  scenario: {
      problem: string;
      action: string;
      uplift: string;
  };
}

const SPECS: Record<string, SpecData> = {
  "Load Factor & RASK Gauges": {
    title: "Visual A: Load Factor, RASK & Yield Gauges",
    description: "Radial progress bars and sparklines showing current performance vs. targets for Load Factor (%), RASK (Revenue per Available Seat Kilometer), and Yield (Revenue per Passenger Kilometer).",
    question: "Is this route currently performing on target? Are we filling seats (Load Factor) at a high enough price point (Yield), or are we sacrificing one for the other?",
    data: [
      "Capacity (Total seats)",
      "Booked_Pax (Current bookings)",
      "Total_Revenue (Sum of ticketed fares)",
      "ASK (Available Seat Kilometers = Capacity × Distance)",
      "RPK (Revenue Passenger Kilometers = Booked_Pax × Distance)"
    ],
    model: [
      "Efficiency Index: RASK / (Yield × Load Factor) correlation check.",
      "Dilution Alert: Triggered when Load Factor > 90% but RASK < Target (indicating 'empty calories' or underpricing).",
      "Trend Regression: 7-day rolling slope analysis to predict month-end landing."
    ],
    scenario: {
        problem: "DOH-JFK shows 95% Load Factor but Yield is 10% below budget. The flight is full, but revenue is low.",
        action: "Algorithm flags 'High Demand / Low Price'. RM Analyst raises the floor price (closes lower fare buckets) for the remaining 5% of inventory.",
        uplift: "Recaptures ~$15,000 per flight by forcing late-booking high-yield passengers into premium fare classes instead of sold-out cheap seats."
    }
  },
  "Booking Pace (S-Curve)": {
    title: "Visual B: Booking Pace (The \"S-Curve\")",
    description: "A multi-line chart comparing Actual (Current Cumulative Bookings), Forecast (Predicted booking path), and Last Year (Historical reference).",
    question: "Are bookings coming in faster or slower than expected? Do we need to panic-sell or hold out for high yield?",
    data: [
      "Historical booking logs (Ticket issuance date vs. Flight Departure Date)",
      "Current PNR creation timestamps",
      "Seasonality Indices"
    ],
    model: [
      "Velocity Monitoring: Calculating the 1st derivative of the booking curve (pick-up rate) daily.",
      "Variance Analysis: Alert triggers if Actual > Forecast + 1.5σ (Standard Deviations).",
      "S-Curve Fitting: Logistic function regression $P(t) = \frac{L}{1 + e^{-k(t-t_0)}}$."
    ],
    scenario: {
        problem: "Bookings for DOH-LHR are 20% ahead of Last Year at 60 days out. Standard forecast assumes normal pace.",
        action: "Model identifies 'Premature Sell-Out Risk'. System recommends restricting discount economy classes (O, Q, T) immediately.",
        uplift: "Prevents selling out the plane 2 weeks early at low fares. Saves last 30 seats for business travelers paying 3x fare. Est. Impact: +$25k revenue."
    }
  },
  "Competitor Price Tracker": {
    title: "Visual C: Competitor Price Tracker",
    description: "A line chart overlaying Qatar Airways' lowest filed fare vs. primary competitor (e.g., Emirates/Etihad) and the Market Average.",
    question: "Are we losing load factor because we are priced out of the market, or are we leaving money on the table by being too cheap?",
    data: [
      "Real-time scraped fare data (Infare/QL2 APIs)",
      "ATPCO GDS Filing feeds",
      "Market Share data (MIDT)"
    ],
    model: [
      "Market Position Index (MPI): $\frac{\text{Our Price}}{\text{Competitor Price}}$.",
      "Price Following Logic: Rules engine that recommends matching drops only if Load Factor < Threshold.",
      "Brand Premium Estimation: Historic willingness-to-pay delta over market average."
    ],
    scenario: {
        problem: "Competitor drops fares by $50 on DOH-BKK. Our automated rule would normally match it.",
        action: "Tracker shows our Load Factor is steady despite the gap. Algorithm recommends 'Hold Price' (do not match).",
        uplift: "Avoids unnecessary yield dilution. We keep pricing $50 higher for 200 pax, saving $10,000 in revenue that would have been lost in a price war."
    }
  },
  "Route Profitability Waterfall": {
    title: "Visual D: Route Profitability Waterfall",
    description: "A floating bar chart that starts with 'Base Fare Revenue' and adds/subtracts components (Fuel, Ancillaries, Spoilage, Ops Cost) to arrive at 'Net Profit'.",
    question: "Why is this route underperforming? Is it a revenue problem (low fares) or a cost problem (high fuel/ops)?",
    data: [
      "Revenue Accounting data (Prorated fares)",
      "Direct Operating Costs (DOC - Fuel, Landing fees)",
      "Ancillary revenue feeds (Baggage, Seats)"
    ],
    model: [
      "Contribution Margin Analysis: Isolating variable vs. fixed costs.",
      "Spoilage Costing: Calculating (Unsold Seats × Avg Marginal Revenue) as an opportunity cost.",
      "Ancillary Penetration: Rate of non-ticket spend per pax."
    ],
    scenario: {
        problem: "DOH-LOS has high revenue but breaks even due to 'Spoilage' (15 unsold Business seats per flight).",
        action: "Waterfall highlights Spoilage cost > Marginal upgrade cost. System triggers 'Aggressive Upgrade' offers at T-24 hours.",
        uplift: "Sells 10 upgrades at $400 each. Adds $4,000 pure profit per flight from inventory that would otherwise fly empty."
    }
  },
  "Price Elasticity Scatter": {
    title: "Visual E: Price Elasticity Scatter Plot",
    description: "A scatter plot where X-Axis is Price Change (%) and Y-Axis is Revenue Uplift (%). Green points indicate optimal scenarios.",
    question: "If I drop the price by 5% to stimulate demand on the Lagos route, will the volume increase enough to offset the lower yield?",
    data: [
      "Historical transaction logs: Price offered vs. Conversion rate",
      "Competitor price changes vs. Our volume shifts"
    ],
    model: [
      "Log-Log Regression: Estimating Price Elasticity of Demand (PED) $\epsilon = \frac{\%\Delta Q}{\%\Delta P}$.",
      "Iso-Revenue Curve: Identifying points where elasticity = -1 (revenue max).",
      "Segmentation: Calculating separate elasticities for Leisure vs. Business."
    ],
    scenario: {
        problem: "Load factor on DOH-ZAG is weak (65%). Analyst considers a 10% promo.",
        action: "Model shows PED is -1.8 (Highly Elastic). A 10% price drop predicts an 18% volume increase.",
        uplift: "Revenue = Price(0.9) * Vol(1.18) = 1.062 (+6.2% Revenue). The promo is greenlit, generating incremental cash flow."
    }
  },
  "Overbooking Risk Histogram": {
    title: "Visual F: Revenue vs. Risk Histogram",
    description: "A bar chart showing the 'Net Financial Result' for different levels of overbooking. Green Bars = Revenue gained > Cost; Red Bars = Cost > Revenue.",
    question: "How aggressively can I overbook flight QR007 to Zagreb without risking expensive compensation payouts?",
    data: [
      "Historical No-Show / Go-Show rates",
      "Distribution of connections (Tight vs. Loose)",
      "Cost of Denied Boarding (DBC) (EU261, Vouchers, Hotel)"
    ],
    model: [
      "Newsvendor Model: Balancing Cost of Underage (Empty Seat) vs. Cost of Overage (Denied Boarding).",
      "Monte Carlo Simulation: Running 10,000 flight instances to calculate Expected Monetary Value (EMV).",
      "Tail Risk Analysis: Assessing probability of >3 denied boardings."
    ],
    scenario: {
        problem: "Flight is full at capacity (300/300). Historical no-show rate is 5%.",
        action: "Model predicts 99% probability that <296 pax show up. Recommends increasing auth capacity to 305.",
        uplift: "Sells 5 extra seats at $800 avg fare = +$4,000 revenue. Expected cost of compensation is <$200. Net gain: ~$3,800."
    }
  },
  "RAG Faithfulness & Sources": {
    title: "Visual G & H: RAG Faithfulness Gauge & Sources Panel",
    description: "A linear gauge (0-100%) indicating trust score, and a side panel listing specific documents (e.g., 'Corporate Protection Rule 4.2') with relevance scores.",
    question: "Can I trust this AI recommendation, or is it hallucinating? Where did the AI get this information?",
    data: [
      "User Query Vector",
      "Document Chunk Vectors (Knowledge Base)",
      "LLM Generated Answer"
    ],
    model: [
      "Cosine Similarity: Measuring distance between Query and Source Context.",
      "Entailment Scoring (NLI): Verifying if the Answer is logically supported by the Context.",
      "Citation Precision: % of sentences directly supported by a source."
    ],
    scenario: {
        problem: "Agent asks if a specific 'Promo Fare' allows refunds. Policies are complex and change often.",
        action: "RAG retrieves the exact PDF clause 'Rule 4.2: Non-refundable'. Faithfulness score is 98%.",
        uplift: "Prevents Revenue Leakage. An incorrect refund of a non-ref ticket costs the airline $1,000+. Accurate enforcement protects this revenue."
    }
  }
};

const SpecVisual = ({ viewKey }: { viewKey: string }) => {
    // MOCK DATA GENERATION FOR VISUALS
    
    // B: Booking Pace
    const paceData = [
        { daysOut: 90, actual: 5, forecast: 5, ly: 4 },
        { daysOut: 75, actual: 12, forecast: 15, ly: 10 },
        { daysOut: 60, actual: 25, forecast: 28, ly: 22 },
        { daysOut: 45, actual: 45, forecast: 42, ly: 38 },
        { daysOut: 30, actual: 68, forecast: 65, ly: 60 },
        { daysOut: 15, actual: 82, forecast: 80, ly: 78 },
        { daysOut: 0, actual: null, forecast: 95, ly: 92 },
    ];

    // C: Competitor
    const compData = [
        { date: 'Mon', ourPrice: 1350, compPrice: 1420, marketAvg: 1380 },
        { date: 'Tue', ourPrice: 1350, compPrice: 1390, marketAvg: 1360 },
        { date: 'Wed', ourPrice: 1350, compPrice: 1250, marketAvg: 1320 },
        { date: 'Thu', ourPrice: 1290, compPrice: 1250, marketAvg: 1280 },
        { date: 'Fri', ourPrice: 1290, compPrice: 1250, marketAvg: 1280 },
        { date: 'Sat', ourPrice: 1450, compPrice: 1490, marketAvg: 1460 },
        { date: 'Sun', ourPrice: 1450, compPrice: 1490, marketAvg: 1460 },
    ];

    // D: Waterfall
    const waterfallChartData = [
        { name: 'Base Fare', start: 0, end: 45000, color: '#3b82f6' },
        { name: 'Fuel (+)', start: 45000, end: 12000, color: '#10b981' },
        { name: 'Ancillary (+)', start: 57000, end: 5000, color: '#10b981' },
        { name: 'Spoilage (-)', start: 58000, end: 4000, color: '#ef4444' }, // Visualize down
        { name: 'Ops Cost (-)', start: 33000, end: 25000, color: '#ef4444' },
        { name: 'Net Profit', start: 0, end: 33000, color: '#8b5cf6' }
    ];

    // E: Elasticity
    const elasticityData = [
        { x: -10, y: 15, z: 100 },
        { x: -5, y: 8, z: 200 },
        { x: 0, y: 0, z: 500 }, // Current
        { x: 5, y: -12, z: 200 },
        { x: 10, y: -25, z: 100 },
    ];

    // F: Overbooking Risk
    const overbookingData = [
        { name: '+2 Seats', value: 1200, type: 'gain' },
        { name: '+4 Seats', value: 2100, type: 'gain' },
        { name: '+6 Seats', value: 1500, type: 'gain' },
        { name: '+8 Seats', value: -800, type: 'loss' },
        { name: '+10 Seats', value: -2500, type: 'loss' },
    ];

    switch (viewKey) {
        case "Load Factor & RASK Gauges":
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-48">
                     <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-5 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Load Factor</p>
                                    <div className="text-3xl font-bold text-slate-50 mt-1">82%</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">Target</div>
                                    <div className="text-sm font-semibold text-emerald-400">90%</div>
                                </div>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden relative">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: '82%' }} />
                                <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: '90%' }} />
                            </div>
                            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500"/> Utilization healthy
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-5 flex flex-col justify-between h-full">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">RASK</p>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-slate-50 mt-1">9.8¢</div>
                                    <span className="text-xs text-emerald-400 font-bold flex items-center"><ArrowUp className="w-3 h-3"/> 4.2%</span>
                                </div>
                            </div>
                            <div className="h-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[{v:9},{v:9.2},{v:9.1},{v:9.4},{v:9.8}]}>
                                        <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-5 flex flex-col justify-between h-full">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Yield</p>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-slate-50 mt-1">11.5¢</div>
                                    <span className="text-xs text-emerald-400 font-bold flex items-center"><ArrowUp className="w-3 h-3"/> 1.2%</span>
                                </div>
                            </div>
                            <div className="h-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[{v:11},{v:11.1},{v:11.2},{v:11.4},{v:11.5}]}>
                                        <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );

        case "Booking Pace (S-Curve)":
            return (
                <div className="h-64 w-full bg-slate-900 border border-slate-800 rounded-xl p-4">
                     <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={paceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="daysOut" reversed label={{ value: 'Days Out', position: 'insideBottomRight', offset: -5, fontSize: 10 }} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Area type="monotone" dataKey="actual" name="Actual" fill="#8b0050" fillOpacity={0.2} stroke="#8b0050" strokeWidth={3} />
                          <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          <Line type="monotone" dataKey="ly" name="Last Year" stroke="#64748b" strokeWidth={2} dot={false} />
                      </ComposedChart>
                  </ResponsiveContainer>
                </div>
            );

        case "Competitor Price Tracker":
            return (
                 <div className="h-64 w-full bg-slate-900 border border-slate-800 rounded-xl p-4">
                     <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={compData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Line type="step" dataKey="ourPrice" name="Qatar Airways" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                          <Line type="monotone" dataKey="compPrice" name="Competitor" stroke="#ef4444" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="marketAvg" name="Market Avg" stroke="#64748b" strokeDasharray="3 3" dot={false} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
            );

        case "Route Profitability Waterfall":
             return (
                 <div className="h-64 w-full bg-slate-900 border border-slate-800 rounded-xl p-4">
                     <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waterfallChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                          <Bar dataKey="start" stackId="a" fill="transparent" />
                          <Bar dataKey="end" stackId="a">
                             {waterfallChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                </div>
            );
        
        case "Price Elasticity Scatter":
            return (
                 <div className="h-64 w-full bg-slate-900 border border-slate-800 rounded-xl p-4">
                     <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" dataKey="x" name="Price Change" unit="%" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis type="number" dataKey="y" name="Revenue Uplift" unit="%" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <ReferenceLine y={0} stroke="#475569" />
                        <ReferenceLine x={0} stroke="#475569" />
                        <Scatter name="Scenarios" data={elasticityData} fill="#8884d8">
                            {elasticityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.y > 0 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                </div>
            );
        
        case "Overbooking Risk Histogram":
            return (
                 <div className="h-64 w-full bg-slate-900 border border-slate-800 rounded-xl p-4">
                     <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overbookingData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                          <ReferenceLine y={0} stroke="#475569" />
                          <Bar dataKey="value">
                             {overbookingData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#ef4444'} />
                             ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                </div>
            );

        case "RAG Faithfulness & Sources":
            return (
                <div className="h-64 w-full bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row gap-8 items-center justify-center">
                    {/* Gauge */}
                    <div className="relative w-48 h-24 flex items-end justify-center overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-full rounded-t-full bg-slate-800 border-[12px] border-slate-700 box-border border-b-0" />
                         <div className="absolute top-0 left-0 w-full h-full rounded-t-full border-[12px] border-emerald-500 border-b-0 box-border origin-bottom transition-all duration-1000" style={{ transform: 'rotate(145deg)' }} /> {/* Simulated partial fill */}
                         <div className="absolute bottom-0 text-center mb-1">
                             <div className="text-2xl font-bold text-slate-100">92%</div>
                             <div className="text-[10px] text-emerald-400 font-bold uppercase">Faithfulness Score</div>
                         </div>
                    </div>
                    
                    {/* Sources Panel Mock */}
                    <div className="flex-1 w-full max-w-sm bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
                        <div className="text-xs text-slate-500 font-bold uppercase">Grounded Sources</div>
                        <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800">
                             <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs text-slate-300">Corp_Protection_Rule_4.2.pdf</span>
                             </div>
                             <Badge variant="success" className="text-[9px]">98% Match</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800">
                             <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs text-slate-300">Q3_2025_Revenue_Report.pdf</span>
                             </div>
                             <Badge variant="outline" className="text-[9px]">85% Match</Badge>
                        </div>
                    </div>
                </div>
            );

        default:
            return <div className="h-48 flex items-center justify-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">Visual not available</div>;
    }
}

interface TechSpecViewProps {
  viewKey: string;
}

export const TechSpecView = ({ viewKey }: TechSpecViewProps) => {
  const spec = SPECS[viewKey];

  if (!spec) return <div>Spec not found for {viewKey}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-bold text-slate-100">{spec.title}</h2>
        <p className="text-lg text-slate-400">{spec.description}</p>
      </div>

      <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Live Component Preview</h3>
          <SpecVisual viewKey={viewKey} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Question */}
        <Card className="bg-slate-900 border-slate-800 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-emerald-400 text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Business Question Solved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-200 text-lg italic leading-relaxed">"{spec.question}"</p>
          </CardContent>
        </Card>

        {/* Data Required */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base flex items-center gap-2">
              Data Ingestion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {spec.data.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0 bg-slate-950 text-slate-400 border-slate-700">Input</Badge>
                  <span className="text-slate-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Analytical Model */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base flex items-center gap-2">
              Calculation / ML Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {spec.model.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0 bg-indigo-950/30 text-indigo-400 border-indigo-900/50">Logic</Badge>
                  <span className="text-slate-300 text-sm font-mono">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* NEW: Scenario Card */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 md:col-span-2 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <CardHeader>
                <CardTitle className="text-slate-100 text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Strategic Revenue Application
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="space-y-2">
                    <div className="text-xs font-bold text-red-400 uppercase tracking-wide">The Problem</div>
                    <p className="text-slate-300 text-sm leading-relaxed">{spec.scenario.problem}</p>
                </div>
                <div className="space-y-2">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">The Action</div>
                    <p className="text-slate-300 text-sm leading-relaxed">{spec.scenario.action}</p>
                </div>
                <div className="space-y-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Revenue Uplift</div>
                    <p className="text-slate-200 text-sm font-medium leading-relaxed bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
                        {spec.scenario.uplift}
                    </p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
