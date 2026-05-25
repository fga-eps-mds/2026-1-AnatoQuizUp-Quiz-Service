import type { Prisma } from "@prisma/client";

export type ListarQuestoesRespondidasItem = Prisma.ResolucaoQuestaoGetPayload<{
  select: {
    id: true;
    questaoId: true;
    respostaMarcada: true;
    criadoEm: true;

    questao: {
      select: {
        enunciado: true;
        tipoQuestao: true;
        respostaCorreta: true;
        saibaMais: true;
        status: true;
        feitoPorIa: true;
        urlImagem: true;
        dificuldade: true;

        tema: {
          select: {
            id: true;
            nome: true;
          };
        };

        alternativas: {
          select: {
            alternativaA: true;
            alternativaB: true;
            alternativaC: true;
            alternativaD: true;
            alternativaE: true;
          };
        };
      };
    };
  };
}>;
