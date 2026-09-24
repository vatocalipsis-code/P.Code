export function validatePLang(pLang, data = {}) {
  const logins = new Set();

  function visit(node) {
    if (!node || typeof node !== "object") throw new Error("Validator: invalid PLang entity");
    if (typeof node.login !== "string" || node.login.length === 0) {
      throw new Error(`Validator: missing Login for ${node.type ?? "entity"}`);
    }
    if (logins.has(node.login)) throw new Error(`Validator: duplicate Login "${node.login}"`);
    logins.add(node.login);

    if (node.type === "Container") {
      if (node.orientation !== undefined && node.orientation !== "Positive" && node.orientation !== "Negative") {
        throw new Error(`Validator: invalid Orientation "${node.orientation}" for Container "${node.login}"`);
      }

      const item = data[node.login];
      if (item !== undefined) {
        if (!item || typeof item !== "object") throw new Error(`Validator: invalid data for Container "${node.login}"`);
        if (item.sourceText !== undefined && typeof item.sourceText !== "string") {
          throw new Error(`Validator: invalid SourceText for Container "${node.login}"`);
        }
        if (item.sourcePicture !== undefined && typeof item.sourcePicture !== "string") {
          throw new Error(`Validator: current WebRenderer requires SourcePicture to be a string for Container "${node.login}"`);
        }
      }
    }

    for (const child of node.children ?? []) visit(child);
  }

  for (const root of Array.isArray(pLang) ? pLang : [pLang]) visit(root);
  return true;
}
