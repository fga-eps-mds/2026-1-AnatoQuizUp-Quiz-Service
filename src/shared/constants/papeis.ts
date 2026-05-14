export const PAPEIS = {
  ALUNO: "ALUNO",
  PROFESSOR: "PROFESSOR",
  ADMINISTRADOR: "ADMINISTRADOR",
} as const;

export type Papel = (typeof PAPEIS)[keyof typeof PAPEIS];

export const STATUS_USUARIO = {
  PENDENTE: "PENDENTE",
  ATIVO: "ATIVO",
  INATIVO: "INATIVO",
  RECUSADO: "RECUSADO",
} as const;

export type StatusUsuario = (typeof STATUS_USUARIO)[keyof typeof STATUS_USUARIO];
