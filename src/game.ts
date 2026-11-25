export const DAY = 24 * 60 * 60 * 1000;
export const EVENT_TIMEOUT = 15 * 60_000;
export const PACK_CAPACITY = 50;
export const SAVE_KEY = "zone-pda.save.v1";
export const STALKER_NAMES = ["Шорох", "Север", "Иней", "Кедр", "Скиталец", "Туман", "Ворон", "Седой", "Бродяга", "Кремень"];

export const FACES = [
  "Тёмные волосы, щетина",
  "Светлый ёжик",
  "Короткая борода",
  "Седина и усы",
  "Бритая голова",
  "Чёрные волосы",
  "Лицо с фотографий",
] as const;
export type Faction = "duty" | "freedom" | "science" | "mercenary";
export type LocationId = "camp" | "bar" | "cordon" | "dump" | "agroprom";
export type Artifact = "stone" | "spark" | "moon";
export type ItemId =
  | "food"
  | "water"
  | "medkit"
  | "antirad"
  | "scrap"
  | Artifact
  | "pistol"
  | "jacket"
  | "detector"
  | "armor"
  | "mask"
  | "rifle";
export type GearSlot = "suit" | "mask" | "primary" | "secondary";
export const GEAR_SLOTS: Record<GearSlot, string> = {
  suit: "Костюм",
  mask: "Противогаз",
  primary: "Основное оружие",
  secondary: "Доп. оружие",
};
export const GEAR: Partial<Record<ItemId, GearSlot>> = {
  jacket: "suit",
  armor: "suit",
  mask: "mask",
  rifle: "primary",
  pistol: "secondary",
};
export type Inventory = Record<ItemId, number>;
export type Stat = "health" | "food" | "water" | "energy" | "radiation";

export const ITEMS: Record<
  ItemId,
  {
    name: string;
    detail: string;
    price: number;
    weight: number;
    kind: "supply" | "artifact" | "gear" | "loot";
  }
> = {
  food: {
    name: "Консервы",
    detail: "Сытость +40 · здоровье +2",
    price: 70,
    weight: 0.4,
    kind: "supply",
  },
  water: {
    name: "Чистая вода",
    detail: "Вода +45",
    price: 45,
    weight: 0.5,
    kind: "supply",
  },
  medkit: {
    name: "Аптечка",
    detail: "Здоровье +35",
    price: 150,
    weight: 0.3,
    kind: "supply",
  },
  antirad: {
    name: "Антирад",
    detail: "Радиация −40",
    price: 110,
    weight: 0.1,
    kind: "supply",
  },
  scrap: {
    name: "Детали",
    detail: "Хабар для продажи Сидоровичу",
    price: 40,
    weight: 0.2,
    kind: "loot",
  },
  stone: {
    name: "Кровь камня",
    detail: "Здоровье +3/ч · голод ×2",
    price: 420,
    weight: 0.5,
    kind: "artifact",
  },
  spark: {
    name: "Вспышка",
    detail: "Расход сил вдвое меньше · жажда ×2",
    price: 650,
    weight: 0.3,
    kind: "artifact",
  },
  moon: {
    name: "Ночная звезда",
    detail: "Награда вылазки +50% ₽ · радиация +3/ч",
    price: 900,
    weight: 0.6,
    kind: "artifact",
  },
  pistol: {
    name: "ПМ",
    detail: "Проверенный старый пистолет",
    price: 250,
    weight: 0.7,
    kind: "gear",
  },
  jacket: {
    name: "Кожаная куртка",
    detail: "В ней ещё можно вернуться живым",
    price: 200,
    weight: 2,
    kind: "gear",
  },
  detector: {
    name: "«Отклик»",
    detail: "Детектор аномальной активности",
    price: 300,
    weight: 0.5,
    kind: "gear",
  },
  mask: {
    name: "Противогаз ГП-5",
    detail: "Радиация в событиях −50%",
    price: 320,
    weight: 1.1,
    kind: "gear",
  },
  rifle: {
    name: "АК-74",
    detail: "Урон в бою −30%",
    price: 1100,
    weight: 3.3,
    kind: "gear",
  },
  armor: {
    name: "Комбинезон «Заря»",
    detail: "Урон в вылазках −35%",
    price: 750,
    weight: 3,
    kind: "gear",
  },
};

export const FACTIONS: Record<
  Faction,
  { name: string; motto: string; benefit: string; color: string }
> = {
  duty: {
    name: "Долг",
    motto: "Защитить людей от Зоны.",
    benefit: "Урон в вылазках −20%",
    color: "#c88a79",
  },
  freedom: {
    name: "Свобода",
    motto: "У Зоны не должно быть хозяев.",
    benefit: "Расход сил в вылазках −25%",
    color: "#a1b77d",
  },
  science: {
    name: "Учёные",
    motto: "Понять то, что пугает остальных.",
    benefit: "Радиация в вылазках −50%",
    color: "#c3b07b",
  },
  mercenary: {
    name: "Наёмники",
    motto: "У каждого риска есть цена.",
    benefit: "Денежная награда +25%",
    color: "#88a9bc",
  },
};

export const LOCATIONS: Record<
  LocationId,
  {
    name: string;
    detail: string;
    safe?: boolean;
    trader?: string;
    background?: string;
    time: number;
    risk: string;
    xp: number;
    artifact: Artifact;
    x: number;
    y: number;
  }
