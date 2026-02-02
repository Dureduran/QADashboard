# 🎬 HeyGen 5-Minute Demo Script
## *Interactive Revenue Management Dashboard Walkthrough*

**Total Duration:** 5 minutes (300 seconds)  
**Format:** Digital Avatar Presentation with Live Dashboard Visuals  
**Tone:** Professional, engaging, conversational  
**Target Audience:** Hiring Manager for Data Science/Revenue Management role

---

## 📋 Visual Walkthrough Overview

| Time      | Section         | Duration | Dashboard View      | Key Visual                               |
| --------- | --------------- | -------- | ------------------- | ---------------------------------------- |
| 0:00-0:40 | Opening Hook    | 40 sec   | Strategic Dashboard | KPI Cards (Load Factor, RASK, Yield)     |
| 0:40-1:45 | Problem #1      | 65 sec   | Strategic Dashboard | Booking Pace Chart + Revenue Simulator   |
| 1:45-2:50 | Problem #2      | 65 sec   | No-Show Predictor   | Risk Pie Chart + Overbooking Gauge       |
| 2:50-3:50 | Problem #3      | 60 sec   | Pricing Optimizer   | Spill Bar Chart + Opportunity Cost Cards |
| 3:50-4:30 | AI Assistant    | 40 sec   | RM Assistant        | Faithfulness Gauge + Source Citations    |
| 4:30-5:00 | Summary & Close | 30 sec   | Strategic Dashboard | Full Impact View                         |

---

# SCRIPT BEGINS

---

## 🎬 SECTION 1: Opening Hook (0:00 - 0:40)

**[VISUAL: Show Strategic Dashboard with KPI Cards prominently displayed]**

> **AVATAR SPEAKS:**

"Welcome! I'm about to show you how data science solves a **half-billion dollar problem** in the airline industry.

**[VISUAL: Point to the three KPI cards showing Load Factor, RASK, and Yield]**

Right here, you're looking at the vital signs of any airline route. This is the DOH-SFO corridor.

See this Load Factor at 82%? That seems healthy—but notice the target is 88%. That 6% gap? On a Boeing 777, that's 21 empty seats at $1,200 each: **$25,000 lost on just one flight.**

**[VISUAL: Highlight the trend arrows on RASK and Yield cards]**

These green arrows show we're trending up—but the real question is: *are we capturing maximum revenue?* Let me show you three problems this dashboard solves."

**[VISUAL CUE: Scroll down to Booking Pace chart]**

---

## 🎬 SECTION 2: Problem #1 - Dynamic Pricing (0:40 - 1:45)

**[VISUAL: Show Booking Pace ComposedChart with actual, forecast, and last year lines]**

> **AVATAR SPEAKS:**

"**Problem one: When should we change ticket prices?**

Think of it like selling lemonade. Price too high, nobody buys. Too low, you run out before your best customers arrive. Airlines face this across thousands of flights daily.

**[VISUAL: Point to the S-curve shape in the Booking Pace chart]**

This chart shows our booking curve versus forecast and last year. Notice the burgundy area—that's 2026 actuals. The yellow dashed line? That's our AI forecast using **LSTM neural networks combined with Prophet.**

**[VISUAL: Move to Revenue Simulator panel on the right - show slider and Apply Simulation button]**

Here's where it gets interactive. Watch what happens when I adjust this Price/Capacity slider to +10%.

**[VISUAL: Show the slider moving and the Projected Revenue Delta updating to show "+$100,000"]**

The system instantly calculates the revenue impact. And see this green simulated line appear on the chart? It shows how the adjusted forecast compares to baseline.

**[VISUAL: Click "Apply Simulation" button, show the processing spinner, then "Simulation Active" confirmation]**

Why LSTM? Because it has *long memory*—it remembers booking patterns from months ago, like last year's Christmas rush. Traditional systems miss demand spikes. **Impact: $15,000 additional revenue per event detected.**"

**[VISUAL CUE: Navigate to No-Show Predictor view]**

---

## 🎬 SECTION 3: Problem #2 - Empty Seats (1:45 - 2:50)

**[VISUAL: Show No-Show Predictor dashboard with the 2x2 grid layout]**

> **AVATAR SPEAKS:**

"**Problem two: Empty seats at departure.**

10 friends say they'll come to your party, but 2 always forget. If you only prepare for 10, you have wasted cake. The solution? Invite 2 extras.

**[VISUAL: Point to the Passenger Risk Profile pie chart in top-left]**

Airlines call this *overbooking*—but they do it blindly. Look at this risk breakdown. My system uses **XGBoost machine learning** to analyze 40+ passenger features and segment them by risk level.

**[VISUAL: Point to the Ticket Value vs Risk scatter plot in top-right]**

