# 🎬 5-Minute Video Avatar Script
## *Revenue Management Dashboard: Solving the $500M Airline Problem*

**Total Duration:** 5 minutes (300 seconds)  
**Format:** Digital Avatar Presentation with Visual Support  
**Tone:** Professional, engaging, conversational

---

## 📋 Script Overview & Visual Cues

| Time      | Section                   | Duration | Visual Cue                        |
| --------- | ------------------------- | -------- | --------------------------------- |
| 0:00-0:30 | Opening Hook              | 30 sec   | Title card + Revenue leak graphic |
| 0:30-1:30 | Problem #1: Pricing       | 60 sec   | Booking curve + Forecast chart    |
| 1:30-2:45 | Problem #2: Empty Seats   | 75 sec   | No-show predictor + Risk gauge    |
| 2:45-3:45 | Problem #3: Hidden Demand | 60 sec   | Unconstraining panel + EM visual  |
| 3:45-4:30 | AI Assistant              | 45 sec   | RAG assistant interface           |
| 4:30-5:00 | Summary & Impact          | 30 sec   | Impact summary dashboard          |

---

# SCRIPT BEGINS

---

## 🎬 SECTION 1: Opening Hook (0:00 - 0:30)

**[VISUAL: Show title card with dashboard logo, then transition to revenue leak infographic]**

> **AVATAR SPEAKS:**

"Welcome! I'm about to show you how data science is solving a **half-billion dollar problem** in the airline industry.

Here's a shocking truth: **airlines operate on just 2-3% profit margins**—one of the thinnest in any industry. A single empty seat on a Boeing 777 costs up to $1,500. When 5 to 15 percent of passengers don't show up? That's billions lost annually.

I built this Revenue Management Dashboard to tackle three critical problems that drain airline profits every single day. Let me show you how."

