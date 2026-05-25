import type { Dificuldade } from "@prisma/client";

type QuantidadePorDificuldade = Record<Dificuldade, number>;

export type QuantidadeQuestoesPorTema = {
  nome: string;
  totalQuestoes: number;
  porDificuldade: QuantidadePorDificuldade;
};
