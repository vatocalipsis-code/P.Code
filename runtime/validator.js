/**
 * PlaneCode contract validators.
 *
 * SetLang/SetData validation and SetRender validation stay separate. Object
 * properties belong to SetLang; SetRender is scene-only. Validation must not
 * invent defaults or semantics for unspecified values.
 */

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
const ORDERS = new Set(["Positive", "Negative"]);

const STRING_RULES = [
  "Background", "BorderColor", "BorderLeftColor", "BorderRightColor",
  "BorderTopColor", "BorderBottomColor", "TextColor", "PictureTint"
];

const NON_NEGATIVE_RULES = [
  "BorderWidth", "BorderLeftWidth", "BorderRightWidth", "BorderTopWidth",
  "BorderBottomWidth", "Width", "Height", "Padding", "Gap", "FontSize"
];

export function validatePLang(pLang, setData = {}) {
  if (!Array.isArray(pLang)) throw new Error("Validator: SetLang.Data must be BasePanel[]");
  const logins = new Set();
  const add = (login, label) => { if (!isNonEmptyString(login)) throw new Error(`Validator: ${label}.Login required`); if (logins.has(login)) throw new Error(`Validator: duplicate Login "${login}"`); logins.add(login); };
  const checkContainer = c => {
    add(c.Login,"Container");
    const p = c.Properties ?? {};
    validateVisualRule(p,`Container "${c.Login}"`, false);
    if (p.Order !== undefined && !ORDERS.has(p.Order)) throw new Error(`Validator: invalid Order for Container "${c.Login}"`);
    if (p.Orientation !== undefined && !DIRECTIONS.has(p.Orientation)) throw new Error(`Validator: invalid Orientation for Container "${c.Login}"`);
    if (p.Flip !== undefined && typeof p.Flip !== "boolean") throw new Error(`Validator: Flip for Container "${c.Login}" must be boolean`);
  };
  const checkActive = (a, aggregate=false) => { add(a.Login,aggregate?"AggregateActivePanel":"ActivePanel"); validateVisualRule(a.Properties ?? {},`${aggregate?"AggregateActivePanel":"ActivePanel"} "${a.Login}"`, true); if (!Array.isArray(a.Containers)) throw new Error(`Validator: ${a.Login}.Containers must be Container[]`); a.Containers.forEach(checkContainer); };
  const checkSimple = sp => { add(sp.Login,"SimplePanel"); const p={...(sp.Properties??{})}; const ag=p.AggregateActivePanels??[]; delete p.AggregateActivePanels; validateVisualRule(p,`SimplePanel "${sp.Login}"`, true); if(!Array.isArray(ag)||ag.length>1) throw new Error(`Validator: ${sp.Login}.Properties.AggregateActivePanels must contain 0..1 item`); ag.forEach(x=>checkActive(x,true)); if(!Array.isArray(sp.Containers)||!Array.isArray(sp.ActivePanels)) throw new Error(`Validator: ${sp.Login} typed arrays required`); sp.Containers.forEach(checkContainer); sp.ActivePanels.forEach(x=>checkActive(x,false)); };
  for (const bp of pLang) { add(bp.Login,"BasePanel"); validateVisualRule(bp.Properties??{},`BasePanel "${bp.Login}"`, false); if(!Array.isArray(bp.Containers)||!Array.isArray(bp.SimplePanels)) throw new Error(`Validator: ${bp.Login} typed arrays required`); bp.Containers.forEach(checkContainer); bp.SimplePanels.forEach(checkSimple); }
  for (const login of Object.keys(setData)) if (!logins.has(login)) throw new Error(`Validator: SetData references unknown Login "${login}"`);
  return true;
}

function validateVisualRule(rule, label, allowPanelEffects = false) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) throw new Error(`Validator: Visual for ${label} must be an object`);
  for (const property of STRING_RULES) if (rule[property] !== undefined && !isNonEmptyString(rule[property])) throw new Error(`Validator: ${property} for ${label} must be a non-empty string`);
  for (const property of NON_NEGATIVE_RULES) if (rule[property] !== undefined && !isNonNegativeNumber(rule[property])) throw new Error(`Validator: ${property} for ${label} must be non-negative`);
  if (rule.FontWeight !== undefined && (!Number.isInteger(rule.FontWeight) || rule.FontWeight < 1 || rule.FontWeight > 1000)) throw new Error(`Validator: FontWeight for ${label} must be 1..1000`);
  if (rule.Alignment !== undefined && !ALIGNMENTS.has(rule.Alignment)) throw new Error(`Validator: invalid Alignment for ${label}`);
  if (rule.Distribution !== undefined && !DISTRIBUTIONS.has(rule.Distribution)) throw new Error(`Validator: invalid Distribution for ${label}`);
  if (rule.Direction !== undefined && !DIRECTIONS.has(rule.Direction)) throw new Error(`Validator: invalid Direction for ${label}`);
  if (rule.Parallax !== undefined && !isFiniteNumber(rule.Parallax)) throw new Error(`Validator: invalid Parallax for ${label}`);
  if (rule.PanelTransparency !== undefined) {
    if (!allowPanelEffects) throw new Error(`Validator: PanelTransparency is not allowed for ${label}`);
    if (!isTransparency(rule.PanelTransparency)) throw new Error(`Validator: PanelTransparency for ${label} must be 0..1`);
  }
  if (rule.Shadow !== undefined) {
    if (!allowPanelEffects) throw new Error(`Validator: Shadow is not allowed for ${label}`);
    if (!isNonNegativeNumber(rule.Shadow)) throw new Error(`Validator: Shadow for ${label} must be non-negative`);
  }
}

export function validateSetRender(renderSet = {}) {
  for (const forbidden of ["Elements", "Types", "Global"]) if (renderSet[forbidden] !== undefined) throw new Error(`Validator: SetRender.${forbidden} is forbidden; object visuals belong to SetLang`);
  for (const property of ["Transparency", "TextTransparency", "PictureTransparency"]) if (!isTransparency(renderSet[property])) throw new Error(`Validator: SetRender.${property} must be 0..1`);
  if (renderSet.Parallax !== undefined && !isFiniteNumber(renderSet.Parallax)) throw new Error("Validator: SetRender.Parallax must be finite");
  return true;
}
