// Opcoes academicas exibidas no cadastro/perfil do aluno.

// Valor padrao para quem nao se enquadra nas opcoes (ex.: publico geral).
export const VALOR_NAO_SE_APLICA = "Não se aplica";

// Codigos internos de escolaridade (persistidos no banco).
export const ESCOLARIDADES_ALUNO = [
  "ENSINO_FUNDAMENTAL",

  "ENSINO_MEDIO",

  "GRADUACAO",

  "POS_GRADUACAO",

  "OUTRO",
] as const;

// Rotulos legiveis de escolaridade (exibidos na interface).
export const ESCOLARIDADES_ALUNO_OPCOES = [
  "Ensino Fundamental",

  "Ensino Médio",

  "Graduação",

  "Pós-graduação",

  "Outro",
] as const;

// Instituicoes de ensino disponiveis para selecao.
export const INSTITUICOES_ALUNO_OPCOES = [
  VALOR_NAO_SE_APLICA,

  "Universidade de Brasilia",

  "Centro Universitario de Brasilia",

  "Universidade Catolica de Brasilia",

  "Instituto Federal de Brasilia",
] as const;

// Cursos disponiveis para selecao.
export const CURSOS_ALUNO_OPCOES = [
  VALOR_NAO_SE_APLICA,

  "Medicina",

  "Enfermagem",

  "Fisioterapia",

  "Biomedicina",

  "Educacao Fisica",
] as const;

// Periodos/semestres letivos disponiveis para selecao.
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

// Uniao dos codigos de escolaridade aceitos.
export type EscolaridadeAluno = (typeof ESCOLARIDADES_ALUNO)[number];
