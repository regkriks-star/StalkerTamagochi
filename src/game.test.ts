import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createGame,
  FACES,
  DAY,
  EVENT_TIMEOUT,
  PACK_CAPACITY,
  packWeight,
  emptyInventory,
  ITEMS,
  maxHealth,
  parseSave,
  reduceGame,
  routePosition,
  LOCATIONS,
  type Action,
  type Game,
  type ItemId,
} from "./game.ts";

const NOW = 1_800_000_000_000;
const startedGame = (now: number) =>
  reduceGame(createGame(now), { type: "create-character", face: 0 }, now);
const step = (game: Game, action: Action) => reduceGame(game, action, NOW);
const skip = (game: Game, ms: number) => step(game, { type: "skip", ms });

test("character creation waits for confirmation, validates available faces and starts the care clock then", () => {
  const draft = createGame(NOW);
  assert.equal(draft.face, null);
  assert.equal(draft.gear.suit, null);
  assert.equal(draft.gear.mask, null);
  assert.equal(draft.inventory.jacket, 1);
  assert.deepEqual(parseSave(JSON.stringify(draft)), draft);
  for (const action of [
    { type: "tick" }, { type: "skip", ms: 4 * DAY },
    { type: "equip", item: "jacket" }, { type: "raid", location: "cordon" },
  ] as Action[]) {
    assert.deepEqual(reduceGame(draft, action, NOW + 4 * DAY), draft);
  }
  for (const face of [-1, FACES.length, 1.5, NaN]) {
    assert.deepEqual(step(draft, { type: "create-character", face }), draft);
  }
  for (let face = 0; face < FACES.length; face++) {
    const created = reduceGame(draft, { type: "create-character", face }, NOW + 4 * DAY);
    assert.equal(created.face, face);
    assert.equal(created.health, draft.health);
    assert.equal(created.startedAt, NOW + 4 * DAY);
    assert.equal(created.lastCare.food, created.lastTick);
    assert.deepEqual(parseSave(JSON.stringify(created)), created);
    assert.equal(step(created, { type: "create-character", face: (face + 1) % FACES.length }).face, face);
    assert.equal(reduceGame(created, { type: "tick" }, NOW + 5 * DAY).mistakes, 1);
  }
});

test("successor requires a new face while keeping graves, history and world loot", () => {
  const original = startedGame(NOW);
  original.ground.dump = { ...emptyInventory(), food: 2 };
  const dead = skip(original, 3 * DAY);
  const draft = step(dead, { type: "next" });
  assert.equal(draft.face, null);
  assert.equal(draft.generation, 2);
  assert.equal(draft.gear.suit, null);
  assert.equal(draft.gear.mask, null);
  assert.deepEqual(draft.graves, dead.graves);
  assert.deepEqual(draft.memorials, dead.memorials);
  assert.deepEqual(draft.ground, dead.ground);
  const reloaded = parseSave(JSON.stringify(draft))!;
  assert.deepEqual(reduceGame(reloaded, { type: "tick" }, NOW + 8 * DAY), draft);
  const created = reduceGame(reloaded, { type: "create-character", face: 5 }, NOW + 8 * DAY);
  assert.equal(created.face, 5);
  assert.equal(created.dead, false);
  assert.equal(created.lastCare.water, created.lastTick);
  assert.deepEqual(created.graves, dead.graves);
});

test("version 2 saves keep progress and gear; corrupt appearance data is rejected", () => {
  const previous = step(startedGame(NOW), { type: "equip", item: "jacket" });
  const { face: _face, ...legacy } = { ...previous, version: 2 };
  const migrated = parseSave(JSON.stringify(legacy))!;
  assert.deepEqual(migrated, { ...previous, face: 0 });
  for (const face of [-1, FACES.length, 0.5, "0", undefined]) {
    assert.equal(parseSave(JSON.stringify({ ...previous, face })), null);
  }
  assert.equal(parseSave(JSON.stringify({ ...previous, face: null, dead: true })), null);
});

