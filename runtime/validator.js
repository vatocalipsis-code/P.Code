function isTransparency(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isCanonicalPngFile(value) {
  return typeof value === "string"
    && value.length > 0
    && !/^[a-z][a-z0-9+.-]*:/i.test(value)
    && /\.png$/i.test(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value) {
  return isFiniteNumber(value) && value >= 0;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

const ALIGNMENTS = new Set(["Start", "Center", "End", "Stretch"]);
const DISTRIBUTIONS = new Set(["Start", "Center", "End", "Between", "Around", "Evenly"]);
const DIRECTIONS = new Set(["Horizontal", "Vertical"]);

const STRING_RULES = [
  "Background", "BorderColor", "BorderLeftColor", "BorderRightColor",
  "BorderTopColor", "BorderBottomColor", "TextColor", "PictureTint"
];

const NON_NEGATIVE_RULES = [
  "BorderWidth", "BorderLeftWidth", "BorderRightWidth", "BorderTopWidth",
  "BorderBottomWidth", "Width", "Height", "Padding", "Gap", "FontSize"
];

export function validatePLang(pLang, data = {}) {
  const logins = new Set();
  function visit(node) {
    if (!node || typeof node !== "object") throw new Error("Validator: invalid PLang entity");
    if (typeof node.Login !== "string" || node.Login.length === 0) {
      throw new Error(`Validator: missing Login for ${node.type ?? "entity"}`);
    }
    if (logins.has(node.Login)) throw new Error(`Validator: duplicate Login "${node.Login}"`);
    logins.add(node.Login);
    const directVisual = {};
    for (const [key, value] of Object.entries(node)) {
      if (!["type", "Login", "id", "Orientation", "OnPress", "OffPress", "children"].includes(key)) directVisual[key] = value;
    }
    validateVisualRule(directVisual, `SetLang object "${node.Login}"`);

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

function validateVisualRule(rule, label) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) throw new Error(`Validator: Visual for ${label} must be an object`);
  for (const property of STRING_RULES) if (rule[property] !== undefined && !isNonEmptyString(rule[property])) throw new Error(`Validator: ${property} for ${label} must be a non-empty string`);
  for (const property of NON_NEGATIVE_RULES) if (rule[property] !== undefined && !isNonNegativeNumber(rule[property])) throw new Error(`Validator: ${property} for ${label} must be non-negative`);
  if (rule.FontWeight !== undefined && (!Number.isInteger(rule.FontWeight) || rule.FontWeight < 1 || rule.FontWeight > 1000)) throw new Error(`Validator: FontWeight for ${label} must be 1..1000`);
  if (rule.Alignment !== undefined && !ALIGNMENTS.has(rule.Alignment)) throw new Error(`Validator: invalid Alignment for ${label}`);
  if (rule.Distribution !== undefined && !DISTRIBUTIONS.has(rule.Distribution)) throw new Error(`Validator: invalid Distribution for ${label}`);
  if (rule.Direction !== undefined && !DIRECTIONS.has(rule.Direction)) throw new Error(`Validator: invalid Direction for ${label}`);
  if (rule.Parallax !== undefined && !isFiniteNumber(rule.Parallax)) throw new Error(`Validator: invalid Parallax for ${label}`);
}

export function validateSetRender(renderSet = {}) {
  for (const forbidden of ["Elements", "Types", "Global"]) if (renderSet[forbidden] !== undefined) throw new Error(`Validator: SetRender.${forbidden} is forbidden; object visuals belong to SetLang`);
  for (const property of ["Transparency", "TextTransparency", "PictureTransparency"]) if (!isTransparency(renderSet[property])) throw new Error(`Validator: SetRender.${property} must be 0..1`);
  if (renderSet.Parallax !== undefined && !isFiniteNumber(renderSet.Parallax)) throw new Error("Validator: SetRender.Parallax must be finite");
  return true;
}
