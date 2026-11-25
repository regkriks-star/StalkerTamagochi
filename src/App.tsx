import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Backpack,
  BatteryMedium,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Crosshair,
  Download,
  Droplets,
  Flame,
  FlaskConical,
  Footprints,
  HeartPulse,
  House,
  Info,
  Map as MapIcon,
  MapPin,
  Package,
  Radio,
  Radiation,
  Settings2,
  Shield,
  ShoppingBag,
  Signal,
  Skull,
  Sun,
  Utensils,
  Volume2,
  VolumeX,
  Wallet,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useGame } from "./useGame";
import { Toast } from "./Toast";
import { MapViewport } from "./MapViewport";
import { CharacterPortrait, Face } from "./CharacterPortrait";
import {
  careDeadline,
  PACK_CAPACITY,
  GEAR,
  GEAR_SLOTS,
  isEquipped,
  isSafe,
  canCarry,
  travelMinutes,
  routePosition,
  type GearSlot,
  DAY,
  FACES,
  STALKER_NAMES,
  FACTIONS,
  ITEMS,
  leader,
  LOCATIONS,
  maxHealth,
  packWeight,
  raidEvent,
  rank,
  type Action,
  type Faction,
  type Game,
  type ItemId,
  type LocationId,
  type Stat,
} from "./game";

type Tab = "stalker" | "map" | "bag" | "journal";
type Send = (action: Action) => void;
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "stalker", label: "Сталкер", icon: Crosshair },
  { id: "map", label: "Карта Зоны", icon: MapIcon },
  { id: "bag", label: "Рюкзак", icon: Backpack },
  { id: "journal", label: "Журнал", icon: BookOpen },
];
const itemSprites: Record<ItemId, number> = {
  food: 0,
  water: 1,
  medkit: 2,
  antirad: 3,
  scrap: 4,
  stone: 5,
  spark: 6,
  moon: 7,
  pistol: 8,
  jacket: 9,
  detector: 10,
  armor: 11,
  mask: 12,
  rifle: 13,
};
const time = (at: number) =>
  new Date(at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
function remaining(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds >= 3600)
    return `${Math.floor(seconds / 3600)} ч ${Math.floor((seconds % 3600) / 60)} мин`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
function ItemIcon({ item, size = 24 }: { item: ItemId; size?: number }) {
  const cell = itemSprites[item];
  // The generated atlas has uneven row gutters; stop before the next object.
  const rowEdges = [0, 0.25, 0.48, 0.715, 1];
  const row = Math.floor(cell / 4);
  const top = rowEdges[row];
  const height = rowEdges[row + 1] - top;
  return (
    <span
      className="item-sprite"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundSize: `400% ${100 / height}%`,
        backgroundPosition: `${((cell % 4) * 100) / 3}% ${(top * 100) / (1 - height)}%`,
      }}
    />
  );
}

function Dialog({
  title,
  children,
  close,
  className = "",
}: {
  title: string;
  children: ReactNode;
  close?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        close?.();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close?.();
      }}
      aria-labelledby="dialog-title"
    >
      <header>
        <h2 id="dialog-title">{title}</h2>
        {close && (
          <button
            className="icon-button"
            onClick={close}
            aria-label="Закрыть окно"
          >
            <X size={22} />
          </button>
        )}
      </header>
      <div className="dialog-content">{children}</div>
    </dialog>
  );
}

