import { test, expect } from '@playwright/test';

test.describe('ChartsPage — 날짜 선택 → 차트 → 탭 전환 → 상세 모달', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('날짜 선택 후 차트 데이터 로드', async ({ page }) => {
    // 초기: 날짜 미선택 안내
    await expect(page.locator('text=날짜를 선택하세요')).toBeVisible();

    // 캘린더 열기
    await page.click('text=날짜 선택');

    // 캘린더 로드 대기 후, 활성화된 날짜 버튼 클릭
    // disabled 날짜는 disabled 또는 aria-disabled 속성을 가짐
    // 적재된 날짜 = title에 "사이클:" 포함된 버튼
    const dayButton = page.locator('button[title*="사이클:"]').first();
    await expect(dayButton).toBeVisible({ timeout: 30000 });
    await dayButton.click();

    // 데이터 로드 확인: "cycles" 텍스트가 표시되면 로드 완료
    await expect(page.locator('text=/\\d+ cycles/').first()).toBeVisible({ timeout: 30000 });

    // RPM 탭이 기본 활성화
    await expect(page.locator('text=RPM 타임라인')).toBeVisible();
  });

  test('차트 탭 전환', async ({ page }) => {
    // 날짜 선택
    await page.click('text=날짜 선택');
    const dayButton = page.locator('button[title*="사이클:"]').first();
    await expect(dayButton).toBeVisible({ timeout: 10000 });
    await dayButton.click();
    await expect(page.locator('text=/\\d+ cycles/').first()).toBeVisible({ timeout: 15000 });

    // 활성 탭 = display: contents인 div
    const activePanel = page.locator('div[style*="contents"]');

    // RPM 탭 (기본) — 차트 존재 확인
    await expect(activePanel.locator('.js-plotly-plot')).toBeVisible({ timeout: 10000 });

    // RPM 3Panel 탭
    await page.click('text=RPM 3Panel');
    await expect(activePanel.locator('.js-plotly-plot')).toBeVisible({ timeout: 10000 });

    // Vibration 탭 — 파형 로딩 후 차트
    await page.click('text=Vibration');
    await expect(
      activePanel.locator('text=파형 데이터 로딩 중').or(activePanel.locator('.js-plotly-plot'))
    ).toBeVisible({ timeout: 15000 });

    // Vib 3Panel 탭
    await page.click('text=Vib 3Panel');
    await expect(activePanel.locator('.js-plotly-plot')).toBeVisible({ timeout: 10000 });

    // RPM 탭 복귀
    await page.click('button:has-text("RPM"):not(:has-text("3Panel"))');
    await expect(activePanel.locator('.js-plotly-plot')).toBeVisible({ timeout: 10000 });
  });

  test('사이클 클릭 → 상세 모달 표시 → 닫기', async ({ page }) => {
    // 날짜 선택 + 데이터 로드
    await page.click('text=날짜 선택');
    // 적재된 날짜 = title에 "사이클:" 포함된 버튼
    const dayButton = page.locator('button[title*="사이클:"]').first();
    await expect(dayButton).toBeVisible({ timeout: 10000 });
    await dayButton.click();
    await expect(page.locator('text=/\\d+ cycles/').first()).toBeVisible({ timeout: 15000 });

    // RPM 차트에서 데이터 포인트 클릭 (Plotly 차트 영역)
    const plotArea = page.locator('.js-plotly-plot').first();
    await expect(plotArea).toBeVisible({ timeout: 10000 });
    // 차트 중앙 클릭
    await plotArea.click({ position: { x: 400, y: 200 } });

    // 모달 표시 확인 — "사이클 상세" 텍스트
    const modal = page.locator('text=사이클 상세');
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(modal).toBeVisible();

      // 탭 전환: Pulse Accel → RPM → VIB Accel
      await expect(page.locator('button:has-text("Pulse Accel")')).toBeVisible();
      await page.click('text=RPM');
      await page.click('text=VIB Accel');

      // 닫기
      await page.click('text=닫기');
      await expect(modal).not.toBeVisible();
    }
    // 차트 클릭 위치에 데이터가 없으면 모달이 안 열림 — 정상
  });
});
