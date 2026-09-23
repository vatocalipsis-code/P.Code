import { planeCode } from "./release/plane-code.js?v=1.0.0";
import { setData } from "./release/set-data.js?v=1.0.0";
import { setRender } from "./release/set-render.js?v=1.0.0";
import { renderPlaneCode } from "./runtime/web-renderer.js?v=1.0.0";
import { validateSetData } from "./runtime/validator.js?v=1.0.0";

const root = document.querySelector("#plane-code-root");
validateSetData(planeCode, setData);
renderPlaneCode(root, planeCode, setData, setRender);

const surfaces = [...root.querySelectorAll(':scope > [data-plane-type="BasePanel"]')];
let current = 0;
let startX = 0;
let dragX = 0;
let pointerId = null;

function positionSurfaces(offset = 0, animate = false) {
  surfaces.forEach((surface, index) => {
    surface.style.transition = animate ? "transform 220ms ease-out" : "none";
    surface.style.transform = `translateX(${(index - current) * 100}%) translateX(${offset}px)`;
  });
}

root.addEventListener("pointerdown", event => {
  pointerId = event.pointerId;
  startX = event.clientX;
  dragX = 0;
  root.setPointerCapture?.(pointerId);
  positionSurfaces(0, false);
});

root.addEventListener("pointermove", event => {
  if (event.pointerId !== pointerId) return;
  dragX = event.clientX - startX;
  if ((current === 0 && dragX > 0) || (current === surfaces.length - 1 && dragX < 0)) dragX *= 0.25;
  positionSurfaces(dragX, false);
});

root.addEventListener("pointerup", event => {
  if (event.pointerId !== pointerId) return;
  if (dragX <= -40 && current < surfaces.length - 1) current += 1;
  else if (dragX >= 40 && current > 0) current -= 1;
  positionSurfaces(0, true);
  if (root.hasPointerCapture?.(pointerId)) root.releasePointerCapture(pointerId);
  pointerId = null;
});

root.addEventListener("pointercancel", () => {
  pointerId = null;
  positionSurfaces(0, true);
});

positionSurfaces();