function encounter(game: Game, event = 1) {
  game.seed = 1;
  let next = step(game, {
    type: "raid",
    location: game.location === "cordon" ? "camp" : "cordon",
  });
  assert.ok(next.raid);
  next.raid!.event = event;
  next = skip(next, next.raid!.endsAt - next.lastTick);
  assert.equal(next.raid?.phase, "choice");
  return next;
}
function raid(game: Game, choice = 0) {
  let next = encounter(game);
  next = step(next, { type: "open-event" });
  next = step(next, { type: "choice", index: choice });
  return skip(next, next.raid!.endsAt - next.lastTick);
}

test("one and two missed care deadlines are survivable; the third kills, at the correct timestamp", () => {
  const fresh = startedGame(NOW);
  const first = skip(fresh, DAY);
  assert.equal(first.mistakes, 1);
  assert.equal(first.dead, false);
  assert.ok(first.health > 0 && first.health < fresh.health);
  assert.equal(maxHealth(first), 85);
  const second = skip(first, DAY);
  assert.equal(second.mistakes, 2);
  assert.equal(second.dead, false);
  assert.equal(maxHealth(second), 70);
  const dead = skip(second, 2 * DAY);
  assert.equal(dead.dead, true);
  assert.equal(dead.mistakes, 3);
  assert.equal(dead.graves[0].at, NOW + 3 * DAY);
  assert.equal(dead.memorials.length, 1);
  assert.equal(skip(dead, DAY).memorials.length, 1);
  assert.equal(
    fresh.mistakes,
    0,
    "the reducer must not mutate the previous save",
  );
});

test("care must cover all neglected needs; food alone cannot reset the survival clock", () => {
  let game = skip(startedGame(NOW), DAY);
  game = step(game, { type: "use", item: "food" });
  assert.equal(game.mistakes, 1);
  game = step(game, { type: "use", item: "water" });
  assert.equal(game.mistakes, 1);
  game = step(game, { type: "rest" });
  assert.equal(game.mistakes, 0);
  assert.equal(maxHealth(game), 100);
  assert.equal(skip(game, DAY - 1).dead, false);
  assert.equal(skip(game, DAY).mistakes, 1);
});

test("successful expeditions deliver loot, rank and the first faction invitation", () => {
  let game = startedGame(NOW);
  game = raid(game);
  assert.equal(game.inventory.stone, 1);
  assert.equal(game.raids, 1);
  assert.equal(game.raid, null);
  assert.ok(game.rubles > 480);
  game = raid(game);
  assert.equal(game.xp, 40);
  game = step(game, { type: "rest" });
  game = raid(game);
  assert.equal(game.xp, 60);
  assert.ok(game.inviteAt);
  const manual = step(game, { type: "faction", faction: "freedom" });
  assert.equal(manual.faction, "freedom");
  assert.equal(
    skip(manual, 10 * 60_000).faction,
    "freedom",
    "autonomy must preserve the explicit choice",
  );
  const automatic = skip(game, 5 * 60_000);
  assert.equal(automatic.faction, "science");
  assert.ok(
    automatic.log.some((entry) => entry.text.includes("Не дождался ответа")),
  );
});

test("unopened events expire at exactly 15 minutes, cause losses once, and catch up chronologically", () => {
  const pending = encounter(startedGame(NOW), 0);
  const before = skip(pending, EVENT_TIMEOUT - 1);
  assert.equal(before.raid?.phase, "choice");
  assert.equal(before.rubles, pending.rubles);
  const expired = skip(before, 1);
  assert.equal(expired.raid?.phase, "return");
  assert.ok(expired.rubles < pending.rubles);
  assert.ok(expired.inventory.food < pending.inventory.food);
  assert.equal(expired.inventory.pistol, pending.inventory.pistol);
  const completed = skip(expired, 30 * 60_000);
  assert.equal(completed.location, "cordon");
  assert.equal(completed.raids, 1);
  assert.equal(
    completed.log.filter((entry) => entry.text.includes("15 минут без связи"))
      .length,
    1,
  );
  const offline = skip(pending, 60 * 60_000);
  assert.equal(offline.rubles, completed.rubles);
  assert.deepEqual(offline.inventory, completed.inventory);
  assert.equal(offline.raid, null);
  const late = step(skip(pending, EVENT_TIMEOUT), { type: "open-event" });
  assert.equal(late.raid?.phase, "return");
});

