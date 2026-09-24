function collectCompositionLogins(composition, logins = new Set()) {
  for (const node of Array.isArray(composition) ? composition : [composition]) {
    if (!node || typeof node !== "object") continue;
    if (typeof node.Login === "string" && node.Login.length > 0) logins.add(node.Login);
    collectCompositionLogins(node.children ?? [], logins);
  }
  return logins;
}

export function validateRenderBindings(composition, renderSet = {}) {
  const available = collectCompositionLogins(composition);
  for (const login of Object.keys(renderSet.Elements ?? {})) {
    if (!available.has(login)) {
      throw new Error(`RenderBindings: SetRender key "${login}" has no target in the current composition`);
    }
  }
  return true;
}
