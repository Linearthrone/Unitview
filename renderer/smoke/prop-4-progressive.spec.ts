import { expect, test } from '@playwright/test';

test('PROP-4 Progressive view switch and hallway', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Enter unit' }).click();

  await page.getByRole('button', { name: 'Admin' }).click();
  await page.getByRole('menuitem', { name: 'Insert mock patients' }).click();
  await page.getByRole('button', { name: 'Admin' }).click();
  await page.getByRole('menuitem', { name: 'Progressive view' }).click();
  await page.keyboard.press('Escape');
  const hideStats = page.getByRole('button', { name: 'Hide stats' });
  if (await hideStats.isVisible().catch(() => false)) {
    await hideStats.click();
  }

  await expect(page.getByText('Nurse assignments')).toBeVisible({ timeout: 15000 });
  await page.getByText('Nurse assignments').scrollIntoViewIfNeeded();
  await expect(page.getByText('Hallway map (glance only)')).toBeVisible();
  await page.screenshot({ path: '/opt/cursor/artifacts/prop4_progressive_workstation.png' });
  await page.getByText('Hallway map (glance only)').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/opt/cursor/artifacts/prop4_progressive_hallway.png' });
});
