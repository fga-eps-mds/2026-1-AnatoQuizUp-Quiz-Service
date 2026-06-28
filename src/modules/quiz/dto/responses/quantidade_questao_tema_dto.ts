import type { Dificuldade } from "@prisma/client";

// Contagem de questoes quebrada por nivel de dificuldade.
type QuantidadePorDificuldade = Record<Dificuldade, number>;

// Total de questoes de um tema, com o detalhamento por dificuldade.
export type QuantidadeQuestoesPorTema = {
  nome: string;
  totalQuestoes: number;
  porDificuldade: QuantidadePorDificuldade;
};
