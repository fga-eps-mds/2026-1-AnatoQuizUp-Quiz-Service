import { QuizService } from "@/modules/quiz/quiz.service";
import { converterParaRespostaQuestaoQuiz } from "@/modules/quiz/dto/converter_para_resposta_questao_quiz";
import type { RespostaQuestaoQuizDto } from "@/modules/quiz/dto/resposta_questao_quiz_dto";
import type { QuizRepository } from "@/modules/quiz/quiz.repository";
import {
  DIFICULDADE_API,
  type FiltroListarQuestoesQueryDto,
  type RegistroQuestaoCompleta,
} from "@/modules/questao/dto/questao.types";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { MENSAGENS } from "@/shared/constants/mensagens";

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
  return questoes_completas.map(converterParaRespostaQuestaoQuiz);
}

function criarRepositoryMock() {
  return {
    filtrar_questoes_quiz: jest.fn<QuizRepository["filtrar_questoes_quiz"]>(),
  } as unknown as jest.Mocked<QuizRepository>;
}

jest.retryTimes(3);
describe("Testa Quiz Service", () => {
  let repository: jest.Mocked<QuizRepository>;
  let quizService: QuizService;

  beforeEach(() => {
    repository = criarRepositoryMock();
    quizService = new QuizService(repository);
    jest.clearAllMocks();
  });

  test("Filtrar questoes para quiz", async () => {
    const mockRepositoryResponse = { data: criarQuestoes(), total: 4 };
    repository.filtrar_questoes_quiz.mockResolvedValue(mockRepositoryResponse);

    const filtro: FiltroListarQuestoesQueryDto = {
      page: 1,
      limit: 4,
      tema: undefined,
      dificuldade: DIFICULDADE_API.DIFICIL,
      tipo: undefined,
    };

    const resultado = await quizService.buscar_questoes_quiz(filtro);

    expect(repository.filtrar_questoes_quiz).toHaveBeenCalledWith(
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

  test("Deve lançar erro caso nenhuma questão seja encotrada", async () => {
    const mockRepositoryResponse = { data: undefined as unknown as RegistroQuestaoCompleta[], total: 0 };
    repository.filtrar_questoes_quiz.mockResolvedValue(mockRepositoryResponse);

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
    await expect(quizService.buscar_questoes_quiz(filtro)).rejects.toThrow(not_nound_error);
  });

  test("Testa embaralhamento", async () => {
    const mockRepositoryResponse = { data: criarQuestoes(), total: 4 };
    repository.filtrar_questoes_quiz.mockResolvedValue(mockRepositoryResponse);
    const questoes_quiz = converterArrayParaQuestoesQuiz(mockRepositoryResponse.data);

    const filtro: FiltroListarQuestoesQueryDto = {
      page: 1,
      limit: 4,
      tema: undefined,
      dificuldade: DIFICULDADE_API.DIFICIL,
      tipo: undefined,
    };

    const resultado = await quizService.buscar_questoes_quiz(filtro);

    expect(resultado.dados).not.toEqual(questoes_quiz);
  });
});