test("opening in time persists after reload, prevents the timeout, and requires a choice", () => {
  const pending = encounter(startedGame(NOW));
  const ignored = step(pending, { type: "choice", index: 0 });
  assert.equal(ignored.raid?.phase, "choice");
  const stale = step(pending, {
    type: "open-event",
    eventAt: pending.raid!.startedAt - 1,
  });
  assert.equal(stale.raid?.openedAt, null);
  let game = step(skip(pending, EVENT_TIMEOUT - 1), { type: "open-event" });
  game = skip(game, 60 * 60_000);
  assert.equal(game.raid?.phase, "choice");
  assert.ok(parseSave(JSON.stringify(game)));
  assert.ok(
    !game.log.some((entry) => entry.text.includes("15 минут без связи")),
  );
  game = step(parseSave(JSON.stringify(game))!, { type: "choice", index: 0 });
  assert.equal(game.raid?.phase, "return");
  const inventory = game.inventory;
  game = step(game, { type: "choice", index: 0 });
  assert.deepEqual(game.inventory, inventory);
});

test("all possessions including equipped artifacts and money persist in the grave and can be recovered once", () => {
  const initial = startedGame(NOW);
  initial.inventory.stone = 2;
  initial.inventory.armor = 1;
  initial.equipped = "stone";
  const dead = skip(initial, 3 * DAY);
  assert.deepEqual(dead.graves[0].inventory, initial.inventory);
  assert.equal(dead.graves[0].rubles, initial.rubles);
  assert.equal(dead.rubles, 0);
  assert.equal(dead.inventory.stone, 0);
  assert.ok(
    parseSave(JSON.stringify(dead)),
    "a dead character must remain a valid save",
  );
  const next = step(step(dead, { type: "next" }), { type: "create-character", face: 1 });
  assert.equal(next.generation, 2);
  assert.equal(next.faction, null);
  assert.equal(next.xp, 0);
  const id = next.graves[0].id;
  const recovered = step(next, { type: "recover", graveId: id });
  for (const key of Object.keys(ITEMS) as ItemId[])
    assert.equal(
      recovered.inventory[key],
      next.inventory[key] + initial.inventory[key],
    );
  assert.equal(recovered.rubles, next.rubles + initial.rubles);
  assert.equal(recovered.graves.length, 0);
  const repeat = step(recovered, { type: "recover", graveId: id });
  assert.deepEqual(repeat.inventory, recovered.inventory);
  assert.equal(repeat.rubles, recovered.rubles);
  assert.equal(recovered.memorials.length, 1);
});

