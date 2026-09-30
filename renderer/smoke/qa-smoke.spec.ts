import { expect, test } from '@playwright/test';

test('QA smoke: startup/login/dashboard/menu and drag signal', async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    const unit = {
      id: 'smoke-unit-ns',
      name: 'North-South View',
      theme: 'dark',
      createdAt: now,
      lastModified: now,
    };
    const raw = localStorage.getItem('unitview_data');
    const data = raw
      ? JSON.parse(raw)
      : {
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
          unit_settings: [],
          facility_profile: { name: 'Your Facility Name' },
          global_theme: 'light',
          action_history: [],
          history_index: -1,
        };
    data.unit_settings = data.unit_settings ?? [];
    if (!data.unit_settings.some((u: { name: string }) => u.name === 'North-South View')) {
      data.unit_settings.push(unit);
    }
    if (!data.layouts?.some((l: { name: string }) => l.name === 'North-South View')) {
      data.layouts = [...(data.layouts ?? []), { name: 'North-South View', created_at: now, updated_at: now }];
    }
    localStorage.setItem('unitview_data', JSON.stringify(data));
  });

  await page.goto('/');

  await expect(page.getByText('Staff Login')).toBeVisible();
  await page.fill('#employeeNumber', '1001');
  await page.fill('#password', 'nurse123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Select unit')).toBeVisible();
  await page.getByRole('combobox', { name: 'Available units' }).click();
  await page.getByRole('option', { name: 'North-South View' }).click();
  await expect(page.getByRole('button', { name: 'Enter unit' })).toBeEnabled();
  await page.getByRole('button', { name: 'Enter unit' }).click();

  await expect(page.getByText('Unitview').first()).toBeVisible();

  await page.getByRole('button', { name: 'Print' }).click();
  await expect(page.getByRole('menuitem', { name: 'Charge report' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.locator('button[title="Oncoming shift board"]').click();
  await expect(page.getByText('Oncoming Shift Blackboard')).toBeVisible();
  await page.getByRole('button', { name: 'Close board' }).click();

  const firstPatientCard = page.locator('[data-patient-id]').first();
  await expect(firstPatientCard).toBeVisible();
  await firstPatientCard.dispatchEvent('dragstart');
  await firstPatientCard.dispatchEvent('dragend');
});
