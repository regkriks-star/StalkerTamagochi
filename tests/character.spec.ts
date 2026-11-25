import { test, expect } from "@playwright/test";
import { createGame, FACES, reduceGame, SAVE_KEY } from "../src/game";

test("first visit: all faces, mandatory creation, plain clothes and persisted selection", async ({ page }) => {
  await page.goto("./");
  const creator = page.getByRole("dialog", { name: "Создание сталкера" });
  await expect(creator).toBeVisible();
  await expect(creator.getByRole("radio")).toHaveCount(FACES.length);
  const nameInput = creator.getByRole("textbox", { name: "Имя сталкера" });
  const initialName = await nameInput.inputValue();
  await creator.getByRole("button", { name: "Случайное имя" }).click();
  await expect(nameInput).not.toHaveValue(initialName);
  await nameInput.fill("   ");
  await expect(creator.getByRole("button", { name: "Войти в Зону" })).toBeDisabled();
  await nameInput.fill("  Следопыт  ");
  await expect(creator.locator(".creation-identity strong")).toHaveText("Следопыт");
  await page.keyboard.press("Escape");
  await expect(creator).toBeVisible();
  await page.mouse.click(3, 3);
  await expect(creator).toBeVisible();
  await creator.getByRole("radio").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(creator.getByRole("radio").nth(1)).toBeChecked();
  for (let face = 0; face < FACES.length; face++) {
    await creator.getByRole("radio").nth(face).check();
    await expect(creator.locator(".character-art")).toHaveAttribute("data-face", String(face));
    await expect(creator.locator(".character-clothing, .character-mask")).toHaveCount(0);
  }
  await page.screenshot({ path: "artifacts/character-creator-desktop.png" });
  for (const width of [320, 540, 600]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await creator.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const tile = await creator.locator(".face-option-art").first().boundingBox();
    expect(Math.abs(tile!.width - tile!.height)).toBeLessThan(1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(creator.getByRole("button", { name: "Войти в Зону" })).toBeVisible();
  await page.screenshot({ path: "artifacts/character-creator-mobile.png" });
  expect(await creator.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "Войти в Зону" }).click();
  await expect(creator).toHaveCount(0);
  await expect(page.locator(".character-art")).toHaveAttribute("data-face", String(FACES.length - 1));
  await expect(page.locator(".character-clothing, .character-mask")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Слот: Костюм", exact: true })).toContainText("Не надето");
  await page.reload();
  await expect(creator).toHaveCount(0);
  await expect(page.locator(".character-art")).toHaveAttribute("data-face", String(FACES.length - 1));
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.face).toBe(FACES.length - 1);
  expect(saved.name).toBe("Следопыт");
  expect(saved.gear.suit).toBeNull();
  await page.screenshot({ path: "artifacts/character-plain-mobile.png", fullPage: true });
});

test("bought clothes and mask appear only when equipped, independently, and survive reload offline", async ({ page, context }) => {
  const game = reduceGame(createGame(), { type: "create-character", face: 2 });
  game.rubles = 2000;
  await page.addInitScript(({ game, key }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(game));
  }, { game, key: SAVE_KEY });
  await page.goto("./");
  await page.getByRole("button", { name: /^Торговец ·/ }).click();
  await page.getByRole("button", { name: /Купить Противогаз/ }).click();
  await page.getByRole("button", { name: /Купить Комбинезон/ }).click();
  await page.getByRole("button", { name: "Закрыть окно" }).click();
  await expect(page.locator(".character-clothing, .character-mask")).toHaveCount(0);
  const bodySource = await page.locator(".character-body").getAttribute("src");
  await page.getByRole("button", { name: "Слот: Костюм", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Кожаная куртка/ }).click();
  await expect(page.locator(".clothing-jacket")).toBeVisible();
  await page.screenshot({ path: "artifacts/character-jacket-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Слот: Противогаз", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Противогаз ГП-5/ }).click();
  await expect(page.locator(".character-mask")).toBeVisible();
  await expect(page.locator(".character-face")).toHaveCount(0);
  await expect(page.locator(".clothing-jacket")).toBeVisible();
  await page.getByRole("button", { name: "Слот: Костюм", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Комбинезон/ }).click();
  await expect(page.locator(".clothing-armor")).toBeVisible();
  await expect(page.locator(".clothing-jacket")).toHaveCount(0);
  await expect(page.locator(".character-body")).toHaveAttribute("src", bodySource!);
  await page.screenshot({ path: "artifacts/character-armored-desktop.png", fullPage: true });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".character-mask")).toBeVisible();
  await expect(page.locator(".clothing-armor")).toBeVisible();
  expect(await page.locator(".character-doll img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/character-armored-mobile.png", fullPage: true });
  await page.getByRole("button", { name: /^Рюкзак/ }).click();
  for (const name of ["Противогаз ГП-5", "Комбинезон «Заря»"]) {
    const item = page.locator(".item-card").filter({ has: page.getByRole("heading", { name, exact: true }) });
    await item.getByRole("button", { name: "Снять", exact: true }).click();
  }
  await page.getByRole("button", { name: "Сталкер", exact: true }).click();
  await expect(page.locator(".character-art")).toHaveAttribute("data-face", "2");
  await expect(page.locator(".character-face")).toBeVisible();
  await expect(page.locator(".character-clothing, .character-mask")).toHaveCount(0);
});