test("suicide preserves every possession for the next character, at rest and during every route phase", () => {
  const draft = createGame(NOW);
  assert.deepEqual(step(draft, { type: "suicide" }), draft);
  for (const phase of [null, "travel", "choice", "return"] as const) {
    const initial = step(draft, { type: "create-character", face: FACES.length - 1 });
    for (const key of Object.keys(ITEMS) as ItemId[]) initial.inventory[key] = 2;
    initial.gear = { suit: "armor", mask: "mask", primary: "rifle", secondary: "pistol" };
    initial.equipped = "stone";
    if (phase) initial.raid = {
      phase, location: "cordon", origin: "camp", startedAt: NOW,
      endsAt: NOW + EVENT_TIMEOUT, remainingMs: 60_000, event: 0,
      graveId: null, openedAt: phase === "choice" ? NOW : null,
    };
    const dead = step(initial, { type: "suicide" });
    assert.equal(dead.dead, true);
    assert.equal(dead.health, 0);
    assert.equal(dead.raid, null);
    assert.equal(dead.inviteAt, null);
    assert.deepEqual(dead.inventory, emptyInventory());
    assert.equal(dead.rubles, 0);
    assert.equal(dead.equipped, null);
    assert.ok(Object.values(dead.gear).every(item => item === null));
    assert.equal(dead.graves.length, 1);
    assert.equal(dead.graves[0].location, phase ? "cordon" : "camp");
    assert.deepEqual(dead.graves[0].inventory, initial.inventory);
    assert.equal(dead.graves[0].rubles, initial.rubles);
    assert.equal(dead.memorials[0].cause, "Самоубийство.");
    assert.deepEqual(step(dead, { type: "suicide" }), dead);
    const saved = parseSave(JSON.stringify(dead));
    assert.ok(saved);
    const next = step(step(saved, { type: "next" }), { type: "create-character", face: 0 });
    assert.deepEqual(next.graves, dead.graves);
    next.location = dead.graves[0].location;
    const recovered = step(next, { type: "recover", graveId: dead.graves[0].id });
    for (const key of Object.keys(ITEMS) as ItemId[]) {
      assert.equal(recovered.inventory[key] + (recovered.graves[0]?.inventory[key] ?? 0), next.inventory[key] + initial.inventory[key]);
    }
    assert.equal(recovered.rubles, next.rubles + initial.rubles);
    assert.ok(packWeight(recovered.inventory) <= PACK_CAPACITY);
  }
});

test("a fatal field encounter leaves a backpack at the field location; a new stalker can fetch it", () => {
  let game = startedGame(NOW);
  game.raids = 3;
  game.health = 20;
  const inventory = { ...game.inventory };
  game = encounter(game, 4);
  game = step(game, { type: "open-event" });
  game = step(game, { type: "choice", index: 2 });
  assert.equal(game.dead, true);
  assert.equal(game.graves[0].location, "cordon");
  assert.deepEqual(game.graves[0].inventory, inventory);
  assert.ok(parseSave(JSON.stringify(game)));
  game = step(step(game, { type: "next" }), { type: "create-character", face: 1 });
  const startingFood = game.inventory.food;
  const id = game.graves[0].id;
  assert.equal(
    step(game, { type: "recover", graveId: id }).graves.length,
    1,
    "cannot remotely loot a field backpack",
  );
  game = step(game, { type: "raid", location: "cordon", graveId: id });
  game = skip(game, game.raid!.endsAt - game.lastTick);
  game = step(game, { type: "open-event" });
  game = step(game, { type: "choice", index: 0 });
  assert.equal(game.graves.length, 0);
  assert.equal(game.inventory.food, startingFood + inventory.food);
  assert.equal(skip(game, game.raid!.endsAt - game.lastTick).raid, null);
});

test("artifact advantages and costs apply offline, and stop when unequipped", () => {
  const initial = startedGame(NOW);
  initial.inventory.stone = 1;
  initial.inventory.spark = 1;
  initial.inventory.moon = 1;
  let stone = step(initial, { type: "equip", item: "stone" });
  stone = skip(stone, 3_600_000);
  const normal = skip(initial, 3_600_000);
  assert.equal(stone.health, normal.health + 3);
  assert.equal(stone.food, normal.food - 2);
  let spark = skip(step(initial, { type: "equip", item: "spark" }), 3_600_000);
  assert.ok(spark.energy > normal.energy);
  assert.equal(spark.water, normal.water - 2.5);
  spark = step(spark, { type: "equip", item: "spark" });
  assert.equal(spark.equipped, null);
  const moon = skip(step(initial, { type: "equip", item: "moon" }), 3_600_000);
  assert.equal(moon.radiation, normal.radiation + 3);
});

