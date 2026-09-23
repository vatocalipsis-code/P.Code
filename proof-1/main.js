import { planeCode } from "./plane-code.js?v=23";
import { setData } from "./set-data.js?v=23";
import { setRender } from "./set-render.js";
import { renderPlaneCode } from "./web-renderer.js?v=23";
import { validateSetData } from "./validator.js?v=23";

const root = document.querySelector("#plane-code-root");
validateSetData(planeCode, setData);
renderPlaneCode(root, planeCode, setData, setRender);

const surfaces = [...root.querySelectorAll(':scope > [data-plane-type="BasePanel"]')];
let current = 0;
let startX = 0;
let pointerId = null;

function showSurface(index) {
  current = index;
  surfaces.forEach((surface, i) => surface.hidden = i !== current);
}

root.addEventListener("pointerdown", event => {
  pointerId = event.pointerId;
  startX = event.clientX;
  root.setPointerCapture?.(pointerId);
});

root.addEventListener("pointerup", event => {
  if (event.pointerId !== pointerId) return;
  const dx = event.clientX - startX;
  if (dx <= -40 && current < surfaces.length - 1) showSurface(current + 1);
  if (dx >= 40 && current > 0) showSurface(current - 1);
  if (root.hasPointerCapture?.(pointerId)) root.releasePointerCapture(pointerId);
  pointerId = null;
});

root.addEventListener("pointercancel", () => { pointerId = null; });

showSurface(0);
