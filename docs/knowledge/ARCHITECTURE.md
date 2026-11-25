# Архитектура

**Сверено с кодом:** 20.11.2026.  
**Исходники истины:** `src/game.ts`, `src/useGame.ts`, `src/App.tsx`,
`vite.config.ts`.

## Общая схема

```text
┌──────────────────────────────────────────────────────────────────┐
│ Браузер / PWA                                                    │
│                                                                  │
│  src/main.tsx                                                    │
│    └── <App />                                                   │
│          ├── useGame()  ────────┐                                │
│          ├── <CharacterScene>   │  действия (Action)             │
│          ├── <ZoneMap>          │                                │
│          ├── <InventoryPanel>   ▼                                │
│          ├── <RaidPanel>   useGame.send(action)                  │
│          └── <Dialog> ...        │                               │
│                                  ├── читает свежий save          │
│                                  ├── reduceGame(prev, action)    │
│                                  │      ├── structuredClone     │
│                                  │      ├── applyTime()          │
│                                  │      └── обработка action     │
│                                  ├── setGame(next)               │
│                                  └── localStorage.setItem(...)   │
│                                                                  │
│  src/game.ts — чистая модель, не знает про React/DOM/окружение   │
│  localStorage["zone-pda.save.v1"] — JSON версии 3                │
└──────────────────────────────────────────────────────────────────┘
```

Плюс два независимых слоя:

```text
vite-plugin-pwa ──► dist/sw.js + workbox-*.js
                    └── precache всех ассетов, navigateFallback
public/notification-handler.js
                    └── notificationclick → focus/postMessage/openWindow
```

## Слои и ответственность

| Слой | Файлы | Отвечает | Не должен |
|---|---|---|---|
| Модель | `src/game.ts` | Типы, константы, `reduceGame`, время, сохранения, миграции | Знать про React, DOM, таймеры, localStorage |
| Состояние | `src/useGame.ts` | Загрузка, тик, запись, синхронизация вкладок, warning | Содержать игровые правила |
| Представление | `src/App.tsx`, `src/style.css` | Экраны, диалоги, действия, тексты, вёрстка | Менять `game` напрямую |
| Специальные компоненты | `src/MapViewport.tsx`, `src/CharacterPortrait.tsx` | Жесты карты, слои персонажа | Хранить игровое состояние |
| Точка входа | `src/main.tsx` | Монтирование, шрифты, глобальные жесты | Бизнес-логика |
| Сборка/PWA | `vite.config.ts` | base, manifest, Workbox, precache | Игровые правила |
| Деплой | `.github/workflows/deploy.yml` | Сборка и публикация `dist` в GitHub Pages на push в `main` | Сборка проекта |

## Файловая карта

| Файл | Назначение | Объём |
|---|---|---|
| `src/game.ts` | Модель, reducer, все константы и формулы | ~1 551 строка |
| `src/game.test.ts` | 22 юнит-теста модели | ~597 строк |
| `src/App.tsx` | Весь UI: 4 вкладки, ~15 компонентов, диалоги, PWA-эффекты | ~2 088 строк |
| `src/style.css` | Вся вёрстка и тема, 11 media-блоков | ~60 КБ |
| `src/useGame.ts` | Загрузка/тик/сохранение/`storage` | ~87 строк |
| `src/MapViewport.tsx` | Pan/pinch карты, зум, подавление клика после drag | ~101 строка |
| `src/CharacterPortrait.tsx` | Слои тела/лица/маски/костюма, фон локации | ~57 строк |
| `src/main.tsx` | React root, шрифты, ErrorBoundary | ~22 строки |
| `src/Toast.tsx` | Тост: портал в открытый `<dialog>`, иначе в `body` | ~30 строк |
| `src/ErrorBoundary.tsx` | Fallback при ошибке рендера, выгрузка save | ~70 строк |
| `tests/prototype.spec.ts` | 9 E2E-сценариев | ~435 строк |
| `tests/character.spec.ts` | 2 E2E-сценария про лица/экипировку/офлайн | ~102 строки |
| `playwright.config.ts` | baseURL, preview webServer, Chrome, таймауты | ~22 строки |
| `vite.config.ts` | base `/StalkerTamagochi/`, PWA, Workbox | ~55 строк |
| `scripts/test.mjs` | Компиляция тестов в `.tmp-tests` + `node --test` | ~35 строк |
| `tsconfig.test.json` | Отдельный конфиг emit для тестов | ~15 строк |
| `.github/workflows/deploy.yml` | Сборка и публикация `dist` в GitHub Pages | ~35 строк |
| `public/` | Иконки, изображения, `notification-handler.js`, лицензии | ~4,2 МБ |
| `dist/` | Результат сборки; в git не хранится | ~4,9 МБ |
| `docs/knowledge/` | Эта база знаний | — |