> = {
  camp: {
    name: "Деревня новичков",
    detail: "Костёр, крыша и люди, которым пока можно верить.",
    safe: true,
    trader: "Сидорович",
    time: 8,
    risk: "Укрытие",
    xp: 0,
    artifact: "stone",
    x: 21,
    y: 75,
  },
  bar: {
    name: "Бар «100 рентген»",
    detail:
      "Безопасное поселение за старой проходной. Бармен торгует припасами и снаряжением.",
    safe: true,
    trader: "Бармен",
    time: 12,
    risk: "Укрытие",
    xp: 0,
    artifact: "stone",
    x: 25,
    y: 30,
  },
  cordon: {
    name: "Кордон",
    detail:
      "За железнодорожной насыпью снова светится низина. Детектор ловит слабый сигнал.",
    time: 8,
    risk: "Низкий",
    xp: 0,
    artifact: "stone",
    x: 43,
    y: 58,
  },
  dump: {
    name: "Свалка",
    detail:
      "Ржавые машины, слепые псы и хороший хабар. Место для тех, кто уже освоился.",
    time: 14,
    risk: "Средний",
    xp: 40,
    artifact: "spark",
    x: 59,
    y: 34,
  },
  agroprom: {
    name: "Агропром",
    detail:
      "В заброшенном институте замечена редкая аномалия. Без припасов лучше не соваться.",
    time: 18,
    risk: "Высокий",
    xp: 100,
    artifact: "moon",
    x: 79,
    y: 23,
  },
};

export interface LogEntry {
  id: number;
  at: number;
  from: string;
  text: string;
  kind: "info" | "good" | "danger";
}
export interface Grave {
  id: number;
  name: string;
  generation: number;
  at: number;
  location: LocationId;
  inventory: Inventory;
  rubles: number;
}
export interface Memorial {
  name: string;
  generation: number;
  at: number;
  cause: string;
  location: LocationId;
  xp: number;
}
export interface MapPosition {
  x: number;
  y: number;
}
export interface Raid {
  location: LocationId;
  phase: "travel" | "choice" | "return";
  startedAt: number;
  endsAt: number;
  event: number;
  graveId: number | null;
  origin: LocationId;
  startPosition?: MapPosition;
  remainingMs: number;
  openedAt: number | null;
}
export interface Game {
  version: 3;
  face: number | null;
  location: LocationId;
  gear: Record<GearSlot, ItemId | null>;
  ground: Partial<Record<LocationId, Inventory>>;
  searchedAt: Partial<Record<LocationId, number>>;
  seed: number;
  name: string;
  generation: number;
  startedAt: number;
  lastTick: number;
  offset: number;
  health: number;
  food: number;
  water: number;
  energy: number;
  radiation: number;
  rubles: number;
  xp: number;
  raids: number;
  mistakes: number;
  lastCare: { food: number; water: number; rest: number };
  inventory: Inventory;
  equipped: Artifact | null;
  faction: Faction | "loner" | null;
  reputation: Record<Faction, number>;
  inviteAt: number | null;
  raid: Raid | null;
  dead: boolean;
  graves: Grave[];
  memorials: Memorial[];
  log: LogEntry[];
  nextId: number;
}

export type Action =
  | { type: "create-character"; face: number; name?: string }
  | { type: "tick" | "rest" | "next" | "delegate" | "explore" | "pickup" | "suicide" }
  | { type: "open-event"; eventAt?: number }
  | { type: "use" | "buy" | "sell" | "drop"; item: ItemId }
  | { type: "equip"; item: ItemId }
  | { type: "raid"; location: LocationId; graveId?: number }
  | { type: "choice"; index: number }
  | { type: "faction"; faction: Faction | "loner" }
  | { type: "recover"; graveId: number }
  | { type: "skip"; ms: number };

export interface Choice {
  title: string;
  detail: string;
  faction: Faction;
  damage: number;
  radiation: number;
  money: number;
  energy: number;
  cost?: number;
  loot?: boolean;
  combat?: boolean;
  delay?: number;
}
export const EVENTS: { title: string; text: string; choices: Choice[] }[] = [
  {
    title: "Бандиты на дороге",
    text: "У разбитого грузовика трое перегородили дорогу. Видят рюкзак, требуют деньги. Можно уйти через лес или принять бой.",
    choices: [
      {
        title: "Обойти",
        detail: "Лесная тропа: без боя, +6 минут к пути.",
        faction: "freedom",
        damage: 0,
        radiation: 0,
        money: 0,
        energy: 12,
        delay: 6 * 60_000,
      },
      {
        title: "Напасть",
        detail: "Риск ранения. Деньги и припасы с поверженных бандитов.",
        faction: "duty",
        damage: 28,
        radiation: 0,
        money: 180,
        energy: 16,
        loot: true,
        combat: true,
      },
      {
        title: "Откупиться",
        detail: "Заплатить 150 ₽ и пройти без боя.",
        faction: "mercenary",
        damage: 0,
        radiation: 0,
        money: 0,
        energy: 0,
        cost: 150,
      },
    ],
  },
  {
    title: "Свет в низине",
    text: "Между бетонными плитами пульсирует аномалия. «Отклик» захлёбывается. На краю поля застрял другой сталкер.",
    choices: [
      {
        title: "Проверить поле болтами",
        detail: "Осторожное исследование. Артефакт и немного радиации.",
        faction: "science",
        damage: 6,
        radiation: 9,
        money: 80,
        energy: 10,
      },
      {
        title: "Вытащить сталкера",
        detail: "Он поделится находкой. Придётся рискнуть здоровьем.",
        faction: "duty",
        damage: 14,
        radiation: 5,
        money: 65,
        energy: 14,
      },
      {
        title: "Найти обход по насыпи",
        detail: "Меньше риска. В старом тайнике тоже бывает хабар.",
        faction: "freedom",
        damage: 3,
        radiation: 4,
        money: 55,
        energy: 16,
      },
    ],
  },
  {
    title: "Чужая частота",
    text: "Из разбитого грузовика доносится сигнал SOS. За кабиной лежит контейнер с артефактом. У помощи здесь своя цена.",
    choices: [
      {
        title: "Ответить на сигнал",
        detail: "Помочь раненому и разделить добычу.",
        faction: "duty",
        damage: 9,
        radiation: 4,
        money: 90,
        energy: 12,
      },
      {
        title: "Выкупить координаты",
        detail: "Обменять информацию на долю от продажи.",
        faction: "mercenary",
        damage: 5,
        radiation: 7,
        money: 150,
        energy: 10,
      },
      {
        title: "Записать аномальный сигнал",
        detail: "Образец пригодится учёным.",
        faction: "science",
        damage: 7,
        radiation: 10,
        money: 100,
        energy: 8,
      },
    ],
  },
  {
    title: "По ту сторону забора",
    text: "Патруль перекрыл проход к тайнику. Свободовец по рации предлагает тропу через старый коллектор.",
    choices: [
      {
        title: "Пойти своей тропой",
        detail: "Свобода стоит промокших сапог.",
        faction: "freedom",
        damage: 8,
        radiation: 6,
        money: 120,
        energy: 14,
      },
      {
        title: "Выполнить просьбу патруля",
        detail: "Разогнать мутантов и получить пропуск.",
        faction: "duty",
        damage: 16,
        radiation: 3,
        money: 140,
        energy: 12,
      },
      {
        title: "Договориться о доле",
        detail: "Хорошая сделка открывает двери.",
        faction: "mercenary",
        damage: 5,
        radiation: 5,
        money: 170,
        energy: 8,
      },
    ],
  },
  {
    title: "Внимание. Выброс",
    text: "На горизонте багровеет небо. Птицы замолкли. До бетонного подвала несколько сотен метров, до находки — десять шагов.",
    choices: [
      {
        title: "Сразу в укрытие",
        detail: "Переждать волну. Хабар найдётся и в подвале.",
        faction: "science",
        damage: 4,
        radiation: 3,
        money: 60,
        energy: 12,
      },
      {
        title: "Предупредить людей",
        detail: "Проводить отставших. Волна заденет краем.",
        faction: "duty",
        damage: 17,
        radiation: 12,
        money: 100,
        energy: 16,
      },
      {
        title: "Успеть забрать находку",
        detail: "Большая награда, серьёзный урон и облучение.",
        faction: "mercenary",
        damage: 32,
        radiation: 24,
        money: 240,
        energy: 20,
      },
    ],
  },
];

