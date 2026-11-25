import { useCallback, useEffect, useRef, useState } from "react";
import {
  createGame,
  parseSave,
  reduceGame,
  SAVE_KEY,
  type Action,
  type Game,
} from "./game";

function loadGame(): { game: Game; warning: string } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { game: createGame(), warning: "" };
    const saved = parseSave(raw);
    if (saved)
      return { game: reduceGame(saved, { type: "tick" }), warning: "" };
    localStorage.setItem(`${SAVE_KEY}.corrupt`, raw);
    return {
      game: createGame(),
      warning:
        "Сохранение повреждено. Его резервная копия оставлена в браузере; начата новая история.",
    };
  } catch {
    return {
      game: createGame(),
      warning:
        "Браузер запретил сохранение. История сохранится только пока открыт этот экран. Разреши хранение данных сайта.",
    };
  }
}

export function useGame() {
  const [initial] = useState(loadGame);
  const [game, setGame] = useState(initial.game);
  const [warning, setWarning] = useState(initial.warning);
  const current = useRef(game);

  const send = useCallback((action: Action) => {
    let previous = current.current;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const saved = raw ? parseSave(raw) : null;
      if (saved && saved.lastTick >= previous.lastTick) previous = saved;
    } catch {
      /* An in-memory session still works when storage is unavailable. */
    }
    const next = reduceGame(previous, action);
    current.current = next;
    setGame(next);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    } catch {
      setWarning(
        "Не удалось сохранить КПК. Проверь свободное место и разрешение на хранение данных сайта.",
      );
    }
    return next;
  }, []);

  useEffect(() => {
    send({ type: "tick" });
    const timer = window.setInterval(() => {
      send({ type: "tick" });
    }, 1000);
    const onVisible = () => {
      if (!document.hidden) send({ type: "tick" });
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SAVE_KEY || !event.newValue) return;
      const saved = parseSave(event.newValue);
      if (saved && saved.lastTick >= current.current.lastTick) {
        current.current = saved;
        setGame(saved);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [send]);

  return { game, send, warning };
}
