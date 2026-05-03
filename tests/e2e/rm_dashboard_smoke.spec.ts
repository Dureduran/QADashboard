import { expect, test } from '@playwright/test';

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5173';

test('dashboard navigation, actions, and RM assistant demo path work', async ({ page }) => {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(page.getByText('Route Performance')).toBeVisible();

  await page.getByRole('button', { name: 'DOH-LOS' }).first().click();
  await expect(page.getByText('74%').first()).toBeVisible();

  await page.getByRole('slider').fill('10');
  await page.getByRole('button', { name: /Apply Simulation/i }).click();
  await expect(page.getByText('Simulation Active')).toBeVisible();
  await expect(page.getByText('Forecast Demand Uplift Scenario')).toBeVisible();
  await expect(page.getByText('Simulated from 74%')).toBeVisible();
  await expect(page.getByText('Scenario-adjusted')).toBeVisible();
  await page.locator('.qa-booking-pace-chart').scrollIntoViewIfNeeded();
  await page.locator('.qa-booking-pace-chart').hover();
  const sCurveTooltip = page.locator('.qa-recharts-tooltip');
  await expect(sCurveTooltip).toBeVisible();
  await expect(sCurveTooltip).toHaveCSS('color', 'rgb(248, 250, 252)');
  await expect(sCurveTooltip).toContainText(/Actual|Forecast|Last Year/);

  await page.getByRole('button', { name: 'Forecasting' }).click();
  await expect(page.getByText('Interactive Demand Forecasting')).toBeVisible();
  await expect(page.getByText('Feb 2026')).toBeVisible();
  await expect(page.getByText('Jul 2026')).toBeVisible();
  const monthOrder = ['Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026'];
  const monthPositions = await Promise.all(monthOrder.map(async month => {
    const box = await page.locator('svg text').filter({ hasText: month }).first().boundingBox();
    expect(box, `${month} should be visible on the forecast x-axis`).not.toBeNull();
    return box!.x;
  }));
  expect(monthPositions).toEqual([...monthPositions].sort((a, b) => a - b));
  await page.getByRole('button', { name: 'DOH-PVG' }).first().click();
  await expect(page.getByText('Price Sensitivity Matrix (DOH-PVG)')).toBeVisible();
  await expect(page.getByText('Stimulate demand')).toBeVisible();
  await expect(page.getByText('65% LF is 15 pts below 80% target')).toBeVisible();
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('button', { name: /Applied/i })).toBeVisible();

  await page.getByRole('button', { name: 'No-Show Predictor' }).click();
  await expect(page.getByText('Overbooking & No-Show Optimizer')).toBeVisible();
  await page.getByRole('button', { name: 'DOH-ZAG' }).first().click();
  await expect(page.getByText(/NO-SHOW PREDICTION & OPTIMIZER/)).toBeVisible();
  await page.locator('.qa-risk-chart').hover();
  const donutTooltip = page.locator('.qa-chart-tooltip');
  await expect(donutTooltip).toBeVisible();
  await expect(donutTooltip).toHaveCSS('color', 'rgb(248, 250, 252)');

  await page.getByRole('button', { name: 'Pricing Optimizer' }).click();
  await expect(page.getByText('Real-Time Demand Unconstraining & Pricing')).toBeVisible();
  await page.getByRole('button', { name: /Optimize Fare Ladder/i }).click();
  await expect(page.getByText('Optimization Complete')).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'RM Assistant' }).click();
  await expect(page.getByText('RM Assistant: Agent Decision Council')).toBeVisible();
  await expect(page.getByText('DOH-LHR')).toHaveCount(0);
  await expect(page.getByText('QR123')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Should we close K/L/M on DOH-SFO?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'How should we protect DOH-JFK?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'What should we do on DOH-PVG?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'How should we handle DOH-LOS?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'What is the right action for DOH-ZAG?' })).toBeVisible();
  await page.getByRole('button', { name: 'Should we close K/L/M on DOH-SFO?' }).click();
  await page.getByPlaceholder(/Should we close K\/L\/M/i).press('Enter');
  await expect(page.getByText('Agents thinking')).toBeVisible({ timeout: 3000 });
  await expect(page.getByText('RM Advisor - Inventory and revenue action')).toBeVisible();
  await expect(page.getByText('Competitor Fares - Market fare freshness')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Policy Verifier - Rules and citations')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Synthesizer - Verified RM response')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Verified Recommendation')).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('heading', { name: 'Do not close K/L/M for DOH-SFO; keep low buckets open and stimulate demand' })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('listitem').filter({ hasText: 'DOH-SFO load factor is 82% versus 90% target.' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Give recommendations for all dashboard routes.' }).click();
  await page.getByPlaceholder(/Should we close K\/L\/M/i).press('Enter');
  await expect(page.getByRole('heading', { name: 'Use route-specific RM actions; do not apply one blanket K/L/M closure rule' })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('listitem').filter({ hasText: 'DOH-PVG: keep K/L/M open, stimulate demand, and review pricing before inventory restriction' }).first()).toBeVisible();
  await expect(page.getByText('Blanket closure guardrail')).toBeVisible();

  await page.getByRole('button', { name: 'What if competitor fare data is stale for DOH-SFO?' }).click();
  await page.getByPlaceholder(/Should we close K\/L\/M/i).press('Enter');
  await expect(page.getByRole('heading', { name: 'Recommendation withheld until competitor fares refresh' })).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Abstained')).toBeVisible();
  await expect(page.getByText('null - stale market feed')).toBeVisible();

  await page.getByRole('button', { name: 'View All Citations' }).click();
  await expect(page.getByText(/claims grounded/i)).toBeVisible();

  await page.getByTitle('View Alerts').click();
  await expect(page.getByText('No unresolved RM alerts in this demo snapshot')).toBeVisible();
});

test('RM assistant remains usable on a narrow demo viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'RM Assistant' }).click();
  await expect(page.getByText('RM Assistant: Agent Decision Council')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Should we close K/L/M on DOH-SFO?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'How should we protect DOH-JFK?' })).toBeVisible();
  await expect(page.getByPlaceholder(/Should we close K\/L\/M/i)).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(hasHorizontalOverflow).toBe(false);
});
