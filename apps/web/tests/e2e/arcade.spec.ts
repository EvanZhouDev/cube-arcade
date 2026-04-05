import { expect, test } from "@playwright/test";

test("simulator drives the arcade flow across multiple games", async ({
  page,
}) => {
  await page.goto("/");

  const macInput = page.getByTestId("cube-mac-input");
  await macInput.fill("cc-a3-00-12-34-56");
  await macInput.press("Tab");
  await expect(macInput).toHaveValue("CC:A3:00:12:34:56");

  await page.getByRole("button", { name: "Use Simulator" }).click();
  await page.getByTestId("sim-move-U").click();

  await expect(page.getByTestId("status-last-move")).toHaveText("U");
  await expect(page.getByTestId("status-last-command")).toHaveText("left");

  await page.getByTestId("game-card-tetris").click();
  await page.getByTestId("sim-move-R").click();
  await expect
    .poll(async () => {
      return page.locator(".board--tetris .board__cell--filled").count();
    })
    .toBeGreaterThan(0);

  await page.getByTestId("game-card-breakout").click();
  const ball = page.locator(".breakout__ball");
  const before = await ball.boundingBox();
  await page.getByTestId("sim-move-F").click();
  await page.waitForTimeout(250);
  const after = await ball.boundingBox();

  expect(before?.y).not.toBeUndefined();
  expect(after?.y).not.toBeUndefined();
  expect(after?.y).toBeLessThan(before?.y ?? 0);
});
