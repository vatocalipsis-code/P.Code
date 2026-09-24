/**
 * SetLang compiler.
 *
 * Converts typed SetLang.Data into the immutable internal Object Plan used by
 * the renderer. SetLang has no generic children[]; children below exist only
 * in the compiled runtime plan. This module does not read SetData or SetRender.
 */

function compileContainer(node) {
  return Object.freeze({ type: "Container", Login: node.Login, Visual: Object.freeze({ ...(node.Properties ?? {}) }), dataSlot: node.Login, children: Object.freeze([]) });
}
function compileActive(node, aggregate = false) {
  const p = { ...(node.Properties ?? {}) };
  const Orientation = p.Orientation; const OnPress = p.OnPress; const OffPress = p.OffPress;
  delete p.Orientation; delete p.OnPress; delete p.OffPress;
  const out = { type: aggregate ? "AggregateActivePanel" : "ActivePanel", Login: node.Login, Visual: Object.freeze(p), children: Object.freeze((node.Containers ?? []).map(compileContainer)) };
  if (Orientation !== undefined) out.Orientation = Orientation;
  if (OnPress !== undefined) out.OnPress = OnPress;
  if (OffPress !== undefined) out.OffPress = OffPress;
  return Object.freeze(out);
}
function compileSimple(node) {
  const p={...(node.Properties??{})}; const aggregates=p.AggregateActivePanels??[]; delete p.AggregateActivePanels;
  const children=[...(node.Containers??[]).map(compileContainer),...aggregates.filter(a=>a.Properties?.Visible!=="No").map(a=>compileActive(a,true)),...(node.ActivePanels??[]).map(a=>compileActive(a,false))];
  return Object.freeze({type:"SimplePanel",Login:node.Login,Visual:Object.freeze(p),children:Object.freeze(children)});
}
function compileBase(node) {
  return Object.freeze({type:"BasePanel",Login:node.Login,Visual:Object.freeze({...node.Properties}),children:Object.freeze([...(node.Containers??[]).map(compileContainer),...(node.SimplePanels??[]).map(compileSimple)])});
}
export function compileSetLang(setLangData) { return Object.freeze(setLangData.map(compileBase)); }
