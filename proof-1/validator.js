export function validateSetData(planeCode, data) {
  const containerIds = [];

  function collect(node) {
    if (node.type === "Container") containerIds.push(node.id);
    for (const child of node.children ?? []) collect(child);
  }

  collect(planeCode);

  for (const id of containerIds) {
    const item = data[id];
    if (!item || typeof item !== "object") {
      throw new Error(`Validator: missing data for Container "${id}"`);
    }
    if (item.type !== "Text" && item.type !== "Image") {
      throw new Error(`Validator: unsupported type "${item.type}" for Container "${id}"`);
    }
    if (typeof item.value !== "string" || item.value.length === 0) {
      throw new Error(`Validator: invalid value for Container "${id}"`);
    }
  }

  return true;
}
