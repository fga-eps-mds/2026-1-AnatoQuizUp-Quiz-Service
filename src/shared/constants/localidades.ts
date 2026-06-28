// Dados de localidades do Brasil usados no cadastro/perfil (estados e capitais).

// Siglas das UFs, na ordem alfabetica padrao.
export const ESTADOS_BRASILEIROS = [
  "AC",

  "AL",

  "AP",

  "AM",

  "BA",

  "CE",

  "DF",

  "ES",

  "GO",

  "MA",

  "MT",

  "MS",

  "MG",

  "PA",

  "PB",

  "PR",

  "PE",

  "PI",

  "RJ",

  "RN",

  "RS",

  "RO",

  "RR",

  "SC",

  "SP",

  "SE",

  "TO",
] as const;

// Uniao das siglas validas de UF.
export type UfBrasileira = (typeof ESTADOS_BRASILEIROS)[number];

// Estados com sigla e nome por extenso (para exibicao em selects).
export const ESTADOS_BRASIL: { sigla: UfBrasileira; nome: string }[] = [
  { sigla: "AC", nome: "Acre" },

  { sigla: "AL", nome: "Alagoas" },

  { sigla: "AP", nome: "Amapa" },

  { sigla: "AM", nome: "Amazonas" },

  { sigla: "BA", nome: "Bahia" },

  { sigla: "CE", nome: "Ceara" },

  { sigla: "DF", nome: "Distrito Federal" },

  { sigla: "ES", nome: "Espirito Santo" },

  { sigla: "GO", nome: "Goias" },

  { sigla: "MA", nome: "Maranhao" },

  { sigla: "MT", nome: "Mato Grosso" },

  { sigla: "MS", nome: "Mato Grosso do Sul" },

  { sigla: "MG", nome: "Minas Gerais" },

  { sigla: "PA", nome: "Para" },

  { sigla: "PB", nome: "Paraiba" },

  { sigla: "PR", nome: "Parana" },

  { sigla: "PE", nome: "Pernambuco" },

  { sigla: "PI", nome: "Piaui" },

  { sigla: "RJ", nome: "Rio de Janeiro" },

  { sigla: "RN", nome: "Rio Grande do Norte" },

  { sigla: "RS", nome: "Rio Grande do Sul" },

  { sigla: "RO", nome: "Rondonia" },

  { sigla: "RR", nome: "Roraima" },

  { sigla: "SC", nome: "Santa Catarina" },

  { sigla: "SP", nome: "Sao Paulo" },

  { sigla: "SE", nome: "Sergipe" },

  { sigla: "TO", nome: "Tocantins" },
];

// Capital de cada UF (lista por estado para preenchimento de cidade).
export const CIDADES_CAPITAIS_POR_UF: Record<UfBrasileira, string[]> = {
  AC: ["Rio Branco"],

  AL: ["Maceio"],

  AP: ["Macapa"],

  AM: ["Manaus"],

  BA: ["Salvador"],

  CE: ["Fortaleza"],

  DF: ["Brasilia"],

  ES: ["Vitoria"],

  GO: ["Goiania"],

  MA: ["Sao Luis"],

  MT: ["Cuiaba"],

  MS: ["Campo Grande"],

  MG: ["Belo Horizonte"],

  PA: ["Belem"],

  PB: ["Joao Pessoa"],

  PR: ["Curitiba"],

  PE: ["Recife"],

  PI: ["Teresina"],

  RJ: ["Rio de Janeiro"],

  RN: ["Natal"],

  RS: ["Porto Alegre"],

  RO: ["Porto Velho"],

  RR: ["Boa Vista"],

  SC: ["Florianopolis"],

  SP: ["Sao Paulo"],

  SE: ["Aracaju"],

  TO: ["Palmas"],
};
