import { expect, test } from "@playwright/test";

test("simulator drives the arcade flow across multiple games", async ({
  page,
}) => {
  await page.goto("/?debug=1");

  await expect(page.getByTestId("connect-cube-button")).toBeVisible();

  await page.getByTestId("status-button").click();
  await expect(page.getByTestId("connect-modal")).toBeVisible();

  await page.getByRole("button", { name: "SHOW ADVANCED" }).click();
  const macInput = page.getByTestId("cube-mac-input");
  await expect(macInput).toHaveAttribute("type", "password");
  await macInput.fill("cc-a3-00-12-34-56");
  await macInput.press("Tab");
  await expect(macInput).toHaveValue("CC:A3:00:12:34:56");
  await page.getByTestId("cube-mac-toggle").click();
  await expect(macInput).toHaveAttribute("type", "text");

  await page.getByRole("button", { name: "USE SIMULATOR" }).click();
  await expect(page.getByTestId("connect-modal")).toHaveCount(0);
  await expect(page.getByTestId("status-button")).toContainText(
    "CUBE CONNECTED",
  );

  await page.getByTestId("sim-move-U").click();

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

test("debug simulator controls stay hidden on the main arcade route", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator(".debug-dock")).toHaveCount(0);
  await expect(page.getByText("SELECT GAME")).toHaveCount(0);
  await expect(page.getByText("ORIENTATION")).toHaveCount(0);
  await expect(page.getByText("CONTROL CUBE")).toHaveCount(0);
  await expect(page.getByText("GROW THE SNAKE")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "HOW TO HOLD THE CUBE" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "HOW TO HOLD THE CUBE" }).click();
  await expect(page.getByText("HOW TO HOLD THE CUBE")).toHaveCount(2);
  await expect(page.getByText("WHITE FACE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "CLOSE" }).click();

  const cube = page.getByTestId("control-cube-body");
  const beforeDrag = await cube.getAttribute("style");
  const box = await cube.boundingBox();

  expect(box).not.toBeNull();

  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 48,
      box.y + box.height / 2 - 24,
      { steps: 6 },
    );
    await page.mouse.up();
  }

  const afterDrag = await cube.getAttribute("style");
  expect(afterDrag).not.toBe(beforeDrag);

  await page.getByTestId("status-button").click();
  await expect(page.getByTestId("connect-modal")).toBeVisible();
  await expect(page.getByRole("button", { name: "USE SIMULATOR" })).toHaveCount(
    0,
  );
});