export const emptyInventory = (): Inventory =>
  Object.fromEntries(Object.keys(ITEMS).map((key) => [key, 0])) as Inventory;
const clamp = (n: number, max = 100) => Math.max(0, Math.min(max, n));
export const maxHealth = (game: Game) => 100 - Math.min(game.mistakes, 2) * 15;
export const rank = (game: Game) =>
  game.xp >= 120 ? "Ветеран" : game.xp >= 40 ? "Опытный" : "Новичок";
export const leader = (game: Game): Faction =>
  (Object.keys(FACTIONS) as Faction[]).reduce(
    (best, key) => (game.reputation[key] > game.reputation[best] ? key : best),
    "science",
  );
export const careDeadline = (game: Game) =>
  Math.min(...Object.values(game.lastCare)) + (game.mistakes + 1) * DAY;
export const packWeight = (inventory: Inventory) =>
  (Object.keys(ITEMS) as ItemId[]).reduce(
    (sum, key) => sum + inventory[key] * ITEMS[key].weight,
    0,
  );

function log(
  game: Game,
  text: string,
  from = game.name,
  kind: LogEntry["kind"] = "info",
  at = game.lastTick,
) {
  game.log.unshift({ id: game.nextId++, at, from, text, kind });
  game.log = game.log.slice(0, 80);
}

export function createGame(now = Date.now(), generation = 1): Game {
  const inventory = {
    ...emptyInventory(),
    food: 3,
    water: 3,
    medkit: 2,
    antirad: 1,
    pistol: 1,
    jacket: 1,
    detector: 1,
  };
  const game: Game = {
    version: 3,
    face: null,
    location: "camp",
    gear: { suit: null, mask: null, primary: null, secondary: "pistol" },
    ground: {},
    searchedAt: {},
    seed: (now + generation) >>> 0,
    name: STALKER_NAMES[(generation - 1) % STALKER_NAMES.length],
    generation,
    startedAt: now,
    lastTick: now,
    offset: 0,
    health: 86,
    food: 72,
    water: 68,
    energy: 78,
    radiation: 7,
    rubles: 480,
    xp: 0,
    raids: 0,
    mistakes: 0,
    lastCare: { food: now, water: now, rest: now },
    inventory,
    equipped: null,
    faction: null,
    reputation: { duty: 0, freedom: 0, science: 0, mercenary: 0 },
    inviteAt: null,
    raid: null,
    dead: false,
    graves: [],
    memorials: [],
    log: [],
    nextId: 1,
  };
  log(
    game,
    "КПК подключён. Береги его — у каждого сталкера здесь одна жизнь.",
    "Сеть Зоны",
  );
  log(
    game,
    "В низине на Кордоне снова фонит. Возьми воды и проверь детектор.",
    "Волк",
  );
  log(game, "Сижу у костра. Пока тихо. Можно перекусить и сходить за хабаром.");
  return game;
}

function die(game: Game, cause: string) {
  if (game.dead) return;
  const location = game.raid?.location ?? game.location;
  game.graves.push({
    id: game.nextId++,
    name: game.name,
    generation: game.generation,
    at: game.lastTick,
    location,
    inventory: { ...game.inventory },
    rubles: game.rubles,
  });
  game.memorials.push({
    name: game.name,
    generation: game.generation,
    at: game.lastTick,
    cause,
    location,
    xp: game.xp,
  });
  game.inventory = emptyInventory();
  game.rubles = 0;
  game.equipped = null;
  game.gear = { suit: null, mask: null, primary: null, secondary: null };
  game.health = 0;
  game.dead = true;
  game.raid = null;
  game.inviteAt = null;
  log(
    game,
    `${game.name} не вышел на связь. ${cause} Тело со всеми припасами, снаряжением и деньгами осталось на отметке: ${LOCATIONS[location].name}.`,
    "Сеть Зоны",
    "danger",
  );
}

