import { test, expect, type Page } from "@playwright/test";
import { createGame, reduceGame, SAVE_KEY } from "../src/game";

test.beforeEach(async ({ page }) => {
  const game = reduceGame(createGame(), { type: "create-character", face: 0 });
  game.seed = 1;
  await page.addInitScript(
    ({ game, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(game));
    },
    { game, key: SAVE_KEY },
  );
});

async function advance(page: Page, label = "+1 минута") {
  await page.getByRole("button", { name: "Настройки КПК" }).click();
  if (label.includes("24")) {
    page.once("dialog", (dialog) => dialog.accept());
  }
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("button", { name: "Закрыть окно" }).click();
}

test("desktop: supplies, expedition, artifact, trade and reload preserve progress", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Шорох" })).toBeVisible();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.getByRole("button", { name: /^Накормить/ }).click();
  await expect(page.getByRole("meter", { name: "Сытость" })).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await page.getByRole("button", { name: /^Напоить/ }).click();
  await page
    .getByRole("button", { name: "Открыть карту", exact: true })
    .click();
  await page.screenshot({ path: "test-results/map.png", fullPage: true });
  await page.getByRole("button", { name: "Место: Кордон", exact: true }).click();
  await page.getByRole("button", { name: "Идти сюда", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Идёт к точке" }),
  ).toBeVisible();
  await advance(page, "+15 минут");
  await expect(page.locator(".event-alert")).toBeVisible();
  await expect(page.locator(".event-choices")).toHaveCount(0);
  await page.locator(".event-alert").click();
  await page.locator(".event-choices button").first().click();
  await expect(
    page.getByRole("heading", { name: "Продолжает путь" }),
  ).toBeVisible();
  await advance(page, "+15 минут");
  await expect(page.locator(".character-background")).toHaveAttribute("data-location", "cordon");
  await page.getByRole("button", { name: /^Карта Зоны/ }).click();
  await page.getByRole("button", { name: "Место: Кордон", exact: true }).click();
  await page.getByRole("button", { name: "Осмотреть точку" }).click();
  await page.getByRole("button", { name: "Закрыть окно" }).click();
  await page
    .getByRole("button", { name: "Место: Деревня новичков", exact: true })
    .click();
  await page.getByRole("button", { name: "Идти сюда", exact: true }).click();
  await advance(page, "+15 минут");
  if (await page.locator(".event-alert").count()) {
    await page.locator(".event-alert").click();
    await page.locator(".event-choices button").first().click();
    await advance(page, "+15 минут");
  }
  await page.getByRole("button", { name: /^Рюкзак/ }).click();
  const artifact = page.locator(".item-card").filter({
    has: page.getByRole("heading", { name: "Кровь камня", exact: true }),
  });
  await expect(artifact).toBeVisible();
  await artifact.getByRole("button", { name: "На пояс", exact: true }).click();
  await expect(artifact).toContainText("Надето");
  await artifact
    .getByRole("button", { name: "Снять с пояса", exact: true })
    .click();
  const copies = await page.evaluate(
    () => JSON.parse(localStorage.getItem("zone-pda.save.v1")!).inventory.stone,
  );
  await page.getByRole("button", { name: "Сталкер", exact: true }).click();
  await page.getByRole("button", { name: /^Торговец ·/ }).click();
  for (let i = 0; i < copies; i++)
    await page.getByRole("button", { name: "Продать Кровь камня", exact: true }).click();
  await expect(page.getByRole("button", { name: "Продать Кровь камня", exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Купить Чистая вода за 45 рублей" })
    .click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("zone-pda.save.v1")!),
  );
  await page.reload();
  const reloaded = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("zone-pda.save.v1")!),
  );
  expect(reloaded.inventory).toEqual(saved.inventory);
  expect(reloaded.rubles).toEqual(saved.rubles);
  expect(reloaded.raids).toBe(2);
  expect(errors).toEqual([]);
});

test("three missed days, death, successor and recovering every possession", async ({
  page,
}) => {
  await page.goto("./");
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("zone-pda.save.v1")!),
  );
  await advance(page, "+24 часа без ухода");
  await expect(page.locator(".field-note")).toContainText("1/3");
  await expect(
    page.getByRole("heading", { name: /остался в Зоне/ }),
  ).toHaveCount(0);
  await advance(page, "+24 часа без ухода");
  await expect(page.locator(".field-note")).toContainText("2/3");
  await page.getByRole("button", { name: "Настройки КПК" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "+24 часа без ухода", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Шорох остался в Зоне" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Шорох остался в Зоне" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Встретить нового сталкера" }).click();
  await expect(page.getByRole("dialog", { name: "Создание сталкера" })).toBeVisible();
  await page.getByRole("radio", { name: /^Лицо 2:/ }).check();
  await page.getByRole("button", { name: "Войти в Зону" }).click();
  await page.getByRole("button", { name: /^Карта Зоны/ }).click();
  await page
    .getByRole("button", { name: "Место: Деревня новичков", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Тело: Шорох" }),
  ).toBeVisible();
  const successor = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("zone-pda.save.v1")!),
  );
  await page
    .getByRole("button", { name: "Забрать хабар по вместимости", exact: true })
    .click();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("zone-pda.save.v1")!),
  );
  expect(after.graves).toHaveLength(0);
  expect(after.memorials).toHaveLength(1);
  for (const key of Object.keys(before.inventory))
    expect(after.inventory[key]).toBe(
      successor.inventory[key] + before.inventory[key],
    );
  expect(after.rubles).toBe(successor.rubles + before.rubles);
  await page.getByRole("button", { name: "Журнал", exact: true }).click();
  await expect(page.locator(".memorial")).toContainText("Шорох");
});

