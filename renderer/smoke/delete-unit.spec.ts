import { expect, test } from '@playwright/test';

test('admin can delete a unit from the dashboard', async ({ page }) => {
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
  await expect(page.getByTestId('delete-unit')).toBeVisible();
  await page.getByTestId('delete-unit').click();
  await expect(page.getByText('Delete this unit?')).toBeVisible();
  await page.screenshot({ path: '/opt/cursor/artifacts/admin_delete_unit_confirm.png' });
  await page.getByTestId('confirm-delete-unit').click();
  await expect(page.getByRole('button', { name: 'Enter unit' })).toBeDisabled();
  await expect(page.getByTestId('delete-unit')).toHaveCount(0);
  await page.screenshot({ path: '/opt/cursor/artifacts/admin_delete_unit_gone.png' });
});
