# RM Dashboard Demo Walkthrough

## 1. Opening Framing

Use this line:

This is not an autopilot. It is a revenue-management decision support dashboard that keeps the analyst in control and shows the evidence behind every recommendation.

For RM leaders, emphasize trust, business judgment, and airline-specific controls. For data science leaders, emphasize grounding, deterministic rules, verification, and abstention.

## 2. Dashboard Overview

Start on **Dashboard**.

Say:

This page shows route health across strategic O&Ds. I start by choosing a route, then I look at load factor, RASK, yield, booking pace, competitor fares, and the revenue simulator.

What to click:

1. Click `DOH-LOS`.
2. Point out that the KPI cards and charts update.
3. Move the simulator slider to `10%`.
4. Click **Apply Simulation to Forecast**.

Easy explanation:

The slider is a controlled what-if. It lets an analyst ask, "If we tighten price or capacity by this much, what happens to revenue and risk?"

## 3. Forecasting Visual

Go to **Forecasting**.

Say:

This visual compares historical demand, forecast demand, and the optimal demand target. The month axis is now chronological from February 2026 through July 2026, so it does not jump from June back to February.

What to click:

1. Change routes using the route buttons.
2. Hover the line chart.
3. Click **Apply** in the recommendation box.

Easy explanation:

The model is not just predicting demand. It is showing where demand is high enough that we should protect higher-yield inventory and avoid selling too cheaply too early.

## 4. No-Show Predictor

Go to **No-Show Predictor**.

Say:

This panel estimates who may not show up and turns that into an overbooking limit. The key is balancing extra revenue against denied-boarding risk.

What to click:

1. Change routes.
2. Point at the passenger risk profile.
3. Point at the overbooking limit and revenue gain.

Easy explanation:

Instead of using one blunt no-show percentage, the model scores passenger risk and then recommends a controlled overbooking level.

## 5. Pricing Optimizer

Go to **Pricing Optimizer**.

Say:

This shows constrained bookings versus latent demand. If demand was blocked because a fare class closed or capacity filled, the model estimates the demand we did not observe.

What to click:

1. Change route.
2. Click **Optimize Fare Ladder**.

Easy explanation:

This is about spill. If too many low-fare seats sell early, we may displace higher-fare passengers later. The optimizer recommends where to close or protect fare classes.

## 6. RM Assistant

Go to **RM Assistant**.

Say:

This is the assistant design I would demo to both RM and data science audiences. It has four agents and one deterministic rules engine: Advisor, Critic, Verifier, Synthesizer, and Rules Engine.

What to click:

1. Click the quick prompt: `Should we close K/L/M on QR123 DOH-LHR D-7?`
2. Submit it.
3. Show the **Agent Pipeline**.
4. Point out the Critic objection.
5. Point out the Verifier claims and citations.
6. Show the counterfactual panel.

Easy explanation:

The Advisor proposes an action, the Critic challenges it like an RM analyst would, the Rules Engine applies hard business constraints, and the Verifier checks that every factual claim is grounded.

## 7. Abstention Moment

Use the second quick prompt:

`What if competitor fare data is stale?`

Say:

This is the trust moment. If the input is stale, the assistant withholds the recommendation instead of guessing.

Easy explanation:

An overconfident answer is dangerous in revenue management. A useful assistant must know when not to answer.

## 8. Final Close

Use this close:

The same demo moment works for both audiences. RM sees a tool that respects analyst judgment. Data science sees a grounded architecture with rules, verification, counterfactuals, and abstention.

## Implementation Plan

Completed in this pass:

1. Fixed the forecasting month sequence to use chronological 2026 periods.
2. Added explicit dummy pricing, no-show, elasticity, overbooking, and unconstraining data for PVG and ZAG where the app previously fell back to defaults.
3. Reworked the RM Assistant UI to show Advisor, Critic, Rules Engine, Verifier, citations, counterfactuals, and abstention.
4. Wired previously dead buttons: **View All Citations** and the header alert bell.

Recommended next pass:

1. Add Playwright tests for sidebar navigation, route switching, simulator apply, forecasting apply, pricing optimizer, assistant support response, and assistant abstention response.
2. Move the assistant pipeline behind a server endpoint before using real API keys.
3. Add a real date picker only if the demo needs date filtering; current date labels are static snapshot labels.
4. Expose the currently unreachable technical views only if they support the interview story.
