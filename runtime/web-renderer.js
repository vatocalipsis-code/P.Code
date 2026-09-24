function renderSource(source) {
  if (source.kind === "Text") {
    const text = document.createElement("span");
    text.dataset.planeSource = "Text";
    text.textContent = source.value;
    return text;
  }

  if (source.kind === "Picture") {
    const image = document.createElement("img");
    image.dataset.planeSource = "Picture";
    image.src = source.value;
    image.alt = "";
    return image;
  }

  throw new Error(`WebRenderer: unsupported source kind "${source.kind}"`);
}

function renderNode(node) {
  const element = document.createElement("div");
  element.dataset.planeType = node.type;
  if (node.id) element.dataset.planeId = node.id;
  if (node.Login) element.dataset.planeLogin = node.Login;

  if (node.type === "Container") {
    const content = document.createElement("div");
    content.dataset.planeContainerContent = "";
    if (node.singleSource) content.dataset.planeSingleSource = "";
    for (const source of node.sources ?? []) content.append(renderSource(source));
    element.append(content);
    return element;
  }

  for (const child of node.children ?? []) element.append(renderNode(child));
  return element;
}

export function renderPlaneCode(root, composition, renderSet) {
  root.style.setProperty("--panel-spacing", `${renderSet.PanelSpacing}px`);
  root.style.setProperty("--background-color", renderSet.BackgroundColor);
  root.style.setProperty("--panel-color", renderSet.PanelColor);
  root.style.setProperty("--border-color", renderSet.BorderColor);
  root.style.setProperty("--text-color", renderSet.TextColor);
  const roots = Array.isArray(composition) ? composition : [composition];
  root.replaceChildren(...roots.map(renderNode));
}