// The saved PRNG makes catch-up independent of how often the UI ticks.
function random(game: Game) {
  game.seed = (Math.imul(game.seed, 1664525) + 1013904223) >>> 0;
  return game.seed / 0x100000000;
}
export const isSafe = (game: Game) =>
  !game.raid && !!LOCATIONS[game.location].safe;
export const isEquipped = (game: Game, item: ItemId) =>
  game.equipped === item || Object.values(game.gear).includes(item);
export const canCarry = (game: Game, item: ItemId) =>
  packWeight(game.inventory) + ITEMS[item].weight <= PACK_CAPACITY + 1e-8;
export function routeProgress(game: Game) {
  const raid = game.raid;
  if (!raid) return 0;
  const duration =
    travelMinutes(raid.startPosition ?? raid.origin, raid.location) * 60_000;
  const encounterPosition = clamp(1 - raid.remainingMs / duration, 1);
  if (raid.phase === "choice") return encounterPosition;
  const elapsed = clamp(
    (game.lastTick - raid.startedAt) /
      Math.max(1, raid.endsAt - raid.startedAt),
    1,
  );
  if (raid.phase === "travel") return encounterPosition * elapsed;
  return encounterPosition + (1 - encounterPosition) * elapsed;
}
export function routePosition(game: Game): MapPosition {
  const raid = game.raid;
  if (!raid) return LOCATIONS[game.location];
  const from = raid.startPosition ?? LOCATIONS[raid.origin];
  const to = LOCATIONS[raid.location];
  const progress = routeProgress(game);
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}
export const travelMinutes = (from: LocationId | MapPosition, to: LocationId) => {
  const start = typeof from === "string" ? LOCATIONS[from] : from;
  return Math.max(
    3,
    Math.round(
      Math.hypot(
        start.x - LOCATIONS[to].x,
        start.y - LOCATIONS[to].y,
      ) / 3.5,
    ),
  );
};

function collect(game: Game, source: Inventory) {
  for (const key of Object.keys(ITEMS) as ItemId[]) {
    const count = Math.min(
      source[key],
      Math.max(
        0,
        Math.floor(
          (PACK_CAPACITY - packWeight(game.inventory) + 1e-8) /
            ITEMS[key].weight,
        ),
      ),
    );
    game.inventory[key] += count;
    source[key] -= count;
  }
}
function loot(
  game: Game,
  items: Partial<Inventory>,
  location = game.raid?.location ?? game.location,
) {
  const ground = game.ground[location] ?? emptyInventory();
  for (const key of Object.keys(items) as ItemId[]) ground[key] += items[key]!;
  collect(game, ground);
  game.ground[location] = ground;
  if (Object.values(ground).some(Boolean))
    log(
      game,
      "Рюкзак полон. Остаток добычи отмечен на карте; можно вернуться и забрать.",
      "КПК",
    );
}
function recover(game: Game, id: number) {
  const grave = game.graves.find((entry) => entry.id === id);
  if (!grave) return;
  collect(game, grave.inventory);
  const money = grave.rubles;
  game.rubles += money;
  grave.rubles = 0;
  const left = Object.values(grave.inventory).some(Boolean);
  if (!left) game.graves = game.graves.filter((entry) => entry.id !== id);
  log(
    game,
    `Рюкзак ${grave.name} найден. Забрано ${money} ₽ и вещи по вместимости.${left ? " Остальное осталось на отметке: предел 50 кг." : " Весь хабар забран."}`,
    "Наследие",
    "good",
  );
}
function continueRoute(game: Game, delay = 0) {
  if (!game.raid) return;
  game.raid.openedAt = null;
  game.raid.phase = "return";
  game.raid.startedAt = game.lastTick;
  game.raid.endsAt = game.lastTick + game.raid.remainingMs + delay;
}
function missEvent(game: Game) {
  if (!game.raid) return;
  if (game.raid.event === 0) {
    const lost = Math.ceil(game.rubles * 0.3);
    game.rubles -= lost;
    const stolen: string[] = [];
    for (const key of Object.keys(ITEMS) as ItemId[]) {
      if (!isEquipped(game, key) && game.inventory[key] > 0) {
        const count = Math.ceil(game.inventory[key] * 0.25);
        game.inventory[key] -= count;
        stolen.push(`${ITEMS[key].name} ×${count}`);
      }
    }
    log(
      game,
      `15 минут без связи. Бандиты забрали ${lost} ₽${stolen.length ? ": " + stolen.join(", ") : ""}.`,
      "КПК",
      "danger",
    );
  } else {
    game.health = clamp(game.health - 25, maxHealth(game));
    game.radiation = clamp(game.radiation + (game.gear.mask ? 6 : 12));
    log(
      game,
      "15 минут без связи. Сталкер ранен: здоровье −25, получено облучение. Нужны аптечка и антирад.",
      "КПК",
      "danger",
    );
    if (game.health <= 0) {
      die(game, "Не получил помощь во время опасного события.");
      return;
    }
  }
  continueRoute(game);
}

export function raidEvent(game: Game) {
  if (game.raid?.graveId != null)
    return {
      title: "Рюкзак на старой отметке",
      text: "Координаты совпадают. Под ржавой балкой виден знакомый рюкзак. Детектор предупреждает: вокруг неспокойно.",
      choices: [
        {
          title: "Проверить подход болтами",
          detail: "Забрать все вещи. Осторожный путь требует сил.",
          faction: "science" as Faction,
          damage: 5,
          radiation: 4,
          money: 0,
          energy: 15,
        },
        {
          title: "Прикрыть отход и забрать",
          detail: "Быстрее, но придётся пройти опасный участок.",
          faction: "duty" as Faction,
          damage: 14,
          radiation: 8,
          money: 0,
          energy: 8,
        },
      ],
    };
  return EVENTS[game.raid?.event ?? 0];
}

