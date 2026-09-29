import { expect, test } from '@playwright/test';

test('map stats are labeled; room cards are symbol-only', async ({ page }) => {
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
  await expect(page.getByRole('button', { name: 'Enter unit' })).toBeEnabled();
  await page.getByRole('button', { name: 'Enter unit' }).click();

  await page.getByRole('button', { name: 'Admin' }).click();
  await page.getByRole('menuitem', { name: 'Insert mock patients' }).click();
  await expect(page.getByText('Mock Data Inserted', { exact: true })).toBeVisible();
  await page.locator('[toast-close]').click({ force: true });
  await expect(page.getByText('Mock Data Inserted', { exact: true })).toBeHidden();

  const safety = page.getByRole('group', { name: 'Safety' });
  await expect(safety.locator('[data-safety-label]').filter({ hasText: 'Fall' })).toBeVisible();
  await expect(safety.locator('[data-safety-label]').filter({ hasText: 'DNR' })).toBeVisible();
  await safety.screenshot({ path: '/opt/cursor/artifacts/map_stats_strip_labeled.png' });
  await page.screenshot({
    path: '/opt/cursor/artifacts/map_board_header_labeled.png',
    clip: { x: 0, y: 0, width: 1280, height: 220 },
  });

  for (let i = 0; i < 8; i += 1) {
    await page.getByRole('button', { name: 'Zoom in' }).click();
  }

  const markedCard = page.locator('[data-patient-id]').filter({ has: page.locator('[data-safety-mark]') }).first();
  await markedCard.evaluate((node) => {
    node.scrollIntoView({ block: 'center', inline: 'center' });
  });
  const cardMark = markedCard.locator('[data-safety-labeled="false"]').first();
  await expect(cardMark).toBeVisible({ timeout: 15000 });
  await expect(cardMark).toHaveAttribute('data-safety-labeled', 'false');
  await expect(cardMark.locator('[data-safety-label]')).toHaveCount(0);
  await markedCard.screenshot({ path: '/opt/cursor/artifacts/map_card_symbol_only_full.png' });
  await markedCard.getByRole('list', { name: 'Safety marks' }).screenshot({
    path: '/opt/cursor/artifacts/map_card_symbols_closeup.png',
  });
});
