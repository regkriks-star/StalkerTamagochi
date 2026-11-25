# AGENTS.md — точка входа в проект

Этот файл — краткая инструкция для человека или AI-агента, который продолжает
«ЗОНА — персональный КПК». Полная база знаний лежит в
[`docs/knowledge/`](docs/knowledge/README.md). Прочитай её перед изменениями,
особенно [`ARCHITECTURE.md`](docs/knowledge/ARCHITECTURE.md) и
[`GAME-RULES.md`](docs/knowledge/GAME-RULES.md).

## Что это за проект

Браузерная игра «Сталкер × Тамагочи»: React 19 + TypeScript 7 + Vite 8,
устанавливается как PWA, работает офлайн после первой загрузки, прогресс
хранится в `localStorage`. Репозиторий:
<https://github.com/regkriks-star/StalkerTamagochi>; сайт публикуется через
GitHub Actions: <https://regkriks-star.github.io/StalkerTamagochi/>.

- Игровая модель: `src/game.ts` (чистый reducer, без React).
- Сохранение и жизненный цикл: `src/useGame.ts`.
- Интерфейс: `src/App.tsx`, `src/style.css`.
- Карта и слои персонажа: `src/MapViewport.tsx`, `src/CharacterPortrait.tsx`.
- PWA и сборка: `vite.config.ts`.
- Деплой: `.github/workflows/deploy.yml` (GitHub Pages, push в `main`).

## С чего начать

1. [`docs/knowledge/README.md`](docs/knowledge/README.md) — карта знаний и
   текущий статус.
2. [`docs/knowledge/ARCHITECTURE.md`](docs/knowledge/ARCHITECTURE.md) — слои,
   поток данных, инварианты.
3. [`docs/knowledge/GAME-RULES.md`](docs/knowledge/GAME-RULES.md) — все числа и
   формулы; если меняешь баланс, меняй и этот файл.
4. [`docs/knowledge/SAVE-AND-TIME.md`](docs/knowledge/SAVE-AND-TIME.md) — формат
   сохранения v3, миграции, догон времени.
5. [`docs/knowledge/TESTING.md`](docs/knowledge/TESTING.md) — что и как
   проверять, известные проблемы E2E.
6. [`docs/knowledge/BUILD-AND-RELEASE.md`](docs/knowledge/BUILD-AND-RELEASE.md) —
   сборка и публикация.
7. [`docs/knowledge/BACKLOG.md`](docs/knowledge/BACKLOG.md) — что уже известно и
   что делать дальше.

## Команды

```sh
npm ci                 # ставит зависимости строго по package-lock.json
npm run dev            # http://localhost:5173/StalkerTamagochi/
npm run build          # tsc --noEmit + vite build → dist/
npm run preview        # http://localhost:4173/StalkerTamagochi/
npm test               # 22 юнит-теста: tsc в .tmp-tests + node --test
npm run test:e2e       # Playwright; сам собирает dist и поднимает preview
```

### Как устроен `npm test`

Скрипт `scripts/test.mjs` компилирует `src/game.ts` и `src/game.test.ts` через
локальный TypeScript в `.tmp-tests/`, запускает `node --test` и удаляет
временный каталог. Встроенный TypeScript в Node не требуется. Если TypeScript
не установлен, выполни `npm ci`. Подробнее — в
[`TESTING.md`](docs/knowledge/TESTING.md).

### Если `node_modules/.bin` пуст

В этой копии проекта `.bin` может отсутствовать, тогда `npm run ...` не находит
`tsc`, `vite`, `playwright`. Лечится чистым `npm ci`. Пока его нет, можно
запускать бинарники напрямую (`node node_modules/vite/bin/vite.js build`,
`node node_modules/@playwright/test/cli.js test`), но это обход, а не норма.

## Жёсткие правила

1. **Не редактируй `dist/` вручную.** Это артефакт сборки, он в `.gitignore`.
   Меняй `src/`/`public/` и пересобирай.
2. **Не публикуй без явной просьбы.** Push в `main` запускает
   `.github/workflows/deploy.yml` и меняет живой сайт. Сначала прочитай
   [`BUILD-AND-RELEASE.md`](docs/knowledge/BUILD-AND-RELEASE.md).