function resolveChoice(game: Game, index: number) {
  if (game.raid?.phase !== "choice" || game.raid.openedAt === null) return;
  const choice = raidEvent(game).choices[index];
  if (!choice || game.rubles < (choice.cost ?? 0)) return;
  game.rubles -= choice.cost ?? 0;
  const location = LOCATIONS[game.raid.location];
  const danger =
    game.raid.location === "agroprom"
      ? 1.65
      : game.raid.location === "dump"
        ? 1.25
        : 1;
  const protection =
    (game.gear.suit === "armor" ? 0.65 : 1) *
    (choice.combat && game.gear.primary ? 0.7 : 1) *
    (game.faction === "duty" ? 0.8 : 1);
  const damage = Math.round(choice.damage * danger * protection);
  game.health = clamp(game.health - damage, maxHealth(game));
  game.radiation = clamp(
    game.radiation +
      choice.radiation *
        (game.faction === "science" ? 0.5 : 1) *
        (game.gear.mask ? 0.5 : 1),
  );
  game.energy = clamp(
    game.energy -
      choice.energy *
        (game.equipped === "spark" ? 0.5 : 1) *
        (game.faction === "freedom" ? 0.75 : 1),
  );
  game.reputation[choice.faction] += 2;
  log(
    game,
    `${choice.title}. Здоровье −${damage}${choice.cost ? `, потрачено ${choice.cost} ₽` : ""}.`,
    game.name,
    damage >= 20 ? "danger" : "info",
  );
  if (game.health <= 0) {
    die(game, "Погиб во время вылазки.");
    return;
  }
  if (game.raid.graveId != null) {
    recover(game, game.raid.graveId);
  } else if (choice.loot !== false && (game.raid.event !== 0 || choice.loot)) {
    const money = Math.round(
      choice.money *
        (game.equipped === "moon" ? 1.5 : 1) *
        (game.faction === "mercenary" ? 1.25 : 1),
    );
    game.rubles += money;
    loot(
      game,
      game.raid.event === 0
        ? { food: 1, medkit: 1, scrap: 3 }
        : { [location.artifact]: 1, scrap: 2 },
    );
    log(
      game,
      `Добыча: ${game.raid.event === 0 ? "припасы бандитов" : "«" + ITEMS[location.artifact].name + "» и детали"}, ${money} ₽. Продолжаю путь.`,
      game.name,
      "good",
    );
  }
  continueRoute(game, choice.delay);
}

function chooseFaction(
  game: Game,
  faction: Faction | "loner",
  automatic = false,
) {
  if (game.xp < 60 || game.faction !== null) return;
  game.faction = faction;
  game.inviteAt = null;
  const name = faction === "loner" ? "Одиночки" : FACTIONS[faction].name;
  log(
    game,
    `${automatic ? "Не дождался ответа и выбрал свой путь" : "Путь выбран"}: ${name}.`,
    game.name,
    "good",
  );
}

function applyTime(game: Game, target: number) {
  if (target <= game.lastTick) return;
  while (game.lastTick < target && !game.dead) {
    const oldestCare = Math.min(...Object.values(game.lastCare));
    const nextMistake =
      oldestCare + (Math.floor((game.lastTick - oldestCare) / DAY) + 1) * DAY;
    const end = Math.max(
      game.lastTick,
      Math.min(
        target,
        nextMistake,
        game.raid?.phase === "choice" && game.raid.openedAt !== null
          ? Infinity
          : (game.raid?.endsAt ?? Infinity),
        game.inviteAt ?? Infinity,
      ),
    );
    const hours = (end - game.lastTick) / 3_600_000;
    game.food = clamp(
      game.food - hours * 2 * (game.equipped === "stone" ? 2 : 1),
    );
    game.water = clamp(
      game.water - hours * 2.5 * (game.equipped === "spark" ? 2 : 1),
    );
    game.energy = clamp(
      game.energy - hours * 1.5 * (game.equipped === "spark" ? 0.5 : 1),
    );
    if (game.equipped === "stone")
      game.health = clamp(game.health + hours * 3, maxHealth(game));
    if (game.equipped === "moon")
      game.radiation = clamp(game.radiation + hours * 3);
    if (game.radiation > 40)
      game.health = Math.max(1, game.health - (hours * game.radiation) / 30);
    game.lastTick = end;
    const mistakes = Math.min(3, Math.floor((end - oldestCare) / DAY));
    if (mistakes > game.mistakes) {
      game.health = Math.max(1, game.health - (mistakes - game.mistakes) * 20);
      game.mistakes = mistakes;
      game.health = Math.min(game.health, maxHealth(game));
      if (mistakes === 3) {
        die(game, "Три пропущенных срока ухода.");
        break;
      }
      log(
        game,
        `Ошибка ухода ${mistakes}/3. ${mistakes === 1 ? "Силы уходят. Нужны еда, вода и отдых." : "Тяжёлое состояние. Следующая ошибка станет последней."}`,
        "Жизнеобеспечение",
        "danger",
      );
    }
    if (
      game.raid &&
      game.raid.endsAt <= end &&
      !(game.raid.phase === "choice" && game.raid.openedAt !== null)
    ) {
      if (game.raid.phase === "travel") {
        game.raid.phase = "choice";
        game.raid.startedAt = end;
        game.raid.endsAt = end + EVENT_TIMEOUT;
        log(
          game,
          raidEvent(game).title +
            ". Открой сообщение в течение 15 минут, иначе будут последствия.",
          game.name,
        );
      } else if (game.raid.phase === "choice") {
        missEvent(game);
      } else {
        game.location = game.raid.location;
        game.raid = null;
        game.raids++;
        game.xp += 20;
        log(
          game,
          `Прибыл: ${LOCATIONS[game.location].name}. ${isSafe(game) ? "Можно отдохнуть и купить припасы." : "Можно осмотреть точку и поискать тайники."}`,
          game.name,
          "good",
        );
        if (game.xp === 40)
          log(
            game,
            "Теперь ты опытный. Дорога на Свалку открыта.",
            "Волк",
            "good",
          );
        if (game.xp >= 60 && game.faction === null && game.inviteAt === null) {
          game.inviteAt = end + 5 * 60_000;
          log(
            game,
            "Тобой заинтересовались группировки. Выбери путь в личном деле. Через 5 минут сталкер определится сам.",
            "Сеть Зоны",
            "good",
          );
        }
      }
    }
    if (!game.dead && game.inviteAt !== null && game.inviteAt <= end)
      chooseFaction(game, leader(game), true);
  }
  game.lastTick = target;
}

