# Qatar Airways RM Dashboard Interview Guide

This guide explains how to walk through the dashboard and the notebooks together. It is written for interview use: what each visual means, what data feeds it, how the notebook outputs relate to the React app, and what to say when asked technical or business questions.

## 1. Current Run Status

The repository was cloned into:

```text
c:\Users\Lenovo\OneDrive\Documents\Resume\2026\Qatar Airways\Interview guides\QADashboard
```

The app was installed and built successfully:

```bash
npm install --legacy-peer-deps
npm run build
```

The Vite dev server is running locally at:

```text
http://127.0.0.1:3000/
```

Important note: the sandbox blocked Vite from spawning esbuild, so the dev server was started outside the sandbox. The production build passed. Vite reported only a large bundle warning, not a compile failure.

## 2. One-Minute Executive Explanation

This project demonstrates an airline revenue management decision-support platform. The notebook proves the analytical logic using synthetic airline-style data. The dashboard turns those model concepts into an interactive revenue management cockpit.

The core business problem is the airline "spill versus spoil" tradeoff:

| Term | Meaning | Revenue risk |
|---|---|---|
| Spoilage | A seat departs empty | Lost revenue from unused capacity |
| Spill | High-value passengers are turned away or priced incorrectly | Lost yield from constrained inventory |

The project tackles three revenue leakage areas:

| Module | Business question | Model concept | Dashboard area |
|---|---|---|---|
| Demand forecasting | Will demand accelerate, and should we change price or capacity? | LSTM plus Prophet concept, simulated in notebook | Dashboard booking pace and Forecasting panel |
| No-show prediction | How much can we safely overbook? | Boosted tree / XGBoost-style classification plus optimization | No-Show Predictor and overbooking visuals |
| Demand unconstraining | How much invisible demand did we miss after sellout? | EM algorithm for censored demand | Pricing Optimizer latent demand visual |

Good interview summary:

> The notebook is the analytical proof of concept. It creates synthetic booking, passenger, and constrained-demand data, then calculates forecasts, risk scores, overbooking limits, and revenue uplift. The dashboard is the product layer. It consumes those same output shapes through TypeScript services and Supabase-ready tables, then displays them as route KPIs, booking curves, pricing heatmaps, no-show risk visuals, and unconstraining bars.

## 3. Important Relationship Between Notebook and Dashboard

The `.ipynb` notebook is not executed by the React app at runtime.

There is no dashboard code that imports a notebook, parses a notebook, or reads notebook-generated files directly. The relationship is conceptual and data-contract based:

```text
Notebook model logic
  -> produces forecast/risk/spill/revenue outputs
  -> outputs are represented as dashboard-ready records
  -> records live in services/mockData.ts or Supabase tables
  -> React components fetch those records through api.get... functions
  -> Recharts and UI cards render the visuals
```

In production, the notebook would become a scheduled ML pipeline or batch job. Its outputs would be written to Supabase or a warehouse table. The dashboard already has the data access layer to read those tables.

Current prototype data flow:

```text
React component
  -> TanStack useQuery
  -> api.getX in services/mockData.ts
  -> first try Supabase via services/supabaseData.ts
  -> if VITE_USE_LIVE_DATA=true, try live API / TypeScript ML services
  -> fallback to mock arrays in services/mockData.ts
  -> render visual
```

The main files are:

| File | Role |
|---|---|
| `App.tsx` | Chooses which view to show from the sidebar route |
| `components/layout/Sidebar.tsx` | Navigation: Dashboard, Forecasting, No-Show Predictor, Pricing Optimizer, RM Assistant |
| `services/mockData.ts` | Primary data service facade and fallback mock data |
| `services/supabaseData.ts` | Maps Supabase rows into dashboard TypeScript objects |
| `services/supabase.ts` | Supabase client and table interfaces |
| `components/dashboard/StrategicDashboard.tsx` | Main route performance page |
| `components/dashboard/DynamicPricingPanel.tsx` | Forecasting and pricing heatmap |
| `components/dashboard/NoShowPanel.tsx` | No-show risk and overbooking page |
| `components/dashboard/UnconstrainingPanel.tsx` | Latent demand and fare ladder page |
| `components/dashboard/Assistant.tsx` | RM assistant chat and grounded-source cards |
| `Qatar_Airways_Revenue_Management_Technical_Report.ipynb` | Main notebook showing the model logic and ROI calculations |

## 4. Data Access Architecture

The dashboard uses a single facade called `api` from `services/mockData.ts`. The components never query Supabase directly.

The fallback order is:

1. Supabase, when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured.
2. Optional live API and TypeScript ML services, only when `VITE_USE_LIVE_DATA=true`.
3. Static mock data inside `services/mockData.ts`.

That is why the app still runs in demo mode even if Supabase, OpenAI, weather, or pricing APIs are unavailable.

Supabase migration docs say the intended database contains 14 tables:

