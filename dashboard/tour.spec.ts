import { test, expect } from "@playwright/test";

const WS_URL = "http://localhost:3001/workspace/c440ccef-9f23-4b6c-9d02-1d60a81b4bd0";
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwiZXhwIjoxNzgyMTM3MzMwfQ.GFBdI2mRosl-S1ddx0F--ZK7wLEQl3h6ihm8tXIBi5g";

async function injectAuth(page: any) {
  await page.addInitScript((jwt: string) => {
    localStorage.setItem("huginin-auth", JSON.stringify({ state: { token: jwt, email: "test@test.com" }, version: 0 }));
    localStorage.removeItem("huginin_tour_v2_dismissed");
  }, JWT);
}

test("BUG: spotlight absent when data-tour element not yet in DOM at 600ms", async ({ page }) => {
  await injectAuth(page);

  // localhost:8000 API 지연 — data-tour 요소가 skeleton 상태로 유지되게
  await page.route("http://localhost:8000/**", async (route) => {
    await new Promise(r => setTimeout(r, 3000));
    await route.continue();
  });

  await page.goto(WS_URL);

  // 900ms: tour 타이머 이미 울렸지만 skeleton 상태 — spotlight 없어야 함
  await page.waitForTimeout(900);
  const hasDataTour = await page.locator('[data-tour="timeline"]').count();
  const hasSpotlight = await page.locator('[style*="9999px"]').count();
  console.log(`900ms — data-tour 요소: ${hasDataTour}, spotlight: ${hasSpotlight}`);
  expect(hasDataTour).toBe(0);    // skeleton 상태, data-tour 없음
  expect(hasSpotlight).toBe(0);  // spotlight도 없음 → BUG

  // 3초 후 데이터 로드됨 — spotlight가 뒤늦게 나타나야 함 (fix 후)
  await page.waitForSelector('[data-tour="timeline"]', { timeout: 8000 });
  await page.waitForTimeout(200);
  const hasSpotlightAfter = await page.locator('[style*="9999px"]').count();
  console.log(`로드 후 spotlight: ${hasSpotlightAfter}`);
  // fix 전: 0 (retry 없음) — fix 후: 1
  expect(hasSpotlightAfter).toBe(1);  // 이게 실패하면 버그 재현 성공
});