test("trade does not create free money, consume nonexistent stock or sell an equipped artifact", () => {
  const initial = startedGame(NOW);
  let game = step(initial, { type: "buy", item: "food" });
  assert.equal(game.rubles, initial.rubles - ITEMS.food.price);
  assert.equal(game.inventory.food, initial.inventory.food + 1);
  game.inventory.stone = 1;
  game = step(game, { type: "equip", item: "stone" });
  const denied = step(game, { type: "sell", item: "stone" });
  assert.equal(denied.inventory.stone, 1);
  assert.equal(denied.rubles, game.rubles);
  game = step(game, { type: "equip", item: "stone" });
  game = step(game, { type: "sell", item: "stone" });
  assert.equal(game.inventory.stone, 0);
  const money = game.rubles;
  assert.equal(step(game, { type: "sell", item: "stone" }).rubles, money);
  game.rubles = 0;
  assert.deepEqual(
    step(game, { type: "buy", item: "medkit" }).inventory,
    game.inventory,
  );
});

test("unprepared characters and locked locations cannot start raids; consumables work during travel but trade and rest do not", () => {
  const initial = startedGame(NOW);
  assert.equal(
    step(initial, { type: "raid", location: "agroprom" }).raid,
    null,
  );
  const exhausted = { ...initial, energy: 0 };
  assert.equal(
    step(exhausted, { type: "raid", location: "cordon" }).raid,
    null,
  );
  const traveling = step(initial, { type: "raid", location: "cordon" });
  assert.equal(
    step(traveling, { type: "use", item: "food" }).inventory.food,
    traveling.inventory.food - 1,
  );
  assert.equal(
    step(traveling, { type: "buy", item: "food" }).rubles,
    traveling.rubles,
  );
  assert.equal(step(traveling, { type: "rest" }).energy, traveling.energy);
  assert.equal(
    step(traveling, { type: "raid", location: "dump" }).raid?.location,
    "cordon",
  );
});

test("saves survive round trips, reject corruption, and never rewind time", () => {
  const game = startedGame(NOW);
  assert.deepEqual(parseSave(JSON.stringify(game)), game);
  assert.equal(parseSave("{broken"), null);
  assert.equal(
    parseSave(JSON.stringify({ ...game, name: "x".repeat(25) })),
    null,
    "имя длиннее 24 символов не должно загружаться",
  );
  assert.equal(
    parseSave(JSON.stringify({ ...game, inviteAt: NOW + 10_000 })),
    null,
  );
  assert.equal(parseSave(JSON.stringify({ ...game, inventory: {} })), null);
  assert.equal(
    parseSave(JSON.stringify({ ...game, raid: { endsAt: "bad" } })),
    null,
  );
  assert.equal(parseSave(JSON.stringify({ ...game, food: -1 })), null);
  assert.equal(
    parseSave(JSON.stringify({ ...game, graves: [{ id: 1 }] })),
    null,
  );
  const future = skip(game, DAY);
  const restored = parseSave(JSON.stringify(future))!;
  assert.equal(
    reduceGame(restored, { type: "tick" }, NOW - DAY).lastTick,
    restored.lastTick,
  );
  assert.equal(restored.mistakes, 1);
});

