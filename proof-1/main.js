import { planeCode } from "./plane-code.js";
import { setData } from "./set-data.js?v=20";
import { setRender } from "./set-render.js";
import { renderPlaneCode } from "./web-renderer.js?v=20";
import { validateSetData } from "./validator.js?v=20";

const root = document.querySelector("#plane-code-root");
validateSetData(planeCode, setData);
renderPlaneCode(root, planeCode, setData, setRender);

const zRange = document.querySelector("#shadow-z");
const zNumber = document.querySelector("#shadow-z-number");
const zOutput = document.querySelector("#shadow-z-output");
const spacingRange = document.querySelector("#panel-spacing");
const spacingNumber = document.querySelector("#panel-spacing-number");
const spacingOutput = document.querySelector("#panel-spacing-output");
const borderRange = document.querySelector("#panel-border");
const borderNumber = document.querySelector("#panel-border-number");
const borderOutput = document.querySelector("#panel-border-output");
const color = document.querySelector("#shadow-color");
const colorText = document.querySelector("#shadow-color-text");
const inset = document.querySelector("#shadow-inset");
const cssOutput = document.querySelector("#shadow-css");

const panelColors = [
  ["base-panel-color", "base-panel-color-text", "--base-panel-color"],
  ["simple-panel-color", "simple-panel-color-text", "--simple-panel-color"],
  ["active-panel-color", "active-panel-color-text", "--active-panel-color"]
];

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function applySpacing() {
  const spacing = Math.max(0, Number(spacingNumber.value) || 0);
  spacingRange.value = String(spacing);
  root.style.setProperty("--panel-spacing", `${spacing}px`);
  spacingOutput.value = `${spacing} px`;
}

function applyBorder() {
  const border = Math.max(0, Number(borderNumber.value) || 0);
  borderRange.value = String(border);
  root.style.setProperty("--panel-border-width", `${border}px`);
  borderOutput.value = `${border} px`;
}

function applyZ() {
  const z = Math.max(0, Number(zNumber.value) || 0);
  zRange.value = String(z);
  const x = round(z);
  const y = round(z);
  const blur = round(2 * Math.sqrt(z));
  const spread = round(0.15 * z);
  const shadowColor = colorText.value || "#666666";
  const insetValue = inset.checked ? " inset" : "";
  const value = `${x}px ${y}px ${blur}px ${spread}px ${shadowColor}${insetValue}`;

  root.style.setProperty("--live-panel-shadow", value);
  zOutput.value = String(z);
  document.querySelector("#shadow-x-output").value = `${x} px`;
  document.querySelector("#shadow-y-output").value = `${y} px`;
  document.querySelector("#shadow-blur-output").value = `${blur} px`;
  document.querySelector("#shadow-spread-output").value = `${spread} px`;
  cssOutput.value = `box-shadow: ${value};`;
}

zRange.addEventListener("input", () => {
  zNumber.value = zRange.value;
  applyZ();
});
zNumber.addEventListener("input", applyZ);

spacingRange.addEventListener("input", () => {
  spacingNumber.value = spacingRange.value;
  applySpacing();
});
spacingNumber.addEventListener("input", applySpacing);

borderRange.addEventListener("input", () => {
  borderNumber.value = borderRange.value;
  applyBorder();
});
borderNumber.addEventListener("input", applyBorder);

color.addEventListener("input", () => {
  colorText.value = color.value;
  applyZ();
});
colorText.addEventListener("input", () => {
  if (/^#[0-9a-fA-F]{6}$/.test(colorText.value)) color.value = colorText.value;
  applyZ();
});
inset.addEventListener("change", applyZ);

for (const [pickerId, textId, variable] of panelColors) {
  const picker = document.querySelector(`#${pickerId}`);
  const text = document.querySelector(`#${textId}`);
  picker.addEventListener("input", () => {
    text.value = picker.value;
    root.style.setProperty(variable, picker.value);
  });
  text.addEventListener("input", () => {
    if (/^#[0-9a-fA-F]{6}$/.test(text.value)) {
      picker.value = text.value;
      root.style.setProperty(variable, text.value);
    }
  });
  root.style.setProperty(variable, picker.value);
}

const activePanel = root.querySelector('[data-plane-type="ActivePanel"]');

function onPress(event) {
  activePanel.setPointerCapture?.(event.pointerId);
  activePanel.style.boxShadow = "none";
}

function onRelease(event) {
  if (activePanel.hasPointerCapture?.(event.pointerId)) {
    activePanel.releasePointerCapture(event.pointerId);
  }
  activePanel.style.boxShadow = "";
}

activePanel.addEventListener("pointerdown", onPress);
activePanel.addEventListener("pointerup", onRelease);
activePanel.addEventListener("pointercancel", onRelease);

applySpacing();
applyBorder();
applyZ();
