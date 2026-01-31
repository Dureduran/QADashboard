
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Table, Database, Info, GitMerge, FileJson, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

// --- DATA DEFINITIONS ---

const SCHEMAS = [
    {
        tableName: "FACT_BOOKING_LOGS",
        description: "Transactional grain of every ticket issued. Mirrored from PNR (Passenger Name Record) data.",
        usage: ["Visual A (Load Factor)", "Visual B (Booking Pace)", "Visual E (Elasticity)", "AI Module 1 (Forecasting)"],
        assumptions: [
            "Includes cancellations (status='CXLD') for unconstraining logic.",
            "Fare basis codes normalized to 26 RBD buckets (A-Z).",
            "Booking_Date vs Flight_Date lag used for booking curve generation."
        ],
        sample: [
            {
                "pnr_locator": "A7X8J9",
                "flight_id": "QR701_20260128",
                "route_od": "DOH-JFK",
                "booking_date_utc": "2025-11-15T08:45:00Z",
                "flight_date_utc": "2026-01-28T01:30:00Z",
                "fare_bucket": "J",
                "cabin": "Business",
                "total_fare_usd": 4250.00,
                "pos_country": "US",
                "pax_status": "ticketed",
                "is_group_booking": false
            },
            {
                "pnr_locator": "B2M4K1",
                "flight_id": "QR701_20260128",
                "route_od": "DOH-JFK",
                "booking_date_utc": "2026-01-20T14:20:00Z",
                "flight_date_utc": "2026-01-28T01:30:00Z",
                "fare_bucket": "Q",
                "cabin": "Economy",
                "total_fare_usd": 850.00,
                "pos_country": "QA",
                "pax_status": "ticketed",
                "is_outlier": true,
                "outlier_reason": "Late booking spike (Conf Event)"
            }
        ]
    },
    {
        tableName: "FACT_COMPETITOR_FARES",
        description: "Daily scraped lowest available fares (LAF) for key competitors on identical O&Ds.",
        usage: ["Visual C (Price Tracker)", "AI Module 1 (Elasticity)", "AI Module 3 (Optimizer)"],
        assumptions: [
            "Competitor data scraped via API (e.g., Infare/QL2) at 02:00 UTC daily.",
            "Only matches 'comparable' flights (+/- 2 hours departure).",
            "Market Average excludes outliers >3σ from mean."
        ],
        sample: [
            {
                "scrape_date": "2026-01-28",
                "route_od": "DOH-BKK",
                "airline_code": "EK",
                "flight_number": "EK372",
                "departure_time_local": "09:45",
                "lowest_economy_usd": 680,
                "lowest_business_usd": 2100,
                "advance_purchase_days": 14,
                "is_flash_sale": true
            },
            {
                "scrape_date": "2026-01-28",
                "route_od": "DOH-BKK",
                "airline_code": "QR",
                "flight_number": "QR832",
                "departure_time_local": "08:15",
                "lowest_economy_usd": 730,
                "lowest_business_usd": 2450,
                "advance_purchase_days": 14,
                "market_position_index": 1.07
            }
        ]
    },
    {
        tableName: "DIM_PAX_PROFILE",
        description: "Anonymized CRM attributes used to predict show/no-show behavior.",
        usage: ["Visual F (Overbooking Risk)", "AI Module 2 (No-Show Predictor)"],
        assumptions: [
            "No-show probability derived from 3-year historical behavior of similar profiles.",
            "Connection tightness calculated based on inbound flight actual arrival time.",
            "Loyalty tier impacts 'Willingness to Pay' logic."
        ],
        sample: [
            {
                "pax_hash_id": "px_992831",
                "loyalty_tier": "Burgundy",
                "avg_annual_spend_usd": 450,
                "historical_no_show_rate": 0.12,
                "inbound_flight": "QR004",
                "connection_time_mins": 55,
                "is_tight_connection": true,
                "predicted_show_prob": 0.45,
                "risk_category": "High Risk (Missed Conn)"
            },
            {
                "pax_hash_id": "px_110293",
                "loyalty_tier": "Platinum",
                "avg_annual_spend_usd": 28000,
                "historical_no_show_rate": 0.01,
                "inbound_flight": null,
                "connection_time_mins": null,
                "is_tight_connection": false,
                "predicted_show_prob": 0.99,
                "risk_category": "Low Risk"
            }
        ]
    },
    {
        tableName: "FACT_SEARCH_LOGS",
        description: "Upper funnel demand data (GDS/Website queries) capturing intent before booking.",
        usage: ["AI Module 3 (Unconstraining)", "Visual E (Elasticity)"],
        assumptions: [
            "Look-to-Book ratio spikes precede booking spikes by 48-72 hours.",
            "Failed searches (0 availability) are counted as 'Denials' for spill calculation.",
            "Search volume acts as a proxy for 'Latent Demand'."
        ],
        sample: [
            {
                "timestamp_utc": "2026-01-20T10:00:01Z",
                "origin": "DOH",
                "destination": "LOS",
                "travel_date": "2026-02-15",
                "pax_count": 2,
                "cabin_requested": "Economy",
                "lowest_fare_displayed": 1200,
                "conversion_event": false,
                "user_agent_category": "OTA_Scraper"
            },
            {
                "timestamp_utc": "2026-01-20T10:05:22Z",
                "origin": "DOH",
                "destination": "LOS",
                "travel_date": "2026-02-15",
                "pax_count": 1,
                "cabin_requested": "Business",
                "lowest_fare_displayed": null,
                "error_code": "NO_AVAILABILITY",
                "conversion_event": false,
                "demand_type": "Spill"
            }
        ]
    },
    {
        tableName: "FACT_FLIGHT_COSTS",
        description: "Operating economics for individual flight legs to determine net profitability.",
        usage: ["Visual D (Waterfall)", "Visual A (Yield)"],
        assumptions: [
            "Fuel cost = Block Hours × Fuel Burn Rate × Hedged Fuel Price.",
            "Spoilage Cost = Empty Seats × Marginal Revenue of Lowest Fare Class.",
            "Crew/Catering are allocated based on aircraft type (e.g., A350 vs B777)."
        ],
        sample: [
            {
                "flight_id": "QR701_20260128",
                "aircraft_type": "B777-300ER",
                "block_hours": 14.5,
                "total_fuel_kg": 105000,
                "fuel_cost_usd": 78000,
                "crew_cost_usd": 12000,
                "catering_cost_usd": 8500,
                "overflight_fees_usd": 15000,
                "est_spoilage_usd": 4000
            }
        ]
    }
];

