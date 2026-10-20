export function validateInventory(data) {
  if (!data || !Array.isArray(data.items) || !Array.isArray(data.history)) {
    throw new Error("Backup ou estoque inválido.");
  }
  const ids = new Set();
  const names = new Set();
  const quantity = (n) =>
    typeof n === "number" &&
    Number.isFinite(n) &&
    n >= 0 &&
    n <= 999999999 &&
    Math.abs(n * 1000 - Math.round(n * 1000)) < 0.0001;
  for (const item of data.items) {
    if (
      !item ||
      typeof item.id !== "string" ||
      item.id.length > 100 ||
      ids.has(item.id) ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      item.name.length > 80 ||
      typeof item.category !== "string" ||
      item.category.length > 80 ||
      !["kg", "g", "L", "mL", "un"].includes(item.unit) ||
      !quantity(item.quantity) ||
      !quantity(item.minimum)
    ) {
      throw new Error("Ingrediente inválido.");
    }
    const name = item.name.trim().toLocaleLowerCase("pt-BR");
    if (names.has(name)) throw new Error("Ingrediente duplicado.");
    ids.add(item.id);
    names.add(name);
  }
  const movementIds = new Set();
  for (const movement of data.history) {
    if (
      !movement ||
      typeof movement.id !== "string" ||
      movementIds.has(movement.id) ||
      !ids.has(movement.itemId) ||
      typeof movement.name !== "string" ||
      !movement.name.trim() ||
      movement.name.length > 80 ||
      !["entrada", "saída"].includes(movement.type) ||
      !quantity(movement.amount) ||
      movement.amount === 0 ||
      !["kg", "g", "L", "mL", "un"].includes(movement.unit) ||
      typeof movement.date !== "string" ||
      !Number.isFinite(Date.parse(movement.date)) ||
      typeof movement.note !== "string" ||
      movement.note.length > 160
    ) {
      throw new Error("Movimentação inválida.");
    }
    movementIds.add(movement.id);
  }
  return data;
}