test("mobile: all sections fit, touch controls and keyboard dialog work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  for (const name of ["Сталкер", "Карта Зоны", "Рюкзак", "Журнал"]) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name: new RegExp(`^${name}`) })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 700 });
  for (const name of ["Сталкер", "Карта Зоны", "Рюкзак", "Журнал"]) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name: new RegExp(`^${name}`) })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Настройки КПК" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Установить КПК" }).click();
  // Chrome may expose a native install prompt; the fallback is an accessible guide.
  const guide = page.getByRole("dialog");
  if (await guide.count()) await expect(guide).toContainText("На экран Домой");
});

test("PWA: manifest is scoped to Pages and the entire game reloads offline", async ({
  page,
  context,
}) => {
  await page.goto("./");
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const response = await page.request.get(manifestHref!);
  const manifest = await response.json();
  expect(manifest.start_url).toBe("/StalkerTamagochi/");
  expect(manifest.scope).toBe("/StalkerTamagochi/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Шорох" })).toBeVisible();
  const imageLoaded = await page
    .locator(".character-body")
    .evaluate(
      (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
    );
  expect(imageLoaded).toBe(true);
  await page.getByRole("button", { name: /^Накормить/ }).click();
  await expect(page.getByRole("meter", { name: "Сытость" })).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await page
    .getByRole("button", { name: "Открыть карту", exact: true })
    .click();
  await page.getByRole("button", { name: "Место: Кордон", exact: true }).click();
  await expect(page.getByRole("button", { name: "Идти сюда", exact: true })).toBeEnabled();
});

test("mobile equipment slots, weight and consumption in the field", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.getByRole("button", { name: "Слот: Костюм", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Надеть/ }).click();
  await expect(page.locator(".clothing-jacket")).toBeVisible();
  await page.getByRole("button", { name: "Слот: Костюм", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Снять/ }).click();
  await expect(
    page.getByRole("button", { name: "Слот: Костюм", exact: true }),
  ).toContainText("Не надето");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Слот: Костюм", exact: true }),
  ).toContainText("Не надето");
  await page.getByRole("button", { name: "Слот: Костюм", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Надеть/ })
    .click();
  await page
    .getByRole("button", { name: "Открыть карту", exact: true })
    .click();
  await page.getByRole("button", { name: "Место: Кордон", exact: true }).click();
  await page.getByRole("button", { name: "Идти сюда", exact: true }).click();
  await page.getByRole("button", { name: "Сталкер", exact: true }).click();
  await page.getByRole("button", { name: /^Накормить/ }).click();
  await expect(
    page.getByRole("meter", { name: "Сытость", exact: true }),
  ).toHaveAttribute("aria-valuenow", "100");
  await page.getByRole("button", { name: /^Рюкзак/ }).click();
  await expect(page.locator(".pack-weight")).toContainText("/ 50 кг");
  await expect(
    page.getByRole("button", { name: "Купить Чистая вода за 45 рублей" }),
  ).toHaveCount(0);
});

test("an opened event survives reload and a closed game catches up with a penalty", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Открыть карту", exact: true })
    .click();
  await page.getByRole("button", { name: "Место: Кордон", exact: true }).click();
  await page.getByRole("button", { name: "Идти сюда", exact: true }).click();
  await advance(page, "+15 минут");
  await page.getByRole("button", { name: /^Рюкзак/ }).click();
  await expect(page.locator(".event-alert")).toBeVisible();
  await page.locator(".event-alert").click();
  await page.reload();
  await advance(page, "+15 минут");
  await expect(page.locator(".event-choices button").first()).toBeEnabled();
  await expect(page.locator(".raid-panel")).toContainText("Связь установлена");
  const now = Date.now() - 60 * 60_000;
  const initial = reduceGame(createGame(now), { type: "create-character", face: 0 }, now);
  initial.seed = 1;
  const traveling = reduceGame(
    initial,
    { type: "raid", location: "cordon" },
    initial.lastTick,
  );
  await page.addInitScript(
    ({ saved, key }: { saved: unknown; key: string }) => {
      localStorage.setItem(key, JSON.stringify(saved));
    },
    { saved: traveling, key: SAVE_KEY },
  );
  await page.reload();
  await page.getByRole("button", { name: "Журнал", exact: true }).click();
  await expect(page.locator(".full.radio-feed")).toContainText(
    "15 минут без связи",
  );
});