export const DataSchemaView = () => {
    const [activeTab, setActiveTab] = useState(SCHEMAS[0].tableName);
    const activeSchema = SCHEMAS.find(s => s.tableName === activeTab);

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                    <Database className="w-8 h-8 text-primary" />
                    Data Sources & Schema
                </h2>
                <p className="text-slate-400 max-w-3xl">
                    This registry defines the synthetic datasets used to power the dashboard visuals and AI models. 
                    Data is designed to mirror real airline flight logs, including augmented "rare events" (outliers) 
                    to test system resilience and scenario logic.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {SCHEMAS.map(schema => (
                        <button
                            key={schema.tableName}
                            onClick={() => setActiveTab(schema.tableName)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all border flex items-center gap-2",
                                activeTab === schema.tableName
                                    ? "bg-slate-800 border-primary text-primary-foreground shadow-md"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            )}
                        >
                            <Table className="w-4 h-4" />
                            {schema.tableName}
                        </button>
                    ))}
                    
                    <div className="mt-6 p-4 bg-amber-900/10 border border-amber-900/30 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-500 mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Augmentation Note</span>
                        </div>
                        <p className="text-xs text-amber-200/70 leading-relaxed">
                            Datasets contain injected <strong className="text-amber-400">rare events</strong> (e.g., 'Late Booking Spikes', 'Weather Cx', 'No-Show Clusters') to validate the robust handling of outliers in AI modules.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {activeSchema && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            
                            {/* Header Card */}
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl font-mono text-emerald-400">{activeSchema.tableName}</CardTitle>
                                            <p className="text-slate-400 mt-2 text-sm">{activeSchema.description}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-slate-950 font-mono text-xs">JSON / Parquet</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                            <GitMerge className="w-4 h-4" /> Powering Visuals
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {activeSchema.usage.map(u => (
                                                <Badge key={u} className="bg-indigo-950/50 text-indigo-300 border-indigo-900/50 hover:bg-indigo-900/50">
                                                    {u}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                            <Info className="w-4 h-4" /> Logic Assumptions
                                        </div>
                                        <ul className="list-disc list-inside space-y-1">
                                            {activeSchema.assumptions.map((a, i) => (
                                                <li key={i} className="text-xs text-slate-400">{a}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Code Snippet Card */}
                            <Card className="bg-slate-950 border-slate-800 overflow-hidden">
                                <CardHeader className="bg-slate-900/50 border-b border-slate-800 py-3">
                                    <div className="flex items-center gap-2">
                                        <FileJson className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-bold text-slate-300">Synthetic Data Sample (Top 2 Rows)</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <pre className="p-4 text-xs font-mono leading-relaxed text-slate-300">
                                            {JSON.stringify(activeSchema.sample, null, 2).split('\n').map((line, i) => {
                                                // Highlight keys and string values for better readability
                                                const highlighted = line
                                                    .replace(/"([^"]+)":/g, '<span class="text-indigo-400">"$1"</span>:') // Keys
                                                    .replace(/: "([^"]+)"/g, ': <span class="text-emerald-300">"$1"</span>') // String Values
                                                    .replace(/: ([0-9\.]+)/g, ': <span class="text-amber-300">$1</span>') // Numbers
                                                    .replace(/: (true|false|null)/g, ': <span class="text-red-400">$1</span>'); // Booleans

                                                return (
                                                    <div key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />
                                                );
                                            })}
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
