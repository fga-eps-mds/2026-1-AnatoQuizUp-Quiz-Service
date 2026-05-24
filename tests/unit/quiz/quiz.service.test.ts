import { QuizService } from "@/modules/quiz/quiz.service";
import { converterParaRespostaQuestaoQuiz } from "@/modules/quiz/dto/converter_para_resposta_questao_quiz";
import type { RespostaQuestaoQuizDto } from "@/modules/quiz/dto/resposta_questao_quiz_dto";
import type { QuizRepository } from "@/modules/quiz/quiz.repository";
import {
  DIFICULDADE_API,
  type FiltroListarQuestoesQueryDto,
  type RegistroQuestaoCompleta,
} from "@/modules/questoes/dto/question.types";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { MENSAGENS } from "@/shared/constants/mensagens";
import type { ResponderQuestaoQuizDto } from "@/modules/quiz/dto/responder_questao_quiz_dto";
import { PAPEIS } from "@/shared/constants/papeis";
import { AlternativaQuestao, Dificuldade, type ResolucaoQuestao } from "@prisma/client";

function criarQuestoes(
  ids: string[] = ["id-1", "id-2", "id-3", "id-4"],
): RegistroQuestaoCompleta[] {
  const agora = new Date("2026-05-09T12:00:00.000Z");

  return ids.map((id) => {
    return {
      id: id,
      enunciado: "Qual estrutura bombeia sangue para a aorta?",
      tipoQuestao: "MULTIPLA_ESCOLHA",
      respostaCorreta: "B",
      saibaMais: "O ventriculo esquerdo impulsiona sangue para a circulacao sistemica.",
      status: "ATIVO",
      feitoPorIa: false,
      urlImagem: "https://cdn.example.com/coracao.png",
      criadoPorId: "professor-1",
      temaId: "tema-1",
      questaoOriginalId: null,
      dificuldade: DIFICULDADE_API.MEDIA,
      criadoEm: agora,
      atualizadoEm: agora,
      excluidoEm: null,
      tema: {
        id: "tema-1",
        nome: "Sistema cardiovascular",
        criadoEm: agora,
        atualizadoEm: agora,
        excluidoEm: null,
      },
      alternativas: {
        id: "alternativas-1",
        alternativaA: "Atrio direito",
        alternativaB: "Ventriculo esquerdo",
        alternativaC: "Atrio esquerdo",
        alternativaD: "Ventriculo direito",
        alternativaE: "Veia cava",
        questaoId: "questao-1",
        criadoEm: agora,
        atualizadoEm: agora,
        excluidoEm: null,
      },
    };
  });
}

function converterArrayParaQuestoesQuiz(
  questoes_completas: RegistroQuestaoCompleta[],
): RespostaQuestaoQuizDto[] {
  return questoes_completas.map((questao) => converterParaRespostaQuestaoQuiz(questao));
}

function criarTentativa() {
  const agora = new Date("2026-05-09T12:00:00.000Z");
  return {
    id: "tentativa-id",
    criadoEm: agora,
    atualizadoEm: agora,
    excluidoEm: null,
    questaoId: "questao-id",
    respostaMarcada: AlternativaQuestao.E,
    usuarioId: "usuario-id",
  };
}

function criarFeedback(
  alternativa: AlternativaQuestao = AlternativaQuestao.E,
  dificuldade: Dificuldade = Dificuldade.MEDIA,
) {
  return {
    respostaCorreta: alternativa,
    saibaMais: "explicação",
    dificuldade,
  };
}

function criarResponderQuestaoQuizDto(): ResponderQuestaoQuizDto {
  return {
    questaoId: "questa-id",
    tipo: "MULTIPLA_ESCOLHA",
    respostaMarcada: "E",
  };
}

function criarRepositoryMock() {
  return {
    filtrarQuestoesQuiz: jest.fn<QuizRepository["filtrarQuestoesQuiz"]>(),
    registrarTentativa: jest.fn<QuizRepository["registrarTentativa"]>(),
    buscarResposta: jest.fn<QuizRepository["buscarResposta"]>(),
    buscarSaldoMoedas: jest.fn<QuizRepository["buscarSaldoMoedas"]>(),
    concederMoedasPorAcerto: jest.fn<QuizRepository["concederMoedasPorAcerto"]>(),
    contarQuestoesQuiz: jest.fn<QuizRepository["contarQuestoesQuiz"]>(),
    buscarQuantidadeDeQuestoesPorTema:
      jest.fn<QuizRepository["buscarQuantidadeDeQuestoesPorTema"]>(),
  } as unknown as jest.Mocked<QuizRepository>;
}