test("notifications use the service worker and a click acknowledges the matching event", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["notifications"]);
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page
    .getByRole("button", { name: "Открыть карту", exact: true })
    .click();
  await page.getByRole("button", { name: "Место: Кордон", exact: true }).click();
  await page.getByRole("button", { name: "Идти сюда", exact: true }).click();
  await advance(page, "+15 минут");
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (
            await (
              await navigator.serviceWorker.ready
            ).getNotifications({ tag: "zone-event" })
          ).length,
      ),
    )
    .toBe(1);
  await page.evaluate(async () => {
    const [notification] = await (
      await navigator.serviceWorker.ready
    ).getNotifications({ tag: "zone-event" });
    navigator.serviceWorker.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "open-event", eventAt: notification.data.eventAt },
      }),
    );
  });
  await expect(page.locator(".event-choices button").first()).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (
            await (
              await navigator.serviceWorker.ready
            ).getNotifications({ tag: "zone-event" })
          ).length,
      ),
    )
    .toBe(0);
});

test("top vitals, settlement trade, location dialogs and changing a route", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator(".vitals-strip [role=meter]")).toHaveCount(5);
  await page.getByRole("button", { name: /^Торговец ·/ }).click();
  await page.getByRole("button", { name: "Купить Чистая вода за 45 рублей" }).click();
  await page.getByRole("button", { name: "Продать Чистая вода", exact: true }).click();
  await page.getByRole("button", { name: "Закрыть окно" }).click();
  for (const name of ["Рюкзак", "Журнал"]) {
    await page.getByRole("navigation").getByRole("button", { name: new RegExp(`^${name}`) }).click();
    await expect(page.locator(".vitals-strip")).toHaveCount(0);
    await expect(page.locator(".trader")).toHaveCount(0);
  }
  await page.getByRole("button", { name: /^Карта Зоны/ }).click();
  await expect(page.locator(".vitals-strip [role=meter]")).toHaveCount(5);
  await expect(page.locator(".location-panel")).toHaveCount(0);
  await page.getByRole("button", { name: "Место: Деревня новичков", exact: true }).click();
  await page.getByRole("button", { name: /^Торговец ·/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Купить Чистая вода за 45 рублей" })).toBeEnabled();
  await page.getByRole("button", { name: "Закрыть окно" }).click();
  await page.getByRole("button", { name: "Место: Кордон", exact: true }).click();
  await page.getByRole("button", { name: "Идти сюда", exact: true }).click();
  await advance(page);
  await expect(page.getByRole("button", { name: /^Торговец ·/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^Карта Зоны/ }).click();
  await page.getByRole("button", { name: "Место: Бар «100 рентген»", exact: true }).click();
  await page.getByRole("button", { name: "Изменить маршрут", exact: true }).click();
  await expect(page.locator(".raid-panel")).toContainText("Бар «100 рентген»");
  await page.reload();
  await expect(page.locator(".raid-panel")).toContainText("Бар «100 рентген»");
  await advance(page, "+15 минут");
  await page.getByRole("button", { name: /^Карта Зоны/ }).click();
  await expect(page.getByRole("button", { name: "Место: Бар «100 рентген»", exact: true }).locator(".quest-marker")).toBeVisible();
  await page.getByRole("button", { name: "Место: Кордон", exact: true }).click();
  await expect(page.getByRole("button", { name: "Изменить маршрут", exact: true })).toBeDisabled();
});

test.describe("mobile gestures", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("pinch zooms the map; dragging does not open locations and navigation stays visible", async ({ page, context }) => {
    await page.goto("./");
    const client = await context.newCDPSession(page);
    async function pinch(x: number, y: number) {
      const touchPoints = (spread: number) => [
        { x: x - spread, y, id: 1 }, { x: x + spread, y, id: 2 },
      ];
      await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touchPoints(25) });
      for (const spread of [35, 45, 55, 65, 75])
        await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touchPoints(spread) });
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    }
    // The page itself is allowed to zoom for accessibility; pinch on the map
    // must still be handled by the map viewport and must not open a dialog.
    await page.getByRole("button", { name: /^Карта Зоны/ }).tap();
    await page.locator(".zone-map").scrollIntoViewIfNeeded();
    const box = (await page.locator(".zone-map").boundingBox())!;
    await pinch(box.x + box.width / 2, Math.min(500, box.y + box.height / 2));
    await expect(page.getByRole("button", { name: "Сбросить масштаб карты" })).not.toHaveText("100%");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("navigation")).toBeInViewport();
    const transform = await page.locator(".map-canvas").evaluate((element) => getComputedStyle(element).transform);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 190, y: 450, id: 1 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 230, y: 470, id: 1 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    expect(await page.locator(".map-canvas").evaluate((element) => getComputedStyle(element).transform)).not.toBe(transform);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Сбросить масштаб карты" }).tap();
    await expect(page.getByRole("button", { name: "Сбросить масштаб карты" })).toHaveText("100%");
    await page.getByRole("button", { name: "Место: Кордон", exact: true }).tap();
    await expect(page.getByRole("button", { name: "Идти сюда", exact: true })).toBeEnabled();
    await page.screenshot({ path: "test-results/mobile-location.png" });
  });
});
