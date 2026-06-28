// Status de usuario usado na autenticacao (espelha o do Usuario-Service).
export const STATUS = {
  PENDENTE: "PENDENTE",

  ATIVO: "ATIVO",

  INATIVO: "INATIVO",

  RECUSADO: "RECUSADO",
} as const;

// Uniao dos valores possiveis de status.
export type Status = (typeof STATUS)[keyof typeof STATUS];
