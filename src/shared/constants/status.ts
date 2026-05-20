export const STATUS = {
  PENDENTE: "PENDENTE",

  ATIVO: "ATIVO",

  INATIVO: "INATIVO",

  RECUSADO: "RECUSADO",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];
