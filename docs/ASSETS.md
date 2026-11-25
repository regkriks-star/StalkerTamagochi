# Изображения

Сцена: `public/scene.webp`. Создана встроенным image_gen, затем сохранена в WebP для офлайн-кэша. Оригинал сохранён в локальном каталоге генераций Codex. Сохранена от первого прототипа; текущий экран персонажа использует отдельные слои из `public/character/`. Не является скриншотом существующей игры.

Промпт:

Use case: stylized-concept. Asset type: original realistic game environment artwork for a Russian survival virtual-pet game on a worn PDA. Create a cinematic photorealistic landscape image, 1536x1024. An anonymous lone exhausted male scavenger in a weathered olive hooded jacket, scratched dark respirator and old canvas backpack sits on a crate beside a small campfire outside a ruined Soviet rural brick shelter in the Chernobyl exclusion zone. Scavenger is fully visible in the center-right, head near upper middle, not closeup. A worn rifle rests safely against the crate, hands warming at fire. Damp concrete, weeds, birch trees, rusted radio antenna, foggy forest distance, overcast dusk sky. Very realistic worn fabric, rust and mud; subtle atmospheric film grain. Muted olive, smoky blue grey and charcoal, only natural small warm amber light from fire. Composition visually rich but calm; background left can carry subtle overlay information. Beautiful restrained environmental game concept art, believable materials, deep tonal range, enough exposure to see character and environment clearly. No letters, no UI, no logos, no watermarks, no cartoon, no pixel art, no neon, no oversaturated colors.

Иконки интерфейса: Lucide (ISC), локально упакованы сборщиком. Иконка PWA — собственный SVG. Шрифты IBM Plex Sans и Oswald подключены локально через Fontsource; лицензии включены в билд.

## Референсы интерфейса, сентябрь 2026

Пользователь предоставил три изображения как визуальные референсы. Они не копируются в приложение. Созданы три самостоятельных игровых ассета встроенным `image_gen`; PNG конвертированы в WebP без изменения композиции. Исходные PNG сохранены во внешнем архиве.

- `public/stalker.webp` — фронтальный портрет для интерактивной экипировки. Исходник: `exec-2f2cce48-20b2-4ef7-9528-13d1fdd6f697.png`.
- `public/zone-map.webp` — фон карты; маршрут, позиции и кнопки рисуются интерфейсом. Исходник: `exec-0d91328b-8102-4322-aec5-b804d251eac2.png`.
- `public/items.webp` — атлас предметов 4×4. Отображение ячеек через CSS, порядок закреплён в `itemSprites` в `src/App.tsx`. Исходник: `exec-f05c1cd4-4290-4c6a-9129-402cc737b752.png`.

Старый цельный портрет `stalker.webp` сохранён как исходный ассет, но больше не используется в экране персонажа. Теперь изображение собирается из тела, одного из семи лиц, одежды и противогаза: [слои, происхождение и промпты](CHARACTER-ASSETS.md).

### Промпт портрета

Use case: stylized-concept. Asset type: portrait character equipment screen background for a survival PDA game. A single full-body post-apocalyptic Eastern European stalker standing facing forward, hooded worn olive protective suit, round glass lens respirator gas mask, leather boots, utility belt, empty relaxed gloved hands at sides, no held gun. Gritty painterly realism with highly detailed worn fabric and metal, muted khaki brown and charcoal, warm pale edge light. Center figure occupies middle 45 percent width, complete head and boots visible with margins. Very dark charcoal olive plain smoky backdrop with subtle scratched texture, ample empty space on BOTH sides for real UI slots. Portrait 1024x1536. No text, no lettering, no UI, no icons, no frame. Inspired by rugged survival game inventory character portraits.

### Промпт карты

Use case: stylized-concept. Asset type: top-down terrain map background for interactive post-apocalyptic PDA. Portrait 1024x1536. Orthographic satellite-like illustrated aerial map of abandoned Eastern European exclusion zone: small village at lower left around 21 percent x 75 percent y, abandoned farm near 43 percent x 58 percent y, scrapyard near 59 percent x 34 percent y, large derelict research industrial complex upper right 79 percent x 23 percent y, small walled safe settlement near 25 percent x 30 percent y. Winding river through middle, abandoned roads and railroad connect settlements, ruined buildings, patchy forest, marshes, fields. Gritty detailed realistic map texture muted olive khaki charcoal, enough contrast to discern buildings and roads, weathered printed military reconnaissance map. NO text, NO labels, NO pins, NO routes highlighted, NO icons, NO UI, NO compass, NO border; all overlays will be real interactive code.

### Промпт предметов

Use case: stylized-concept. Asset type: 4 by 4 inventory item sprite atlas for gritty survival PDA game, square 1024x1024. EXACT sixteen equal square cells 256x256, orderly grid, no visible dividers, each object centered entirely inside its cell with generous 18 percent empty margin; dark uniform charcoal background #171b16. Detailed realistic painted isolated objects, muted olive and weathered metal, warm edge lighting. Row 1 left to right: rusty food tin can, transparent blue water bottle, red canvas medical kit with faded cross, small orange anti-radiation pill bottle. Row 2: pile of metal nuts and scrap, red glowing irregular stone artifact, pale blue glowing electrical crystal, small amber glowing crystalline rock. Row 3: old Makarov pistol in side view, brown leather hooded jacket, handheld olive electronic detector with small screen, folded olive protective armored stalker suit. Row 4: old round-lens GP5 gas mask, AK74 rifle sideways diagonal so fits cell, canvas backpack, coil of wire. Consistent scale and soft studio lighting, strong crisp silhouettes, dirty realistic textures. No letters, no labels, no typography, no UI, no watermarks, no outer frame. Items never cross their cell boundaries.

### Уведомления

Для системных уведомлений использованы `Notification.requestPermission` по действию пользователя и `ServiceWorkerRegistration.showNotification`. Источники: [showNotification](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification), [requestPermission](https://developer.mozilla.org/docs/Web/API/Notification/requestPermission_static). Это локальные уведомления открытой игры; push-подписки и сервер не используются.
