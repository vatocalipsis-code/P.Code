function isTransparency(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isCanonicalPngFile(value) {
  return typeof value === "string"
    && value.length > 0
    && !/^[a-z][a-z0-9+.-]*:/i.test(value)
    && /\.png$/i.test(value);
}

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
        if (item.SourcePicture !== undefined && !isCanonicalPngFile(item.SourcePicture)) {
          throw new Error(`Validator: SourcePicture for Container "${node.Login}" must reference a PNG file`);
        }
      }
    }

    for (const child of node.children ?? []) visit(child);
  }

  for (const root of Array.isArray(pLang) ? pLang : [pLang]) visit(root);
  return true;
}

export function validateSetRender(pLang, renderSet = {}) {
  for (const property of ["Transparency", "TextTransparency", "PictureTransparency"]) {
    if (!isTransparency(renderSet[property])) {
      throw new Error(`Validator: SetRender.${property} must be a number from 0 to 1`);
    }
  }

  if (!renderSet.Elements || typeof renderSet.Elements !== "object") {
    throw new Error("Validator: SetRender.Elements is required");
  }

  function visit(node) {
    const rule = renderSet.Elements[node.Login];
    if (!rule || typeof rule.Background !== "string" || rule.Background.length === 0) {
      throw new Error(`Validator: Background is required for render element "${node.Login}"`);
    }
    for (const child of node.children ?? []) visit(child);
  }

  for (const root of Array.isArray(pLang) ? pLang : [pLang]) visit(root);
  return true;
}
