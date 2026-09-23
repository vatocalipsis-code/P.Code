function renderNode(node, data, spacing) {
  const element = document.createElement("div");
  element.dataset.planeType = node.type;
  if (node.id) element.dataset.planeId = node.id;

  if (node.type === "Container") {
    if (node.content !== "Text") {
      throw new Error(`Proof-1 supports Text Container only: ${node.id ?? "unnamed"}`);
    }
    element.textContent = data[node.id] ?? "";
    return element;
  }

  if (node.type === "SimplePanel" || node.type === "ActivePanel") {
    element.style.marginLeft = `${spacing}px`;
    element.style.marginRight = `${spacing}px`;
  }

  for (const child of node.children ?? []) {
    element.append(renderNode(child, data, spacing));
  }

  return element;
}

export function renderPlaneCode(root, planeCode, data, renderSet) {
  root.style.setProperty("--panel-spacing", `${renderSet.PanelSpacing}px`);
  root.replaceChildren(renderNode(planeCode, data, renderSet.PanelSpacing));
}
