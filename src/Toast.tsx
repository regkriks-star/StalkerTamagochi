import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

/**
 * Status toast. A modal <dialog> lives in the browser top layer and ignores
 * z-index, so the toast is portalled into the open dialog when there is one.
 */
export function Toast({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const update = () => {
      setTarget(document.querySelector<HTMLElement>("dialog[open]") ?? document.body);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    return () => observer.disconnect();
  }, []);

  if (!target) return null;

  return createPortal(
    <div ref={ref} className="toast" role="status">
      <Check size={17} />
      {message}
    </div>,
    target,
  );
}
