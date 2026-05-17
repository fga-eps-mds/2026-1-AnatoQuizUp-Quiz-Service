export const VALOR_NAO_SE_APLICA = "Não se aplica";

export const ESCOLARIDADES_ALUNO = [
  "ENSINO_FUNDAMENTAL",

  "ENSINO_MEDIO",

  "GRADUACAO",

  "POS_GRADUACAO",

  "OUTRO",
] as const;

export const ESCOLARIDADES_ALUNO_OPCOES = [
  "Ensino Fundamental",

  "Ensino Médio",

  "Graduação",

  "Pós-graduação",

  "Outro",
] as const;

export const INSTITUICOES_ALUNO_OPCOES = [
  VALOR_NAO_SE_APLICA,

  "Universidade de Brasilia",

  "Centro Universitario de Brasilia",

  "Universidade Catolica de Brasilia",

  "Instituto Federal de Brasilia",
] as const;

export const CURSOS_ALUNO_OPCOES = [
  VALOR_NAO_SE_APLICA,

  "Medicina",

  "Enfermagem",

  "Fisioterapia",

  "Biomedicina",

  "Educacao Fisica",
] as const;

export const PERIODOS_ALUNO_OPCOES = [
  VALOR_NAO_SE_APLICA,

  "1o Periodo",

  "2o Periodo",

  "3o Periodo",

  "4o Periodo",

  "5o Periodo",

  "6o Periodo",

  "7o Periodo",

  "8o Periodo",

  "9o Periodo",

  "10o Periodo",

  "11o Periodo",

  "12o Periodo",
] as const;

export type EscolaridadeAluno = (typeof ESCOLARIDADES_ALUNO)[number];
