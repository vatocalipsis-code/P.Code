function renderNode(node, data) {
  const element = document.createElement("div");
  element.dataset.planeType = node.type;
  if (node.id) element.dataset.planeId = node.id;

  if (node.type === "Container") {
    const item = data[node.id];

    if (item.type === "Text") {
      element.textContent = item.value;
      return element;
    }

    if (item.type === "Image") {
      const image = document.createElement("img");
      image.src = item.value;
      image.alt = "";
      element.append(image);
      return element;
    }
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
