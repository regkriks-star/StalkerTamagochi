import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from "react";

type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function MapViewport({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const moved = useRef(false);
  const start = useRef<Point | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const element = viewport.current!;
    // The map handles gestures itself; prevent native dragging from swallowing the next tap.
    const preventDrag = (event: TouchEvent) => event.preventDefault();
    element.addEventListener("touchmove", preventDrag, { passive: false });
    return () => element.removeEventListener("touchmove", preventDrag);
  }, []);

  function transform(previous: Point, next: Point, factor: number) {
    const { width, height } = viewport.current!.getBoundingClientRect();
    setView((old) => {
      const scale = Math.max(1, Math.min(3, old.scale * factor));
      const ratio = scale / old.scale;
      return {
        scale,
        x: Math.max(width * (1 - scale), Math.min(0, next.x - (previous.x - old.x) * ratio)),
        y: Math.max(height * (1 - scale), Math.min(0, next.y - (previous.y - old.y) * ratio)),
      };
    });
  }

  function point(event: PointerEvent): Point {
    const rect = viewport.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    const before = [...pointers.current.values()];
    const next = point(event);
    if (!moved.current && start.current && distance(start.current, next) < 6) return;
    moved.current = true;
    pointers.current.set(event.pointerId, next);
    const after = [...pointers.current.values()];
    if (after.length === 1) transform(before[0], after[0], 1);
    else transform(midpoint(before[0], before[1]), midpoint(after[0], after[1]), distance(after[0], after[1]) / Math.max(1, distance(before[0], before[1])));
  }

  function release(event: PointerEvent) {
    pointers.current.delete(event.pointerId);
    start.current = [...pointers.current.values()][0] ?? null;
  }

  function zoom(factor: number) {
    const { width, height } = viewport.current!.getBoundingClientRect();
    const center = { x: width / 2, y: height / 2 };
    transform(center, center, factor);
  }

  return (
    <div className="map-container">
      <div
        ref={viewport}
        className="zone-map"
        aria-label="Карта районов Зоны"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          if (!pointers.current.size) { moved.current = false; start.current = point(event); }
          pointers.current.set(event.pointerId, point(event));
          if (pointers.current.size > 1) moved.current = true;
          (event.target as Element).setPointerCapture(event.pointerId);
        }}
        onPointerMove={move}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onClickCapture={(event) => {
          if (moved.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); }
        }}
      >
        <div
          className="map-canvas"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            "--map-marker-scale": 1 / view.scale,
          } as CSSProperties}
        >
          {children}
        </div>
      </div>
      <div className="map-zoom" aria-label="Масштаб карты">
        <button aria-label="Уменьшить карту" disabled={view.scale <= 1} onClick={() => zoom(1 / 1.4)}>−</button>
        <button aria-label="Сбросить масштаб карты" onClick={() => setView({ x: 0, y: 0, scale: 1 })}>{Math.round(view.scale * 100)}%</button>
        <button aria-label="Увеличить карту" disabled={view.scale >= 3} onClick={() => zoom(1.4)}>+</button>
      </div>
    </div>
  );
}