jest.retryTimes(3);
describe("Testa Quiz Service", () => {
  let repository: jest.Mocked<QuizRepository>;
  let quizService: QuizService;

  beforeEach(() => {
    repository = criarRepositoryMock();
    quizService = new QuizService(repository);
    repository.buscarSaldoMoedas.mockResolvedValue(0);
    jest.clearAllMocks();
  });

  test("Filtrar questoes para quiz", async () => {
    const mockRepositoryResponse = { data: criarQuestoes(), total: 4 };
    repository.filtrarQuestoesQuiz.mockResolvedValue(mockRepositoryResponse);

    const filtro: FiltroListarQuestoesQueryDto = {
      page: 1,
      limit: 4,
      tema: undefined,
      dificuldade: DIFICULDADE_API.DIFICIL,
      tipo: undefined,
    };

    const resultado = await quizService.buscarQuestoesQuiz(filtro);

    expect(repository.filtrarQuestoesQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        limit: 4,
      }),
      expect.objectContaining({
        dificuldade: DIFICULDADE_API.DIFICIL,
      }),
    );
    expect(resultado.metadados.total).toBe(4);
    expect(resultado.dados[0]).not.toHaveProperty("saibaMais");
    expect(resultado.dados[0]).not.toHaveProperty("respostaCorreta");
  });

  test("Deve calcular skip aleatório baseado no total de questões", async () => {
    repository.contarQuestoesQuiz.mockResolvedValue(20);

    repository.filtrarQuestoesQuiz.mockResolvedValue({
      data: criarQuestoes(),
      total: 20,
    });

    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const filtro: FiltroListarQuestoesQueryDto = {
      page: 1,
      limit: 4,
    };

    await quizService.buscarQuestoesQuiz(filtro);

    expect(repository.contarQuestoesQuiz).toHaveBeenCalledWith(filtro);

    expect(repository.filtrarQuestoesQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        limit: 4,
      }),
      filtro,
    );
  });

  test("Não deve alterar skip quando não houver questões", async () => {
    repository.contarQuestoesQuiz.mockResolvedValue(0);

    repository.filtrarQuestoesQuiz.mockResolvedValue({
      data: criarQuestoes(),
      total: 0,
    });

    const filtro: FiltroListarQuestoesQueryDto = {
      page: 1,
      limit: 4,
    };

    await quizService.buscarQuestoesQuiz(filtro);

    expect(repository.filtrarQuestoesQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        limit: 4,
      }),
      filtro,
    );
  });

  test("Deve lançar erro caso nenhuma questão seja encotrada", async () => {
    const mockRepositoryResponse = {
      data: undefined as unknown as RegistroQuestaoCompleta[],
      total: 0,
    };
    repository.filtrarQuestoesQuiz.mockResolvedValue(mockRepositoryResponse);

    const filtro: FiltroListarQuestoesQueryDto = {
      page: 1,
      limit: 4,
      tema: undefined,
      dificuldade: DIFICULDADE_API.DIFICIL,
      tipo: undefined,
    };

    const not_nound_error = new ErroAplicacao({
      codigoStatus: 422,
      codigo: CodigoDeErro.NAO_ENCONTRADO,
      mensagem: MENSAGENS.questaoNaoEncontrada,
    });
    await expect(quizService.buscarQuestoesQuiz(filtro)).rejects.toThrow(not_nound_error);
  });

  test("Testa embaralhamento", async () => {
    const mockRepositoryResponse = { data: criarQuestoes(), total: 4 };
    repository.filtrarQuestoesQuiz.mockResolvedValue(mockRepositoryResponse);
    const questoes_quiz = converterArrayParaQuestoesQuiz(mockRepositoryResponse.data);

    const filtro: FiltroListarQuestoesQueryDto = {
      page: 1,
      limit: 4,
      tema: undefined,
      dificuldade: DIFICULDADE_API.DIFICIL,
      tipo: undefined,
    };

    const resultado = await quizService.buscarQuestoesQuiz(filtro);

    expect(resultado.dados).not.toEqual(questoes_quiz);
  });

  test("Testa resposta correta de questão deve retornar boolean true e a resposta correta", async () => {
    repository.registrarTentativa.mockResolvedValue(criarTentativa());
    repository.buscarResposta.mockResolvedValue(criarFeedback(AlternativaQuestao.E));
    repository.concederMoedasPorAcerto.mockResolvedValue({
      moedasConcedidas: 25,
      saldoMoedas: 25,
      moedasJaConcedidas: false,
    });

    const resultado = await quizService.responderQuestaoQuiz(
      criarResponderQuestaoQuizDto(),
      "usuario-id",
      PAPEIS.ALUNO,
    );

    expect(resultado.correcao).toBe(true);
    expect(resultado.respostaCorreta).toBe("E");
    expect(resultado.moedasConcedidas).toBe(25);
    expect(resultado.saldoMoedas).toBe(25);
  });

  test("Testa resposta errada de questão deve retornar boolean false e a resposta correta", async () => {
    repository.registrarTentativa.mockResolvedValue(criarTentativa());
    repository.buscarResposta.mockResolvedValue(criarFeedback(AlternativaQuestao.C));
    const resultado = await quizService.responderQuestaoQuiz(
      criarResponderQuestaoQuizDto(),
      "usuario-id",
      PAPEIS.ALUNO,
    );

    expect(resultado.correcao).toBe(false);
    expect(resultado.respostaCorreta).toBe("C");
    expect(resultado.moedasConcedidas).toBe(0);
    expect(resultado.saldoMoedas).toBe(0);
    expect(repository.concederMoedasPorAcerto).not.toHaveBeenCalled();
  });

  test.each([
    [Dificuldade.FACIL, 10],
    [Dificuldade.MEDIA, 25],
    [Dificuldade.DIFICIL, 50],
  ])("deve conceder moedas conforme a dificuldade", async (dificuldade, moedas) => {
    repository.registrarTentativa.mockResolvedValue(criarTentativa());
    repository.buscarResposta.mockResolvedValue(criarFeedback(AlternativaQuestao.E, dificuldade));
    repository.concederMoedasPorAcerto.mockResolvedValue({
      moedasConcedidas: moedas,
      saldoMoedas: moedas,
      moedasJaConcedidas: false,
    });

    const resultado = await quizService.responderQuestaoQuiz(
      criarResponderQuestaoQuizDto(),
      "usuario-id",
      PAPEIS.ALUNO,
    );

    expect(repository.concederMoedasPorAcerto).toHaveBeenCalledWith(
      "usuario-id",
      "questa-id",
      moedas,
    );
    expect(resultado.moedasConcedidas).toBe(moedas);
    expect(resultado.saldoMoedas).toBe(moedas);
    expect(resultado.moedasJaConcedidas).toBe(false);
  });

  test("deve permitir recompensa no primeiro acerto mesmo apos erro anterior", async () => {
    repository.registrarTentativa.mockResolvedValue(criarTentativa());
    repository.buscarResposta
      .mockResolvedValueOnce(criarFeedback(AlternativaQuestao.C, Dificuldade.FACIL))
      .mockResolvedValueOnce(criarFeedback(AlternativaQuestao.E, Dificuldade.FACIL));
    repository.concederMoedasPorAcerto.mockResolvedValue({
      moedasConcedidas: 10,
      saldoMoedas: 10,
      moedasJaConcedidas: false,
    });

    await quizService.responderQuestaoQuiz(criarResponderQuestaoQuizDto(), "usuario-id", PAPEIS.ALUNO);
    const resultadoAcerto = await quizService.responderQuestaoQuiz(
      criarResponderQuestaoQuizDto(),
      "usuario-id",
      PAPEIS.ALUNO,
    );

    expect(repository.concederMoedasPorAcerto).toHaveBeenCalledTimes(1);
    expect(resultadoAcerto.correcao).toBe(true);
    expect(resultadoAcerto.moedasConcedidas).toBe(10);
  });

  test("nao deve conceder moedas novamente para questao ja recompensada", async () => {
    repository.registrarTentativa.mockResolvedValue(criarTentativa());
    repository.buscarResposta.mockResolvedValue(criarFeedback(AlternativaQuestao.E, Dificuldade.DIFICIL));
    repository.concederMoedasPorAcerto.mockResolvedValue({
      moedasConcedidas: 0,
      saldoMoedas: 50,
      moedasJaConcedidas: true,
    });

    const resultado = await quizService.responderQuestaoQuiz(
      criarResponderQuestaoQuizDto(),
      "usuario-id",
      PAPEIS.ALUNO,
    );

    expect(resultado.correcao).toBe(true);
    expect(resultado.moedasConcedidas).toBe(0);
    expect(resultado.saldoMoedas).toBe(50);
    expect(resultado.moedasJaConcedidas).toBe(true);
  });

  test.each([PAPEIS.PROFESSOR, PAPEIS.ADMINISTRADOR])(
    "nao deve conceder moedas para usuario com papel %s",
    async (papel) => {
      repository.registrarTentativa.mockResolvedValue(criarTentativa());
      repository.buscarResposta.mockResolvedValue(criarFeedback(AlternativaQuestao.E, Dificuldade.MEDIA));
      repository.buscarSaldoMoedas.mockResolvedValue(0);

      const resultado = await quizService.responderQuestaoQuiz(
        criarResponderQuestaoQuizDto(),
        "usuario-id",
        papel,
      );

      expect(resultado.correcao).toBe(true);
      expect(resultado.moedasConcedidas).toBe(0);
      expect(repository.concederMoedasPorAcerto).not.toHaveBeenCalled();
    },
  );

  test("deve retornar saldo de moedas do usuario autenticado", async () => {
    repository.buscarSaldoMoedas.mockResolvedValue(75);

    const resultado = await quizService.buscarSaldoMoedas("usuario-id");

    expect(repository.buscarSaldoMoedas).toHaveBeenCalledWith("usuario-id");
    expect(resultado).toEqual({ saldoMoedas: 75 });
  });

  test("Lança erro caso id do usuário não seja informado", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.NAO_AUTORIZADO,
      mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
    });
    await expect(
      quizService.responderQuestaoQuiz(criarResponderQuestaoQuizDto(), ""),
    ).rejects.toThrow(error);
  });

  test("Lança erro caso registro da tentativa falhe", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.ERRO_TENTATIVA,
      mensagem: MENSAGENS.erroTentativa,
    });
    repository.buscarResposta.mockResolvedValue(criarFeedback(AlternativaQuestao.E));
    repository.registrarTentativa.mockResolvedValue(null as unknown as ResolucaoQuestao);
    await expect(
      quizService.responderQuestaoQuiz(criarResponderQuestaoQuizDto(), "usuario-id"),
    ).rejects.toThrow(error);
  });

  test("Lança erro caso busca do gabarito falhe", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.ERRO_FEEDBACK,
      mensagem: MENSAGENS.erroFeedback,
    });
    repository.registrarTentativa.mockResolvedValue(criarTentativa());
    repository.buscarResposta.mockResolvedValue(null);
    await expect(
      quizService.responderQuestaoQuiz(criarResponderQuestaoQuizDto(), "usuario-id"),
    ).rejects.toThrow(error);
  });

  test("deve retornar a quantidade de questões agrupadas por dificuldade", async () => {
    repository.buscarQuantidadeDeQuestoesPorTema.mockResolvedValue([
      {
        nome: "Português",
        questoes: [
          { dificuldade: "FACIL" },
          { dificuldade: "FACIL" },
          { dificuldade: "MEDIA" },
          { dificuldade: "DIFICIL" },
        ],
        _count: {
          questoes: 4,
        },
      },
    ]);

    const resultado = await quizService.buscarQuantidadeDeQuestoesPorTema();

    expect(resultado).toEqual([
      {
        nome: "Português",
        totalQuestoes: 4,
        porDificuldade: {
          FACIL: 2,
          MEDIA: 1,
          DIFICIL: 1,
        },
      },
    ]);

    expect(repository.buscarQuantidadeDeQuestoesPorTema).toHaveBeenCalledTimes(1);
  });

  test("Lança erro caso busca por quantidade de questões por tema falhe", async () => {
    const error = new ErroAplicacao({
      codigoStatus: 401,
      codigo: CodigoDeErro.TEMAS_NAO_ENCONTRADOS,
      mensagem: MENSAGENS.temasNaoEncontrados,
    });
    repository.buscarQuantidadeDeQuestoesPorTema.mockResolvedValue(null);
    await expect(quizService.buscarQuantidadeDeQuestoesPorTema()).rejects.toThrow(error);
  });
});