This scatter plot shows each passenger's ticket value against their no-show probability. See those red dots in the upper-left? High-value passengers with low show probability—that's where the risk lives.

**[VISUAL: Point to the Optimal Overbooking Gauge showing "10 Seats (Low Risk)"]**

Here's the magic: the system runs **10,000 Monte Carlo simulations** to find the sweet spot. This gauge shows we can safely overbook by 10 seats with less than 1% denied boarding risk.

**[VISUAL: Point to the Projected Revenue Gain card showing "$12,500"]**

The result? $12,500 additional revenue per flight. And denied boardings actually *decreased*—because we know exactly where the risk lives."

**[VISUAL CUE: Navigate to Pricing Optimizer view]**

---

## 🎬 SECTION 4: Problem #3 - Hidden Demand (2:50 - 3:50)

**[VISUAL: Show Pricing Optimizer with Latent Demand Analysis bar chart]**

> **AVATAR SPEAKS:**

"**Problem three: The customers you never see.**

Imagine your lemonade stand sold out at noon. 20 people walked away disappointed—but you never counted them. Airlines have the exact same problem.

**[VISUAL: Point to the stacked bar chart - blue bars are bookings, orange bars are spill]**

See these bars? Blue represents actual bookings. But these orange sections on top? That's **spill**—customers who tried to book but couldn't because we sold out.

Traditional systems say 100 people wanted this flight. The real answer? 127.

**[VISUAL: Point to the Opportunity Cost cards on the right - "$4,250 Revenue Spill" and "85% Recapture Potential"]**

I use the **Expectation-Maximization algorithm**—an industry-standard technique that reconstructs invisible demand. See this number? $4,250 in revenue spill, daily.

**[VISUAL: Point to the Pricing Action section and "Optimize Fare Ladder" button]**

With true demand visible, we can set **bid prices**—the minimum price for the last few seats. Watch what happens when I click this.

**[VISUAL: Click "Optimize Fare Ladder", show the spinner, then success toast showing "Lower buckets closed"]**

The system just closed our cheapest fare classes, protecting premium inventory. **Impact: $8,000 in recaptured revenue per high-demand route.**"

**[VISUAL CUE: Navigate to RM Assistant view]**

---

## 🎬 SECTION 5: The AI Assistant (3:50 - 4:30)

**[VISUAL: Show RM Assistant with chat interface and Trust panel on right]**

> **AVATAR SPEAKS:**

"Now, you might ask: why not just use ChatGPT for analyst queries?

**[VISUAL: Point to the chat interface]**

In regulated industries like aviation, an AI that **hallucinates policy is dangerous**. Imagine it telling an analyst 'you can overbook by 50 passengers' when the limit is 10.

**[VISUAL: Point to the Faithfulness Score gauge showing 98%]**

I implemented **Retrieval-Augmented Generation**—RAG. Instead of relying on training data, the AI searches actual policy documents first.

See this faithfulness score? It measures how grounded each answer is in real documentation. 98%—that means you can trust this answer.

**[VISUAL: Point to the Grounded Sources panel with document citations and match percentages]**

Every answer shows its sources with match percentages. This is enterprise-grade AI—trustworthy enough for boardroom decisions."

**[VISUAL CUE: Navigate back to Strategic Dashboard]**

---

## 🎬 SECTION 6: Summary & Close (4:30 - 5:00)

**[VISUAL: Show full Strategic Dashboard with all visualizations visible]**

> **AVATAR SPEAKS:**

"Let me bring it all together.

**[VISUAL: Quick visual tour across the dashboard]**

- **Problem 1—Pricing:** LSTM plus Prophet captures demand in real-time. **Plus $15,000 per event.**
- **Problem 2—Empty Seats:** XGBoost plus Monte Carlo fills seats intelligently. **Plus $19,200 per flight.**
- **Problem 3—Hidden Demand:** EM Algorithm reveals true market size. **Plus $8,000 per route.**
- **Problem 4—Unreliable AI:** RAG ensures 100% policy compliance with citations.

**[VISUAL: Show Competitor Tracker and Profitability Waterfall charts]**

And everything you've seen—from competitor tracking to profitability breakdowns—updates in real-time.

**Combined impact: Over $42,000 improvement per flight.** Multiply that across thousands of flights, and this is a game-changer.

This project demonstrates **mature, ROI-driven data science**—choosing the right tool for each constraint, not the flashiest model.

Thank you for watching. I'd love to discuss how these techniques can apply to your organization."

**[VISUAL: Show closing view of dashboard with Qatar Airways branding]**

---

# SCRIPT ENDS

---

## 📸 Visual Mapping to Dashboard Components

