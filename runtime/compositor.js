function collectLogins(nodes, seen = new Set()) {
  for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
    if (!node || typeof node !== "object") throw new Error("Compositor: invalid PLang entity");
    if (typeof node.login !== "string" || node.login.length === 0) {
      throw new Error(`Compositor: missing Login for ${node.type ?? "entity"}`);
    }
    if (seen.has(node.login)) throw new Error(`Compositor: duplicate Login "${node.login}"`);
    seen.add(node.login);
    collectLogins(node.children ?? [], seen);
  }
  return seen;
}

function composeContainer(node, data) {
  const item = data[node.login] ?? {};
  const sources = [];

  const hasText = typeof item.sourceText === "string" && item.sourceText.length > 0;
  const hasPicture = typeof item.sourcePicture === "string" && item.sourcePicture.length > 0;

  const textSource = hasText ? { kind: "Text", value: item.sourceText } : null;
  const pictureSource = hasPicture ? { kind: "Picture", value: item.sourcePicture } : null;

  if (textSource && pictureSource) {
    if (node.orientation === "Negative") sources.push(textSource, pictureSource);
    else sources.push(pictureSource, textSource);
  } else if (textSource) {
    sources.push(textSource);
  } else if (pictureSource) {
    sources.push(pictureSource);
  }

  return {
    ...node,
    sources,
    singleSource: sources.length === 1
  };
}

function composeNode(node, data) {
  if (node.type === "Container") return composeContainer(node, data);
  return {
    ...node,
    children: (node.children ?? []).map(child => composeNode(child, data))
  };
}

export function composePLang(pLang, data) {
  collectLogins(pLang);
  return (Array.isArray(pLang) ? pLang : [pLang]).map(node => composeNode(node, data));
}