| Supabase table | Purpose |
|---|---|
| `routes` | Master route list |
| `route_kpis` | Route load factor, target, RASK, yield |
| `flights` | Flight inventory rows |
| `kpis` | Global KPI cards |
| `booking_curves` | Actual, forecast, last-year booking points |
| `competitor_data` | Qatar vs competitor vs market fare series |
| `waterfall_data` | Profit and cost decomposition |
| `elasticity_scenarios` | Price change vs revenue uplift |
| `overbooking_scenarios` | Net value of added overbooking seats |
| `pricing_forecast` | Historical, forecast, optimal price by month |
| `pricing_matrix` | Segment by price sensitivity matrix |
| `noshow_risk` | Low, medium, high no-show risk distribution |
| `unconstraining_data` | Actual bookings and spill by fare level |
| `rag_metrics` | Assistant source metadata and faithfulness score |

Interview phrasing:

> I designed the dashboard around stable data contracts. The notebook can change model internals, but as long as it writes the same output tables, the frontend does not need to change. That is the right separation between ML experimentation and product delivery.

## 5. Dashboard View Map

The active sidebar views are:

| View | Component | Purpose |
|---|---|---|
| Dashboard | `StrategicDashboard` | Executive route performance, booking pace, competitor fares, simulation, profitability, elasticity, overbooking |
| Forecasting | `DynamicPricingPanel` | Demand and price forecast plus segment sensitivity heatmap |
| No-Show Predictor | `NoShowPanel` | Passenger no-show risk profile, ticket value vs risk, overbooking recommendation |
| Pricing Optimizer | `UnconstrainingPanel` | Latent demand and spill analysis |
| RM Assistant | `Assistant` | Chat-based route and policy assistant |

There are also legacy or supporting components like `KPICards`, `RevenueChart`, and `FlightTable`. They are useful for understanding the repo, but they are not mounted in the current `App.tsx` sidebar flow.

## 6. Strategic Dashboard Visuals

Component: `components/dashboard/StrategicDashboard.tsx`

This is the main page. It uses the selected route state, defaulting to `DOH-SFO`, and sends that route into multiple data queries.

### 6.1 Route Selector

Routes:

```text
DOH-SFO, DOH-JFK, DOH-LOS, DOH-PVG, DOH-ZAG
```

Data source:

```text
Static route list inside StrategicDashboard
```

What it controls:

Changing the route refetches route KPI, booking curve, competitor, waterfall, elasticity, and overbooking data. It also resets the simulation slider.

Interview phrasing:

> The route selector is the main dimensional filter. It scopes every route-dependent chart to one origin-destination pair.

### 6.2 Load Factor Card

Visual type:

```text
KPI card plus progress bar and target marker
```

Data fields:

| Field | Meaning | Used as |
|---|---|---|
| `loadFactor` | Current passenger load factor | Large percentage and filled progress width |
| `targetLoadFactor` | Commercial target | White target marker on the bar |

Data source:

```text
api.getRouteKPIs(route)
  -> Supabase route_kpis
  -> or MOCK_ROUTE_KPIS
```

Logic:

If load factor is below 75 percent, the bar becomes red and the card warns about capacity spoilage risk. Otherwise it shows utilization as healthy.

Example mock values:

| Route | Load factor | Target |
|---|---:|---:|
| DOH-SFO | 82% | 90% |
| DOH-JFK | 88% | 92% |
| DOH-LOS | 74% | 85% |
| DOH-PVG | 65% | 80% |
| DOH-ZAG | 79% | 85% |

How to explain:

> This card answers: are we filling the aircraft at the expected pace? A low load factor against target is spoilage risk, while a very high one can mean pricing was too low or inventory needs protection.

### 6.3 RASK Card

Visual type:

```text
KPI card with trend badge and small sparkline
```

Data fields:

| Field | Meaning | Used as |
|---|---|---|
| `rask` | Revenue per available seat kilometer | Main KPI value |
| `raskTrend` | Change versus prior period | Up/down trend badge |
| `bookingCurve.actual` | Actual booking trend | Mini sparkline |

Data source:

```text
api.getRouteKPIs(route)
api.getBookingCurve(route)
```

How to explain:

> Load factor tells us utilization, but RASK tells us how much revenue the capacity is generating. A route can have strong load but weak RASK if we filled it with low fares.

### 6.4 Yield Card

Visual type:

```text
KPI card with trend badge and static business/economy chips
```

Data fields:

| Field | Meaning |
|---|---|
| `yield` | Revenue per passenger kilometer |
| `yieldTrend` | Yield change trend |

Data source:

```text
api.getRouteKPIs(route)
```

Important caveat:

The "Biz $4.2k" and "Eco $850" chips are static display examples in the current UI. They are not fetched per route.

How to explain:

> Yield isolates price quality. If RASK is under pressure but yield is high, the issue may be volume. If load is high but yield is weak, the issue may be fare mix.

### 6.5 Booking Pace Chart

Visual type:

```text
Composed chart: actual area, forecast line, last-year line, optional simulated line
```

Data fields:

| Field | Meaning | Visual encoding |
|---|---|---|
| `daysOut` | Days before departure | X-axis |
| `actual` | Current cumulative bookings | Filled area |
| `forecast` | Predicted cumulative bookings | Dashed line |
| `ly` | Last-year cumulative bookings | Gray reference line |
| `simulated` | Forecast after user uplift | Green dashed line after simulation |

Data source:

```text
api.getBookingCurve(route)
  -> Supabase booking_curves
  -> or MOCK_BOOKING_CURVES
```

