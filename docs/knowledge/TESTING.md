# Тесты и проверки

**Сверено с кодом:** 25.11.2026.  
**Источник истины:** `src/game.test.ts`, `tests/*.spec.ts`,
`playwright.config.ts`, `package.json`, `.github/workflows/`.

## 1. Быстрый запуск

```sh
npm ci
npm run build          # tsc --noEmit + vite build
npm test               # 22 юнит-теста
npm run test:e2e       # Playwright; нужен dist и preview
```

E2E-конфиг сам собирает `dist` перед preview, поэтому отдельный `npm run build`
для запуска не обязателен; для ручной проверки preview — обязателен.

## 2. Как устроен `npm test`

```sh
npm test
```

запускает `scripts/test.mjs`:

1. удаляет `.tmp-tests/`;
2. компилирует `src/game.ts` и `src/game.test.ts` через локальный TypeScript
   (`node_modules/typescript/lib/tsc.js -p tsconfig.test.json`);
3. запускает `node --test .tmp-tests/game.test.js`;
4. удаляет `.tmp-tests/` и возвращает код выхода.

Встроенная поддержка TypeScript в Node **не требуется**. Нужен установленный
`typescript` и `node >= 22.18` (см. `engines`). Если `node_modules/typescript`
нет — `npm ci`.

`tsconfig.test.json` расширяет основной конфиг, включает emit в `.tmp-tests`,
`nodenext` и `rewriteRelativeImportExtensions`, чтобы импорт `./game.ts`
превратился в `./game.js`.

Старый вариант `node --experimental-strip-types --test src/game.test.ts` больше
не используется: он падал на дистрибутивных сборках Node без Amaro
(`ERR_NO_TYPESCRIPT`).

## 3. Юнит-тесты: 22 сценария

Файл `src/game.test.ts`, фиксированное `NOW`, детерминированный seed.

| # | Тест | Что проверяет |
|---|---|---|
| 1 | character creation waits… | Черновик до подтверждения, валидация лиц, старт часов ухода |
| 2 | successor requires a new face… | Новое поколение, сохранение могил/истории/земли |
| 3 | version 2 saves keep progress… | Миграция v2, отказ битого `face` |
| 4 | one and two missed care deadlines… | 1/2 ошибки выживаемы, третья смертельна, точное время |
| 5 | care must cover all neglected needs… | Еда без воды/отдыха не сбрасывает ошибку |
| 6 | successful expeditions deliver loot… | Лут, ранг, приглашение фракции, авто-выбор |
| 7 | unopened events expire… | Граница 15 минут, штраф один раз, хронология |
| 8 | opening in time persists… | Открытие, пауза таймера, выбор, повторное открытие |
| 9 | all possessions including equipped… | Могила со всем имуществом, возврат |
| 10 | suicide preserves every possession… | Самоубийство в покое и во всех фазах рейда |
| 11 | fatal field encounter… | Смерть в бою, рюкзак на точке, новый герой |
| 12 | artifact advantages and costs… | Артефакты работают офлайн и отключаются |
| 13 | trade does not create free money… | Покупка/продажа, нет бесплатных денег, надетое не продаётся |
| 14 | unprepared characters and locked locations… | Пороги рейда, расходники в пути, запрет торговли/отдыха |
| 15 | saves survive round trips… | `parseSave`, порча, отсутствие отката времени |
| 16 | capacity applies to purchases/loot/drop… | 50 кг, частичный забор, отсутствие потерь |
| 17 | equipment has explicit slots… | Слоты, защита только надетого, снятие |
| 18 | bandit bribes… | Взятка 150 ₽, обход, лечение, урон |
| 19 | old saves migrate… | v1→v3, неверный слот, открытое событие |
| 20 | safe settlements are travel destinations… | Безопасные точки, торговля/отдых после прибытия |
| 21 | rerouting preserves position… | Смена маршрута, позиция, припасы, событие, reload |
| 22 | rerouted saves reject invalid coordinates… | Валидация `startPosition`, сброс `graveId` |

