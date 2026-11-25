# Сборка и публикация

**Сверено с кодом:** 25.11.2026.  
**Источник истины:** `package.json`, `vite.config.ts`,
`.github/workflows/deploy.yml`.

> **25.11.2026:** исходники перенесены в Git
> (`regkriks-star/StalkerTamagochi`), деплой — GitHub Actions. Первый push и
> включение Pages ещё не выполнены.

## 1. Окружение

| Компонент | Требование / факт |
|---|---|
| Node | README/engines: 22.18+; тесты компилируются локальным TypeScript |
| npm | 9.x в проверенной среде |
| Пакетный менеджер | npm, lockfileVersion 3 |
| Браузер для E2E | Chrome/Chromium; Playwright |
| Публикация | Git + SSH-ключ github.com; GitHub Actions → Pages |

`engines.node` — `>=22.18.0`; добавлен `.nvmrc` (22.18.0). `@types/node` — 26,
хотя README обещает Node 22.18: типы могут разрешать API новее рантайма.

## 2. Установка и разработка

```sh
npm ci
npm run dev
```

- Dev-сервер: <http://localhost:5173/StalkerTamagochi/>.
- `base` в `vite.config.ts` — `/StalkerTamagochi/`, поэтому корень `/`
  отдаст 404; это нормально.
- В dev service worker не регистрируется; PWA проверяется только на
  production-сборке.
- `npm run dev` слушает `0.0.0.0`; для локальной работы это лишнее, для
  LAN-теста — удобно. Не запускай на публичной машине без необходимости.

## 3. Сборка

```sh
npm run build
```

Скрипт:

```text
tsc --noEmit && vite build
```

Что происходит:

1. TypeScript проверяет `src`, `vite.config.ts`, `playwright.config.ts`.
2. Vite собирает React-приложение в `dist/`.
3. `vite-plugin-pwa` генерирует `sw.js`, `workbox-*.js`,
   `manifest.webmanifest`, копирует `public/`.
4. Source maps отключены (`build.sourcemap: false`).

### Ориентиры сборки (20.11.2026)

| Артефакт | Размер |
|---|---|
| JS `assets/index-*.js` | ~321,0 кБ (100,6 кБ gzip) |
| CSS `assets/index-*.css` | ~55,3 кБ (13,0 кБ gzip) |
| `dist/` целиком | ~3,7 МБ |
| Precache | ~2,9 MiB, 32 записи, все уникальные |

Крупнейшие ассеты: `items.webp` ~672 КБ, `zone-map.webp` ~580 КБ,
слои персонажа ~1,2 МБ, седьмое лицо — WebP ~190 КБ. `scene.webp` и
`stalker.webp` остаются в `dist`, но исключены из precache (`globIgnores`).

### Проверка сборки

```sh
ls dist
cat dist/manifest.webmanifest
node -e "console.log(require('fs').readFileSync('dist/sw.js','utf8').length)"
```

`dist/manifest.webmanifest` должен содержать `start_url` и `scope`
`/StalkerTamagochi/`; `dist/index.html` — ссылки на `assets/index-*.js` и
`assets/index-*.css`.

## 4. Preview

```sh
npm run preview
```

<http://localhost:4173/StalkerTamagochi/>. Preview отдаёт уже собранный
`dist`, поэтому после изменения `src` нужен новый `npm run build`.

Не открывай `dist/index.html` через `file://`: модули и service worker
требуют HTTP.

## 5. PWA: обновление и офлайн

- `registerType: "prompt"` — новый SW ждёт, пока пользователь нажмёт
  «Обновить».
- `useRegisterSW` показывает `offlineReady` / `needRefresh`.
- `updateServiceWorker(true)` активирует новый SW и перезагружает страницу.
- `cleanupOutdatedCaches` удаляет старые Workbox-кэши.
- `navigateFallback` отдаёт `index.html` для навигации внутри scope.
- Первая установка кэширует все ассеты; офлайн доступен после полной
  загрузки и перезагрузки под контролем SW.

Если после публикации видна старая версия:

1. Проверь, что деплой в Actions завершился и собран нужный коммит.
2. Сделай hard reload.
3. Закрой все вкладки приложения.
4. Проверь `sw.js` на сайте (должен совпадать с локальным).
5. При необходимости — «Удалить данные сайта» в DevTools.

## 6. Деплой на GitHub Pages

**Важно:** `npm run build` ничего не публикует. Пуш в `main` запускает
`.github/workflows/deploy.yml`, который собирает и публикует сайт.