**[VISUAL CUE: Transition animation to Problem #1]**

---

## 🎬 SECTION 2: Problem #1 - The Pricing Puzzle (0:30 - 1:30)

**[VISUAL: Show the booking S-curve chart and demand forecasting panel]**

> **AVATAR SPEAKS:**

"**Problem one: Dynamic Pricing.**

Think of it like selling lemonade. If you price too high, nobody buys. Too low? You run out before your best customers arrive. Airlines face this dilemma across **thousands of flights every day**.

**[VISUAL: Point to the booking curve visualization]**

See this S-curve? It shows how bookings accelerate as departure approaches. The challenge is: traditional systems can't detect demand spikes in real-time.

**[VISUAL: Highlight the LSTM + Prophet forecast section]**

My solution uses a **hybrid AI model**—LSTM neural networks combined with Facebook's Prophet.

Why this combination? LSTM has a *long memory*—it remembers booking patterns from months ago. Think of it as remembering last year's Christmas rush, not just yesterday's sales. Prophet handles holidays like Eid, Easter, and school breaks automatically.

**[VISUAL: Show the simulation results - revenue uplift]**

When I run the simulation, the system captures demand spikes **in real-time**—something legacy systems miss entirely. **Impact: $15,000 additional revenue per event detected.**"

**[VISUAL CUE: Transition to No-Show Predictor]**

---

## 🎬 SECTION 3: Problem #2 - The Empty Seat Crisis (1:30 - 2:45)

**[VISUAL: Show the No-Show Predictor dashboard with passenger risk analysis]**

> **AVATAR SPEAKS:**

"**Problem two: Empty seats at departure.**

Here's a scenario: 10 friends say they'll come to your party, but 2 always forget. If you only prepare for 10, you have wasted cake. But if you invite 2 extras, you fill every seat.

Airlines call this **overbooking**—but they do it blindly. The industry average? A conservative plus-5 seats. My system? It recommends plus-14 to plus-18—and *reduces* denied boarding. How?

**[VISUAL: Show the XGBoost feature importance and passenger segmentation]**

I use **XGBoost machine learning** to analyze 40+ passenger features: loyalty status, ticket type, connection risks, past behavior. 

**[VISUAL: Point to the risk segmentation pie chart]**

See this passenger breakdown? The model identifies *who* is likely to no-show—not just how many. A business traveler with platinum status on a non-refundable ticket? Almost zero risk. A first-time customer with a refundable fare and tight connections? High risk.

**[VISUAL: Show the overbooking gauge recommending +14]**

Then I run **10,000 Monte Carlo simulations** to find the sweet spot—maximum fill rate with less than 1% denied boarding risk.

**[VISUAL: Show the before/after metrics]**

**The result: 75% fewer empty seats, $19,200 additional revenue per flight—and denied boardings actually *decreased*.** The system knows exactly where the risk lives."

**[VISUAL CUE: Transition to Unconstraining panel]**

---

## 🎬 SECTION 4: Problem #3 - The Invisible Queue (2:45 - 3:45)

**[VISUAL: Show the Unconstraining Analysis panel with spill visualization]**

> **AVATAR SPEAKS:**

"**Problem three: The customers you never see.**

Imagine your lemonade stand sold out at noon. 20 people walked away disappointed—but you never counted them because you'd already closed. Airlines have the same problem: once a flight sells out, they stop measuring demand.

**[VISUAL: Point to the spill bars (orange) showing lost demand]**

These orange bars represent **spill**—customers who tried to book but couldn't. Traditional systems would tell you 100 people wanted that flight. The real answer? 127.

**[VISUAL: Show the EM Algorithm explanation graphic]**

I use the **Expectation-Maximization algorithm**—an industry-standard technique developed specifically for this 'censored data' problem. It reconstructs the invisible demand you never captured.

**[VISUAL: Show the bid price optimization panel]**

With true demand visible, we can set **bid prices**—the minimum price for the last few seats. This protects premium inventory from being sold too cheaply.

**[VISUAL: Show revenue recapture metrics]**

**Impact: $8,000 in recaptured revenue per high-demand route.** That's money that was previously invisible."

**[VISUAL CUE: Transition to AI Assistant]**

---

## 🎬 SECTION 5: The Trustworthy AI Assistant (3:45 - 4:30)

**[VISUAL: Show the AI Assistant interface with a policy question]**

> **AVATAR SPEAKS:**

"Now, you might ask: why not just use ChatGPT for analyst queries?

In regulated industries like aviation, an AI that **hallucinates policy is dangerous**. Imagine if it told an analyst 'you can overbook by 50 passengers' when the actual limit is 10. That's a legal liability.

**[VISUAL: Show a RAG response with source citations and faithfulness score]**

I implemented **Retrieval-Augmented Generation**—or RAG. Instead of relying on training data, the AI searches actual policy documents *first*, then formulates answers with **source citations**.

**[VISUAL: Point to the faithfulness score - 98%]**

See this faithfulness score? It measures how grounded each answer is in real documentation. Above 90%? Trust it. Below 70%? Flag for human review.

**[VISUAL: Show the source document citation]**

Every answer can be **audited and verified**. This is enterprise-grade AI—trustworthy enough for boardroom decisions."

**[VISUAL CUE: Transition to Summary Dashboard]**

---

## 🎬 SECTION 6: Summary & Impact (4:30 - 5:00)

**[VISUAL: Show the full impact summary table]**

> **AVATAR SPEAKS:**

"Let me bring it all together.

**[VISUAL: Highlight each row as you speak]**

- **Problem 1—Pricing:** LSTM plus Prophet captures demand in real-time. **Plus $15,000 per event.**
- **Problem 2—Empty Seats:** XGBoost plus Monte Carlo fills seats intelligently. **Plus $19,200 per flight.**
- **Problem 3—Hidden Demand:** EM Algorithm reveals true market size. **Plus $8,000 per route.**
- **Problem 4—Unreliable AI:** RAG ensures 100% policy compliance with citations.

**[VISUAL: Show the total impact - $42,000+ per flight]**

**Combined impact: Over $42,000 improvement per flight.** Multiply that across thousands of flights, and this is a game-changer.

This project demonstrates **mature, ROI-driven data science**—choosing the right tool for each constraint, not the flashiest model.

Thank you for watching. I'd love to discuss how these techniques can apply to your organization."

**[VISUAL: Closing card with contact information and dashboard URL]**

---

# SCRIPT ENDS

---

## 📸 Required Visual Assets

| Section        | Image/Screenshot Needed           | Description                               |
| -------------- | --------------------------------- | ----------------------------------------- |
| Opening        | `revenue_leak_infographic.png`    | Infographic showing $5-10B annual losses  |
| Opening        | `dashboard_title_card.png`        | Qatar Airways RM Demo logo                |
| Pricing        | `booking_curve_schart.png`        | The S-curve booking pattern visualization |
| Pricing        | `lstm_forecast_panel.png`         | Demand forecasting with LSTM + Prophet    |
| Pricing        | `simulation_results.png`          | Revenue uplift after applying simulation  |
| No-Show        | `noshow_predictor_dashboard.png`  | Full No-Show Predictor page               |
| No-Show        | `passenger_risk_segmentation.png` | Pie chart of passenger risk categories    |
| No-Show        | `overbooking_gauge.png`           | Gauge showing +14 recommendation          |
| No-Show        | `feature_importance.png`          | XGBoost feature importance chart          |
| Unconstraining | `unconstraining_panel.png`        | Full Unconstraining Analysis page         |
| Unconstraining | `spill_bars_chart.png`            | Orange spill bars showing lost demand     |
| Unconstraining | `bid_price_optimizer.png`         | Bid price optimization panel              |
| AI Assistant   | `rag_assistant_query.png`         | AI Assistant with a policy question       |
| AI Assistant   | `faithfulness_score.png`          | Response showing 98% faithfulness         |
| AI Assistant   | `source_citation.png`             | Document citation panel                   |
| Summary        | `impact_summary_table.png`        | Full impact metrics table                 |
| Closing        | `closing_card.png`                | Contact info and dashboard URL            |

---

## 🎙️ Avatar Recording Instructions

### Voice Settings
- **Pace:** Moderate (150 words/minute)
- **Tone:** Professional but approachable
- **Emphasis:** On dollar amounts and impact metrics
- **Pauses:** Brief pause before each "Impact" statement

### Visual Sync Points
Mark these timestamps for image transitions:
- `0:00` → Title card
- `0:05` → Revenue leak infographic
- `0:30` → Booking curve
- `0:50` → LSTM forecast panel
- `1:20` → Simulation results
- `1:30` → No-show predictor
- `1:55` → Risk segmentation pie chart
- `2:20` → Overbooking gauge
- `2:35` → Before/after metrics
- `2:45` → Unconstraining panel
- `3:05` → Spill bars
- `3:25` → Bid price optimizer
- `3:45` → AI Assistant interface
- `4:05` → Faithfulness score
- `4:20` → Source citation
- `4:30` → Impact summary table
- `4:55` → Closing card

---

## 📊 Word Count & Timing Verification

| Section      | Word Count    | @ 150 WPM | Target Duration |
| ------------ | ------------- | --------- | --------------- |
| Opening Hook | 75 words      | 30 sec    | 30 sec ✅        |
| Problem #1   | 155 words     | 62 sec    | 60 sec ✅        |
| Problem #2   | 195 words     | 78 sec    | 75 sec ✅        |
| Problem #3   | 150 words     | 60 sec    | 60 sec ✅        |
| AI Assistant | 115 words     | 46 sec    | 45 sec ✅        |
| Summary      | 110 words     | 44 sec    | 30 sec ⚠️        |
| **TOTAL**    | **800 words** | **5:20**  | **5:00**        |

*Note: Summary section runs slightly long. Speak 10% faster or trim as needed.*

---

## 💡 Pro Tips for Avatar Recording

1. **Use hand gestures** that sync with "pointing" moments in the script
2. **Smile on impact statements** (dollar amounts)
3. **Pause briefly** before transitioning between problems
4. **Look directly at camera** during opening and closing
5. **Gesture toward the side** when referencing visuals

---

*Script optimized for digital avatar platforms like Synthesia, HeyGen, or D-ID.*
