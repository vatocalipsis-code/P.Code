import { planeCode } from "./plane-code.js";
import { setData } from "./set-data.js";
import { setRender } from "./set-render.js";
import { renderPlaneCode } from "./web-renderer.js";

const root = document.querySelector("#plane-code-root");
renderPlaneCode(root, planeCode, setData, setRender);

const pairs = [
  ["shadow-x", "shadow-x-number", "shadow-x-output"],
  ["shadow-y", "shadow-y-number", "shadow-y-output"],
  ["shadow-blur", "shadow-blur-number", "shadow-blur-output"],
  ["shadow-spread", "shadow-spread-number", "shadow-spread-output"]
];

const color = document.querySelector("#shadow-color");
const colorText = document.querySelector("#shadow-color-text");
const inset = document.querySelector("#shadow-inset");
const cssOutput = document.querySelector("#shadow-css");

function syncPair(rangeId, numberId) {
  const range = document.querySelector(`#${rangeId}`);
  const number = document.querySelector(`#${numberId}`);
  range.addEventListener("input", () => {
    number.value = range.value;
    applyShadow();
  });
  number.addEventListener("input", () => {
    range.value = number.value;
    applyShadow();
  });
}

function applyShadow() {
  const x = document.querySelector("#shadow-x-number").value || 0;
  const y = document.querySelector("#shadow-y-number").value || 0;
  const blur = document.querySelector("#shadow-blur-number").value || 0;
  const spread = document.querySelector("#shadow-spread-number").value || 0;
  const shadowColor = colorText.value || "#666666";
  const insetValue = inset.checked ? " inset" : "";
  const value = `${x}px ${y}px ${blur}px ${spread}px ${shadowColor}${insetValue}`;

  root.style.setProperty("--live-panel-shadow", value);
  cssOutput.value = `box-shadow: ${value};`;

  document.querySelector("#shadow-x-output").value = `${x} px`;
  document.querySelector("#shadow-y-output").value = `${y} px`;
  document.querySelector("#shadow-blur-output").value = `${blur} px`;
  document.querySelector("#shadow-spread-output").value = `${spread} px`;
}

for (const [rangeId, numberId] of pairs) syncPair(rangeId, numberId);

color.addEventListener("input", () => {
  colorText.value = color.value;
  applyShadow();
});
colorText.addEventListener("input", () => {
  if (/^#[0-9a-fA-F]{6}$/.test(colorText.value)) color.value = colorText.value;
  applyShadow();
});
inset.addEventListener("change", applyShadow);

applyShadow();