function CharacterCreator({
  game,
  create,
}: {
  game: Game;
  create: (face: number, name: string) => void;
}) {
  const [face, setFace] = useState(0);
  const [name, setName] = useState(game.name);
  return (
    <Dialog title="Создание сталкера" className="character-creator">
      <form
        className="creation-layout"
        onSubmit={(event) => {
          event.preventDefault();
          create(face, name.trim());
        }}
      >
        <div className="creation-preview">
          <CharacterPortrait face={face} location="camp" />
          <div className="creation-identity">
            <strong>{name.trim() || "Твой сталкер"}</strong>
            <span>Одиночка · новичок</span>
          </div>
        </div>
        <div className="creation-options">
          <p className="creation-intro">
            {game.generation === 1
              ? "У каждой истории в Зоне своё лицо. Выбери, с кем пройдёшь этот путь."
              : "Новая жизнь, новая история. Вещи предшественника ждут на отметке в карте."}
          </p>
          <label className="creation-name" htmlFor="stalker-name">Имя сталкера</label>
          <div className="creation-name-controls">
            <input
              id="stalker-name"
              name="stalker-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Введи имя или позывной"
              maxLength={24}
              required
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const names = STALKER_NAMES.filter(
                  (candidate) => candidate !== name.trim(),
                );
                setName(names[Math.floor(Math.random() * names.length)]);
              }}
            >
              Случайное имя
            </button>
          </div>
          <fieldset className="face-picker">
            <legend>Выбери лицо</legend>
            <div className="face-options">
              {FACES.map((description, index) => (
                <label key={description} className="face-option">
                  <input
                    type="radio"
                    name="face"
                    value={index}
                    checked={face === index}
                    onChange={() => setFace(index)}
                    aria-label={`Лицо ${index + 1}: ${description}`}
                  />
                  <span className="face-option-art"><Face face={index} /></span>
                  <span className="face-option-caption">{String(index + 1).padStart(2, "0")}<Check size={14} /></span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="creation-kit">
            Начнёшь в обычном свитере и брюках. Куртка и припасы уже в рюкзаке —
            снаряжение можно надеть после входа.
          </p>
          <button type="submit" className="primary-button full-width" disabled={!name.trim()}>
            Войти в Зону <ArrowRight size={17} />
          </button>
          <small className="creation-hint">
            Лицо останется с этим сталкером до конца его истории.
          </small>
        </div>
      </form>
    </Dialog>
  );
}

function RadioFeed({ game, full = false }: { game: Game; full?: boolean }) {
  return (
    <div className={`radio-feed ${full ? "full" : ""}`}>
      {(full ? game.log : game.log.slice(0, 3)).map((entry) => (
        <article key={entry.id} className={`message ${entry.kind}`}>
          <span className="message-mark">
            <Radio size={14} />
          </span>
          <div>
            <div className="message-meta">
              <strong>{entry.from}</strong>
              <time>{time(entry.at)}</time>
            </div>
            <p>{entry.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatMeter({
  game,
  stat,
  title,
  icon: Icon,
  inverse = false,
}: {
  game: Game;
  stat: Stat;
  title: string;
  icon: LucideIcon;
  inverse?: boolean;
}) {
  const value = Math.round(game[stat]);
  const maximum = stat === "health" ? maxHealth(game) : 100;
  const danger = inverse ? value > 40 : value < 30;
  return (
    <div className={`stat ${danger ? "danger" : ""} stat-${stat}`}>
      <div className="stat-top">
        <span>
          <Icon size={16} />
          {title}
        </span>
        <b>
          {value}
          <small> / {stat === "health" ? maxHealth(game) : 100}</small>
        </b>
      </div>
      <div
        className="stat-track"
        role="meter"
        aria-label={title}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={maximum}
      >
        <i style={{ width: `${(value / maximum) * 100}%` }} />
      </div>
    </div>
  );
}

function CarePanel({
  game,
  send,
  openBag,
}: {
  game: Game;
  send: Send;
  openBag: () => void;
}) {
  const away = game.dead;
  return (
    <section className="care-panel instrument">
      <div className="section-heading">
        <h2>
          <Activity size={17} />
          Состояние
        </h2>
        <span
          className={`status-text ${game.mistakes || game.health < 30 ? "danger-text" : ""}`}
        >
          {game.dead
            ? "Нет сигнала"
            : game.mistakes
              ? "Нужна помощь"
              : "Связь стабильна"}
        </span>
      </div>
      <div className="care-buttons">
        <button
          disabled={away || !game.inventory.food || game.food >= 99}
          onClick={() => send({ type: "use", item: "food" })}
        >
          <ItemIcon item="food" size={36} />
          <span>
            Накормить<small>Консервы · {game.inventory.food} шт.</small>
          </span>
        </button>
        <button
          disabled={away || !game.inventory.water || game.water >= 99}
          onClick={() => send({ type: "use", item: "water" })}
        >
          <ItemIcon item="water" size={36} />
          <span>
            Напоить<small>Вода · {game.inventory.water} шт.</small>
          </span>
        </button>
        <button
          disabled={
            away || !game.inventory.medkit || game.health >= maxHealth(game)
          }
          onClick={() => send({ type: "use", item: "medkit" })}
        >
          <ItemIcon item="medkit" size={36} />
          <span>
            Подлечить<small>Аптечки · {game.inventory.medkit} шт.</small>
          </span>
        </button>
        <button
          disabled={
            away ||
            !isSafe(game) ||
            (game.energy >= 95 &&
              game.lastTick - game.lastCare.rest < 3_600_000)
          }
          onClick={() => send({ type: "rest" })}
        >
          <Flame size={19} />
          <span>
            Отдохнуть<small>У костра · +45 сил</small>
          </span>
        </button>
      </div>
      {game.radiation > 0 && (
        <button
          className="radiation-action"
          disabled={away || !game.inventory.antirad}
          onClick={() => send({ type: "use", item: "antirad" })}
        >
          <Radiation size={16} /> Принять антирад · {game.inventory.antirad} шт.
        </button>
      )}
      <div className="care-footer">
        <span>
          <Clock3 size={13} />{" "}
          {away
            ? "Связь потеряна"
            : `До ошибки ухода ${remaining(careDeadline(game) - game.lastTick)}`}
        </span>
        <button className="text-button" onClick={openBag}>
          Припасы <ChevronRight size={13} />
        </button>
      </div>
    </section>
  );
}

function CharacterScene({ game, send }: { game: Game; send: Send }) {
  const [slot, setSlot] = useState<GearSlot | null>(null);
  return (
    <section
      className={`character-scene equipment-scene ${game.dead ? "scene-dead" : ""}`}
      aria-label="Экипировка сталкера"
    >
      <CharacterPortrait face={game.face ?? 0} suit={game.gear.suit} mask={game.gear.mask} location={game.location} />
      <div className="scene-top">
        <span>
          <MapPin size={14} />
          {game.raid ? "На маршруте" : LOCATIONS[game.location].name}
        </span>
        <span>{rank(game)}</span>
      </div>
      <div className="equipment-slots">
        {(Object.keys(GEAR_SLOTS) as GearSlot[]).map((key) => {
          const item = game.gear[key];
          return (
            <button
              key={key}
              className={`equipment-slot slot-${key} ${item ? "filled" : ""}`}
              disabled={game.dead}
              onClick={() => setSlot(key)}
              aria-label={`Слот: ${GEAR_SLOTS[key]}`}
            >
              <small>{GEAR_SLOTS[key]}</small>
              {item ? (
                <ItemIcon item={item} size={58} />
              ) : (
                <span className="empty-slot">+</span>
              )}
              <strong>{item ? ITEMS[item].name : "Не надето"}</strong>
            </button>
          );
        })}
      </div>
      <div className="portrait-caption">
        <span>{game.name}</span>
        <small>
          {game.dead
            ? "Связь потеряна"
            : game.raid?.phase === "choice"
              ? "Ждёт твоего решения"
              : game.raid
                ? "В пути · слушай эфир"
                : "На связи"}
        </small>
      </div>
      <div className="portrait-weight">
        <Backpack size={17} />
        <b>
          {packWeight(game.inventory).toFixed(1)} / {PACK_CAPACITY} кг
        </b>
        <meter
          min={0}
          max={PACK_CAPACITY}
          value={packWeight(game.inventory)}
          aria-label="Вес снаряжения"
        />
      </div>
      {slot && (
        <Dialog title={GEAR_SLOTS[slot]} close={() => setSlot(null)}>
          <p className="dialog-intro">
            Выбери предмет из рюкзака. Его защита действует только после
            экипировки.
          </p>
          <div className="gear-picker">
            {(Object.keys(GEAR) as ItemId[])
              .filter((item) => GEAR[item] === slot && game.inventory[item])
              .map((item) => (
                <button
                  key={item}
                  className="secondary-button"
                  onClick={() => {
                    send({ type: "equip", item });
                    setSlot(null);
                  }}
                >
                  <ItemIcon item={item} />
                  <span>
                    {ITEMS[item].name}
                    <small>{ITEMS[item].detail}</small>
                  </span>
                  {game.gear[slot] === item ? "Снять" : "Надеть"}
                </button>
              ))}
          </div>
          {!(Object.keys(GEAR) as ItemId[]).some(
            (item) => GEAR[item] === slot && game.inventory[item],
          ) && (
            <p>
              Подходящих предметов нет. Снаряжение можно купить у торговца в
              поселении.
            </p>
          )}
        </Dialog>
      )}
    </section>
  );
}

function RaidPanel({ game, send }: { game: Game; send: Send }) {
  const raid = game.raid;
  if (!raid) return null;
  const event = raidEvent(game);
  const progress = Math.min(
    100,
    Math.max(
      0,
      ((game.lastTick - raid.startedAt) / (raid.endsAt - raid.startedAt)) * 100,
    ),
  );
  return (
    <section
      className={`raid-panel instrument ${raid.phase === "choice" ? "awaiting-choice" : ""}`}
      aria-label="Текущая вылазка"
    >
      <div className="section-heading">
        <h2>
          <Radio size={18} />
          {raid.phase === "choice"
            ? "На связи " + game.name
            : "Вылазка: " + LOCATIONS[raid.location].name}
        </h2>
        <span className="countdown">
          {raid.phase === "choice" && raid.openedAt !== null
            ? "Связь установлена"
            : remaining(raid.endsAt - game.lastTick)}
        </span>
      </div>
      {raid.phase === "choice" ? (
        <>
          <h3>{event.title}</h3>
          <p className="event-description">{event.text}</p>
          {raid.openedAt === null ? (
            <button
              className="primary-button open-event"
              onClick={() => send({ type: "open-event" })}
            >
              Открыть сообщение
            </button>
          ) : (
            <div className="event-choices">
              {event.choices.map((choice, index) => (
                <button
                  key={choice.title}
                  disabled={game.rubles < (choice.cost ?? 0)}
                  onClick={() => send({ type: "choice", index })}
                >
                  <span className="choice-number">0{index + 1}</span>
                  <span>
                    <strong>{choice.title}</strong>
                    <small>{choice.detail}</small>
                    <em>
                      Базовый урон {choice.damage} · радиация +
                      {choice.radiation} · {FACTIONS[choice.faction].name}
                    </em>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          )}
          <p className="helper">
            <Info size={13} />
            {raid.openedAt === null
              ? "Открой в течение 15 минут. Без связи сталкер может быть ранен или потерять деньги и хабар."
              : "Сообщение открыто вовремя. Штраф за отсутствие связи отменён; путь продолжится после выбора."}
          </p>
        </>
      ) : (
        <>
          <div className="travel-status">
            <Footprints size={25} />
            <div>
              <h3>
                {raid.phase === "travel" ? "Идёт к точке" : "Продолжает путь"}
              </h3>
              <p>
                {raid.phase === "travel"
                  ? "Скоро он выйдет на связь. Следи за эфиром."
                  : `До прибытия: ${LOCATIONS[raid.location].name}. Припасы можно использовать в пути.`}
              </p>
            </div>
          </div>
          <div className="travel-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
        </>
      )}
    </section>
  );
}

function DeathPanel({
  game,
  send,
  openMap,
}: {
  game: Game;
  send: Send;
  openMap: () => void;
}) {
  const death = game.memorials.at(-1);
  return (
    <section className="death-panel">
      <Skull size={38} strokeWidth={1.2} />
      <div>
        <span className="eyebrow">Последний сигнал принят</span>
        <h2>{game.name} остался в Зоне</h2>
        <p>
          {death?.cause} Тело со всеми припасами, снаряжением и деньгами отмечено на карте:{" "}
          <strong>{LOCATIONS[death?.location ?? "camp"].name}</strong>.
        </p>
        <button
          className="primary-button"
          onClick={() => {
            send({ type: "next" });
            openMap();
          }}
        >
          Встретить нового сталкера <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

function FactionPanel({ game, send }: { game: Game; send: Send }) {
  const favorite = leader(game);
  return (
    <>
      <p className="dialog-intro">
        Каждое решение оставляет след. Помощь людям, исследование аномалий и
        погоня за прибылью сближают сталкера с разными группировками.
      </p>
      {game.faction !== null ? (
        <div className="notice">
          <Check size={18} />
          <span>
            Путь выбран:{" "}
            {game.faction === "loner"
              ? "Одиночка"
              : FACTIONS[game.faction].name}
            . {game.faction !== "loner" && FACTIONS[game.faction].benefit}.
          </span>
        </div>
      ) : (
        <div className="notice">
          <Clock3 size={18} />
          <span>
            {game.xp < 60
              ? `Предложения придут после трёх вылазок. Завершено: ${game.raids}/3.`
              : `До самостоятельного решения ${remaining((game.inviteAt ?? game.lastTick) - game.lastTick)}. Сейчас ближе: ${FACTIONS[favorite].name}.`}
          </span>
        </div>
      )}
      <div className="faction-list">
        {(Object.keys(FACTIONS) as Faction[]).map((id) => (
          <article key={id}>
            <div
              className="faction-emblem"
              style={{ color: FACTIONS[id].color }}
            >
              {id === "science" ? (
                <FlaskConical />
              ) : id === "freedom" ? (
                <Wind />
              ) : id === "duty" ? (
                <Shield />
              ) : (
                <Crosshair />
              )}
            </div>
            <div>
              <h3>
                {FACTIONS[id].name}
                <small>Близость {game.reputation[id]}</small>
              </h3>
              <p>{FACTIONS[id].motto}</p>
              <span>{FACTIONS[id].benefit}</span>
            </div>
            <button
              className="small-button"
              disabled={game.dead || game.xp < 60 || game.faction !== null}
              onClick={() => send({ type: "faction", faction: id })}
            >
              {game.faction === id ? "Выбрано" : "Вступить"}
            </button>
          </article>
        ))}
      </div>
      {game.xp >= 60 && game.faction === null && !game.dead && (
        <div className="dialog-actions">
          <button
            className="secondary-button"
            onClick={() => send({ type: "faction", faction: "loner" })}
          >
            Остаться одиночкой
          </button>
          <button
            className="primary-button"
            onClick={() => send({ type: "delegate" })}
          >
            Пусть решает сам
          </button>
        </div>
      )}
    </>
  );
}

function activeQuests(game: Game, location: LocationId) {
  const quests = game.graves.filter((grave) => grave.location === location)
    .map((grave) => `Найти тело: ${grave.name}`);
  if (game.raid?.location === location && game.raid.phase === "choice")
    quests.push(raidEvent(game).title);
  return quests;
}

function ZoneMap({ game, send, openTrader }: {
  game: Game;
  send: Send;
  openTrader: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<LocationId>("cordon");
  const location = LOCATIONS[selected];
  const locked = game.xp < location.xp;
  const here = selected === game.location && !game.raid;
  const from = game.raid?.startPosition ?? LOCATIONS[game.raid?.origin ?? game.location];
  const to = LOCATIONS[game.raid?.location ?? selected];
  const position = routePosition(game);
  const currentTarget = game.raid?.location === selected;
  const choosing = game.raid?.phase === "choice";
  let travelLabel = "Идти сюда";
  if (locked) travelLabel = `Нужно ${location.xp} опыта`;
  else if (currentTarget) travelLabel = "Уже идёт сюда";
  else if (game.raid) travelLabel = "Изменить маршрут";
  const unfit =
    game.health < 20 ||
    game.energy < 20 ||
    game.food < 10 ||
    game.water < 10 ||
    packWeight(game.inventory) > PACK_CAPACITY + 1e-8;
  const graves = game.graves.filter((grave) => grave.location === selected);
  return (
    <div className="map-layout">
      <div>
        <MapViewport>
          <svg
            className="map-route"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={`M${from.x} ${from.y} L${to.x} ${to.y}`}
              fill="none"
              stroke="#ebbb5e"
              strokeWidth=".65"
              strokeDasharray="1.5 1"
            />
          </svg>
          <div
            className="player-marker"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
            }}
            aria-label="Положение сталкера"
          >
            <Footprints size={20} />
          </div>
          <span className="map-label map-label-north">Северный периметр</span>
          <span className="map-label map-label-south">За линией блокпоста</span>
          <div className="map-compass">
            <Compass size={36} strokeWidth={1} />
            <span>С</span>
          </div>
          {(Object.keys(LOCATIONS) as LocationId[]).map((id) => (
            <button
              key={id}
              className={`map-point ${LOCATIONS[id].safe ? "safe-point" : ""} ${selected === id ? "selected" : ""} ${game.xp < LOCATIONS[id].xp ? "locked" : ""}`}
              style={{
                left: `${LOCATIONS[id].x}%`,
                top: `${LOCATIONS[id].y}%`,
              }}
              onClick={() => { setSelected(id); setDetailsOpen(true); }}
              aria-label={`Место: ${LOCATIONS[id].name}`}
              aria-pressed={selected === id}
            >
              <span className="map-point-symbol">
                {LOCATIONS[id].safe ? (
                  <House size={19} />
                ) : (
                  <Crosshair size={19} />
                )}
              </span>
              <span>{LOCATIONS[id].name}</span>
              {activeQuests(game, id).length > 0 && (
                <small className="quest-marker" aria-label={`Активных заданий: ${activeQuests(game, id).length}`}>
                  <BookOpen size={13} /> {activeQuests(game, id).length}
                </small>
              )}
            </button>
          ))}
          <div className="map-scale">
            <span />
            200 м
          </div>
          <div className="map-coordinate">Квадрат 04–12 · Кордон</div>
        </MapViewport>
        <div className="map-legend">
          <span>
            <i /> Доступный маршрут
          </span>
          <span>
            <i /> Требуется опыт
          </span>
          <span>
            <BookOpen size={13} /> Активные задания у точек
          </span>
        </div>
        <p className="helper">
          <Info size={14} />
          Нажми на точку, чтобы узнать о ней и выбрать маршрут. Масштабируй карту двумя пальцами и перетаскивай её. Цель можно менять в пути.
        </p>
      </div>
      {detailsOpen && (
        <Dialog title={location.name} close={() => setDetailsOpen(false)}>
          <section className="location-panel">
            <div className="section-heading">
              <h2>
                <MapPin size={17} />
                Маршрут
              </h2>
              <span>{location.safe ? "Поселение" : "Точка интереса"}</span>
            </div>
            <div className="location-detail">
              <span className="eyebrow">
                {location.safe ? "Безопасная территория" : "За периметром"}
              </span>
              <p>{location.detail}</p>
              {activeQuests(game, selected).length > 0 && (
                <div className="ground-loot">
                  <h3>Активные задания</h3>
                  <ul>{activeQuests(game, selected).map((quest, index) => <li key={index}>{quest}</li>)}</ul>
                </div>
              )}
              <dl>
                <div>
                  <dt>Опасность</dt>
                  <dd>{location.risk}</dd>
                </div>
                <div>
                  <dt>До точки</dt>
                  <dd>
                    {here
                      ? "Ты здесь"
                      : `${travelMinutes(position, selected)} мин.`}
                  </dd>
                </div>
                <div>
                  <dt>Возможная находка</dt>
                  <dd>
                    {location.safe
                      ? "Отдых и припасы"
                      : ITEMS[location.artifact].name}
                  </dd>
                </div>
              </dl>
              {!here && (
                <>
                  <button
                    className="primary-button full-width"
                    disabled={game.dead || choosing || currentTarget || locked || (!game.raid && unfit)}
                    onClick={() => { send({ type: "raid", location: selected }); setDetailsOpen(false); }}
                  >
                    <Footprints size={17} />
                    {travelLabel}
                    <ArrowRight size={16} />
                  </button>
                  {unfit && !game.dead && !game.raid && (
                    <p className="danger-text helper">
                      Перед выходом нужно ≥20 здоровья и сил, ≥10 сытости и воды.
                      Вес — не более 50 кг.
                    </p>
                  )}
                </>
              )}
              {choosing && <p className="helper">Сначала ответь на событие в пути, затем можно сменить маршрут.</p>}
              {here && location.safe && (
                <button className="primary-button full-width" disabled={game.dead} onClick={() => { setDetailsOpen(false); openTrader(); }}>
                  <ShoppingBag size={18} /> Торговец · {location.trader}
                </button>
              )}
              {here && !location.safe && (
                <>
                  <button
                    className="primary-button full-width"
                    disabled={
                      game.dead ||
                      game.energy < 10 ||
                      game.lastTick - (game.searchedAt[selected] ?? 0) < 30 * 60_000
                    }
                    onClick={() => send({ type: "explore" })}
                  >
                    <Package size={17} />
                    Осмотреть точку
                  </button>
                  <p className="helper">
                    Поиск тайника: −10 сил. Повторный поиск через 30 минут.
                    {game.searchedAt[selected] &&
                    game.lastTick - game.searchedAt[selected]! < 30 * 60_000
                      ? ` Осталось ${remaining(game.searchedAt[selected]! + 30 * 60_000 - game.lastTick)}.`
                      : ""}
                  </p>
                </>
              )}
              {game.ground[selected] &&
                Object.values(game.ground[selected]!).some(Boolean) && (
                  <div className="ground-loot">
                    <h3>Оставленная добыча</h3>
                    <p>
                      {(Object.keys(ITEMS) as ItemId[])
                        .filter((id) => game.ground[selected]![id])
                        .map(
                          (id) =>
                            `${ITEMS[id].name} ×${game.ground[selected]![id]}`,
                        )
                        .join(", ")}
                    </p>
                    <button
                      className="secondary-button"
                      disabled={
                        !here ||
                        game.dead ||
                        packWeight(game.inventory) >= PACK_CAPACITY
                      }
                      onClick={() => send({ type: "pickup" })}
                    >
                      Забрать по вместимости
                    </button>
                  </div>
                )}
              {graves.map((grave) => (
                <div className="grave-card" key={grave.id}>
                  <Skull size={24} />
                  <div>
                    <h3>Тело: {grave.name}</h3>
                    <p>
                      {Object.values(grave.inventory).reduce((a, b) => a + b, 0)}{" "}
                      предметов · {grave.rubles} ₽
                    </p>
                    <button
                      className="secondary-button"
                      disabled={game.dead || choosing || currentTarget || (!game.raid && !here && unfit)}
                      onClick={() => {
                        send(
                          here
                            ? { type: "recover", graveId: grave.id }
                            : {
                                type: "raid",
                                location: selected,
                                graveId: grave.id,
                              },
                        );
                        setDetailsOpen(false);
                      }}
                    >
                      {here ? "Забрать хабар по вместимости" : "Отправиться к телу"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Dialog>
      )}
    </div>
  );
}

function InventoryPanel({ game, send }: { game: Game; send: Send }) {
  const [filter, setFilter] = useState<"all" | "supply" | "artifact" | "gear">(
    "all",
  );
  const keys = (Object.keys(ITEMS) as ItemId[]).filter(
    (key) =>
      game.inventory[key] > 0 &&
      (filter === "all" || ITEMS[key].kind === filter),
  );
  const away = game.dead;
  const unusable = (item: ItemId) =>
    (item === "food" && game.food >= 99) ||
    (item === "water" && game.water >= 99) ||
    (item === "medkit" && game.health >= maxHealth(game)) ||
    (item === "antirad" && game.radiation <= 0);
  return (
    <div className="inventory-layout">
      <section>
        <div className="inventory-top">
          <div className="filters" aria-label="Категория предметов">
            {(
              [
                ["all", "Всё"],
                ["supply", "Припасы"],
                ["artifact", "Артефакты"],
                ["gear", "Снаряжение"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className={filter === id ? "active" : ""}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="pack-weight">
            <Backpack size={15} />
            {packWeight(game.inventory).toFixed(1)} / {PACK_CAPACITY} кг
          </span>
        </div>
        <div className="item-grid">
          {keys.map((key) => (
            <article
              key={key}
              className={`item-card ${ITEMS[key].kind} ${isEquipped(game, key) ? "equipped" : ""}`}
            >
              <div className="item-visual">
                <ItemIcon item={key} size={96} />
                <span>×{game.inventory[key]}</span>
                {isEquipped(game, key) && <b>Надето</b>}
              </div>
              <div className="item-body">
                <h3>{ITEMS[key].name}</h3>
                <p>{ITEMS[key].detail}</p>
                <div className="item-actions">
                  {ITEMS[key].kind === "supply" && (
                    <button
                      className="small-button"
                      disabled={away || unusable(key)}
                      onClick={() => send({ type: "use", item: key })}
                    >
                      Использовать
                    </button>
                  )}
                  {ITEMS[key].kind === "artifact" && (
                    <button
                      className="small-button"
                      disabled={away}
                      onClick={() => send({ type: "equip", item: key })}
                    >
                      {game.equipped === key ? "Снять с пояса" : "На пояс"}
                    </button>
                  )}
                  {GEAR[key] && (
                    <button
                      className="small-button"
                      disabled={away}
                      onClick={() => send({ type: "equip", item: key })}
                    >
                      {isEquipped(game, key) ? "Снять" : "Надеть"}
                    </button>
                  )}
                  <button
                    className="text-button"
                    disabled={away || isEquipped(game, key)}
                    onClick={() => send({ type: "drop", item: key })}
                  >
                    Оставить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!keys.length && (
          <div className="empty-state">
            <Package size={38} />
            <h3>Пока пусто</h3>
            <p>
              {filter === "artifact"
                ? "Первый артефакт ждёт в низине на Кордоне. Отправь сталкера в вылазку."
                : "Припасы можно купить у торговца или найти в Зоне."}
            </p>
          </div>
        )}
        <div className="artifact-note">
          <Radiation size={19} />
          <p>
            На поясе работает один артефакт. Остальные лежат в защитном
            контейнере. Польза и побочный эффект действуют, даже когда КПК
            закрыт.
          </p>
        </div>
      </section>
    </div>
  );
}

function TraderPanel({ game, send }: { game: Game; send: Send }) {
  const away = game.dead;
  return (
    <aside className="trader instrument">
      <div className="section-heading">
        <h2>
          <ShoppingBag size={17} />
          {LOCATIONS[game.location].trader ?? "Торговец"}
        </h2>
        <span>Торговец</span>
      </div>
      <div className="trader-quote">
        {isSafe(game)
          ? `«Хабар принёс? Давай посмотрим.» ${LOCATIONS[game.location].name}`
          : "Нужно добраться до безопасного поселения."}
      </div>
      <div className="trader-balance">
        <Wallet size={17} />
        <span>В кармане</span>
        <b>{game.rubles.toLocaleString("ru")} ₽</b>
      </div>
      {(
        [
          "food",
          "water",
          "medkit",
          "antirad",
          "armor",
          "mask",
          "rifle",
        ] as ItemId[]
      ).map((key) => (
        <div key={key} className="shop-row">
          <ItemIcon item={key} />
          <div>
            <strong>{ITEMS[key].name}</strong>
            <small>
              {key === "armor" ? "Защита от урона −35%" : ITEMS[key].detail}
            </small>
          </div>
          <button
            aria-label={`Купить ${ITEMS[key].name} за ${ITEMS[key].price} рублей`}
            disabled={
              away ||
              !isSafe(game) ||
              !canCarry(game, key) ||
              game.rubles < ITEMS[key].price ||
              (ITEMS[key].kind === "gear" && game.inventory[key] > 0)
            }
            onClick={() => send({ type: "buy", item: key })}
          >
            {key === "armor" && game.inventory.armor ? (
              <Check size={17} />
            ) : (
              `${ITEMS[key].price} ₽`
            )}
          </button>
        </div>
      ))}
      <div className="section-heading"><h2>Продать из рюкзака</h2></div>
      {(Object.keys(ITEMS) as ItemId[]).filter((key) => game.inventory[key] > 0).map((key) => (
        <div key={key} className="shop-row">
          <ItemIcon item={key} />
          <div><strong>{ITEMS[key].name} ×{game.inventory[key]}</strong><small>{isEquipped(game, key) ? "Сначала сними предмет" : "Из рюкзака"}</small></div>
          <button disabled={away || !isSafe(game) || isEquipped(game, key)} onClick={() => send({ type: "sell", item: key })} aria-label={`Продать ${ITEMS[key].name}`}>
            {Math.round(ITEMS[key].price * 0.7)} ₽
          </button>
        </div>
      ))}
      <p className="helper trader-helper">
        {!isSafe(game) || away
          ? "Торговля доступна в безопасном поселении."
          : "Предел переносимого веса — 50 кг, включая надетые вещи. Перед продажей сними предмет."}
      </p>
    </aside>
  );
}

export default function App() {
  const { game, send, warning } = useGame();
  const [tab, setTab] = useState<Tab>("stalker");
  const [modal, setModal] = useState<
    "help" | "settings" | "factions" | "install" | "trader" | null
  >(null);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [sound, setSound] = useState(false);
  const [swError, setSwError] = useState("");
  const [toast, setToast] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(
    "Notification" in window ? Notification.permission : "unsupported",
  );
  const notified = useRef<number | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const lastLog = useRef(game.log[0]?.id);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      setSwError(
        "Офлайн-копия не загрузилась. Проверь сеть и открой КПК заново.",
      ),
  });

  useEffect(() => {
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    const installed = () => {
      setInstall(null);
      setToast("КПК установлен. Удачи в Зоне.");
    };
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener("beforeinstallprompt", handleInstall);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstall);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
    };
  }, []);

  useEffect(() => {
    if (game.log[0]?.id === lastLog.current) return;
    lastLog.current = game.log[0]?.id;
    if (sound && audio.current?.state === "running") {
      const context = audio.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 640;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
    }
  }, [game.log, sound]);

  useEffect(() => {
    if (game.dead) setModal(null);
  }, [game.dead]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);

  useEffect(() => {
    const openEvent = (eventAt: number) => {
      send({ type: "open-event", eventAt });
      setTab("stalker");
      setModal(null);
    };
    const url = new URL(window.location.href);
    if (url.searchParams.has("event")) {
      const eventAt = Number(url.searchParams.get("event"));
      if (Number.isFinite(eventAt)) openEvent(eventAt);
      url.searchParams.delete("event");
      window.history.replaceState(null, "", url);
    }
    const onMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "open-event" &&
        Number.isFinite(event.data.eventAt)
      )
        openEvent(event.data.eventAt);
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, [send]);

  useEffect(() => {
    const raid = game.raid;
    const pending = raid?.phase === "choice" && raid.openedAt === null;
    document.title = pending
      ? `(!) ${raidEvent(game).title} — ЗОНА`
      : "ЗОНА — персональный КПК";
    if (!pending) {
      navigator.serviceWorker
        ?.getRegistration()
        .then(async (registration) => {
          const notifications = await registration?.getNotifications({
            tag: "zone-event",
          });
          notifications?.forEach((notification) => notification.close());
        })
        .catch(() => {});
      return;
    }
    if (
      notificationPermission !== "granted" ||
      notified.current === raid.startedAt
    )
      return;
    const title = raidEvent(game).title;
    const options = {
      body: "Сталкер ждёт связи. Открой сообщение за 15 минут, чтобы избежать последствий.",
      tag: "zone-event",
      icon: `${import.meta.env.BASE_URL}icon-192.png`,
      data: { eventAt: raid.startedAt },
    };
    let fallback: Notification | undefined;
    let disposed = false;
    (async () => {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (disposed) return;
      notified.current = raid.startedAt;
      if (registration) await registration.showNotification(title, options);
      else {
        fallback = new Notification(title, options);
        fallback.onclick = () => {
          window.focus();
          send({ type: "open-event", eventAt: raid.startedAt });
          setTab("stalker");
          setModal(null);
          fallback?.close();
        };
      }
    })().catch(() =>
      setToast("Системное уведомление недоступно. Сообщение ждёт в КПК."),
    );
    return () => {
      disposed = true;
      fallback?.close();
    };
  }, [
    game.raid?.phase,
    game.raid?.startedAt,
    game.raid?.openedAt,
    notificationPermission,
    send,
  ]);

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setToast(
        permission === "granted"
          ? "Уведомления включены для открытой игры."
          : "Сообщения будут появляться внутри КПК. Разрешение можно изменить в настройках браузера.",
      );
    } catch {
      setToast(
        "Этот браузер не разрешил системные уведомления. Сообщения доступны в КПК.",
      );
    }
  };

  const act: Send = (action) => {
    const next = send(action);
    if (action.type === "raid") setTab("stalker");
    if (
      ["buy", "sell", "recover", "pickup"].includes(action.type) &&
      next.log[0]?.id !== game.log[0]?.id
    )
      setToast(next.log[0].text);
  };
  const installApp = async () => {
    if (!install) {
      setModal("install");
      return;
    }
    try {
      await install.prompt();
      await install.userChoice;
      setInstall(null);
    } catch {
      setModal("install");
    }
  };
  const toggleSound = async () => {
    if (!sound) {
      try {
        audio.current ??= new AudioContext();
        await audio.current.resume();
      } catch {
        setToast("Звук недоступен в этом браузере.");
        return;
      }
    }
    setSound(!sound);
  };
  const exportSave = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(game, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `zone-${game.name}-${game.generation}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const factionName =
    game.faction && game.faction !== "loner"
      ? FACTIONS[game.faction].name
      : "Одиночка";
  const subtitles: Record<Tab, string> = {
    stalker: "У каждого в Зоне должен быть кто-то на связи.",
    map: "Проложи маршрут. Оцени риск. Вернись живым.",
    bag: "Всё, что отделяет тебя от ещё одной плохой истории.",
    journal: "Следы тех, кто прошёл через Зону.",
  };

  return (
    <main className="workbench">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="device">
        <i className="screw screw-tl" aria-hidden="true" />
        <i className="screw screw-tr" aria-hidden="true" />
        <i className="screw screw-bl" aria-hidden="true" />
        <i className="screw screw-br" aria-hidden="true" />
        <header className="device-header">
          <div className="brand">
            <div className="brand-symbol">
              <Radiation size={34} strokeWidth={1.3} />
            </div>
            <div>
              <span className="brand-name">ЗОНА</span>
              <span className="brand-subtitle">Персональный КПК</span>
            </div>
            <span className="model-badge">ПДА–3М</span>
          </div>
          <div className="header-tools">
            <span className="connection">
              <Signal size={16} />
              <span>{online ? "Сеть сталкеров" : "Локальный режим"}</span>
            </span>
            <span className="device-time">{time(game.lastTick)}</span>
            <button
              className="install-button"
              aria-label="Установить КПК"
              onClick={installApp}
            >
              <ArrowDownToLine size={16} />
              <span>Установить КПК</span>
            </button>
            <button
              className="icon-button"
              aria-label="Настройки КПК"
              onClick={() => setModal("settings")}
            >
              <Settings2 size={19} />
            </button>
          </div>
        </header>
        <div className="screen">
          <nav className="navigation" aria-label="Разделы КПК">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => setTab(id)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {id === "bag" && (
                  <small>
                    {Object.values(game.inventory).reduce((a, b) => a + b, 0)}
                  </small>
                )}
                {id === "map" && game.graves.length > 0 && (
                  <i className="nav-dot" />
                )}
              </button>
            ))}
            <span className="nav-status">
              <i />
              {game.dead ? "Сигнал потерян" : "Терминал активен"}
            </span>
          </nav>
          <div className="screen-content">
            {(tab === "stalker" || tab === "map") && (
              <div className="stats vitals-strip" aria-label="Потребности сталкера">
                <StatMeter
                  game={game}
                  stat="health"
                  title="Здоровье"
                  icon={HeartPulse}
                />
                <StatMeter game={game} stat="food" title="Сытость" icon={Utensils} />
                <StatMeter game={game} stat="water" title="Вода" icon={Droplets} />
                <StatMeter game={game} stat="energy" title="Силы" icon={Zap} />
                <StatMeter
                  game={game}
                  stat="radiation"
                  title="Радиация"
                  icon={Radiation}
                  inverse
                />
              </div>
            )}
            {(warning || swError) && (
              <div className="notice warning" role="alert">
                <Info size={18} />
                <span>{warning || swError}</span>
              </div>
            )}
            {needRefresh && (
              <div className="notice">
                <Download size={18} />
                <span>Доступна новая версия КПК. Прогресс сохранён.</span>
                <button
                  className="small-button"
                  onClick={() => updateServiceWorker(true)}
                >
                  Обновить
                </button>
              </div>
            )}
            {game.raid?.phase === "choice" && game.raid.openedAt === null && (
              <button
                className="event-alert"
                onClick={() => {
                  act({ type: "open-event" });
                  setTab("stalker");
                  setModal(null);
                }}
              >
                <Radio size={25} />
                <span>
                  <strong>{raidEvent(game).title}</strong>
                  <small>
                    Открыть сообщение · до последствий{" "}
                    {remaining(game.raid.endsAt - game.lastTick)}
                  </small>
                </span>
                <ChevronRight size={22} />
              </button>
            )}
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  {tab === "stalker"
                    ? `Личное дело № ${String(game.generation).padStart(3, "0")}`
                    : "Персональный терминал"}
                </div>
                <h1>
                  {tab === "stalker" ? (
                    <>
                      {game.name}
                      <span className="rank-tag">{rank(game)}</span>
                    </>
                  ) : (
                    tabs.find((item) => item.id === tab)?.label
                  )}
                </h1>
                <p>{subtitles[tab]}</p>
              </div>
              <div className="day-counter">
                <Sun size={19} />
                <div>
                  <span>День в Зоне</span>
                  <strong>
                    {String(
                      Math.floor((game.lastTick - game.startedAt) / DAY) + 1,
                    ).padStart(2, "0")}
                  </strong>
                </div>
                <button
                  className="icon-button"
                  aria-label="Как играть"
                  onClick={() => setModal("help")}
                >
                  <CircleHelp size={19} />
                </button>
              </div>
            </div>
            {game.dead && (
              <DeathPanel
                game={game}
                send={act}
                openMap={() => setTab("map")}
              />
            )}
            {tab === "stalker" && (
              <>
                {game.raid && <RaidPanel game={game} send={act} />}
                <div className="stalker-layout">
                  <div className="character-column">
                    <CharacterScene game={game} send={act} />
                    {isSafe(game) && !game.dead && (
                      <button className="secondary-button full-width settlement-trade" onClick={() => setModal("trader")}>
                        <ShoppingBag size={18} /> Торговец · {LOCATIONS[game.location].trader}
                      </button>
                    )}
                    <button
                      className="secondary-button full-width end-life danger-text"
                      disabled={game.dead || game.face === null}
                      onClick={() => {
                        if (window.confirm(`Завершить жизнь сталкера «${game.name}»? Тело со всеми припасами, снаряжением и деньгами останется на карте для следующего персонажа.`)) {
                          act({ type: "suicide" });
                        }
                      }}
                    >
                      <Skull size={18} /> Самоубийство
                    </button>
                    <div className="identity-strip">
                      <button
                        className="faction-link"
                        onClick={() => setModal("factions")}
                      >
                        <Shield size={20} />
                        <span>
                          <small>Группировка</small>
                          <b>{factionName}</b>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                      <div className="experience">
                        <span>
                          Опыт{" "}
                          <b>
                            {game.xp} /{" "}
                            {game.xp >= 120
                              ? game.xp
                              : game.xp >= 40
                                ? 120
                                : 40}
                          </b>
                        </span>
                        <div>
                          <i
                            style={{
                              width: `${Math.min(100, (game.xp / (game.xp >= 40 ? 120 : 40)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="identity-money">
                        <small>В кармане</small>
                        <b>
                          {game.rubles.toLocaleString("ru")} <span>₽</span>
                        </b>
                      </div>
                    </div>
                  </div>
                  <CarePanel
                    game={game}
                    send={act}
                    openBag={() => setTab("bag")}
                  />
                </div>
                {game.inviteAt && !game.dead && (
                  <button
                    className="invitation-banner"
                    onClick={() => setModal("factions")}
                  >
                    <Shield size={22} />
                    <span>
                      <strong>У Зоны появились на тебя планы</strong>
                      <small>
                        Группировки предлагают выбрать сторону. До решения героя{" "}
                        {remaining(game.inviteAt - game.lastTick)}.
                      </small>
                    </span>
                    <ChevronRight size={20} />
                  </button>
                )}
                <div className="lower-grid">
                  <div>
                    <section className="route-preview instrument">
                      <div className="section-heading">
                        <h2>
                          <Compass size={17} />
                          За периметр
                        </h2>
                        <span>Ближайшая вылазка</span>
                      </div>
                      <div className="route-body">
                        <div className="route-symbol">
                          <MapIcon size={42} strokeWidth={1} />
                          <span className="coordinate">КОРДОН / 04–12</span>
                        </div>
                        <div>
                          <h3>
                            {game.graves.length
                              ? "Зона хранит старые следы"
                              : "Сигнал из низины"}
                          </h3>
                          <p>
                            {game.graves.length
                              ? "На карте остались тела погибших со всеми припасами. Их вещи могут помочь новому сталкеру."
                              : "Детектор что-то ловит за насыпью. Похоже на артефакт. Стоит проверить."}
                          </p>
                          <div className="route-details">
                            <span>
                              <Clock3 size={13} />
                              {travelMinutes(game.location, "cordon")} мин. до
                              точки
                            </span>
                            <span>
                              <Shield size={13} />
                              Низкий риск
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="primary-button"
                        disabled={game.dead}
                        onClick={() => setTab("map")}
                      >
                        Открыть карту <ArrowRight size={17} />
                      </button>
                    </section>
                  </div>
                  <section className="radio-panel instrument">
                    <div className="section-heading">
                      <h2>
                        <Radio size={17} />
                        Эфир Зоны
                      </h2>
                      <button
                        className="text-button"
                        onClick={() => setTab("journal")}
                      >
                        Все сообщения <ChevronRight size={13} />
                      </button>
                    </div>
                    <RadioFeed game={game} />
                  </section>
                </div>
                <div className="field-note">
                  <Info size={14} />
                  <p>
                    {game.equipped
                      ? `На поясе «${ITEMS[game.equipped].name}»: ${ITEMS[game.equipped].detail.toLowerCase()}.`
                      : "Он живёт, пока тебя нет. Заглядывай хотя бы раз в сутки: накорми, напои и дай отдохнуть."}
                  </p>
                  <span>
                    Ошибки ухода{" "}
                    <b className={game.mistakes ? "danger-text" : ""}>
                      {game.mistakes}/3
                    </b>
                  </span>
                </div>
              </>
            )}
            {tab === "map" && (
              <>
                <ZoneMap game={game} send={act} openTrader={() => setModal("trader")} />
                {game.raid && <RaidPanel game={game} send={act} />}
              </>
            )}
            {tab === "bag" && <InventoryPanel game={game} send={act} />}
            {tab === "journal" && (
              <div className="journal-layout">
                <section className="instrument">
                  <div className="section-heading">
                    <h2>
                      <Radio size={17} />
                      Принятые сообщения
                    </h2>
                    <span>{game.log.length} записей</span>
                  </div>
                  <RadioFeed game={game} full />
                </section>
                <aside className="instrument memorial">
                  <div className="section-heading">
                    <h2>
                      <BookOpen size={17} />
                      Память Зоны
                    </h2>
                  </div>
                  <div className="memorial-content">
                    {!game.memorials.length ? (
                      <>
                        <Flame size={33} strokeWidth={1} />
                        <h3>Пока все живы</h3>
                        <p>
                          Здесь останутся имена погибших. Их тела с припасами будут отмечены
                          на карте.
                        </p>
                      </>
                    ) : (
                      game.memorials
                        .slice()
                        .reverse()
                        .map((person) => (
                          <article key={person.generation}>
                            <Skull size={24} />
                            <h3>
                              {person.name} <small>№ {person.generation}</small>
                            </h3>
                            <p>{person.cause}</p>
                            <span>
                              {LOCATIONS[person.location].name} · {person.xp}{" "}
                              опыта
                            </span>
                          </article>
                        ))
                    )}
                  </div>
                </aside>
              </div>
            )}
          </div>
          <footer className="screen-footer">
            <span>
              <i className={warning ? "error-led" : ""} />
              {warning
                ? "Проблема с сохранением"
                : "Прогресс сохранён на этом устройстве"}
            </span>
            <span>
              {offlineReady ? "Офлайн готов" : "КПК v.0.1"}
              <span className="footer-divider">/</span>regkriks-star
            </span>
          </footer>
        </div>
        <div className="device-bottom">
          <span>ПОЛЕВОЙ ТЕРМИНАЛ · СЕРИЯ 031</span>
          <div className="speaker" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <span>
            <BatteryMedium size={17} /> РЕЗЕРВ ПИТАНИЯ
          </span>
        </div>
      </div>
      <p className="outside-caption">
        Зона не отпускает. Но иногда даёт передохнуть.
      </p>
      {toast && <Toast message={toast} />}
      <div className="sr-only" role="status" aria-live="polite">
        {game.log[0]?.text}
      </div>
      {game.face === null && <CharacterCreator key={game.generation} game={game} create={(face, name) => {
        act({ type: "create-character", face, name });
        setTab("stalker");
        setModal(null);
      }} />}
      {modal && game.face !== null && (
        <Dialog
          title={
            modal === "trader"
              ? `Торговец · ${LOCATIONS[game.location].trader}`
              : modal === "settings"
              ? "Настройки КПК"
              : modal === "factions"
                ? "Свой путь в Зоне"
                : modal === "install"
                  ? "Установить КПК"
                  : "Связь — это тоже забота"
          }
          close={() => setModal(null)}
        >
          {modal === "trader" && <TraderPanel game={game} send={act} />}
          {modal === "factions" && <FactionPanel game={game} send={act} />}
          {modal === "install" && (
            <>
              <p className="dialog-intro">
                КПК можно добавить на главный экран и открывать как отдельную
                игру.
              </p>
              <div className="guide-step">
                <b>Android / Chrome</b>
                <p>
                  Меню браузера → «Установить приложение» или «Добавить на
                  главный экран».
                </p>
              </div>
              <div className="guide-step">
                <b>iPhone / iPad</b>
                <p>В Safari нажми «Поделиться» → «На экран Домой».</p>
              </div>
              <div className="guide-step">
                <b>Компьютер</b>
                <p>
                  В Chrome или Edge используй значок установки в адресной
                  строке.
                </p>
              </div>
              <p className="helper">
                Офлайн доступен после первой полной загрузки. Прогресс хранится
                в этом браузере; на другой телефон автоматически не переносится.
              </p>
            </>
          )}
          {modal === "help" && (
            <>
              <p className="dialog-intro">
                Ты — тот, кто остаётся на связи. У сталкера своя жизнь, но твои
                решения помогают ему вернуться.
              </p>
              <div className="guide-step">
                <b>01 / Подготовь</b>
                <p>
                  Дай еду, воду и отдых на главном экране. Купи припасы у
                  торговца в безопасном поселении. Надень костюм, противогаз и
                  оружие через слоты персонажа. Рюкзак вмещает 50 кг.
                </p>
              </div>
              <div className="guide-step">
                <b>02 / Отправь за хабаром</b>
                <p>
                  Выбери точку на карте. В пути возможно событие: открой
                  уведомление за 15 минут, затем выбери действие. Без связи
                  будут негативные последствия.
                </p>
              </div>
              <div className="guide-step">
                <b>03 / Разбери находки</b>
                <p>
                  Продай артефакт или надень на пояс: «Кровь камня» лечит, но
                  усиливает голод. После двух вылазок получишь ранг и откроешь
                  Свалку.
                </p>
              </div>
              <div className="guide-step">
                <b>04 / Оставайся на связи</b>
                <p>
                  Через 24 часа без еды, воды или отдыха — первый штраф, через
                  48 — второй, через 72 — смерть. Уход снимает штрафы; здоровье
                  восстанавливается отдельно. Вылезать с низким здоровьем тоже
                  опасно.
                </p>
              </div>
              <div className="guide-step">
                <b>05 / Выбери свой путь</b>
                <p>
                  После трёх вылазок группировки предложат вступить. Выбери
                  любую или останься одиночкой. Без ответа через 5 минут герой
                  присоединится к близкой ему фракции.
                </p>
              </div>
              <p className="helper">
                <Backpack size={15} />
                После смерти тело со всем хабаром остаётся на карте. Новый
                сталкер может вернуть его. Уведомлений при закрытой игре пока
                нет.
              </p>
            </>
          )}
          {modal === "settings" && (
            <>
              <button
                className="secondary-button help-button"
                onClick={() => setModal("help")}
              >
                <CircleHelp size={17} />
                Как играть
              </button>
              <div className="settings-row">
                <div>
                  <h3>Сигналы рации</h3>
                  <p>Короткий звук при новом сообщении</p>
                </div>
                <button className="secondary-button" onClick={toggleSound}>
                  {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
                  {sound ? "Включены" : "Выключены"}
                </button>
              </div>
              <div className="settings-row">
                <div>
                  <h3>Уведомления о событиях</h3>
                  <p>
                    Работают, пока игра открыта. При закрытом или
                    приостановленном браузере последствия рассчитываются при
                    возвращении.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  disabled={
                    notificationPermission === "unsupported" ||
                    notificationPermission === "granted"
                  }
                  onClick={enableNotifications}
                >
                  {notificationPermission === "granted"
                    ? "Включены"
                    : notificationPermission === "unsupported"
                      ? "Недоступны"
                      : "Включить уведомления"}
                </button>
              </div>
              <div className="settings-row">
                <div>
                  <h3>Копия личного дела</h3>
                  <p>Скачать текущий прогресс в JSON</p>
                </div>
                <button className="secondary-button" onClick={exportSave}>
                  <Download size={17} />
                  Скачать
                </button>
              </div>
              <section className="time-controls">
                <h3>
                  <Clock3 size={19} />
                  Проверка времени
                </h3>
                <p>
                  Перемотка влияет на настоящее сохранение. +24 часа добавят
                  ошибку ухода, если не пополнять еду, воду и отдых. Третья
                  ошибка смертельна.
                </p>
                <div>
                  <button
                    className="secondary-button"
                    disabled={game.dead}
                    onClick={() => act({ type: "skip", ms: 60_000 })}
                  >
                    +1 минута
                  </button>
                  <button
                    className="secondary-button"
                    disabled={game.dead}
                    onClick={() => act({ type: "skip", ms: 15 * 60_000 })}
                  >
                    +15 минут
                  </button>
                  <button
                    className="secondary-button"
                    disabled={game.dead}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Перемотать на 24 часа без ухода? Это может привести к ошибке ухода и смерти сталкера.",
                        )
                      ) {
                        act({ type: "skip", ms: DAY });
                      }
                    }}
                  >
                    +24 часа без ухода
                  </button>
                </div>
                <span>
                  Ошибки ухода: {game.mistakes}/3.{" "}
                  {game.dead
                    ? "Сталкер погиб."
                    : `До следующей: ${remaining(careDeadline(game) - game.lastTick)}.`}
                </span>
              </section>
              <p className="helper">
                React · TypeScript · PWA. Прототип 0.1. Прогресс сохраняется
                локально. Когда игра закрыта, события рассчитываются при
                следующем открытии.
              </p>
            </>
          )}
        </Dialog>
      )}
    </main>
  );
}
