/**
 * Legacy composition utility retained for historical compatibility/tests.
 *
 * The current 2.9.0 browser entry point does not import this module. Its
 * generic children traversal describes the older composition path, not the
 * current typed SetLang/SPL grammar.
 */

function collectLogins(nodes, seen = new Set()) {
  for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
    if (!node || typeof node !== "object") throw new Error("Compositor: invalid PLang entity");
    if (typeof node.Login !== "string" || node.Login.length === 0) {
      throw new Error(`Compositor: missing Login for ${node.type ?? "entity"}`);
    }
    if (seen.has(node.Login)) throw new Error(`Compositor: duplicate Login "${node.Login}"`);
    seen.add(node.Login);
    collectLogins(node.children ?? [], seen);
  }
  return seen;
}

function composeContainer(node, data) {
  const item = data[node.Login] ?? {};
  const sources = [];

  const hasText = typeof item.SourceText === "string" && item.SourceText.length > 0;
  const hasPicture = typeof item.SourcePicture === "string" && item.SourcePicture.length > 0;

  const textSource = hasText ? { kind: "Text", value: item.SourceText } : null;
  const pictureSource = hasPicture ? { kind: "Picture", value: item.SourcePicture } : null;

  if (textSource && pictureSource) {
    if (node.Orientation === "Negative") sources.push(textSource, pictureSource);
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