3. **Не ломай совместимость сохранений.** При изменении `Game`, `Inventory`,
   `Raid`, `Action` или версии сохранения нужна миграция в `parseSave` и новый
   `version`, иначе игроки потеряют прогресс.
4. **Сохраняй детерминизм.** `reduceGame` не мутирует вход, случайность идёт
   только через `random(game)` с сохранённым `seed`, а не через `Math.random()`
   в модели. Иначе офлайн-догон перестанет совпадать после перезагрузки.
5. **Меняй UI и модель вместе.** Правила в `GAME-RULES.md` — контракт; если
   меняешь цену, урон, таймер или слот, обнови и код, и документ, и тесты.
6. **Обновляй базу знаний.** Любое изменение механики/сохранения/сборки/PWA
   должно оставить след в `docs/knowledge/` и в
   [`CHANGELOG.md`](docs/knowledge/CHANGELOG.md). Иначе база устареет и станет
   вредной.
7. **Не коммить `node_modules/`, `dist/`, `test-results/`, `artifacts/`.**
   Они перечислены в `.gitignore`.
8. **Не добавляй секреты и локальные абсолютные пути.** В документации уже есть
   нежелательные `/home/...` — не повторяй; для оригиналов ассетов описывай
   «внешний архив», а не путь на чужой машине.
9. **Проверяй доступность.** Уже исправлены zoom, контраст кнопки «Случайное
   имя», тост под диалогом и длинное имя. Остался долг: мелкий текст, `aria-label`
   на generic-элементах, тач-таргеты. Не добавляй новые проблемы: `aria-label`
   только с ролью, тач-таргеты ≥ 44px, контраст ≥ 4,5:1.

## Текущее известное состояние (25.11.2026)

- `tsc --noEmit` — проходит.
- `vite build` — проходит; `dist/` собирается локально, а на сайте — из
  GitHub Actions, коммитить его не нужно.
- Юнит-тесты — 22/22; `npm test` компилирует их локальным TypeScript, встроенная
  поддержка TS в Node не нужна.
- E2E — 11/11 (20.11.2026); конфиг сам собирает `dist`, timeout 90 с,
  retries в CI. Подробности — [`TESTING.md`](docs/knowledge/TESTING.md).
- Исходники в Git: ветка `main`, remote `origin` →
  `regkriks-star/StalkerTamagochi`; первый push и деплой выполнены 25.11.2026,
  сайт отдаёт 200.
- Деплой — `.github/workflows/deploy.yml`; Pages нужно один раз включить вручную:
  Settings → Pages → Source: GitHub Actions.
- Нет `LICENSE`; лицензии зависимостей лежат в `dist/licenses/`.

## Definition of done

Перед завершением задачи:

- [ ] `tsc --noEmit` (или `npm run build`) проходит.
- [ ] `npm test` проходит (22/22).
- [ ] `npm run test:e2e` — 11/11 (или явно задокументированное падение).
- [ ] Изменения механики отражены в `GAME-RULES.md`, сохранения — в
      `SAVE-AND-TIME.md`, интерфейса — в `UI-PWA.md`.
- [ ] Добавлена запись в `CHANGELOG.md`.
- [ ] При изменении сохранения проверена загрузка старой версии.
- [ ] `dist/` пересобран локально для проверки; деплой собирает его сам.
- [ ] Нет новых секретов, абсолютных путей и мусорных файлов.

## Где искать ответы

- «Почему 15 минут?» — [`DECISIONS.md`](docs/knowledge/DECISIONS.md).
- «Что означают ошибки ухода?» — [`GAME-RULES.md`](docs/knowledge/GAME-RULES.md).
- «Можно ли менять `Game`?» — [`SAVE-AND-TIME.md`](docs/knowledge/SAVE-AND-TIME.md).
- «Почему E2E может падать?» — [`TESTING.md`](docs/knowledge/TESTING.md).
- «Как опубликовать?» — [`BUILD-AND-RELEASE.md`](docs/knowledge/BUILD-AND-RELEASE.md).
- «Что делать дальше?» — [`BACKLOG.md`](docs/knowledge/BACKLOG.md).
