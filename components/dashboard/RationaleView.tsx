
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export const RationaleView = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
           <CardTitle className="text-2xl text-slate-100 leading-tight">Rationale for Route Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-slate-300 leading-relaxed text-sm md:text-base">
            <p>
                In the high-stakes world of airline revenue management, the biggest untapped wins rarely come from polishing already-shining gems. While <strong>busiest routes</strong> (like DOH–LHR or DOH–BKK) and high-frequency <strong>regional feeders</strong> often run at near-optimal load factors and yields—thanks to mature demand patterns, established pricing power, and steady traffic—they leave limited headroom for dramatic improvement. RM analytics on these can refine margins by 1–3%, but the real leverage lies elsewhere.
            </p>
            <p>
                We prioritize RM analytics on routes exhibiting <strong>volatility</strong> (seasonal spikes from events like Hajj/Umrah or Chinese New Year, economic swings, or geopolitical shifts), <strong>underperformance</strong> (suboptimal load factors or yields despite available capacity, as seen on softening long-haul US markets like San Francisco with recent 30% capacity cuts amid demand dips), <strong>intense competition</strong> (from Gulf rivals or local carriers eroding share), or <strong>untapped growth potential</strong> (emerging markets like Lagos or Shanghai, where surging frequencies signal rebounding demand but leave room for smarter forecasting, dynamic pricing, and elasticity modeling to capture 5–15% RASK uplift). These routes are where advanced analytics—ML-driven demand forecasts, real-time competitor tracking, and scenario simulations—can unlock outsized revenue gains by turning uncertainty into precision, preventing spill in peaks, minimizing spoilage in troughs, and outmaneuvering rivals. In a network as expansive as Qatar Airways', focusing here delivers the highest ROI on data science efforts, directly boosting overall profitability in a volatile global market.
            </p>
            
            <div className="mt-8 bg-slate-950/50 p-6 rounded-lg border border-slate-800">
                <h3 className="text-lg font-bold text-slate-100 mb-4">Why focus on volatile, underperforming, highly competitive, or high-growth-potential routes?</h3>
                <ul className="list-disc pl-5 space-y-3">
                    <li><strong className="text-emerald-400">Highest potential ROI for RM efforts:</strong> Routes with volatility, underperformance, intense competition, or untapped growth offer the largest opportunity for measurable revenue uplift (typically 5–15% RASK improvement), whereas busiest routes are already near theoretical maximums (often 1–3% headroom left).</li>
                    <li><strong className="text-emerald-400">Greater impact from advanced analytics:</strong> ML-driven demand forecasting, price elasticity modeling, real-time competitor tracking, and scenario simulations deliver outsized value on routes with unpredictable demand patterns, economic sensitivity, or emerging traffic — turning uncertainty into precision revenue capture.</li>
                    <li><strong className="text-emerald-400">Avoiding diminishing returns on mature routes:</strong> Flagship high-volume routes (e.g., DOH–LHR, DOH–BKK) and dense regional feeders already benefit from mature booking curves, strong pricing power, high load factors (frequently 90%+), and established competitive positioning — leaving limited incremental gains even with sophisticated RM.</li>
                    <li><strong className="text-emerald-400">Preventing revenue leakage in volatile environments:</strong> Seasonal spikes (Hajj/Umrah, Chinese New Year), economic fluctuations, geopolitical events, or sudden demand drops cause significant spill (lost high-yield bookings) or spoilage (empty premium seats); targeted analytics can capture what would otherwise be left on the table.</li>
                    <li><strong className="text-emerald-400">Capitalizing on growth & recovery opportunities:</strong> Emerging or rebounding markets (e.g., Africa routes like Lagos, Asia routes like Shanghai post-recovery) show rising frequencies and passenger potential but inconsistent yields — better forecasting and dynamic pricing can accelerate profitable expansion.</li>
                    <li><strong className="text-emerald-400">Outmaneuvering competition where it matters most:</strong> On routes with aggressive Gulf or local carrier competition, RM analytics enable faster, smarter fare adjustments and inventory control, protecting or growing market share where pricing battles are fiercest.</li>
                    <li><strong className="text-emerald-400">Strategic alignment with network economics:</strong> Qatar Airways operates a hub-and-spoke model with significant connecting traffic; optimizing underperforming long-haul or feeder legs improves overall network profitability far more than fine-tuning already-efficient core routes.</li>
                </ul>
            </div>

            <p className="mt-4 font-semibold text-emerald-400 text-center italic">
                "Focusing RM analytics here maximizes the leverage of data science in driving bottom-line impact for Qatar Airways."
            </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
           <CardTitle className="text-lg text-slate-100">Top 5 Priority Routes Analysis</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-950 text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium whitespace-nowrap">Rank</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap">Route (DOH to)</th>
                            <th className="px-4 py-3 font-medium min-w-[200px]">Why High RM Improvement Potential?</th>
                            <th className="px-4 py-3 font-medium min-w-[200px]">Key Analytics Opportunities</th>
                            <th className="px-4 py-3 font-medium min-w-[200px]">Recent Performance Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                        {[
                            {
                                rank: 1,
                                route: "San Francisco (SFO)",
                                why: "Long-haul US route with recent softening demand and capacity cuts; volatile tech/business travel affected by economic shifts. RM can refine pricing to recapture yields.",
                                opportunities: "Demand forecasting for seasonal dips; price elasticity simulations to reduce spill; overbooking adjustments. Potential RASK uplift: 10-20% via targeted promotions.",
                                notes: "30% flight reduction in summer 2026 (from daily to 5x weekly) due to 3% passenger drop and load factor fall from 96% to 93% in 2025."
                            },
                            {
                                rank: 2,
                                route: "New York JFK (JFK)",
                                why: "Busiest US route but with overcapacity relative to traffic; high competition from Emirates/Etihad. RM analytics can optimize fare classes and alliances (e.g., Oneworld).",
                                opportunities: "Yield analysis by cabin (premium heavy); competitor fare tracking; scenario modeling for capacity tweaks. Potential uplift: 5-10% in load factors.",
                                notes: "88% load factor (lowest among Qatar's US routes) despite high volumes; part of broader US demand strength at 86-87% overall."
                            },
                            {
                                rank: 3,
                                route: "Lagos (LOS)",
                                why: "Growing African market with economic volatility and high ancillary potential; frequency increases signal demand, but fluctuations (e.g., currency issues) create RM challenges.",
                                opportunities: "Time-series forecasting for event-driven spikes; dynamic pricing for business/leisure mix; spoilage minimization. Potential uplift: 15% in revenue via better inventory control.",
                                notes: "Flights up from 10 to 14 weekly in winter 2025-2026 to meet demand; part of Africa expansion with high connectivity to Asia/Europe."
                            },
                            {
                                rank: 4,
                                route: "Shanghai (PVG)",
                                why: "Key Asia route with post-recovery growth but seasonal/cyclical demand (e.g., business from China); competition from local carriers. RM can enhance yield on connecting traffic.",
                                opportunities: "External factor integration (e.g., economic APIs for GDP/fuel); elasticity heatmaps; ancillary bundling. Potential uplift: 10% in RASK during peaks.",
                                notes: "Frequencies rising from 7 to 10 weekly in early 2026; supports inbound/outbound China demand amid network-wide additions."
                            },
                            {
                                rank: 5,
                                route: "Zagreb (ZAG)",
                                why: "European mid-haul with strong loads but recent reductions; geopolitical/economic sensitivity in region. RM analytics can fine-tune for high-frequency feeders.",
                                opportunities: "Booking curve analysis; overbooking for no-shows; competitive benchmarking. Potential uplift: 8-12% in utilization.",
                                notes: "Cutting from 10 to 7 weekly in summer 2025 despite 86%+ load factors; aligns with Europe-wide adjustments but highlights optimization needs."
                            }
                        ].map((row) => (
                            <tr key={row.rank} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-slate-300 font-bold align-top">{row.rank}</td>
                                <td className="px-4 py-3 text-slate-200 font-semibold align-top whitespace-nowrap">{row.route}</td>
                                <td className="px-4 py-3 text-slate-400 align-top">{row.why}</td>
                                <td className="px-4 py-3 text-emerald-400 align-top font-medium">{row.opportunities}</td>
                                <td className="px-4 py-3 text-slate-400 italic align-top">{row.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