Dashboard transform:

```text
simulated = forecast * (1 + upliftScenario / 100)
```

Notebook relationship:

The technical notebook's demand forecasting section creates:

```text
days_before_departure
daily_bookings
legacy_forecast
ai_forecast
```

The dashboard version simplifies the model output into:

```text
daysOut, actual, forecast, ly
```

How to explain:

> This chart is the bridge between the notebook and the product. The notebook demonstrates how an AI forecast detects a demand spike earlier than a moving average. The dashboard renders the model output as a route-level booking curve so a revenue manager can decide whether to close low fare buckets, adjust capacity, or monitor competitor movement.

Interview question:

Q: Why is it an S-curve?

A: Airline bookings typically accumulate slowly far from departure, accelerate in the middle of the sales window, then taper near departure as capacity fills and fares rise. The mock data uses a logistic S-curve to approximate that behavior.

### 6.6 Competitor Tracker

Visual type:

```text
Multi-line fare chart
```

Data fields:

| Field | Meaning | Visual encoding |
|---|---|---|
| `date` | Day label | X-axis |
| `ourPrice` | Qatar lowest available fare | Green step line |
| `compPrice` | Primary competitor fare | Red line |
| `marketAverage` | Market average fare | Gray dashed line |

Data source:

```text
api.getCompetitorData(route)
  -> Supabase competitor_data
  -> or MOCK_COMPETITOR_DATA
```

How to explain:

> This visual shows whether Qatar is pricing above, below, or in line with the competitive set. It gives context to demand changes. If bookings slow while our price is materially above market, that suggests price resistance. If bookings are strong while we are below market, it may be an opportunity to raise fares.

### 6.7 Revenue Simulator

Visual type:

```text
Slider plus projected revenue delta card plus apply button
```

Data fields:

This is mostly local UI state:

| Field | Source | Meaning |
|---|---|---|
| `upliftScenario` | Slider | Selected 0 to 15 percent adjustment |
| `simulationActive` | Local state | Whether green simulated line appears |
| `selectedRoute` | Route selector | Changes the elasticity label |

Formula used:

```text
Projected Revenue Delta = (upliftScenario * 0.8) * 12500
```

Important caveat:

This is not calling a backend optimizer. It is an interactive demo of how a model recommendation would be applied to the forecast curve.

How to explain:

> The simulator is a what-if layer. In production, the slider would call an optimization service and recalculate expected revenue, denied boarding risk, or spill. In the demo, it applies a transparent uplift to the forecast line so the interviewer can see the workflow.

### 6.8 Profitability Breakdown

Visual type:

```text
Waterfall-style stacked bar chart
```

Data fields:

| Field | Meaning | Visual encoding |
|---|---|---|
| `name` | Driver name such as Base Fare, Ancillaries, Ops Cost | X-axis label |
| `value` | Dollar value of driver | Bar size |
| `type` | increase, decrease, total | Color |
| `start` | Calculated offset | Floating bar position |

Data source:

```text
api.getWaterfallData(route)
  -> Supabase waterfall_data
  -> or MOCK_WATERFALL_DATA
```

Color logic:

| Type | Color | Meaning |
|---|---|---|
| `increase` | Green | Adds revenue or margin |
| `decrease` | Red | Cost, spoilage, spill, loss |
| `total` | Blue | Base or net total |

How to explain:

> This chart decomposes route profit into controllable and uncontrollable levers. It lets an RM analyst see whether the route problem is demand, price, ancillaries, spoilage, spill, or operating cost.

### 6.9 Price Elasticity Scatter

Visual type:

```text
Scatter plot with zero reference lines
```

Data fields:

| Field | Meaning | Visual encoding |
|---|---|---|
| `x` | Percent price change | X-axis |
| `y` | Revenue uplift percent | Y-axis |

Data source:

```text
api.getElasticityData(route)
  -> Supabase elasticity_scenarios
  -> or MOCK_ELASTICITY
```

Interpretation:

| Quadrant | Meaning |
|---|---|
| Price down, revenue up | Demand is elastic, discounting can increase total revenue |
| Price up, revenue down | Price increase destroys enough demand to lower revenue |
| Price up, revenue up | Demand is inelastic, yield opportunity |
| Price down, revenue down | Discounting is not justified |

Caveat:

The mock and Supabase contract use `revenue_uplift`. The optional live ML fallback currently maps `demandChange` into the same chart field. In production, that naming should be standardized so the chart always displays revenue uplift or demand uplift, not both.

How to explain:

> This chart tells us whether price actions improve total revenue, not just fare level. The right question is not "can we raise price?" but "does the revenue gained per passenger outweigh the demand lost?"

### 6.10 Overbooking Optimization Bars

Visual type:

```text
Bar chart of net value by overbooking increment
```

Data fields:

| Field | Meaning | Visual encoding |
|---|---|---|
| `name` | Scenario such as +2 Seats, +4 Seats | X-axis |
| `value` | Net dollar result | Bar height and sign |

Data source:

```text
api.getOverbookingData(route)
  -> Supabase overbooking_scenarios
  -> or MOCK_OVERBOOKING
```

Interpretation:

