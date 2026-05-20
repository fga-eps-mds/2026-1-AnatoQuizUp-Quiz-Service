export function normalizarEspacos(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