test("capacity applies to purchases, loot, dropping and partial grave recovery without loss", () => {
  let game = startedGame(NOW);
  game.inventory = emptyInventory();
  game.gear = { suit: null, mask: null, primary: null, secondary: null };
  game.inventory.water = 100;
  assert.equal(packWeight(game.inventory), PACK_CAPACITY);
  const blocked = step(game, { type: "buy", item: "food" });
  assert.equal(blocked.rubles, game.rubles);
  assert.equal(blocked.inventory.food, 0);
  game.location = "cordon";
  game = step(game, { type: "explore" });
  assert.equal(packWeight(game.inventory), PACK_CAPACITY);
  const waiting = { ...game.ground.cordon! };
  assert.ok(Object.values(waiting).some(Boolean));
  const repeat = step(game, { type: "explore" });
  assert.deepEqual(repeat.ground, game.ground);
  game = step(game, { type: "drop", item: "water" });
  assert.equal(game.inventory.water, 99);
  assert.equal(game.ground.cordon!.water, waiting.water + 1);
  game = step(game, { type: "pickup" });
  assert.ok(packWeight(game.inventory) <= PACK_CAPACITY + 1e-8);
  game.location = "camp";
  const before = game.inventory.food;
  game.graves.push({
    id: 999,
    name: "Старый",
    generation: 1,
    at: NOW,
    location: "camp",
    inventory: { ...emptyInventory(), food: 100 },
    rubles: 100,
  });
  const money = game.rubles;
  game = step(game, { type: "recover", graveId: 999 });
  assert.equal(game.rubles, money + 100);
  assert.ok(game.graves.length);
  assert.equal(
    game.graves[0].inventory.food + game.inventory.food - before,
    100,
  );
  game = step(game, { type: "recover", graveId: 999 });
  assert.equal(game.rubles, money + 100);
});

test("equipment has explicit slots and only worn gear protects from combat and radiation", () => {
  const initial = startedGame(NOW);
  initial.inventory.armor = 1;
  initial.inventory.mask = 1;
  initial.inventory.rifle = 1;
  const damage = (game: Game, event: number) => {
    game = step(encounter(game, event), { type: "open-event" });
    return step(game, { type: "choice", index: event === 0 ? 1 : 0 });
  };
  const unequipped = damage(initial, 0);
  let geared = step(initial, { type: "equip", item: "armor" });
  geared = step(geared, { type: "equip", item: "rifle" });
  geared = step(geared, { type: "equip", item: "mask" });
  assert.equal(geared.gear.suit, "armor");
  assert.equal(geared.inventory.jacket, 1);
  assert.ok(damage(geared, 0).health > unequipped.health);
  assert.ok(damage(geared, 1).radiation < damage(initial, 1).radiation);
  assert.equal(
    step(geared, { type: "sell", item: "armor" }).inventory.armor,
    1,
  );
  assert.equal(step(geared, { type: "drop", item: "mask" }).inventory.mask, 1);
  assert.equal(step(geared, { type: "equip", item: "mask" }).gear.mask, null);
});

test("bandit bribes require and consume money, bypass yields no combat loot, injuries need manual healing", () => {
  let game = step(encounter(startedGame(NOW), 0), { type: "open-event" });
  game.rubles = 149;
  assert.equal(step(game, { type: "choice", index: 2 }).raid?.phase, "choice");
  game.rubles = 150;
  const paid = step(game, { type: "choice", index: 2 });
  assert.equal(paid.rubles, 0);
  assert.deepEqual(paid.inventory, game.inventory);
  const bypass = step(game, { type: "choice", index: 0 });
  assert.deepEqual(bypass.inventory, game.inventory);
  assert.ok(bypass.raid!.endsAt > paid.raid!.endsAt);
  const injured = skip(encounter(startedGame(NOW), 1), EVENT_TIMEOUT);
  assert.ok(injured.health < game.health);
  const healed = step(injured, { type: "use", item: "medkit" });
  assert.ok(healed.health > injured.health);
});

test("old saves migrate without losing possessions; invalid slots and opened events are rejected", () => {
  const initial = startedGame(NOW);
  const legacy: any = { ...initial, version: 1 };
  delete legacy.location;
  delete legacy.gear;
  delete legacy.ground;
  delete legacy.searchedAt;
  delete legacy.seed;
  delete legacy.inventory.mask;
  delete legacy.inventory.rifle;
  const migrated = parseSave(JSON.stringify(legacy))!;
  assert.equal(migrated.version, 3);
  assert.equal(migrated.inventory.food, 3);
  assert.equal(migrated.gear.secondary, "pistol");
  assert.equal(
    parseSave(
      JSON.stringify({
        ...migrated,
        gear: { ...migrated.gear, primary: "food" },
      }),
    ),
    null,
  );
  const pending = encounter(startedGame(NOW));
  pending.raid!.openedAt = pending.raid!.endsAt + 1;
  assert.equal(parseSave(JSON.stringify(pending)), null);
});

