/**
 * Browser renderer for a compiled P.Code Object Plan.
 *
 * Receives structure already compiled from SetLang, live values from SetData,
 * and scene defaults from SetRender. SetData patches update bound Containers
 * without recompiling SetLang.
 */

const activeParallax = new WeakMap();

function opacityFromTransparency(value) {
  return String(1 - value);
}

function structuralPercent(transparency) {
  return `${(1 - transparency) * 100}%`;
}

function px(value) {
  return `${value}px`;
}

function combinedPanelTransparency(renderSet, panelTransparency = 0) {
  return 1 - ((1 - renderSet.Transparency) * (1 - panelTransparency));
}

function structuralColor(color, renderSet, panelTransparency = 0) {
  return `color-mix(in srgb, ${color} ${structuralPercent(combinedPanelTransparency(renderSet, panelTransparency))}, transparent)`;
}

function contentShadowFilter(depth) {
  if (!(depth > 0)) return "";
  const x = depth / 7;
  const y = depth;
  const blur = depth * 10 / 7;
  return `drop-shadow(${x}px ${y}px ${blur}px rgba(0, 12, 22, .62))`;
}

function alignmentValue(value) {
  return {
    Start: "flex-start",
    Center: "center",
    End: "flex-end",
    Stretch: "stretch"
  }[value];
}

function distributionValue(value) {
  return {
    Start: "flex-start",
    Center: "center",
    End: "flex-end",
    Between: "space-between",
    Around: "space-around",
    Evenly: "space-evenly"
  }[value];
}

function applyBoxRule(element, rule = {}, renderSet, panelEffects = false) {
  const panelTransparency = panelEffects ? (rule.PanelTransparency ?? 0) : 0;
  if (rule.Background !== undefined) {
    element.style.setProperty("--plane-background", rule.Background);
    element.dataset.planeBackground = "present";
  } else {
    element.dataset.planeBackground = "absent";
  }

  if (rule.BorderColor !== undefined) element.style.borderColor = structuralColor(rule.BorderColor, renderSet, panelTransparency);
  if (rule.BorderWidth !== undefined) element.style.borderWidth = px(rule.BorderWidth);

  for (const side of ["Left", "Right", "Top", "Bottom"]) {
    if (rule[`Border${side}Color`] !== undefined) element.style[`border${side}Color`] = structuralColor(rule[`Border${side}Color`], renderSet, panelTransparency);
    if (rule[`Border${side}Width`] !== undefined) element.style[`border${side}Width`] = px(rule[`Border${side}Width`]);
  }

  if (rule.Width !== undefined) element.style.width = px(rule.Width);
  if (rule.Height !== undefined) element.style.height = px(rule.Height);
  if (rule.Padding !== undefined) element.style.padding = px(rule.Padding);
}

function applyLayoutRule(element, rule = {}) {
  if (rule.Gap !== undefined) element.style.gap = px(rule.Gap);
  if (rule.Alignment !== undefined) element.style.alignItems = alignmentValue(rule.Alignment);
  if (rule.Distribution !== undefined) element.style.justifyContent = distributionValue(rule.Distribution);
  if (rule.Direction !== undefined) element.style.flexDirection = rule.Direction === "Horizontal" ? "row" : "column";
}

function renderSource(source, renderSet, rule, shadow = 0) {
  if (source.kind === "Text") {
    const text = document.createElement("span");
    text.dataset.planeSource = "Text";
    text.textContent = source.value;
    text.style.opacity = opacityFromTransparency(renderSet.TextTransparency);
    if (rule?.TextColor !== undefined) text.style.color = rule.TextColor;
    if (rule?.FontSize !== undefined) text.style.fontSize = px(rule.FontSize);
    if (rule?.FontWeight !== undefined) text.style.fontWeight = String(rule.FontWeight);
    if (shadow > 0) text.style.filter = contentShadowFilter(shadow);
    return text;
  }

  if (source.kind === "Picture") {
    if (rule?.PictureTint !== undefined) {
      const picture = document.createElement("span");
      picture.dataset.planeSource = "Picture";
      picture.dataset.planePictureTint = "present";
      picture.style.opacity = opacityFromTransparency(renderSet.PictureTransparency);
      if (shadow > 0) picture.style.filter = contentShadowFilter(shadow);

      const sizer = document.createElement("img");
      sizer.src = source.value;
      sizer.alt = "";
      sizer.setAttribute("aria-hidden", "true");
      sizer.dataset.planePictureSizer = "";

      const tint = document.createElement("span");
      tint.dataset.planePictureTintLayer = "";
      tint.style.backgroundColor = rule.PictureTint;
      tint.style.maskImage = `url("${source.value}")`;
      tint.style.webkitMaskImage = `url("${source.value}")`;

      picture.append(sizer, tint);
      return picture;
    }

    const image = document.createElement("img");
    image.dataset.planeSource = "Picture";
    image.src = source.value;
    image.alt = "";
    image.style.opacity = opacityFromTransparency(renderSet.PictureTransparency);
    if (shadow > 0) image.style.filter = contentShadowFilter(shadow);
    return image;
  }

  throw new Error(`WebRenderer: unsupported source kind "${source.kind}"`);
}