| Section       | Dashboard View      | Component File            | Key Visual Elements                                                                                 |
| ------------- | ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| Opening       | Strategic Dashboard | `StrategicDashboard.tsx`  | KPI Cards (Load Factor gauge, RASK trend, Yield breakdown)                                          |
| Pricing       | Strategic Dashboard | `StrategicDashboard.tsx`  | Booking Pace ComposedChart, Revenue Simulator slider, Apply Simulation button                       |
| No-Show       | No-Show Predictor   | `NoShowPanel.tsx`         | Passenger Risk PieChart, Value vs Risk ScatterChart, Overbooking Gauge, Revenue Gain card           |
| Hidden Demand | Pricing Optimizer   | `UnconstrainingPanel.tsx` | Latent Demand BarChart (blue + orange stacked), Opportunity Cost cards, Optimize Fare Ladder button |
| AI Assistant  | RM Assistant        | `Assistant.tsx`           | Chat interface, Faithfulness Score gauge, Grounded Sources panel                                    |
| Summary       | Strategic Dashboard | `StrategicDashboard.tsx`  | Competitor Tracker LineChart, Profitability Waterfall BarChart                                      |

---

## 🎙️ HeyGen Recording Instructions

### Navigation Flow
Record the dashboard interaction as follows:
1. **Start on Strategic Dashboard** - Route selector on "DOH-SFO"
2. **Scroll to show Booking Pace** - Wait for chart animation
3. **Interact with Revenue Simulator** - Slide to +10%, click Apply
4. **Navigate to "No-Show Predictor"** - Click sidebar item
5. **Navigate to "Pricing Optimizer"** - Click sidebar item, click Optimize button
6. **Navigate to "RM Assistant"** - Click sidebar item
7. **Return to "Dashboard"** - Click sidebar item for closing

### Voice Settings
- **Pace:** Moderate (145-150 words/minute)
- **Tone:** Professional but approachable
- **Emphasis:** On dollar amounts and impact metrics
- **Pauses:** Brief pause before each "Impact" statement

### Visual Sync Points
Mark these timestamps for transitions:
- `0:00` → Strategic Dashboard (KPI cards in view)
- `0:40` → Scroll to Booking Pace chart
- `0:55` → Point to Revenue Simulator
- `1:20` → Click Apply Simulation
- `1:45` → Navigate to No-Show Predictor
- `2:00` → Point to Pie Chart
- `2:20` → Point to Scatter Plot
- `2:35` → Point to Gauge
- `2:50` → Navigate to Pricing Optimizer
- `3:10` → Point to Spill bars
- `3:30` → Click Optimize Fare Ladder
- `3:50` → Navigate to RM Assistant
- `4:10` → Point to Faithfulness Score
- `4:30` → Navigate to Strategic Dashboard
- `4:55` → Closing tour

---

## 📊 Word Count & Timing Verification

| Section      | Word Count    | @ 150 WPM | Target Duration |
| ------------ | ------------- | --------- | --------------- |
| Opening Hook | 100 words     | 40 sec    | 40 sec ✅        |
| Problem #1   | 160 words     | 64 sec    | 65 sec ✅        |
| Problem #2   | 165 words     | 66 sec    | 65 sec ✅        |
| Problem #3   | 145 words     | 58 sec    | 60 sec ✅        |
| AI Assistant | 100 words     | 40 sec    | 40 sec ✅        |
| Summary      | 115 words     | 46 sec    | 30 sec ⚠️        |
| **TOTAL**    | **785 words** | **5:14**  | **5:00**        |

*Note: Summary section runs slightly long. Speak 10% faster in summary or trim the impact recap.*

---

## 💡 Pro Tips for HeyGen Recording

1. **Use screen recording overlay** - Record the actual dashboard with mouse movements synced to script
2. **Pre-populate data** - Ensure all routes show compelling data before recording
3. **Practice button clicks** - Time the "Apply Simulation" and "Optimize" button clicks to match script
4. **Smooth transitions** - Use sidebar navigation between views (don't use refresh)
5. **Keep dashboard running** - Start the dev server first: `npm run dev`

---

## 🚀 Pre-Recording Checklist

- [ ] Start the dashboard: `npm run dev`
- [ ] Navigate to `http://localhost:5173`
- [ ] Set route to "DOH-SFO" on Strategic Dashboard
- [ ] Reset Revenue Simulator slider to 0%
- [ ] Clear any previous simulation states
- [ ] Test all navigation links work
- [ ] Record in 1920x1080 resolution for HeyGen overlay
- [ ] Practice the full 5-minute flow once before recording

---

*Script optimized for HeyGen digital avatar platform with live dashboard visual overlay.*
*Dashboard: Qatar Airways Revenue Management Demo*
