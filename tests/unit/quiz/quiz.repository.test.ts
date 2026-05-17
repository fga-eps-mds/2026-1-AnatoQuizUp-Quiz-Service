import { prisma } from "@/config/db";
import type { FiltroListarQuestoesQueryDto } from "@/modules/questoes/dto/question.types";
import { DIFICULDADE_API, TIPO_QUESTAO_API } from "@/modules/questoes/dto/question.types";
import { QuizRepository } from "@/modules/quiz/quiz.repository";
import { AlternativaQuestao } from "@prisma/client";

jest.mock("@/config/db", () => ({
  prisma: {
    $transaction: jest.fn(),

    questao: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    resolucaoQuestao: {
      create: jest.fn(),
    },
  },
}));

const transactionMock = prisma.$transaction as jest.Mock;

describe("Testa QuizRepository", () => {
  let repository: QuizRepository;

  beforeEach(() => {
    repository = new QuizRepository();
    jest.clearAllMocks();
  });

  test("deve filtrar questoes por tema, dificuldade e tipo com paginacao", async () => {
    const registros = [{ id: "questao-filtrada-1" }];
    const totalRegistros = 1;

    transactionMock.mockResolvedValue([registros, totalRegistros]);

    const filtros: FiltroListarQuestoesQueryDto = {
      tema: "Sistema Cardiovascular",
      dificuldade: DIFICULDADE_API.MEDIA,
      tipo: TIPO_QUESTAO_API.MULTIPLA_ESCOLHA,
    };

    const paginacao = { skip: 0, limit: 5, page: 1 };

    const resposta = await repository.filtrarQuestoesQuiz(paginacao, filtros);

    expect(prisma.questao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ATIVO",
          excluidoEm: null,
          dificuldade: "MEDIA",
          tipoQuestao: "MULTIPLA_ESCOLHA",
          tema: {
            nome: {
              contains: "Sistema Cardiovascular",
              mode: "insensitive",
            },
          },
        }),
        skip: 0,
        take: 5,
      }),
    );

    expect(prisma.questao.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ATIVO",
          dificuldade: "MEDIA",
        }),
      }),
    );

    expect(resposta).toEqual({ data: registros, total: totalRegistros });
  });

  test("Deve criar novo registro de resposta à questão de quiz", async () => {
    const usuario_id = "usuario_id";
    const tentativa = {
      questaoId: "questao-id",
      tipo: TIPO_QUESTAO_API.VERDADEIRO_FALSO,
      respostaMarcada: AlternativaQuestao.E,
    };

    await repository.registrarTentativa(tentativa, usuario_id);

    expect(prisma.resolucaoQuestao.create).toHaveBeenCalledWith({
      data: {
        questaoId: "questao-id",
        respostaMarcada: AlternativaQuestao.E,
        usuarioId: usuario_id,
      },
    });
  });

  test("Deve buscar um registro de tentativa de resposta", async () => {
    const id = "id-tentativa";
    await repository.buscarResposta(id);
    expect(prisma.questao.findUnique).toHaveBeenCalledWith({
      where: { id, excluidoEm: null },
      select: { respostaCorreta: true, saibaMais: true },
    });
  });
  test("deve contar questões filtradas por tema, dificuldade e tipo", async () => {

  const filtros: FiltroListarQuestoesQueryDto = {
    tema: "Sistema Cardiovascular",
    dificuldade: DIFICULDADE_API.MEDIA,
    tipo: TIPO_QUESTAO_API.MULTIPLA_ESCOLHA,
  };


  await repository.contarQuestoesQuiz(filtros);

  expect(prisma.questao.count).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        status: "ATIVO",
        excluidoEm: null,
        dificuldade: "MEDIA",
        tipoQuestao: "MULTIPLA_ESCOLHA",
        tema: {
          nome: {
            contains: "Sistema Cardiovascular",
            mode: "insensitive",
          },
        },
      }),
    }),
  );

});
});
