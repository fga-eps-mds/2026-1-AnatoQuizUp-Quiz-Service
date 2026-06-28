// Normaliza espacos: remove os das pontas e colapsa sequencias em um unico espaco.
export function normalizarEspacos(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
