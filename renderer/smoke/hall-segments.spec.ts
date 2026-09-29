import { expect, test } from '@playwright/test';

test('hallway setup places and rotates premade segments', async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    localStorage.setItem(
      'unitview_data',
      JSON.stringify({
        user_preferences: { lastSelectedLayout: 'North-South View', isLayoutLocked: 'false' },
        layouts: [{ name: 'North-South View', created_at: now, updated_at: now }],
        patients: [],
        nurses: [],
        nurses_oncoming: [],
        patient_care_techs: [],
        spectra_pool: [],
        assignment_sets: [],
        users: [],
        passwords: {},
        unit_settings: [
          { id: 'smoke-unit-ns', name: 'North-South View', theme: 'light', createdAt: now, lastModified: now },
        ],
        facility_profile: { name: 'Riverside Medical Center' },
        global_theme: 'light',
        action_history: [],
        history_index: -1,
      }),
    );
  });

  await page.goto('/');
  await expect(page.getByText('Staff Login')).toBeVisible();
  await page.waitForFunction(() => {
    try {
      const data = JSON.parse(localStorage.getItem('unitview_data') ?? '{}');
      return Boolean(data.passwords?.admin);
    } catch {
      return false;
    }
  });
  await page.fill('#employeeNumber', 'admin');
  await page.fill('#password', 'password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('#new-password')).toBeVisible({ timeout: 15000 });
  await page.locator('#new-password').fill('ChargeBoard26');
  await page.locator('#confirm-password').fill('ChargeBoard26');
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page.locator('#new-password')).toBeHidden({ timeout: 15000 });
  await page.getByRole('button', { name: 'Units' }).click();
  await expect(page.getByText('Select unit')).toBeVisible();
  await page.getByRole('button', { name: 'Enter unit' }).click();

  await page.getByRole('button', { name: 'Admin' }).click();
  await page.getByRole('menuitem', { name: 'Progressive hallway setup…' }).click();
  await expect(page.getByText('Hall pieces')).toBeVisible();
  await expect(page.getByTestId('hall-piece-straight3')).toBeVisible();
  await expect(page.getByTestId('turn-palette')).toContainText('Turn 0°');

  await page.getByTestId('hall-piece-straight3').click();
  await page.getByTestId('hall-cell-4-3').click();
  await expect(page.getByTestId('rotate-placed-segment')).toBeVisible();
  await page.screenshot({ path: '/opt/cursor/artifacts/hall_segment_placed.png' });

  await page.getByTestId('rotate-placed-segment').click();
  await expect(page.getByText('Straight 3 · 90°').first()).toBeVisible();
  await page.screenshot({ path: '/opt/cursor/artifacts/hall_segment_rotated.png' });

  await page.getByTestId('turn-palette').click();
  await expect(page.getByTestId('turn-palette')).toContainText('Turn 90°');
  await page.getByTestId('hall-piece-corner').click();
  await page.getByTestId('hall-cell-2-8').click();
  await expect(page.getByText('Corner · 90°').first()).toBeVisible();
  await page.screenshot({ path: '/opt/cursor/artifacts/hall_segments_corner_and_straight.png' });

  await page.getByTestId('save-progressive-hallway').click();
  await expect(page.getByTestId('hall-segment-grid')).toHaveCount(0);
  await expect(page.getByText('Hallway map (glance only)')).toBeVisible({ timeout: 15000 });
  const hideStats = page.getByRole('button', { name: 'Hide stats' });
  if (await hideStats.isVisible().catch(() => false)) {
    await hideStats.click();
  }
  await page.getByText('Hallway map (glance only)').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('glance-hall-painted')).toHaveCount(8);
  await page.screenshot({ path: '/opt/cursor/artifacts/hall_segments_saved_board.png' });
  await page.getByLabel('Hallway map (glance only)').screenshot({
    path: '/opt/cursor/artifacts/hall_segments_saved_map.png',
  });
});
