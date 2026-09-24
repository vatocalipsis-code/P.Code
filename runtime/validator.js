export function validatePLang(pLang, data = {}) {
  const logins = new Set();

  function visit(node) {
    if (!node || typeof node !== "object") throw new Error("Validator: invalid PLang entity");
    if (typeof node.Login !== "string" || node.Login.length === 0) {
      throw new Error(`Validator: missing Login for ${node.type ?? "entity"}`);
    }
    if (logins.has(node.Login)) throw new Error(`Validator: duplicate Login "${node.Login}"`);
    logins.add(node.Login);

    if (node.type === "Container") {
      if (node.Orientation !== undefined && node.Orientation !== "Positive" && node.Orientation !== "Negative") {
        throw new Error(`Validator: invalid Orientation "${node.Orientation}" for Container "${node.Login}"`);
      }

      const item = data[node.Login];
      if (item !== undefined) {
        if (!item || typeof item !== "object") throw new Error(`Validator: invalid data for Container "${node.Login}"`);
        if (item.SourceText !== undefined && typeof item.SourceText !== "string") {
          throw new Error(`Validator: invalid SourceText for Container "${node.Login}"`);
        }
        if (item.SourcePicture !== undefined && typeof item.SourcePicture !== "string") {
          throw new Error(`Validator: current WebRenderer requires SourcePicture to be a string for Container "${node.Login}"`);
        }
      }
    }

    for (const child of node.children ?? []) visit(child);
  }

  for (const root of Array.isArray(pLang) ? pLang : [pLang]) visit(root);
  return true;
}
