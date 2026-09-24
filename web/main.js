import { pLang } from "./release/p-lang.js?v=2.5.4r1";
import { setData } from "./release/set-data.js?v=2.5.4r1";
import { setRender } from "./release/set-render.js?v=2.5.4r1";
import { composePLang } from "./runtime/compositor.js?v=2.5.4r1";
import { validatePLang, validateSetRender } from "./runtime/validator.js?v=2.5.4r1";
import { validateRenderBindings } from "./runtime/render-bindings.js?v=2.5.4r1";
import { renderPlaneCode } from "./runtime/web-renderer.js?v=2.5.4r1";

const root = document.querySelector("#plane-code-root");

validatePLang(pLang, setData);
validateSetRender(setRender);
const composition = composePLang(pLang, setData);
validateRenderBindings(composition, setRender);
renderPlaneCode(root, composition, setRender);

const surfaces = [...root.querySelectorAll(':scope > [data-plane-type="BasePanel"]')];
let current = 0;
let startX = 0;
let startY = 0;
let dragX = 0;
let dragY = 0;
let pointerId = null;
let gesture = null;
const refreshThreshold = 72;

const refreshIndicator = document.createElement("div");
refreshIndicator.dataset.planeRefresh = "";
refreshIndicator.textContent = "↓";
root.append(refreshIndicator);

function positionSurfaces(offset = 0, animate = false) {
  surfaces.forEach((surface, index) => {
    surface.style.transition = animate ? "transform 220ms ease-out" : "none";
    surface.style.transform = `translateX(${(index - current) * 100}%) translateX(${offset}px)`;
  });
}

function setRefreshPull(distance = 0) {
  const pull = Math.min(Math.max(distance, 0) * 0.45, 54);
  refreshIndicator.style.transform = `translate(-50%, ${pull}px)`;
  refreshIndicator.style.opacity = String(Math.min(distance / 48, 1));
  refreshIndicator.textContent = distance >= refreshThreshold ? "↻" : "↓";
}

root.addEventListener("pointerdown", event => {
  pointerId = event.pointerId;
  startX = event.clientX;
  startY = event.clientY;
  dragX = 0;
  dragY = 0;
  gesture = null;
  positionSurfaces(0, false);
});

root.addEventListener("pointermove", event => {
  if (event.pointerId !== pointerId) return;
  dragX = event.clientX - startX;
  dragY = event.clientY - startY;
  if (!gesture && (Math.abs(dragX) > 8 || Math.abs(dragY) > 8)) {
    const atTop = window.scrollY <= 0 && document.documentElement.scrollTop <= 0;
    if (atTop && dragY > 0 && Math.abs(dragY) > Math.abs(dragX)) gesture = "refresh";
    else if (Math.abs(dragX) > Math.abs(dragY)) gesture = "horizontal";
    else gesture = "vertical";
  }
  if (gesture === "refresh") {
    event.preventDefault();
    setRefreshPull(dragY);
    return;
  }
  if (gesture !== "horizontal") return;
  if ((current === 0 && dragX > 0) || (current === surfaces.length - 1 && dragX < 0)) dragX *= 0.25;
  positionSurfaces(dragX, false);
});

root.addEventListener("pointerup", event => {
  if (event.pointerId !== pointerId) return;
  if (gesture === "refresh") {
    const reload = dragY >= refreshThreshold;
    setRefreshPull(0);
    pointerId = null;
    gesture = null;
    if (reload) location.reload();
    return;
  }
  if (gesture === "horizontal") {
    if (dragX <= -40 && current < surfaces.length - 1) current += 1;
    else if (dragX >= 40 && current > 0) current -= 1;
  }
  positionSurfaces(0, true);
  pointerId = null;
  gesture = null;
});

root.addEventListener("pointercancel", () => {
  pointerId = null;
  gesture = null;
  setRefreshPull(0);
  positionSurfaces(0, true);
});

positionSurfaces();
