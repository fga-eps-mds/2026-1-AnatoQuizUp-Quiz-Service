import type { Prisma } from "@prisma/client";

// Tipo derivado do Prisma: formato exato da resolucao+questao retornada do banco
// no historico, com tema e alternativas. Mantem o select e o tipo em sincronia.
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
        origemQuestao: true;
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