```text
git push origin main
  → actions/checkout
  → npm ci
  → npm run build
  → dist/ → actions/upload-pages-artifact
  → actions/deploy-pages
```

Remote и адрес:

```text
git@github.com:regkriks-star/StalkerTamagochi.git
ветка: main
сайт: https://regkriks-star.github.io/StalkerTamagochi/
```

### Разовая настройка

1. SSH-ключ `~/.ssh/id_ed25519`; публичная часть добавляется в GitHub →
   Settings → SSH and GPG keys.
2. Проверить доступ: `ssh -T git@github.com`; ожидается
   `Hi regkriks-star!`, код выхода 1 с приветствием — норма.
3. Pages: workflow включает его сам (`enablement: true`); если GitHub откажет —
   Settings → Pages → Source: **GitHub Actions** (не «Deploy from a branch»).
4. Первый push: `git push -u origin main`.

### Что делает workflow

- `actions/checkout` + `actions/setup-node` по `.nvmrc` (22.18.0), `npm ci`,
  `npm run build`.
- `actions/configure-pages` → `actions/upload-pages-artifact` (`path: dist`) →
  `actions/deploy-pages`.
- Права: `contents: read`, `pages: write`, `id-token: write`.
- `concurrency: pages` не отменяет уже идущий деплой.
- Есть `workflow_dispatch` для ручного запуска.

### Повторный деплой

Достаточно пуша в `main`. Ветка `gh-pages` не используется, force-push не
нужен. Статус — вкладка **Actions**, окружение `github-pages`.

## 7. Проверка live-сайта

Минимально:

```sh
node -e "fetch('https://regkriks-star.github.io/StalkerTamagochi/').then(r=>console.log(r.status))"
```

Должно быть `200`. Затем сравни `dist/index.html` и живой HTML: имена
`assets/index-*.js` и `assets/index-*.css` должны совпадать. Полезно также
сравнить `sw.js` и `manifest.webmanifest`.

Первый деплой появляется только после включения Pages и успешного run
workflow; до этого адрес отдаёт 404.

## 8. Откат

- Исходники хранятся в Git, поэтому код откатывается обычным
  `git revert <sha>` (или `git reset` + push) — Actions пересоберёт сайт.
- Артефакты прошлых сборок лежат в запусках Actions; историю деплоев видно
  в Settings → Pages / вкладка Actions.
- Ветки `gh-pages` и force-push в проекте больше нет.

## 9. Частые проблемы

| Симптом | Причина | Решение |
|---|---|---|
| `tsc: not found` | нет `.bin`/`node_modules` | `npm ci` |
| `npm test` не находит TypeScript | нет `node_modules/typescript` | `npm ci` |
| E2E 404 | нет `dist` или неверный base | `npm run build`, открыть `/StalkerTamagochi/` |
| E2E проверяет старый код | `reuseExistingServer`/старый preview | остановить сервер, пересобрать |
| Pages 404 после push | Pages не включён, Source не GitHub Actions или деплой ещё идёт | Settings → Pages, вкладка Actions |
| Actions падает на `npm ci` | нет `package-lock.json` или неверный Node | проверить lockfile и `.nvmrc` |
| Деплой зелёный, сайт старый | service worker ждёт обновления | кнопка «Обновить», hard reload |
| 404 на внутренних путях | неверный `base` | `/StalkerTamagochi/` в `vite.config.ts` |
| `Permission denied (publickey)` | ключ не добавлен в GitHub | Settings → SSH keys, `ssh -T git@github.com` |

## 10. Безопасность деплоя

- В `dist` не попадают `src`, тесты, `1.md–4.md`, source maps, `.env`,
  symlink, ключи.
- Сайт собирается из исходников в CI; `dist/` не коммитится.
- Секреты в проекте не хранятся; `GITHUB_TOKEN` выдаётся на время run.
- Публикуется только артефакт `dist`; рабочая Git-история не затрагивается.

## 11. Чек-лист релиза

- [ ] `npm ci` на чистой машине.
- [ ] `npx tsc --noEmit`.
- [ ] `npm test` — 22/22.
- [ ] `npm run build`.
- [ ] `npm run preview` + ручная проверка desktop/mobile/offline.
- [ ] `npm run test:e2e` — 11/11; конфиг сам собирает `dist`.
- [ ] Проверить `dist/manifest.webmanifest` и пути `/StalkerTamagochi/`.
- [ ] Push в `main`; дождаться зелёного `deploy` в Actions.
- [ ] Проверить live HTTP 200 и совпадение хешей.
- [ ] Записать в [`CHANGELOG.md`](CHANGELOG.md): дата, sha, проверки.
