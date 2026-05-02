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
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('button', { name: /Applied/i })).toBeVisible();

  await page.getByRole('button', { name: 'No-Show Predictor' }).click();
  await expect(page.getByText('Overbooking & No-Show Optimizer')).toBeVisible();
  await page.getByRole('button', { name: 'DOH-ZAG' }).first().click();
  await expect(page.getByText(/NO-SHOW PREDICTION & OPTIMIZER/)).toBeVisible();

  await page.getByRole('button', { name: 'Pricing Optimizer' }).click();
  await expect(page.getByText('Real-Time Demand Unconstraining & Pricing')).toBeVisible();
  await page.getByRole('button', { name: /Optimize Fare Ladder/i }).click();
  await expect(page.getByText('Optimization Complete')).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'RM Assistant' }).click();
  await expect(page.getByText('RM Assistant: Decision Rationale')).toBeVisible();
  await page.getByRole('button', { name: 'Should we close K/L/M on QR123 DOH-LHR D-7?' }).click();
  await page.getByPlaceholder(/Should we close K\/L\/M/i).press('Enter');
  await expect(page.getByText('Recommendation: close K/L/M')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Verified 5/5 claims')).toBeVisible();
  await expect(page.getByText('Flip to hold if competitor fares drop more than 5%.')).toBeVisible();

  await page.getByRole('button', { name: 'What if competitor fare data is stale?' }).click();
  await page.getByPlaceholder(/Should we close K\/L\/M/i).press('Enter');
  await expect(page.getByText('Recommendation withheld')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Abstained')).toBeVisible();
  await expect(page.getByText('null - stale market feed')).toBeVisible();

  await page.getByRole('button', { name: 'View All Citations' }).click();
  await expect(page.getByText(/claims grounded/i)).toBeVisible();

  await page.getByTitle('View Alerts').click();
  await expect(page.getByText('No unresolved RM alerts in this demo snapshot')).toBeVisible();
});