### Что покрыто хорошо

- Границы 15 минут и 24/48/72 часов.
- Смерть, могила, наследование, самоубийство.
- Вместимость 50 кг и частичный забор.
- Экипировка, защита, торговля, миграции.
- Смена маршрута и сохранение позиции.
- `parseSave` round-trip и базовые атаки на форму.

### Пробелы

- События `EVENTS[2]` и `EVENTS[3]` не исполняются.
- Генерация рейда: 80%, 25–75%, выбор `event`, стартовые −8/−5/−7 — не
  проверяются напрямую (helper вручную ставит `raid.event`).
- Не-бандитский `missEvent` проверен грубо: нет точных −25 HP, +6/+12
  радиации, смерти от штрафа.
- `explore`: cooldown 30 минут, нехватка сил, безопасная локация, обе ветки
  лута — не покрыты.
- `delegate`, `loner`, `antirad`, `delegate` при `xp < 60`.
- Валидация `parseSave`: большинство веток (статы >100, `lastCare` в будущем,
  битые `ground`/`gear`/`faction`/`raid`/`log`).
- `useGame`: corrupt-save, `.corrupt`, слияние вкладок, warning.
- `notificationclick` и `?event=` — E2E обходит их.
- Нет покрытия UI-компонентов и CSS.

## 4. E2E: 11 сценариев

Конфиг: `playwright.config.ts`, baseURL
`http://127.0.0.1:4173/StalkerTamagochi/`, сборка + preview на 4173, Chrome из
`/usr/bin/google-chrome` (если есть), timeout 90 с, retries в CI, trace при
падении. `reuseExistingServer: false` — чужой preview не подхватывается.

| Файл | Тест | Что проверяет |
|---|---|---|
| `character.spec.ts` | first visit… | Создание, 7 лиц, имя, перезагрузка, обычная одежда |
| `character.spec.ts` | bought clothes and mask… | Покупка/надевание/снятие, слои, офлайн |
| `prototype.spec.ts` | desktop: supplies/expedition… | Еда, рейд, событие, артефакт, торговля, reload |
| `prototype.spec.ts` | three missed days… | Смерть, новый герой, забор могилы |
| `prototype.spec.ts` | mobile: all sections fit… | 390/320 px, отсутствие горизонтального скролла, Escape |
| `prototype.spec.ts` | PWA offline… | manifest, SW, offline reload, изображение, кнопки |
| `prototype.spec.ts` | mobile equipment… | Слоты, вес, расходники, запрет торговли в пути |
| `prototype.spec.ts` | opened event… | Reload открытого события, догон штрафа |
| `prototype.spec.ts` | notifications… | SW-уведомление и synthetic message |
| `prototype.spec.ts` | top vitals/trade/route… | 5 статов, торговец, диалоги, смена маршрута |
| `prototype.spec.ts` | mobile gestures | Pinch/drag карты, отсутствие зума страницы |

### Исправлено 20.11.2026

- Кнопка могилы: тест синхронизирован с UI («Забрать хабар по вместимости»).
- Гонка инъекции сохранения: тест пишет save через `addInitScript` до загрузки,
  а не в работающее приложение.
- E2E теперь собирает `dist` перед preview и не переиспользует чужой сервер.
- Общий timeout поднят до 90 с, добавлены retries в CI.
- Полный прогон: **11/11**.

### Оставшиеся ограничения E2E

1. **Нет projects.** Нет отдельного мобильного project, WebKit, Firefox.
2. **Системный Chrome.** Путь `/usr/bin/google-chrome` не переносим.
3. **Хрупкие селекторы.** `.event-alert`, `.item-card`, `.raid-panel`,
   `.full.radio-feed` и точные тексты ломаются от косметики.
4. **Условные проверки.** `if (await locator.count())` может пройти вхолостую.
5. **«Notification click»** диспатчит сообщение вручную и не проверяет
   `notificationclick` из SW.