export function reduceGame(
  previous: Game,
  action: Action,
  realNow = Date.now(),
): Game {
  let game = structuredClone(previous);
  // A new life starts only after the player confirms their character.
  if (game.face === null) {
    if (
      action.type === "create-character" &&
      Number.isInteger(action.face) &&
      action.face >= 0 &&
      action.face < FACES.length
    ) {
      if (action.name !== undefined) {
        const name = action.name.trim();
        if (!name || name.length > 24) return game;
        game.name = name;
      }
      game.face = action.face;
      game.lastTick = Math.max(game.lastTick, realNow + game.offset);
      game.lastCare = {
        food: game.lastTick,
        water: game.lastTick,
        rest: game.lastTick,
      };
      if (game.generation === 1) game.startedAt = game.lastTick;
      log(game, "Вхожу в Зону. Пока в обычной одежде; снаряжение — в рюкзаке.", game.name, "good");
    }
    return game;
  }
  if (action.type === "skip" && Number.isFinite(action.ms) && action.ms > 0)
    game.offset += action.ms;
  applyTime(game, Math.max(game.lastTick, realNow + game.offset));
  if (action.type === "next" && game.dead) {
    const next = createGame(game.lastTick, game.generation + 1);
    game = {
      ...next,
      startedAt: game.startedAt,
      offset: game.offset,
      ground: game.ground,
      graves: game.graves,
      memorials: game.memorials,
      log: game.log,
      nextId: game.nextId,
    };
    log(
      game,
      "Новый КПК, старая Зона. Отметки рюкзаков погибших сохранены на карте.",
      game.name,
      "good",
    );
    return game;
  }
  if (game.dead) return game;
  if (action.type === "suicide") {
    die(game, "Самоубийство.");
    return game;
  }
  if (action.type === "faction") chooseFaction(game, action.faction);
  if (action.type === "delegate") chooseFaction(game, leader(game), true);
  if (
    action.type === "open-event" &&
    game.raid?.phase === "choice" &&
    game.raid.openedAt === null &&
    (action.eventAt === undefined || action.eventAt === game.raid.startedAt)
  ) {
    game.raid.openedAt = game.lastTick;
    log(game, "Связь установлена. Выбери, как поступить.");
  }
  if (action.type === "choice") resolveChoice(game, action.index);
  if (game.dead) return game;
  if (action.type === "raid" && game.raid) {
    const raid = game.raid;
    const location = LOCATIONS[action.location];
    const grave = game.graves.find(
      (entry) => entry.id === action.graveId && entry.location === action.location,
    );
    if (
      !location ||
      raid.phase === "choice" ||
      raid.location === action.location ||
      (!grave && game.xp < location.xp) ||
      (action.graveId != null && !grave)
    ) return game;
    const position = routePosition(game);
    const duration = travelMinutes(position, action.location) * 60_000;
    const encounter = raid.phase === "travel" || !!grave;
    const untilEvent = encounter
      ? Math.min(raid.endsAt - game.lastTick, Math.round(duration / 2))
      : duration;
    raid.startPosition = position;
    raid.location = action.location;
    raid.graveId = grave?.id ?? null;
    raid.phase = encounter ? "travel" : "return";
    raid.startedAt = game.lastTick;
    raid.endsAt = game.lastTick + untilEvent;
    raid.remainingMs = encounter ? duration - untilEvent : duration;
    log(game, `Меняю маршрут: ${location.name}. Продолжаю с текущего места.`);
    return game;
  }
  if (
    action.type === "raid" &&
    !game.raid &&
    action.location !== game.location
  ) {
    const location = LOCATIONS[action.location];
    if (!location) return game;
    const grave = game.graves.find(
      (entry) =>
        entry.id === action.graveId && entry.location === action.location,
    );
    if (
      (!grave && game.xp < location.xp) ||
      (action.graveId != null && !grave) ||
      game.energy < 20 ||
      game.health < 20 ||
      game.food < 10 ||
      game.water < 10 ||
      packWeight(game.inventory) > PACK_CAPACITY + 1e-8
    )
      return game;
    const duration = travelMinutes(game.location, action.location) * 60_000;
    const encounter = grave || random(game) < 0.8;
    const untilEvent = Math.round(duration * (0.25 + random(game) * 0.5));
    game.raid = {
      location: action.location,
      phase: encounter ? "travel" : "return",
      startedAt: game.lastTick,
      endsAt: game.lastTick + (encounter ? untilEvent : duration),
      event: Math.floor(random(game) * EVENTS.length),
      origin: game.location,
      remainingMs: encounter ? duration - untilEvent : duration,
      openedAt: null,
      graveId: grave?.id ?? null,
    };
    game.energy = clamp(game.energy - 8);
    game.food = clamp(game.food - 5);
    game.water = clamp(game.water - 7);
    log(
      game,
      `Выхожу: ${location.name}. ${grave ? "Проверю отметку рюкзака." : "Держи рацию рядом."}`,
    );
  }
  if (game.raid && !["use", "equip", "drop"].includes(action.type)) return game;
  if (
    action.type === "explore" &&
    !game.raid &&
    !isSafe(game) &&
    game.energy >= 10 &&
    game.lastTick - (game.searchedAt[game.location] ?? 0) >= 30 * 60_000
  ) {
    game.energy = clamp(game.energy - 10);
    game.searchedAt[game.location] = game.lastTick;
    const found =
      random(game) < 0.5
        ? { food: 2, water: 1, scrap: 3 }
        : { medkit: 1, antirad: 1, [LOCATIONS[game.location].artifact]: 1 };
    loot(game, found);
    log(
      game,
      `Нашёл чужой тайник: ${Object.entries(found)
        .map(([id, count]) => `${ITEMS[id as ItemId].name} ×${count}`)
        .join(", ")}.`,
      game.name,
      "good",
    );
  }
  if (action.type === "pickup" && !game.raid && game.ground[game.location]) {
    collect(game, game.ground[game.location]!);
    log(game, "Забрал добычу по вместимости рюкзака.");
  }
  if (
    action.type === "drop" &&
    game.inventory[action.item] > 0 &&
    !isEquipped(game, action.item)
  ) {
    game.inventory[action.item]--;
    const location = game.raid?.location ?? game.location;
    game.ground[location] ??= emptyInventory();
    game.ground[location]![action.item]++;
    log(
      game,
      `${ITEMS[action.item].name} оставлен на отметке: ${LOCATIONS[location].name}.`,
    );
  }
  if (
    action.type === "recover" &&
    game.graves.some(
      (grave) =>
        grave.id === action.graveId && grave.location === game.location,
    )
  )
    recover(game, action.graveId);
  if (
    action.type === "rest" &&
    isSafe(game) &&
    (game.energy < 95 || game.lastTick - game.lastCare.rest >= 3_600_000)
  ) {
    game.energy = clamp(game.energy + 45);
    game.health = clamp(game.health + 6, maxHealth(game));
    game.lastCare.rest = game.lastTick;
    log(game, "Отдохнул у костра. Силы +45, здоровье +6.");
  }
  if (
    action.type === "use" &&
    game.inventory[action.item] > 0 &&
    ITEMS[action.item].kind === "supply"
  ) {
    game.inventory[action.item]--;
    if (action.item === "food") {
      game.food = clamp(game.food + 40);
      game.health = clamp(game.health + 2, maxHealth(game));
      game.lastCare.food = game.lastTick;
    }
    if (action.item === "water") {
      game.water = clamp(game.water + 45);
      game.lastCare.water = game.lastTick;
    }
    if (action.item === "medkit")
      game.health = clamp(game.health + 35, maxHealth(game));
    if (action.item === "antirad") game.radiation = clamp(game.radiation - 40);
    log(
      game,
      `${ITEMS[action.item].name}: ${ITEMS[action.item].detail.toLowerCase()}.`,
      game.name,
      "good",
    );
  }
  if (action.type === "buy" && isSafe(game)) {
    const item = ITEMS[action.item];
    if (
      (item.kind === "supply" || item.kind === "gear") &&
      canCarry(game, action.item) &&
      game.rubles >= item.price &&
      (item.kind !== "gear" || !game.inventory[action.item])
    ) {
      game.rubles -= item.price;
      game.inventory[action.item]++;
      log(
        game,
        `Куплено: ${item.name}. −${item.price} ₽.`,
        LOCATIONS[game.location].trader,
      );
    }
  }
  if (
    action.type === "sell" &&
    isSafe(game) &&
    game.inventory[action.item] > 0 &&
    !isEquipped(game, action.item)
  ) {
    const value = Math.round(ITEMS[action.item].price * 0.7);
    game.inventory[action.item]--;
    game.rubles += value;
    log(
      game,
      `Продано: ${ITEMS[action.item].name}. +${value} ₽.`,
      LOCATIONS[game.location].trader,
      "good",
    );
  }
  if (
    action.type === "equip" &&
    game.inventory[action.item] > 0 &&
    GEAR[action.item]
  ) {
    const slot = GEAR[action.item]!;
    game.gear[slot] = game.gear[slot] === action.item ? null : action.item;
    log(
      game,
      `${ITEMS[action.item].name}: ${game.gear[slot] ? "экипировано" : "снято в рюкзак"}.`,
    );
  }
  if (
    action.type === "equip" &&
    game.inventory[action.item] > 0 &&
    ITEMS[action.item].kind === "artifact"
  ) {
    game.equipped =
      game.equipped === action.item ? null : (action.item as Artifact);
    log(
      game,
      game.equipped
        ? `На поясе «${ITEMS[action.item].name}». ${ITEMS[action.item].detail}.`
        : "Артефакт убран в контейнер. Побочный эффект остановлен.",
    );
  }
  const mistakes = Math.min(
    2,
    Math.floor(
      (game.lastTick - Math.min(...Object.values(game.lastCare))) / DAY,
    ),
  );
  if (mistakes < game.mistakes) {
    game.mistakes = mistakes;
    log(
      game,
      "Необходимый уход получен. Ограничение здоровья ослабло; раны можно вылечить.",
      "Жизнеобеспечение",
      "good",
    );
  }
  return game;
}

