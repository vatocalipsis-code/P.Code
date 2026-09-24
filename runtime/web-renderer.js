function opacityFromTransparency(value) {
  return String(1 - value);
}

function structuralPercent(transparency) {
  return `${(1 - transparency) * 100}%`;
}

function renderSource(source, renderSet) {
  if (source.kind === "Text") {
    const text = document.createElement("span");
    text.dataset.planeSource = "Text";
    text.textContent = source.value;
    text.style.opacity = opacityFromTransparency(renderSet.TextTransparency);
    return text;
  }

  if (source.kind === "Picture") {
    const image = document.createElement("img");
    image.dataset.planeSource = "Picture";
    image.src = source.value;
    image.alt = "";
    image.style.opacity = opacityFromTransparency(renderSet.PictureTransparency);
    return image;
  }

  throw new Error(`WebRenderer: unsupported source kind "${source.kind}"`);
}

function renderNode(node, renderSet) {
  const element = document.createElement("div");
  element.dataset.planeType = node.type;
  if (node.id) element.dataset.planeId = node.id;
  if (node.Login) element.dataset.planeLogin = node.Login;

  const renderRule = renderSet.Elements?.[node.Login];
  element.style.setProperty("--plane-structural-opacity", structuralPercent(renderSet.Transparency));

  if (renderRule?.Background !== undefined) {
    element.style.setProperty("--plane-background", renderRule.Background);
    element.dataset.planeBackground = "present";
  } else {
    element.dataset.planeBackground = "absent";
  }

  if (node.type === "Container") {
    const content = document.createElement("div");
    content.dataset.planeContainerContent = "";
    if (node.singleSource) content.dataset.planeSingleSource = "";
    for (const source of node.sources ?? []) content.append(renderSource(source, renderSet));
    element.append(content);
    return element;
  }

  for (const child of node.children ?? []) element.append(renderNode(child, renderSet));
  return element;
}

export function renderPlaneCode(root, composition, renderSet) {
  root.style.setProperty("--panel-spacing", `${renderSet.PanelSpacing}px`);
  root.style.setProperty("--background-color", renderSet.BackgroundColor);
  root.style.setProperty("--panel-color", renderSet.PanelColor);
  root.style.setProperty("--border-color", renderSet.BorderColor);
  root.style.setProperty("--text-color", renderSet.TextColor);
  const roots = Array.isArray(composition) ? composition : [composition];
  root.replaceChildren(...roots.map(node => renderNode(node, renderSet)));
}