## Поток одного действия

1. Пользователь нажимает кнопку → компонент вызывает `send(action)` из
   `useGame` (в `App` он обёрнут в `act` для toast/переключения вкладки).
2. `send` пытается прочитать `localStorage` и распарсить сохранение. Если
   сохранённый `lastTick >= previous.lastTick`, берётся оно — так подхватываются
   изменения из другой вкладки.
3. `reduceGame(previous, action, realNow)`:
   - делает `structuredClone(previous)` (вход не мутируется);
   - если `face === null`, обрабатывает только `create-character` и выходит;
   - применяет `skip` к `offset`, затем `applyTime` до `realNow + offset`;
   - обрабатывает `next`, `suicide`, `faction`, `delegate`, `open-event`,
     `choice` — некоторые до общего запрета действий в рейде;
   - обрабатывает `raid`, `explore`, `pickup`, `drop`, `recover`, `rest`,
     `use`, `buy`, `sell`, `equip`;
   - пересчитывает `mistakes` после действия;
   - возвращает новое состояние.
4. `useGame` сохраняет новое состояние в `localStorage`, обновляет React state.
5. `App` перерисовывается; производные значения (`packWeight`, `raidEvent`,
   `careDeadline`) считаются в рендере.

## Время и тик

- `useGame` запускает `setInterval(1000)` и вызывает `tick` каждую секунду.
- На `visibilitychange` (когда вкладка снова видима) — внеочередной `tick`.
- На `storage` из другой вкладки — принимает сохранение только если его
  `lastTick` не старше текущего.
- `applyTime` двигает `lastTick` не одним прыжком, а по ближайшим событиям:
  срок ухода, конец рейда, дедлайн события, авто-выбор фракции. Это нужно, чтобы
  смерть, штраф и прибытие применялись в правильном порядке и ровно один раз.
- Пока событие открыто (`phase === "choice" && openedAt !== null`), дорога
  стоит: `applyTime` не завершает рейд по таймеру.

## Ключевые типы (`src/game.ts`)

| Тип | Смысл |
|---|---|
| `Game` | Всё состояние одной жизни + мир (рюкзак, рейды, могилы, журнал) |
| `Action` | Размеченное объединение всех команд reducer'а |
| `Raid` | Текущий переход: `phase`, `startedAt/endsAt`, `event`, `remainingMs`, `graveId` |
| `Inventory` | `Record<ItemId, number>`; нули хранятся для всех предметов |
| `ItemId` | 14 идентификаторов предметов |
| `LocationId` | `camp`, `bar`, `cordon`, `dump`, `agroprom` |
| `Faction` | `duty`, `freedom`, `science`, `mercenary` |
| `Artifact` | `stone`, `spark`, `moon` |
| `GearSlot` | `suit`, `mask`, `primary`, `secondary` |
| `Grave` | Тело погибшего: вещи, деньги, локация, поколение |
| `Memorial` | Запись в «Памяти Зоны» |
| `LogEntry` | Сообщение эфира; хранится до 80 последних |

## Ключевые функции

| Функция | Ответственность |
|---|---|
| `createGame(now, generation)` | Новая жизнь: стартовые статы, вещи, лог |
| `reduceGame(prev, action, realNow)` | Единственный вход изменения игры |
| `applyTime(game, target)` | Догон реального времени по событиям |
| `parseSave(raw)` | Миграции v1→v2→v3 и строгая валидация |
| `die(game, cause)` | Могила со всем имуществом, мемориал, очистка |
| `recover(game, graveId)` | Забор из могилы по вместимости, деньги полностью |
| `collect(game, source)` | Перекладывание вещей с учётом 50 кг |
| `loot(game, items, location)` | Добавление добычи на землю + `collect` |
| `resolveChoice(game, index)` | Урон/радиация/деньги/репутация/лут, продолжение пути |
| `missEvent(game)` | Последствия неоткрытого события |
| `chooseFaction` | Ручной/автоматический выбор фракции |
| `routeProgress` / `routePosition` | Позиция на карте во время рейда |
| `travelMinutes(from, to)` | Длительность перехода |
| `isSafe`, `isEquipped`, `canCarry`, `packWeight`, `maxHealth`, `rank`, `leader`, `careDeadline` | Производные правила |

## Инварианты

Их нельзя нарушать без осознанного изменения формата сохранения:

