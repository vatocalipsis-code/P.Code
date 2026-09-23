function applyStyle(element, style = {}) {
  Object.assign(element.style, style);
}

function renderNode(node, data, renderSet) {
  const element = document.createElement("div");
  element.dataset.planeType = node.type;
  if (node.id) element.dataset.planeId = node.id;
  applyStyle(element, renderSet[node.type]);

  if (node.type === "Container") {
    if (node.content !== "Text") {
      throw new Error(`Proof-1 supports Text Container only: ${node.id ?? "unnamed"}`);
    }
    element.textContent = data[node.id] ?? "";
    return element;
  }

  for (const child of node.children ?? []) {
    element.append(renderNode(child, data, renderSet));
  }

  return element;
}

export function renderPlaneCode(root, planeCode, data, renderSet) {
  root.replaceChildren(renderNode(planeCode, data, renderSet));
}