test("safe settlements are travel destinations; trade and rest are possible only after arrival", () => {
  let game = startedGame(NOW);
  game.seed = 1;
  game = step(game, { type: "raid", location: "bar" });
  assert.ok(game.raid!.endsAt - NOW > 60_000);
  assert.equal(step(game, { type: "buy", item: "water" }).rubles, game.rubles);
  game = skip(game, 60 * 60_000);
  assert.equal(game.location, "bar");
  const purchased = step(game, { type: "buy", item: "water" });
  assert.equal(purchased.inventory.water, game.inventory.water + 1);
  game.location = "cordon";
  assert.equal(step(game, { type: "rest" }).energy, game.energy);
  assert.equal(step(game, { type: "sell", item: "water" }).rubles, game.rubles);
});


test("rerouting preserves position, supplies and pending encounters, survives reload and arrives at the new target", () => {
  const initial = startedGame(NOW);
  initial.seed = 1;
  let game = step(initial, { type: "raid", location: "cordon" });
  game = skip(game, 60_000);
  const position = routePosition(game);
  const supplies = [game.energy, game.food, game.water];
  const event = game.raid!.event;
  game = step(game, { type: "raid", location: "bar" });
  assert.deepEqual(routePosition(game), position);
  assert.deepEqual([game.energy, game.food, game.water], supplies);
  assert.equal(game.location, "camp");
  assert.equal(game.raid!.event, event);
  assert.equal(game.raid!.phase, "travel");
  game = parseSave(JSON.stringify(game))!;
  assert.ok(game);
  assert.deepEqual(routePosition(game), position);
  game = step(game, { type: "raid", location: "camp" });
  assert.equal(game.raid!.location, "camp", "can turn back to origin");
  assert.deepEqual(routePosition(game), position);
  game = skip(game, game.raid!.endsAt - game.lastTick);
  assert.equal(game.raid!.phase, "choice");
  assert.deepEqual(step(game, { type: "raid", location: "bar" }).raid, game.raid, "cannot bypass a pending event");
  game = step(game, { type: "open-event" });
  game = step(game, { type: "choice", index: 0 });
  game = skip(game, 10_000);
  const afterEvent = routePosition(game);
  game = step(game, { type: "raid", location: "bar" });
  assert.deepEqual(routePosition(game), afterEvent);
  assert.equal(game.raid!.phase, "return", "resolved events do not restart");
  assert.deepEqual(step(game, { type: "raid", location: "agroprom" }).raid, game.raid);
  assert.deepEqual(step(game, { type: "raid", location: "bar" }).raid, game.raid);
  game = skip(game, game.raid!.endsAt - game.lastTick);
  assert.equal(game.raid, null);
  assert.equal(game.location, "bar");
  assert.deepEqual(routePosition(game), LOCATIONS.bar);
  assert.equal(game.raids, 1);
});

test("rerouted saves reject invalid coordinates and release the old backpack target", () => {
  const initial = startedGame(NOW);
  initial.graves.push({ id: 999, name: "Старый", generation: 1, at: NOW, location: "cordon", inventory: emptyInventory(), rubles: 100 });
  const traveling = step(initial, { type: "raid", location: "cordon", graveId: 999 });
  const changed = step(traveling, { type: "raid", location: "bar" });
  assert.equal(changed.raid!.graveId, null);
  assert.equal(changed.graves.length, 1);
  for (const startPosition of [null, { x: -1, y: 20 }, { x: 10, y: 101 }, { x: "10", y: 20 }])
    assert.equal(parseSave(JSON.stringify({ ...changed, raid: { ...changed.raid, startPosition } })), null);
});