function sourcesFromData(node, dataSet) {
  if (node.type !== "Container") return [];
  const item = dataSet[node.dataSlot] ?? {};
  const text = typeof item.SourceText === "string" && item.SourceText.length ? { kind: "Text", value: item.SourceText } : null;
  const picture = typeof item.SourcePicture === "string" && item.SourcePicture.length ? { kind: "Picture", value: item.SourcePicture } : null;
  if (text && picture) return node.Orientation === "Negative" ? [text, picture] : [picture, text];
  return text ? [text] : picture ? [picture] : [];
}

function renderNode(node, dataSet, renderSet, parallaxNodes, ownerShadow = 0) {
  const element = document.createElement("div");
  element.dataset.planeType = node.type;
  if (node.id) element.dataset.planeId = node.id;
  if (node.Login) element.dataset.planeLogin = node.Login;

  const rule = node.Visual ?? {};
  element.__planeVisual = rule;
  if (node.Orientation !== undefined) element.dataset.planeOrientation = node.Orientation;
  const panelEffects = node.type === "SimplePanel" || node.type === "ActivePanel" || node.type === "AggregateActivePanel";
  const panelTransparency = panelEffects ? (rule.PanelTransparency ?? 0) : 0;
  element.style.setProperty("--plane-structural-opacity", structuralPercent(combinedPanelTransparency(renderSet, panelTransparency)));
  element.style.setProperty("--plane-panel-surface-opacity", String(1 - panelTransparency));
  applyBoxRule(element, rule, renderSet, panelEffects);

  const parallax = rule.Parallax ?? renderSet.Parallax ?? 0;
  if (parallax !== 0) parallaxNodes.push({ element, parallax });

  if (node.type === "Container") {
    applyLayoutRule(element, rule);
    const content = document.createElement("div");
    content.dataset.planeContainerContent = "";
    applyLayoutRule(content, rule);
    for (const source of sourcesFromData(node, dataSet)) content.append(renderSource(source, renderSet, rule, ownerShadow));
    element.dataset.planeDataSlot = node.dataSlot;
    element.append(content);
    return element;
  }

  applyLayoutRule(element, rule);
  const contentShadow = panelEffects ? (rule.Shadow ?? 0) : 0;
  for (const child of node.children ?? []) {
    element.append(renderNode(child, dataSet, renderSet, parallaxNodes, child.type === "Container" ? contentShadow : 0));
  }

  if (node.type === "ActivePanel" || node.type === "AggregateActivePanel") {
    element.dataset.planeActive = "";
    const release = () => element.removeAttribute("data-plane-pressed");
    element.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;
      element.setAttribute("data-plane-pressed", "");
      element.setPointerCapture?.(event.pointerId);
    });
    element.addEventListener("pointerup", release);
    element.addEventListener("pointercancel", release);
    element.addEventListener("lostpointercapture", release);
  }
  return element;
}

function bindParallax(root, nodes) {
  activeParallax.get(root)?.cancel();

  if (nodes.length === 0) {
    activeParallax.delete(root);
    return;
  }

  const controller = new AbortController();
  let frame = 0;
  const cancel = () => {
    controller.abort();
    if (frame) cancelAnimationFrame(frame);
  };
  activeParallax.set(root, { cancel });
  let point = null;

  function apply() {
    frame = 0;
    if (!point) return;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = ((point.x - rect.left) / rect.width) * 2 - 1;
    const ny = ((point.y - rect.top) / rect.height) * 2 - 1;

    for (const { element, parallax } of nodes) {
      element.style.translate = `${nx * parallax}px ${ny * parallax}px`;
    }
  }

  root.addEventListener("pointermove", event => {
    point = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(apply);
  }, { signal: controller.signal });

  root.addEventListener("pointerleave", () => {
    point = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    for (const { element } of nodes) element.style.translate = "";
  }, { signal: controller.signal });
}

export function renderPlaneCode(root, objectPlan, dataSet, renderSet) {
  root.style.setProperty("--panel-spacing", `${renderSet.PanelSpacing}px`);
  root.style.setProperty("--background-color", renderSet.BackgroundColor);
  root.style.setProperty("--panel-color", renderSet.PanelColor);
  root.style.setProperty("--border-color", renderSet.BorderColor);
  root.style.setProperty("--text-color", renderSet.TextColor);

  const parallaxNodes = [];
  const roots = Array.isArray(objectPlan) ? objectPlan : [objectPlan];
  root.replaceChildren(...roots.map(node => renderNode(node, dataSet, renderSet, parallaxNodes)));
  bindParallax(root, parallaxNodes);
}

export function patchSetData(root, nextData, renderSet) {
  for (const element of root.querySelectorAll("[data-plane-data-slot]")) {
    const slot = element.dataset.planeDataSlot;
    const content = element.querySelector(":scope > [data-plane-container-content]");
    if (!content) continue;
    const node = { type: "Container", dataSlot: slot, Orientation: element.dataset.planeOrientation };
    const rule = {};
    const visual = element.__planeVisual ?? rule;
    const owner = element.parentElement;
    const shadow = owner?.__planeVisual?.Shadow ?? 0;
    content.replaceChildren(...sourcesFromData(node, nextData).map(source => renderSource(source, renderSet, visual, shadow)));
  }
}
