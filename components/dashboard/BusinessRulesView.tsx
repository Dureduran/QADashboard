
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Shield, Network, ShoppingBag, Clock, Users } from 'lucide-react';

export const BusinessRulesView = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
           <div className="flex flex-col space-y-1">
             <CardTitle className="text-2xl text-slate-100 leading-tight">Assumptions & Business Rules for Selected Routes</CardTitle>
             <p className="text-sm text-slate-500">We have simulated business rules that serve as the ground truth for the RAG Assistant and the constraints for your Pricing Engine.</p>
           </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-950 text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium whitespace-nowrap">Target Route</th>
                            <th className="px-4 py-3 font-medium">Business Rule (The "Logic")</th>
                            <th className="px-4 py-3 font-medium">Why It Exists (The Strategy)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                        {[
                            {
                                route: "San Francisco (SFO)",
                                icon: <Shield className="w-4 h-4 text-indigo-400" />,
                                ruleName: "Protective Pricing",
                                rule: "Maintain a minimum fare floor even if load factors drop below 90%.",
                                why: "To protect the \"Premium\" brand image and prevent a price war on a route with softening business demand."
                            },
                            {
                                route: "New York (JFK)",
                                icon: <Network className="w-4 h-4 text-blue-400" />,
                                ruleName: "Connection Priority",
                                rule: "Automatically lower fares for DOH-JFK if the passenger is connecting from high-yield origins like India or Southeast Asia.",
                                why: "JFK is hyper-competitive; the goal is to use it as a \"funnel\" to fill the plane with high-value connecting traffic."
                            },
                            {
                                route: "Lagos (LOS)",
                                icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
                                ruleName: "Ancillary Aggression",
                                rule: "Offer discounted \"Extra Baggage\" bundles during the 14x weekly winter frequency peak.",
                                why: "High-growth African markets often have massive demand for excess baggage; this captures revenue that traditional fare increases might miss."
                            },
                            {
                                route: "Shanghai (PVG)",
                                icon: <Clock className="w-4 h-4 text-amber-400" />,
                                ruleName: "Inventory Shadowing",
                                rule: "Hold 15% of Business Class seats for \"Last Minute\" corporate bookings until 7 days before departure.",
                                why: "PVG has high recovery growth in luxury/corporate sectors; selling these seats too early to leisure travelers \"displaces\" high-yield revenue."
                            },
                            {
                                route: "Zagreb (ZAG)",
                                icon: <Users className="w-4 h-4 text-red-400" />,
                                ruleName: "Overbooking Aggregator",
                                rule: "Increase overbooking limits by 5% on days when connecting banks in Doha are tight (<90 mins).",
                                why: "Because ZAG is aircraft-constrained and has high load factors, you must overbook more aggressively to account for passengers who will likely miss their connection to ZAG in Doha."
                            }
                        ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-slate-200 font-bold whitespace-nowrap align-top">
                                    <div className="flex items-center gap-2">
                                        {row.icon}
                                        {row.route}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <span className="text-slate-200 font-semibold block mb-1">{row.ruleName}</span>
                                    <span className="text-slate-400 leading-snug">{row.rule}</span>
                                </td>
                                <td className="px-4 py-3 text-emerald-400/90 align-top leading-snug">
                                    {row.why}
                                </td>
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