6. **Скриншоты** пишутся в `artifacts/`, но не сравниваются с baseline.
7. **Сборка в webServer** занимает ~60 с; timeout 180 с, но на медленном CI
   может понадобиться больше.

### Что E2E делает хорошо

- Проверяет реальный service worker и offline reload.
- Проверяет мобильную ширину 320/390 px.
- Использует роли и доступные имена там, где это возможно.
- Не использует `waitForTimeout` в большинстве мест (ожидания event-driven).
- Каждый тест получает свой контекст, localStorage изолирован.

## 5. Проверка деплоя

Деплой вынесен в отдельный workflow `.github/workflows/deploy.yml`: на push в
`main` он выполняет `npm ci`, `npm run build` и публикует `dist` через GitHub
Pages. Локальный аналог проверки — `npm run build` и `npm run preview`.

`verify.yml` запускает `tsc`, `npm test`, `npm run build` и E2E на Node 22/24.
Секретов workflow не требует: используется штатный `GITHUB_TOKEN` с правами
`pages: write` и `id-token: write`. Отдельного publish-теста больше нет.

## 6. Фаззинг (разово, 20.11.2026)

Была прогнана случайная последовательность: 80 прогонов × 400 действий
(тики, рейды, события, торговля, экипировка, смерть, `next`, `skip`).

Проверялись инварианты:

- количества неотрицательные и целые;
- статы 0–100;
- вес ≤ 50 + 1e-8;
- `lastTick` конечен;
- `parseSave(JSON.stringify(game))` не равен `null`.

Результат: нарушений нет. Это не заменяет тесты, но даёт уверенность в
устойчивости reducer'а и сериализации. Скрипт не сохранён; при желании его
стоит оформить как `scripts/fuzz.mjs` и запускать по расписанию.

## 7. Как добавить юнит-тест

```ts
test("короткое название", () => {
  const game = startedGame(NOW);          // фиксированное время
  const next = step(game, { type: "..." });
  assert.equal(next.someField, expected);
  // не мутируй game; проверяй next
});
```

Правила:

- Используй `NOW`, `DAY`, `EVENT_TIMEOUT` из модели, а не магические числа.
- Для рейда используй helper'ы `encounter`/`raid`, но помни: они вручную
  ставят событие, поэтому саму генерацию надо тестировать отдельно.
- Проверяй `parseSave(JSON.stringify(next))` после новых полей.
- Не полагайся на порядок тестов и общий mutable state.
- Для смерти/сохранения проверяй точные значения, а не только «стало меньше».

## 8. Как добавить E2E

- Собирай `dist` до запуска.
- Начинай с `page.addInitScript`, если нужен предзаполненный save: это
  выполняется до монтирования и не проигрывает гонку с автосейвом.
- Для действий, меняющих состояние, используй роли/имена, а не CSS.
- Для нестабильных зон добавь `data-testid`.
- Не используй `waitForTimeout`; используй `expect.poll`/`toBeVisible`.
- Проверяй, что тест падает по правильной причине: сообщение об ошибке должно
  указывать на поведение, а не на таймаут.
- Не оставляй `if (await locator.count())` без явного ожидания состояния.

## 9. Критерии «зелёно»

- `npx tsc --noEmit` — 0 ошибок.
- `npm test` — 22/22.
- `npm run build` — успешно, `dist` свежий.
- `npm run test:e2e` — 11/11.
- Нет новых предупреждений Workbox о дублях.

## 10. CI

Добавлен [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml):

- matrix Node 22.18 и 24;
- `npm ci`, `tsc --noEmit`, `npm test`, `build`;
- E2E на Node 24 с установленным Chromium;
- артефакт `test-results/` при падении.

E2E-конфиг уже использует `reuseExistingServer: false`, собирает `dist` перед
preview и имеет `retries: 2` в CI. Для медленных раннеров можно ограничить
`workers` до 1.
