import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page shows DateSelector', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Day Viewer');
  });

  test('navigate to DataManager via button', async ({ page }) => {
    await page.goto('/');
    await page.click('text=데이터 관리');
    await expect(page).toHaveURL('/manager');
    await expect(page.locator('h1')).toContainText('데이터 관리');
  });

  test('DataManager has path and upload tabs', async ({ page }) => {
    await page.goto('/manager');
    await expect(page.locator('text=로컬 경로')).toBeVisible();
    await expect(page.locator('text=파일 업로드')).toBeVisible();
  });

  test('back button returns to home', async ({ page }) => {
    await page.goto('/manager');
    await page.click('text=← 뒤로');
    await expect(page).toHaveURL('/');
  });
});