Green bars mean the expected incremental revenue exceeds expected denied boarding or service recovery cost. Red bars mean the overbooking level is too aggressive.

How to explain:

> This visual makes the overbooking decision economic. It balances the value of selling extra seats against the expected cost of denied boarding.

## 7. Forecasting View Visuals

Component: `components/dashboard/DynamicPricingPanel.tsx`

This panel is labeled "Dynamic Pricing & Demand Forecasting". It uses `api.getPricingData(route)`.

### 7.1 Historical, Forecast, and Optimal Price Chart

Visual type:

```text
Three-line chart
```

Data fields:

| Field | Meaning |
|---|---|
| `month` | Month label |
| `historical` | Past observed price or index |
| `forecast` | Predicted price or demand direction |
| `optimal` | Model-recommended optimal trajectory |

Data source:

```text
api.getPricingData(route)
  -> Supabase pricing_forecast
  -> or MOCK_PRICING_BY_ROUTE.forecast
```

How to explain:

> The chart separates what happened, what is expected, and what the optimizer recommends. That is useful because a forecast is descriptive, but "optimal" is prescriptive.

### 7.2 Price Sensitivity Matrix

Visual type:

```text
Heatmap
```

Data fields:

| Field | Meaning |
|---|---|
| `segment` | Leisure, Business, Corporate |
| `values` | Demand or sensitivity score across price points |

Data source:

```text
api.getPricingData(route)
  -> Supabase pricing_matrix
  -> or MOCK_PRICING_BY_ROUTE.matrix
```

Visual encoding:

| Value range | Color interpretation |
|---|---|
| 0 to 20 | Low demand or low attractiveness |
| 21 to 40 | Weak |
| 41 to 60 | Moderate |
| 61 to 80 | Strong |
| 81 to 100 | Very strong |

How to explain:

> The heatmap shows which customer segments still buy at each price point. For example, corporate demand usually tolerates higher prices than leisure demand. This supports fare bucket control and availability decisions.

### 7.3 Recommendation Card

Current text:

```text
Increase J class availability for selected route due to high corporate demand forecast.
```

Data source:

The card text is currently template text using the selected route. The Apply button changes UI state and shows a toast; it does not call an external optimizer.

How to explain:

> This is the final decision layer. A production system would convert the model output into an action, such as closing low fare buckets, opening more J class inventory, or raising bid price. The current demo shows that workflow.

## 8. No-Show Predictor Visuals

Component: `components/dashboard/NoShowPanel.tsx`

This panel uses `api.getNoShowData(route)`.

### 8.1 Passenger Risk Profile Pie Chart

Visual type:

```text
Donut pie chart
```

Data fields:

| Field | Meaning |
|---|---|
| `name` | High Risk, Medium Risk, Low Risk |
| `value` | Count or percentage share |
| `color` | Segment color |

Data source:

```text
api.getNoShowData(route)
  -> Supabase noshow_risk
  -> or MOCK_NOSHOW_BY_ROUTE.risk
```

Notebook relationship:

The notebook creates passenger-level data, calculates `noshow_probability`, and buckets each passenger into:

```text
Low Risk, Medium Risk, High Risk
```

The dashboard consumes the aggregated distribution.

How to explain:

> The pie chart summarizes passenger-level risk into an operational view. RM does not need to inspect every PNR to make a first-pass overbooking decision; they need to know whether the flight composition is unusually risky.

### 8.2 Ticket Value vs Risk Scatter

Visual type:

```text
Scatter plot
```

Data fields:

| Field | Meaning |
|---|---|
| `x` | No-show risk probability, from 0 to 1 |
| `y` | Ticket value |
| `fill` | Category or styling color |

Data source:

```text
api.getNoShowData(route)
  -> Supabase risk profile plus generated scatter points
  -> or MOCK_NOSHOW_BY_ROUTE.scatter
```

Important caveat:

In the Supabase path, only the risk buckets come from the database. The scatter points are generated in the frontend data service. In production, this should be a table of passenger-level or anonymized risk-score records.

How to explain:

> This chart identifies high-risk and high-value passengers. A high no-show probability on a low fare may support overbooking, while high-risk high-value passengers may warrant service recovery or reminders rather than simply treating them as empty-seat opportunity.

### 8.3 Optimal Overbooking Gauge

Visual type:

```text
Custom SVG gauge
```

Current behavior:

The gauge is currently hardcoded:

```text
Gauge value = 25
Label = 10 Seats (Low Risk)
```

Notebook relationship:

The notebook calculates an AI overbooking recommendation:

```text
legacy_overbook = 5
ai_overbook = 17
extra_seats = ai_overbook - legacy_overbook
```

How to explain honestly:

> The notebook contains the actual overbooking calculation logic. The dashboard gauge is a static prototype visual showing where that recommendation would be displayed. The next production step would be to bind it to `recommendedOverbooking` or the overbooking scenario table.

### 8.4 Projected Revenue Gain Card

Visual type:

```text
Static stats card
```

Current value:

```text
$12,500
```

Important caveat:

This value is hardcoded in the React component. It is not currently recalculated from the selected route.

How to explain:

> The value represents the business output of the no-show model. In production, it would be calculated from extra seats sold multiplied by expected fare, minus denied boarding compensation risk.

