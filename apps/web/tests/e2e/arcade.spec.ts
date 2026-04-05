import { expect, test } from "@playwright/test";

test("simulator drives the arcade flow across multiple games", async ({
  page,
}) => {
  await page.goto("/?debug=1");

  const statusButton = page.getByTestId("status-button");
  const modal = page.getByTestId("connect-modal");

  await expect(statusButton).toContainText("NO CUBE CONNECTED");

  await page.getByTestId("connect-cube-button").click();
  await expect(modal).toBeVisible();
  await modal
    .locator(".connect-modal__header")
    .getByRole("button", { name: "CLOSE", exact: true })
    .click();
  await expect(modal).toHaveCount(0);

  await statusButton.click();
  await expect(modal).toBeVisible();

  await page
    .getByRole("button", { exact: true, name: "SHOW ADVANCED" })
    .click();
  const macInput = page.getByTestId("cube-mac-input");
  await expect(macInput).toHaveAttribute("type", "password");
  await macInput.fill("cc-a3-00-12-34-56");
  await macInput.press("Tab");
  await expect(macInput).toHaveValue("CC:A3:00:12:34:56");
  await page.getByTestId("cube-mac-toggle").click();
  await expect(macInput).toHaveAttribute("type", "text");

  await page
    .getByRole("button", { exact: true, name: "USE SIMULATOR" })
    .click();
  await expect(page.getByTestId("connect-modal")).toHaveCount(0);
  await expect(statusButton).toContainText("CUBE CONNECTED");

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
