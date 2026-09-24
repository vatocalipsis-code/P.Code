import { pLang } from "./release/p-lang.js?v=2.5.3";
import { setData } from "./release/set-data.js?v=2.5.3";
import { setRender } from "./release/set-render.js?v=2.5.3";
import { composePLang } from "./runtime/compositor.js?v=2.5.3";
import { validatePLang, validateSetRender } from "./runtime/validator.js?v=2.5.3";
import { validateRenderBindings } from "./runtime/render-bindings.js?v=2.5.3";
import { renderPlaneCode } from "./runtime/web-renderer.js?v=2.5.3";

const root = document.querySelector("#plane-code-root");

validatePLang(pLang, setData);
validateSetRender(setRender);
const composition = composePLang(pLang, setData);
validateRenderBindings(composition, setRender);
renderPlaneCode(root, composition, setRender);

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
  pointerId = null;
});

root.addEventListener("pointercancel", () => {
  pointerId = null;
  positionSurfaces(0, true);
});

positionSurfaces();