## 9. Pricing Optimizer / Unconstraining Visuals

Component: `components/dashboard/UnconstrainingPanel.tsx`

This panel uses `api.getUnconstrainingData(route)`.

### 9.1 Latent Demand Analysis

Visual type:

```text
Stacked bar chart
```

Data fields:

| Field | Meaning | Visual encoding |
|---|---|---|
| `price` | Fare class or price bucket | X-axis |
| `bookings` | Actual constrained bookings | Blue bar |
| `denial` | Estimated latent/spilled demand | Amber stacked bar |
| `latent` | True demand estimate | Stored in data but not directly drawn in current chart |

Data source:

```text
api.getUnconstrainingData(route)
  -> Supabase unconstraining_data
  -> or MOCK_UNCONSTRAINING_BY_ROUTE
```

Notebook relationship:

The notebook's unconstraining section creates:

```text
observed_bookings = 300
failed_booking_attempts = 45
true_demand_estimate = estimate_true_demand(...)
hidden_demand = true_demand_estimate - observed_bookings
```

The dashboard version makes that visible by fare bucket:

```text
price bucket -> actual bookings + estimated denial/spill
```

How to explain:

> Unconstraining solves the hidden-demand problem. Once a flight sells out, observed bookings stop increasing, but demand may still exist. The amber bars represent passengers who wanted to book but were constrained by availability or pricing.

### 9.2 Opportunity Cost Cards

Visual type:

```text
Two statistic cards
```

Current values:

```text
Total Revenue Spill = $4,250
Recapture Potential = 85%
```

Important caveat:

These values are static in the current prototype.

How to explain:

> These cards translate latent demand into business language. They answer: how much money is being left on the table, and how much could be recaptured if we adjust capacity or fare controls?

### 9.3 Pricing Action Card

Visual type:

```text
Recommendation and action button
```

Current action:

```text
Optimize Fare Ladder
```

Behavior:

Clicking the button simulates an optimization run, shows a spinner, then displays a toast saying lower buckets were closed.

How to explain:

> This is a prototype of decision automation. The model identifies spill in lower fare buckets, then recommends closing or repricing those buckets to force upsell and protect seats for higher-yield demand.

## 10. RM Assistant Visuals

Component: `components/dashboard/Assistant.tsx`

### 10.1 Chat Panel

Visual type:

```text
Chat interface
```

Data source:

```text
getAIResponse(userMessage, conversationHistory)
```

Current AI logic:

1. If an OpenAI-compatible API key is available, it calls the OpenAI client.
2. If not, it returns fallback responses based on `MOCK_ROUTE_KPIS`.

The assistant's context is built from route KPIs:

```text
DOH-SFO load factor, RASK, yield, trends
DOH-JFK load factor, RASK, yield, trends
DOH-LOS load factor, RASK, yield, trends
DOH-PVG load factor, RASK, yield, trends
DOH-ZAG load factor, RASK, yield, trends
```

### 10.2 Grounded Sources Panel

Visual type:

```text
Source cards with match bars
```

Data fields:

| Field | Meaning |
|---|---|
| `name` | Source document name |
| `type` | Policy, Report, Brief, Data |
| `matchScore` | Relevance percentage shown as a progress bar |

Current behavior:

The source list is simulated. It is selected by keyword rules inside `determineRelevantSources`.

Important caveat:

There is an `api.getRAGMetrics()` function and a `rag_metrics` Supabase table contract, but the current `Assistant` component does not query it. It keeps source metadata in component state and from `aiService.ts`.

How to explain:

> The assistant demonstrates a RAG-style interface: answer plus cited sources. In the current prototype, retrieval is simulated with source metadata. In production, this would be backed by a vector store or document search index, and the faithfulness score would be calculated or logged from the retrieval pipeline.

## 11. Notebook Walkthrough

Main notebook:

```text
Qatar_Airways_Revenue_Management_Technical_Report.ipynb
```

Supporting walkthrough notebook:

```text
AirlineDashboard_Walkthrough.ipynb
```

### 11.1 Notebook Section 1: Demand Forecasting

Notebook input data:

```text
days_before_departure
normal_bookings
event_spike
actual_daily_bookings
```

The notebook simulates 100 days of daily bookings before departure. It adds a tech conference event spike around 35 to 28 days before departure.

Notebook model outputs:

```text
legacy_forecast = rolling 14-day moving average
ai_forecast = simulated LSTM + Prophet output
extra_bookings_captured = ai_total - legacy_total
forecasting_revenue_uplift = extra_bookings_captured * premium_per_booking
```

Dashboard mapping:

| Notebook output | Dashboard data contract | Dashboard visual |
|---|---|---|
| `actual_daily_bookings` | `booking_curves.actual` | Booking Pace actual area |
| `ai_forecast` | `booking_curves.forecast` | Booking Pace forecast line |
| Previous year baseline | `booking_curves.last_year` / `ly` | Last Year gray line |
| Revenue uplift | Static scenario text / simulator concept | Revenue Simulator and ModuleExplanation |

Interview phrasing:

> The notebook proves why the AI forecast matters. It detects an event spike earlier than a rolling average. The dashboard takes the resulting forecast curve and turns it into an operational decision view.

