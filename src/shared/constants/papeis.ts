// Papeis de acesso do sistema, usados nos middlewares de autorizacao.
export const PAPEIS = {
  ALUNO: "ALUNO",

  PROFESSOR: "PROFESSOR",

  ADMINISTRADOR: "ADMINISTRADOR",
} as const;

// Uniao dos valores possiveis de papel.
export type Papel = (typeof PAPEIS)[keyof typeof PAPEIS];

// Status possiveis do cadastro de um usuario.
export const STATUS_USUARIO = {
  PENDENTE: "PENDENTE",

  ATIVO: "ATIVO",

  INATIVO: "INATIVO",

  RECUSADO: "RECUSADO",
} as const;

// Uniao dos valores possiveis de status de usuario.
export type StatusUsuario = (typeof STATUS_USUARIO)[keyof typeof STATUS_USUARIO];
