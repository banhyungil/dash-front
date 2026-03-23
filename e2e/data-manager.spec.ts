import { test, expect } from '@playwright/test';

test.describe('DataManager - Path Ingest', () => {
  test('can enter path and click scan', async ({ page }) => {
    await page.goto('/manager');

    // Should default to "로컬 경로" tab
    const input = page.locator('input[placeholder*="Measured"]');
    await expect(input).toBeVisible();

    // Enter a path and click scan
    await input.fill('C:/projects/dash-backend/data/Measured_2601');
    await page.click('text=스캔');

    // Should show scan results or error (depends on backend state)
    // Just verify the button was clickable and page didn't crash
    await expect(page.locator('text=데이터 관리')).toBeVisible();
  });

  test('switch to upload tab shows dropzone', async ({ page }) => {
    await page.goto('/manager');
    await page.click('text=파일 업로드');

    await expect(page.locator('text=드래그')).toBeVisible();
  });
});
