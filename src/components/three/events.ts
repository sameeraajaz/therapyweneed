import type { ThreeEvent } from "@react-three/fiber";

/**
 * The canvas receives events through the page wrapper so 3D objects stay
 * interactive under the HTML layer. Ignore events that actually landed on
 * HTML controls (buttons, links, form fields, dialogs) to avoid double actions.
 */
export function landedOnUi(e: ThreeEvent<PointerEvent | MouseEvent>): boolean {
  const t = e.nativeEvent.target as HTMLElement | null;
  return Boolean(t && typeof t.closest === "function" && t.closest("button, a, input, textarea, select, [data-ui]"));
}

export function setCursor(pointer: boolean) {
  if (typeof document !== "undefined") document.body.style.cursor = pointer ? "pointer" : "";
}