### 11.2 Notebook Section 2: No-Show Prediction

Notebook input data:

```text
days_booked_ahead
is_loyalty_member
party_size
connection_time_mins
ticket_type
trip_type
```

Risk logic:

The notebook calculates `noshow_probability` using intuitive airline features:

| Feature | Why it matters |
|---|---|
| Non-loyalty member | Less committed behavior |
| Solo traveler | Easier to change plans |
| Tight connection | May misconnect |
| Refundable ticket | Easier to cancel |
| Leisure trip | Often more flexible |

Model:

The markdown says XGBoost conceptually, but the notebook code uses scikit-learn `GradientBoostingClassifier`. For interview purposes, say:

> The notebook uses a boosted-tree classifier to demonstrate the no-show scoring logic. In production I would likely use XGBoost or LightGBM because they perform strongly on tabular PNR data and provide feature importance.

Notebook outputs:

```text
noshow_probability
risk_category
risk_distribution
feature_importance
ai_overbook
extra_seats
noshow_revenue_uplift
```

Dashboard mapping:

| Notebook output | Dashboard data contract | Dashboard visual |
|---|---|---|
| `risk_category` counts | `noshow_risk` or `NoShowData.risk` | Passenger Risk Profile pie |
| passenger risk and ticket value | `NoShowData.scatter` | Ticket Value vs Risk scatter |
| `ai_overbook` | Intended overbooking recommendation | Gauge and overbooking visuals |
| `noshow_revenue_uplift` | Intended revenue KPI | Projected Revenue Gain card |

Interview phrasing:

> The no-show model turns passenger-level features into a probability of no-show. Aggregated across a flight, that gives expected empty seats. The optimizer then chooses the overbooking level that maximizes expected revenue while controlling denied boarding risk.

### 11.3 Notebook Section 3: Demand Unconstraining

Notebook input data:

```text
flight_capacity = 300
observed_bookings = 300
failed_booking_attempts = 45
```

Why this matters:

When a flight sells out, demand data becomes censored. Observed bookings cannot exceed capacity, so the raw booking count hides how much demand was turned away.

Model logic:

```text
Start with observed bookings.
Estimate spillover from booking velocity and failed attempts.
Iteratively update true demand estimate.
Hidden demand = estimated true demand - observed bookings.
```

Notebook outputs:

```text
true_demand_estimate
hidden_demand
unconstraining_revenue_uplift
```

Dashboard mapping:

| Notebook output | Dashboard data contract | Dashboard visual |
|---|---|---|
| observed sold seats | `unconstraining_data.bookings` | Blue bar |
| hidden demand | `unconstraining_data.denial` | Amber spill bar |
| true demand | `unconstraining_data.latent` | Stored value, not directly drawn |
| revenue uplift | Static opportunity/action cards | Opportunity Cost and ModuleExplanation |

Interview phrasing:

> Unconstraining estimates the demand that did not appear in booking totals because the flight or fare bucket was already closed. That is essential for future pricing and capacity planning.

### 11.4 Notebook Final ROI

Notebook final calculation:

```text
total_revenue_uplift =
    forecasting_revenue_uplift
  + noshow_revenue_uplift
  + unconstraining_revenue_uplift
```

How to explain:

> The ROI calculation is not meant to be a financial forecast for Qatar Airways. It is a scenario-based estimate showing the magnitude of value from better forecasting, better overbooking, and better spill recovery.

## 12. Exact Notebook-to-Dashboard Output Map

| Notebook concept | Output shape needed by dashboard | Dashboard table/mock object | Visual |
|---|---|---|---|
| Route performance summary | Route, load factor, target, RASK, yield, trends | `route_kpis` / `MOCK_ROUTE_KPIS` | Load Factor, RASK, Yield cards |
| Demand forecast curve | Route, days out, actual, forecast, last year | `booking_curves` / `MOCK_BOOKING_CURVES` | Booking Pace |
| Event or AI forecast uplift | Route, scenario uplift percent, revenue delta | UI state or future scenario table | Revenue Simulator |
| Competitor fare comparison | Route, date, our fare, competitor fare, market average | `competitor_data` / `MOCK_COMPETITOR_DATA` | Competitor Tracker |
| Profit decomposition | Route, driver name, value, type | `waterfall_data` / `MOCK_WATERFALL_DATA` | Profitability Breakdown |
| Price elasticity scenarios | Route, price change percent, revenue uplift percent | `elasticity_scenarios` / `MOCK_ELASTICITY` | Price Elasticity scatter |
| Overbooking economics | Route, +N seats, expected net value | `overbooking_scenarios` / `MOCK_OVERBOOKING` | Overbooking Optimization bars |
| Pricing forecast | Route, month, historical, forecast, optimal | `pricing_forecast` / `MOCK_PRICING_BY_ROUTE.forecast` | Forecasting line chart |
| Price sensitivity matrix | Route, segment, array of scores | `pricing_matrix` / `MOCK_PRICING_BY_ROUTE.matrix` | Heatmap |
| No-show risk distribution | Route, risk bucket, value, color | `noshow_risk` / `MOCK_NOSHOW_BY_ROUTE.risk` | Risk Profile pie |
| Passenger risk vs value | Risk probability, ticket value, category color | Generated currently, future passenger risk table | Ticket Value vs Risk scatter |
| Hidden demand / spill | Route, price bucket, bookings, latent, denial | `unconstraining_data` / `MOCK_UNCONSTRAINING_BY_ROUTE` | Latent Demand stacked bars |
| RAG source relevance | Source name, type, match score | `rag_metrics` / `MOCK_RAG_METRICS` | Grounded Sources panel |