// Stored data is untrusted: a broken save must not crash the entire PDA.
export function parseSave(raw: string): Game | null {
  try {
    const game = JSON.parse(raw);
    if (game?.version === 1 && game.inventory && Array.isArray(game.graves)) {
      game.version = 2;
      game.location = "camp";
      game.gear = {
        suit: game.inventory.armor
          ? "armor"
          : game.inventory.jacket
            ? "jacket"
            : null,
        mask: null,
        primary: null,
        secondary: game.inventory.pistol ? "pistol" : null,
      };
      game.ground = {};
      game.searchedAt = {};
      game.seed = game.startedAt >>> 0;
      for (const inv of [
        game.inventory,
        ...game.graves.map((grave: Grave) => grave?.inventory),
      ]) {
        if (inv && typeof inv === "object") {
          inv.mask ??= 0;
          inv.rifle ??= 0;
        }
      }
      if (game.raid) {
        game.raid.origin = "camp";
        game.raid.remainingMs = 60_000;
        game.raid.openedAt = null;
        // Legacy event indices preceded the bandit encounter.
        game.raid.event += 1;
        if (game.raid.phase === "choice")
          game.raid.endsAt = game.raid.startedAt + EVENT_TIMEOUT;
      }
    }
    if (game?.version === 2) {
      game.version = 3;
      game.face = 0;
    }
    const number = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value) && value >= 0;
    const integer = (value: unknown) =>
      number(value) && Number.isInteger(value);
    const location = (value: unknown) =>
      typeof value === "string" && Object.hasOwn(LOCATIONS, value);
    const inventory = (value: unknown) =>
      !!value &&
      typeof value === "object" &&
      Object.keys(ITEMS).every((key) =>
        integer((value as Record<string, unknown>)[key]),
      );
    if (
      !game ||
      game.version !== 3 ||
      !(game.face === null || (integer(game.face) && game.face < FACES.length)) ||
      typeof game.name !== "string" ||
      game.name.length > 24 ||
      typeof game.dead !== "boolean"
    )
      return null;
    if (
      ![
        "generation",
        "startedAt",
        "lastTick",
        "offset",
        "rubles",
        "xp",
        "raids",
        "mistakes",
        "nextId",
      ].every((key) => integer(game[key]))
    )
      return null;
    if (
      game.generation < 1 ||
      game.mistakes > 3 ||
      game.startedAt > game.lastTick
    )
      return null;
    if (
      !["health", "food", "water", "energy", "radiation"].every(
        (key) => number(game[key]) && game[key] <= 100,
      )
    )
      return null;
    if (
      !inventory(game.inventory) ||
      !game.lastCare ||
      !["food", "water", "rest"].every(
        (key) =>
          number(game.lastCare[key]) && game.lastCare[key] <= game.lastTick,
      )
    )
      return null;
    if (
      !location(game.location) ||
      !integer(game.seed) ||
      game.seed > 0xffffffff ||
      !game.gear ||
      !Object.keys(GEAR_SLOTS).every(
        (slot) =>
          game.gear[slot] === null ||
          (Object.hasOwn(GEAR, game.gear[slot]) &&
            GEAR[game.gear[slot] as ItemId] === slot &&
            game.inventory[game.gear[slot]] > 0),
      ) ||
      !game.ground ||
      typeof game.ground !== "object" ||
      !Object.entries(game.ground).every(
        ([key, value]) => location(key) && inventory(value),
      ) ||
      !game.searchedAt ||
      typeof game.searchedAt !== "object" ||
      !Object.entries(game.searchedAt).every(
        ([key, value]) =>
          location(key) && number(value) && (value as number) <= game.lastTick,
      )
    )
      return null;
    if (
      !game.reputation ||
      !Object.keys(FACTIONS).every((key) => integer(game.reputation[key]))
    )
      return null;
    if (
      game.faction !== null &&
      game.faction !== "loner" &&
      !Object.hasOwn(FACTIONS, game.faction)
    )
      return null;
    if (
      game.equipped !== null &&
      (!["stone", "spark", "moon"].includes(game.equipped) ||
        game.inventory[game.equipped] < 1)
    )
      return null;
    if (
      game.inviteAt !== null &&
      (!number(game.inviteAt) ||
        game.inviteAt < game.lastTick ||
        game.xp < 60 ||
        game.faction !== null)
    )
      return null;
    if (
      game.raid !== null &&
      (!location(game.raid.location) ||
        !["travel", "choice", "return"].includes(game.raid.phase) ||
        !number(game.raid.startedAt) ||
        !number(game.raid.endsAt) ||
        (game.raid.openedAt === null && game.raid.endsAt < game.lastTick) ||
        game.raid.startedAt > game.lastTick ||
        game.raid.endsAt < game.raid.startedAt ||
        !location(game.raid.origin) ||
        (game.raid.startPosition !== undefined &&
          (!game.raid.startPosition ||
            !number(game.raid.startPosition.x) ||
            game.raid.startPosition.x > 100 ||
            !number(game.raid.startPosition.y) ||
            game.raid.startPosition.y > 100)) ||
        !number(game.raid.remainingMs) ||
        (game.raid.openedAt !== null &&
          (game.raid.phase !== "choice" ||
            !number(game.raid.openedAt) ||
            game.raid.openedAt < game.raid.startedAt ||
            game.raid.openedAt >= game.raid.endsAt ||
            game.raid.openedAt > game.lastTick)) ||
        !integer(game.raid.event) ||
        game.raid.event >= EVENTS.length ||
        (game.raid.graveId !== null && !integer(game.raid.graveId)))
    )
      return null;
    if (
      !Array.isArray(game.graves) ||
      !game.graves.every(
        (entry: Grave) =>
          entry &&
          integer(entry.id) &&
          typeof entry.name === "string" &&
          integer(entry.generation) &&
          number(entry.at) &&
          location(entry.location) &&
          inventory(entry.inventory) &&
          number(entry.rubles),
      )
    )
      return null;
    if (
      !Array.isArray(game.memorials) ||
      !game.memorials.every(
        (entry: Memorial) =>
          entry &&
          typeof entry.name === "string" &&
          typeof entry.cause === "string" &&
          integer(entry.generation) &&
          number(entry.at) &&
          location(entry.location) &&
          number(entry.xp),
      )
    )
      return null;
    if (
      !Array.isArray(game.log) ||
      !game.log.every(
        (entry: LogEntry) =>
          entry &&
          integer(entry.id) &&
          number(entry.at) &&
          typeof entry.from === "string" &&
          typeof entry.text === "string" &&
          ["info", "good", "danger"].includes(entry.kind),
      )
    )
      return null;
    if (game.dead && (game.raid !== null || game.inviteAt !== null))
      return null;
    if (game.face === null && (game.dead || game.raid !== null || game.inviteAt !== null))
      return null;
    return game as Game;
  } catch {
    return null;
  }
}
