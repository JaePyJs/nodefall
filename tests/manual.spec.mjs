import { test, expect } from '@playwright/test';

test('Escape closes every reopening and restores focus to the launcher', async ({ page }) => {
  await page.goto('/');
  const launcher = page.locator('#docs-btn');
  const manual = page.locator('#docs-panel-overlay');
  for (let visit = 0; visit < 2; visit += 1) {
    await launcher.click();
    await expect(manual).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(manual).toBeHidden();
    await expect(launcher).toBeFocused();
  }
});

test('manual never changes the player’s pause setting or leaks keyboard shortcuts', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#start-game-btn').click();
  const launcher = page.locator('#manual-btn');
  const pause = page.locator('#pause-btn');
  const screen = page.locator('#game-container');
  await expect(screen).not.toHaveClass(/paused/);
  await launcher.click();
  await expect(page.getByRole('dialog', { name: 'NODEFALL system manual' })).toBeVisible();
  await page.keyboard.press('1');
  await expect(page.locator('#card-FIREWALL')).not.toHaveClass(/selected/);
  await page.keyboard.press('Escape');
  await expect(screen).not.toHaveClass(/paused/);
  await expect(launcher).toBeFocused();
  await pause.click();
  await expect(screen).toHaveClass(/paused/);
  await launcher.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(screen).toHaveClass(/paused/);
  await pause.click();
  await expect(screen).not.toHaveClass(/paused/);
  expect(errors).toEqual([]);
});