## 13. Suggested Live Demo Walkthrough

Use this order in an interview.

### Step 1: Open with the architecture

Say:

> I will start from the dashboard as the business-facing layer, then show the notebook as the model-development layer. The important design idea is that the notebook produces stable outputs, while the dashboard consumes those outputs through a service layer and database-ready contracts.

Point to:

```text
App.tsx
services/mockData.ts
services/supabaseData.ts
```

### Step 2: Dashboard route performance

Open Dashboard.

Walk through:

1. Select `DOH-SFO`.
2. Explain Load Factor versus target.
3. Explain RASK and yield difference.
4. Show booking pace actual versus forecast versus last year.
5. Show competitor tracker.
6. Show profitability waterfall.

Good line:

> I do not want the RM analyst to look at one metric in isolation. Load factor, RASK, yield, competitor fares, and spill all tell different parts of the route story.

### Step 3: Use the simulator

Move the slider to around 8 to 12 percent and click Apply Simulation.

Say:

> This is a what-if layer. It shows how a pricing or capacity adjustment would flow into the forecast curve before an analyst commits the decision.

### Step 4: Forecasting panel

Open Forecasting.

Walk through:

1. Historical vs forecast vs optimal line chart.
2. Segment by price heatmap.
3. Recommendation card.

Say:

> The forecast predicts the future, but the optimal line recommends what to do about it. The heatmap helps explain which customer segments can absorb a higher fare.

### Step 5: No-show panel

Open No-Show Predictor.

Walk through:

1. Risk pie chart.
2. Ticket value vs risk scatter.
3. Gauge.
4. Revenue gain card.

Say:

> The model works at passenger level, but the dashboard aggregates it to a flight-level decision: how many extra seats can I sell without unacceptable denied boarding risk?

Be honest:

> The gauge and revenue card are currently static prototype values. The notebook contains the model calculation, and the data layer is ready to bind these to model outputs.

### Step 6: Pricing Optimizer

Open Pricing Optimizer.

Walk through:

1. Blue bookings are observed demand.
2. Amber bars are estimated spill or denial.
3. Opportunity cost summarizes the revenue leakage.
4. Optimize Fare Ladder simulates action.

Say:

> This is about censored demand. Sold-out flights look like demand equals capacity, but that is false. We need unconstraining to estimate demand that was never recorded as a booking.

### Step 7: RM Assistant

Open RM Assistant and ask something like:

```text
Which route needs the most attention and why?
```

Say:

> The assistant is meant to sit on top of the same route performance data and policy documents. In the current prototype, the RAG source cards are simulated; in production they would come from a real retrieval system.

### Step 8: Notebook walkthrough

Open `Qatar_Airways_Revenue_Management_Technical_Report.ipynb`.

Walk through three sections:

1. Demand forecasting: event spike, legacy forecast, AI forecast, revenue uplift.
2. No-show prediction: passenger features, boosted-tree classifier, overbooking uplift.
3. Unconstraining: observed bookings, hidden demand, EM estimate, spill revenue.

Closing line:

> The dashboard is not a separate story from the notebook. It is the operationalization of the notebook's outputs.

## 14. Interview Questions and Strong Answers

### Q1. Is the dashboard using the notebook live?

Answer:

> Not directly. The notebook is the analytical proof of concept. The dashboard consumes dashboard-ready data shapes through `services/mockData.ts` and Supabase-ready tables. In production, the notebook would be converted into a scheduled ML pipeline that writes outputs such as booking curves, no-show risk, overbooking recommendations, and unconstrained demand into those tables.

### Q2. Why not run the notebook directly from the dashboard?

Answer:

> A notebook is not a reliable low-latency production serving layer. It is excellent for experimentation and validation. For a dashboard, I want stable APIs or database tables, versioned data contracts, monitoring, and cached results. That separation keeps the frontend responsive and lets the model evolve independently.

### Q3. What data feeds the visuals?

Answer:

> The visuals are fed by route-level and module-level data contracts: route KPIs, booking curves, competitor fares, waterfall drivers, elasticity scenarios, overbooking scenarios, pricing forecasts, pricing matrices, no-show risk buckets, and unconstraining data. These are currently available as Supabase tables or mock arrays.

### Q4. What is RASK, and why is it important?

Answer:

> RASK is revenue per available seat kilometer. It combines pricing and capacity productivity. Load factor can look healthy while RASK is weak if seats were sold too cheaply. RASK is a better commercial performance metric than load factor alone.

### Q5. What is yield?

Answer:

> Yield is revenue per passenger kilometer. It focuses on revenue quality from passengers who actually flew or booked. RASK includes available capacity, so the two together tell whether the issue is price quality, capacity utilization, or both.

### Q6. Why use boosted trees for no-show prediction?

Answer:

> Passenger no-show data is tabular: booking channel, fare class, lead time, loyalty tier, connection risk, trip type. Boosted trees such as XGBoost or LightGBM usually perform very well on this kind of structured data, handle nonlinear interactions, and give feature importance that business stakeholders can understand.

### Q7. Why mention XGBoost if the notebook uses GradientBoostingClassifier?

Answer:

> The notebook demonstrates boosted-tree classification using scikit-learn's `GradientBoostingClassifier` to keep dependencies simple. The production model choice would likely be XGBoost or LightGBM. The conceptual approach is the same: passenger-level boosted-tree risk scoring.

### Q8. Why use LSTM plus Prophet for demand forecasting?

Answer:

> Prophet is strong for seasonality and holiday effects. LSTM-style sequence models are useful for nonlinear booking patterns and sudden pickup behavior. Combining them allows the model to separate calendar seasonality from unusual demand acceleration such as events or competitor changes.

### Q9. Why use EM for unconstraining?

Answer:

> Sold-out demand is censored. Once inventory closes, observed bookings no longer equal true demand. EM is a natural approach because it estimates missing or hidden demand iteratively from observed bookings, booking velocity, denials, and assumptions about the demand distribution.

### Q10. How does the overbooking model balance risk?

Answer:

> It compares the expected value of selling extra seats against the expected cost of denied boarding. The optimal overbooking level is where marginal expected revenue is still greater than marginal compensation and customer disruption cost.

### Q11. How would you productionize this?

Answer:

> I would turn the notebooks into scheduled pipelines, add feature validation, train and register models, write predictions into Supabase or a warehouse, and expose stable API contracts. I would monitor forecast error, no-show calibration, denied boarding rate, revenue uplift, drift, and data freshness.

### Q12. What are the limitations of the current prototype?

Answer:

> Several values are synthetic or static, including some recommendation cards, the no-show gauge, and opportunity cost cards. The RAG assistant is simulated unless an API key is configured. The model logic is demonstrated in the notebook, while the dashboard currently uses mock or Supabase-populated outputs. That is acceptable for a portfolio demo, but production would require real data pipelines, model monitoring, and governance.

## 15. Honest Caveats to Be Ready For

Use these carefully. They make you sound credible, not defensive.

| Caveat | How to frame it |
|---|---|
| Some dashboard values are hardcoded | "This is a prototype UI showing where model outputs land. The data contracts are ready for dynamic binding." |
| Notebook is not called at runtime | "That is intentional. Notebooks are for experimentation; production dashboards consume materialized outputs." |
| README mentions slightly different stack details | "The source of truth is `package.json`: React 18, Vite 5, Recharts, React Query, OpenAI client. Some docs are older." |
| No-show notebook uses GradientBoostingClassifier | "It is a boosted-tree proxy for XGBoost-style logic to keep the notebook runnable." |
| RAG sources are simulated | "The UI demonstrates grounded-answer design. Production would connect to vector retrieval and source scoring." |
| Tailwind is loaded from CDN in `index.html` | "For production I would bundle Tailwind through the build pipeline rather than rely on CDN." |
| Some scatter data is generated client-side | "In production I would store anonymized passenger risk outputs or aggregate bins." |

## 16. What to Emphasize for a Qatar Airways Data Science Interview

Emphasize business judgment:

```text
The goal is not just model accuracy. The goal is better RM decisions:
  - protect seats for high-yield demand
  - avoid empty seat spoilage
  - reduce revenue spill
  - price with competitor and demand context
  - keep recommendations explainable for analysts
```

Emphasize explainability:

```text
Revenue managers need to trust why a route is being repriced or overbooked.
That is why the dashboard shows drivers, not just predictions.
```

Emphasize separation of concerns:

```text
Notebook = model development and validation.
Data service = stable contract.
Dashboard = decision interface.
Supabase/API = production data layer.
```

Emphasize operational metrics:

```text
Forecast accuracy alone is not enough.
I would monitor:
  - forecast error by route and booking window
  - no-show calibration
  - denied boarding incidents
  - RASK and yield uplift
  - spill recapture
  - analyst adoption of recommendations
```

## 17. Quick Route Talking Points

Based on the mock route KPIs:

| Route | Story to tell |
|---|---|
| DOH-SFO | Healthy but below target load. Good route for event-demand forecasting and simulation. |
| DOH-JFK | Strong performer close to target. Good route for conservative overbooking and premium yield protection. |
| DOH-LOS | High yield but weak load and negative RASK trend. Good example of volatility, unconstraining, and pricing control. |
| DOH-PVG | Low load but strongest RASK trend. Good growth opportunity that needs demand stimulation. |
| DOH-ZAG | Moderate stable route. Good baseline comparison. |

## 18. Short Final Pitch

Use this as your closing explanation:

> This project shows the full path from data science logic to an RM decision interface. The notebook demonstrates the analytical engines: demand forecasting, no-show scoring, and unconstraining. The dashboard operationalizes those outputs into visuals that an analyst can use: route KPIs, booking curves, competitor fares, pricing sensitivity, overbooking economics, and latent demand. The current data is synthetic and some visuals are prototype-bound, but the architecture already separates model output, data service, and frontend decisioning, which is exactly how I would productionize it.

