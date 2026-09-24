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

function structuralColor(color, renderSet) {
  return `color-mix(in srgb, ${color} ${structuralPercent(renderSet.Transparency)}, transparent)`;
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

function applyBoxRule(element, rule = {}, renderSet) {
  if (rule.Background !== undefined) {
    element.style.setProperty("--plane-background", rule.Background);
    element.dataset.planeBackground = "present";
  } else {
    element.dataset.planeBackground = "absent";
  }

  if (rule.BorderColor !== undefined) element.style.borderColor = structuralColor(rule.BorderColor, renderSet);
  if (rule.BorderWidth !== undefined) element.style.borderWidth = px(rule.BorderWidth);

  for (const side of ["Left", "Right", "Top", "Bottom"]) {
    if (rule[`Border${side}Color`] !== undefined) element.style[`border${side}Color`] = structuralColor(rule[`Border${side}Color`], renderSet);
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

function renderSource(source, renderSet, rule) {
  if (source.kind === "Text") {
    const text = document.createElement("span");
    text.dataset.planeSource = "Text";
    text.textContent = source.value;
    text.style.opacity = opacityFromTransparency(renderSet.TextTransparency);
    if (rule?.TextColor !== undefined) text.style.color = rule.TextColor;
    if (rule?.FontSize !== undefined) text.style.fontSize = px(rule.FontSize);
    if (rule?.FontWeight !== undefined) text.style.fontWeight = String(rule.FontWeight);
    return text;
  }

  if (source.kind === "Picture") {
    if (rule?.PictureTint !== undefined) {
      const picture = document.createElement("span");
      picture.dataset.planeSource = "Picture";
      picture.dataset.planePictureTint = "present";
      picture.style.opacity = opacityFromTransparency(renderSet.PictureTransparency);

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
    return image;
  }

  throw new Error(`WebRenderer: unsupported source kind "${source.kind}"`);
}

function renderNode(node, renderSet, parallaxNodes) {
  const element = document.createElement("div");
  element.dataset.planeType = node.type;
  if (node.id) element.dataset.planeId = node.id;
  if (node.Login) element.dataset.planeLogin = node.Login;

  const rule = renderSet.Elements?.[node.Login] ?? {};
  element.style.setProperty("--plane-structural-opacity", structuralPercent(renderSet.Transparency));
  applyBoxRule(element, rule, renderSet);

  const parallax = rule.Parallax ?? renderSet.Parallax ?? 0;
  if (parallax !== 0) parallaxNodes.push({ element, parallax });

  if (node.type === "Container") {
    const content = document.createElement("div");
    content.dataset.planeContainerContent = "";
    if (node.singleSource) content.dataset.planeSingleSource = "";
    applyLayoutRule(content, rule);
    for (const source of node.sources ?? []) content.append(renderSource(source, renderSet, rule));
    element.append(content);
    return element;
  }

  applyLayoutRule(element, rule);
  for (const child of node.children ?? []) element.append(renderNode(child, renderSet, parallaxNodes));

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

export function renderPlaneCode(root, composition, renderSet) {
  root.style.setProperty("--panel-spacing", `${renderSet.PanelSpacing}px`);
  root.style.setProperty("--background-color", renderSet.BackgroundColor);
  root.style.setProperty("--panel-color", renderSet.PanelColor);
  root.style.setProperty("--border-color", renderSet.BorderColor);
  root.style.setProperty("--text-color", renderSet.TextColor);

  const parallaxNodes = [];
  const roots = Array.isArray(composition) ? composition : [composition];
  root.replaceChildren(...roots.map(node => renderNode(node, renderSet, parallaxNodes)));
  bindParallax(root, parallaxNodes);
}
