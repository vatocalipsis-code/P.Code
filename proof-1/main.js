import { planeCode } from "./plane-code.js";
import { setData } from "./set-data.js";
import { setRender } from "./set-render.js";
import { renderPlaneCode } from "./web-renderer.js";

const root = document.querySelector("#plane-code-root");
renderPlaneCode(root, planeCode, setData, setRender);

const zRange = document.querySelector("#shadow-z");
const zNumber = document.querySelector("#shadow-z-number");
const zOutput = document.querySelector("#shadow-z-output");
const color = document.querySelector("#shadow-color");
const colorText = document.querySelector("#shadow-color-text");
const inset = document.querySelector("#shadow-inset");
const cssOutput = document.querySelector("#shadow-css");

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function applyZ() {
  const z = Math.max(0, Number(zNumber.value) || 0);
  zRange.value = String(z);
  zNumber.value = String(z);

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

color.addEventListener("input", () => {
  colorText.value = color.value;
  applyZ();
});
colorText.addEventListener("input", () => {
  if (/^#[0-9a-fA-F]{6}$/.test(colorText.value)) color.value = colorText.value;
  applyZ();
});
inset.addEventListener("change", applyZ);

applyZ();
