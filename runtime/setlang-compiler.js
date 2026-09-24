const STRUCTURAL = new Set(["type", "Login", "id", "Orientation", "OnPress", "OffPress", "children"]);

function compileNode(node) {
  const visual = {};
  for (const [key, value] of Object.entries(node)) {
    if (!STRUCTURAL.has(key)) visual[key] = value;
  }
  const compiled = { type: node.type, Login: node.Login, Visual: Object.freeze(visual) };
  if (node.id !== undefined) compiled.id = node.id;
  if (node.Orientation !== undefined) compiled.Orientation = node.Orientation;
  if (node.OnPress !== undefined) compiled.OnPress = node.OnPress;
  if (node.OffPress !== undefined) compiled.OffPress = node.OffPress;
  if (node.type === "Container") compiled.dataSlot = node.Login;
  compiled.children = Object.freeze((node.children ?? []).map(compileNode));
  return Object.freeze(compiled);
}

export function compileSetLang(setLangData) {
  return Object.freeze((Array.isArray(setLangData) ? setLangData : [setLangData]).map(compileNode));
}
