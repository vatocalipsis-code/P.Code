function compileNode(node) {
  const compiled = {
    type: node.type,
    Login: node.Login,
    Visual: Object.freeze({ ...(node.Visual ?? {}) })
  };
  if (node.id !== undefined) compiled.id = node.id;
  if (node.Orientation !== undefined) compiled.Orientation = node.Orientation;
  if (node.OnPress !== undefined) compiled.OnPress = node.OnPress;
  if (node.OffPress !== undefined) compiled.OffPress = node.OffPress;
  if (node.type === "Container") compiled.dataSlot = node.Login;
  compiled.children = Object.freeze((node.children ?? []).map(compileNode));
  return Object.freeze(compiled);
}

export function compileSetLang(pLang) {
  const roots = (Array.isArray(pLang) ? pLang : [pLang]).map(compileNode);
  return Object.freeze(roots);
}
