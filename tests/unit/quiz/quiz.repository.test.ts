import { prisma } from "@/config/db";
import type { FiltroListarQuestoesQueryDto } from "@/modules/questao/dto/questao.types";
import { DIFICULDADE_API, TIPO_QUESTAO_API } from "@/modules/questao/dto/questao.types";
import { QuizRepository } from "@/modules/quiz/quiz.repository";

jest.mock("@/config/db", () => ({
  prisma: {
    $transaction: jest.fn(),

    questao: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
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

    const resposta = await repository.filtrar_questoes_quiz(paginacao, filtros);

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
});
