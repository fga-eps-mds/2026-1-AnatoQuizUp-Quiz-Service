// Converte uma data em string ISO 8601 (formato usado nas respostas da API).
export function converterParaIsoString(value: Date): string {
  return value.toISOString();
}
