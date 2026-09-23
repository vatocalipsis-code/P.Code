import { planeCode } from "./plane-code.js";
import { setData } from "./set-data.js";
import { setRender } from "./set-render.js";
import { renderPlaneCode } from "./web-renderer.js";

const root = document.querySelector("#plane-code-root");

renderPlaneCode(root, planeCode, setData, setRender);
