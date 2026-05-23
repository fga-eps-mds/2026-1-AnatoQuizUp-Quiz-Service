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
      findMany: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
    },
    tema: {
      findMany: jest.fn(),
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

  test("Deve contar a quantidade de questões por tema e dificuldade", async () => {
    await repository.buscarQuantidadeDeQuestoesPorTema();

    expect(prisma.tema.findMany).toHaveBeenCalledWith({
      select: {
        nome: true,
        questoes: {
          select: {
            dificuldade: true,
          },
        },
        _count: {
          select: {
            questoes: true,
          },
        },
      },
    });

    expect(prisma.tema.findMany).toHaveBeenCalledTimes(1);
  });

  test("deve listar questões respondidas com filtros e paginação", async () => {
    const filtros: FiltroListarQuestoesQueryDto = {
      tema: "tema-id",
      dificuldade: DIFICULDADE_API.MEDIA,
      tipo: TIPO_QUESTAO_API.MULTIPLA_ESCOLHA,
    };

    const paginacao = {
      skip: 0,
      limit: 5,
      page: 1,
    };

    const where = {
      usuarioId: "usuario-1",
      excluidoEm: null,
      questao: {
        dificuldade: "MEDIA",
        excluidoEm: null,
        status: "ATIVO",
        temaId: "tema-id",
        tipoQuestao: "MULTIPLA_ESCOLHA",
      },
    };
    await repository.listarQuestoesRespondidas("usuario-1", paginacao, filtros);

    const select = {
      id: true,
      questaoId: true,
      respostaMarcada: true,
      criadoEm: true,
      questao: {
        select: {
          enunciado: true,
          tipoQuestao: true,
          respostaCorreta: true,
          saibaMais: true,
          status: true,
          feitoPorIa: true,
          urlImagem: true,
          dificuldade: true,
          tema: {
            select: {
              id: true,
              nome: true,
            },
          },
          alternativas: {
            select: {
              alternativaA: true,
              alternativaB: true,
              alternativaC: true,
              alternativaD: true,
              alternativaE: true,
            },
          },
        },
      },
    };

    expect(prisma.resolucaoQuestao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        distinct: ["questaoId"],
        where,
        select,
        skip: 0,
        take: 5,
        orderBy: {
          criadoEm: "desc",
        },
      }),
    );

    expect(prisma.resolucaoQuestao.groupBy).toHaveBeenCalledWith({
      by: ["questaoId"],

      where: {
        usuarioId: "usuario-1",
        excluidoEm: null,

        questao: {
          excluidoEm: null,
          status: "ATIVO",

          temaId: "tema-id",
          dificuldade: "MEDIA",
          tipoQuestao: "MULTIPLA_ESCOLHA",
        },
      },
    });

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  test("Deve retornar a quantidade de respostas por questão respondida", async () => {
    const questoesIds = ["id-1", "id-2"];
    const usuarioId = "id-usuario";
    await repository.buscarQuantidadeRespostasQuestoes(usuarioId, questoesIds);

    expect(prisma.resolucaoQuestao.groupBy).toHaveBeenCalledWith({
      by: ["questaoId", "respostaMarcada"],
      where: {
        questaoId: {
          in: questoesIds,
        },
        usuarioId,
        excluidoEm: null,
      },
      _count: {
        _all: true,
      },
    });
  });
});