1. `reduceGame` не мутирует `previous`; клонирование через `structuredClone`.
2. `lastTick` не уменьшается и не обгоняет `realNow + offset`.
3. Количества в `inventory`/`ground`/`graves[].inventory` — неотрицательные
   целые; статы — в `[0, 100]`, здоровье — `<= maxHealth`.
4. Вес рюкзака после `collect`/`buy` не превышает 50 кг + `1e-8`.
5. На поясе не больше одного артефакта; артефакт есть в рюкзаке.
6. В слоте снаряжения только предмет, подходящий слоту, и он есть в рюкзаке.
7. Экипировка не удаляется из рюкзака: надетый предмет одновременно учитывается
   в весе и доступен для снятия.
8. `dead === true` ⇒ `raid === null` и `inviteAt === null`.
9. `face === null` ⇒ время ухода не идёт; допустим только `create-character`.
   Имя в сохранении — не длиннее 24 символов.
10. Случайность в модели — только `random(game)` с сохранённым `seed`; никакого
    `Math.random()`/`Date.now()` внутри правил, кроме параметра `realNow`.
11. Сохранение имеет `version === 3`; неизвестная версия отвергается.
12. `next` сохраняет мир (`ground`, `graves`, `memorials`, `log`, `nextId`,
    `offset`, `startedAt`) и сбрасывает жизнь (статы, вещи, имя, лицо).

## Точки расширения

### Новый предмет

1. Добавить id в `ItemId`.
2. Добавить запись в `ITEMS` (имя, detail, price, weight, kind).
3. Если это снаряжение — добавить в `GEAR` и при необходимости в `GEAR_SLOTS`.
4. Если артефакт — добавить в `Artifact`, эффекты в `applyTime` и/или
   `resolveChoice`, учесть в `parseSave` (список артефактов).
5. Добавить спрайт в `itemSprites` в `App.tsx`; проверить, что ячейка атласа
   соответствует.
6. Добавить в список покупок `TraderPanel`, если должен продаваться.
7. Обновить таблицу в [`GAME-RULES.md`](GAME-RULES.md) и тесты.

### Новая локация

1. Добавить id в `LocationId`.
2. Добавить запись в `LOCATIONS`: `name`, `detail`, `safe`, `trader`,
   `background`, `time` (сейчас не используется), `risk`, `xp`, `artifact`,
   `x`, `y`.
3. Проверить координаты на карте (0–100), маршрут и `travelMinutes`.
4. Обновить тесты и [`GAME-RULES.md`](GAME-RULES.md).
5. Не переиспользовать старый id под другую локацию: id хранится в сейвах.

### Новое событие

1. Добавить объект в конец `EVENTS`, **не вставлять в середину**: в сохранении
   хранится индекс события.
2. Описать 2–3 `Choice` с базовыми `damage`, `radiation`, `money`, `energy`,
   `faction`, при необходимости `cost`, `delay`, `loot`, `combat`.
3. Проверить `raidEvent` (особый случай могилы), `resolveChoice`, лут,
   множители фракций/артефактов/локаций.
4. Обновить тесты и [`GAME-RULES.md`](GAME-RULES.md).

### Новое действие

1. Добавить вариант в `Action`.
2. Обработать в `reduceGame` в правильном месте относительно `applyTime`,
   `dead`, `face === null`, рейда и общего guard'а
   `if (game.raid && !["use","equip","drop"].includes(...))`.
3. Добавить кнопку/диалог в UI.
4. Проверить `parseSave` (если меняется форма состояния) и тесты.

### Новый экран/вкладка

1. Расширить `Tab` в `App.tsx`.
2. Добавить в `tabs`, `subtitles`, навигацию.
3. Сверстать в `style.css`, проверить 320/390/820/1440 px.
4. Проверить доступность: заголовок, фокус, `aria-current`, клавиатура.
5. Обновить [`UI-PWA.md`](UI-PWA.md).

## Чего избегать

- Не добавлять `Math.random()` в модель: сломает детерминизм и офлайн-догон.
- Не мутировать `previous` в `reduceGame`.
- Не хранить производные значения (вес, максимум здоровья, статус) в `Game`.
- Не менять порядок `EVENTS` и id локаций/предметов без миграции.
- Не удалять поля `Game` без миграции и повышения `version`.
- Не вызывать `Date.now()` внутри `applyTime`/`resolveChoice`: время приходит
  параметром `realNow`.
- Не добавлять в `dist/` ручные правки.
- Не дублировать игровые константы в UI: использовать `PACK_CAPACITY`,
  `EVENT_TIMEOUT`, `DAY`, `ITEMS`, `LOCATIONS`.
- Не делать `useGame` «умнее»: правила должны оставаться в `game.ts`.
