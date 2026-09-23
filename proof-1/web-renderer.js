function renderNode(node, data) {
  const element = document.createElement("div");
  element.dataset.planeType = node.type;
  if (node.id) element.dataset.planeId = node.id;

  if (node.type === "Container") {
    if (node.content !== "Text") {
      throw new Error(`Proof-2 supports Text Container only: ${node.id ?? "unnamed"}`);
    }
    element.textContent = data[node.id] ?? "";
    return element;
  }

  for (const child of node.children ?? []) {
    element.append(renderNode(child, data));
  }

  return element;
}

export function renderPlaneCode(root, planeCode, data, renderSet) {
  root.style.setProperty("--panel-spacing", `${renderSet.PanelSpacing}px`);
  root.style.setProperty("--background-color", renderSet.BackgroundColor);
  root.style.setProperty("--panel-color", renderSet.PanelColor);
  root.style.setProperty("--border-color", renderSet.BorderColor);
  root.style.setProperty("--text-color", renderSet.TextColor);
  root.style.setProperty("--panel-depth", `${renderSet.PanelDepth}px`);
  root.style.setProperty("--panel-depth-color", renderSet.PanelDepthColor);
  root.replaceChildren(renderNode(planeCode, data));
}
