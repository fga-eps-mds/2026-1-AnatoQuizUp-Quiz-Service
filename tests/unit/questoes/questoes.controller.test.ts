import type { NextFunction, Request, Response } from "express";
import { MENSAGENS } from "@/shared/constants/mensagens";
import type { RespostaApiSucesso, RespostaPaginada } from "@/shared/types/api.types";
import { QuestionController } from "../../../src/modules/questoes/questoes.controller";
import type { QuestionService } from "../../../src/modules/questoes/questoes.service";
import type {
  CriarQuestaoDto,
  RespostaQuestaoDto,
} from "../../../src/modules/questoes/dto/question.types";

function criarQuestaoResposta(): RespostaQuestaoDto {
  return {
    id: "questao-1",
    tema: { id: "tema-1", nome: "Anatomia" },
    enunciado: "Enunciado",
    tipo: "MULTIPLA_ESCOLHA",
    dificuldade: "MEDIA",
    imagem: null,
    alternativaCorreta: "A",
    saibaMais: "Explicacao",
    taxonomiaBloom: null,
    origemQuestao: "ELABORADA_POR_PROFESSOR",
    regiaoAnatomica: null,
    alternativas: { A: "A", B: "B", C: "C", D: "D", E: "E" },
    status: "ATIVO",
    criadoPorId: "professor-1",
    criadoEm: "2026-05-09T12:00:00.000Z",
    atualizadoEm: "2026-05-09T12:00:00.000Z",
    excluidoEm: null,
  };
}

function criarResponseMock<T>() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  return {
    response: { status } as unknown as Response<T>,
    status,
    json,
  };
}

describe("QuestionController", () => {
  const next = jest.fn() as NextFunction;
  let questionService: jest.Mocked<QuestionService>;
  let controller: QuestionController;

  const imagemMock = {
    fieldname: "imagem",
    originalname: "femur.jpeg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    buffer: Buffer.from("arquivo-fake-binario"),
    size: 1024,
  } as Express.Multer.File;

  beforeEach(() => {
    questionService = {
      listar: jest.fn(),
      buscarPorId: jest.fn(),
      criar: jest.fn(),
      atualizar: jest.fn(),
      remover: jest.fn(),
      filtrar: jest.fn(),
    } as unknown as jest.Mocked<QuestionService>;
    controller = new QuestionController(questionService);
    jest.clearAllMocks();
  });

  test("criar responde 201 com mensagem e dados", async () => {
    const questao = criarQuestaoResposta();
    questionService.criar.mockResolvedValue(questao);

    const body: CriarQuestaoDto = {
      tema: "Anatomia",
      enunciado: "Enunciado",
      tipo: "MULTIPLA_ESCOLHA",
      alternativaCorreta: "A",
      saibaMais: "Explicacao",
      alternativas: { A: "A", B: "B", C: "C", D: "D", E: "E" },
    };

    const request = {
      body,
      file: imagemMock,
      usuario: { id: "professor-1" },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock<RespostaApiSucesso<RespostaQuestaoDto>>();

    await controller.criar(request, response, next);

    expect(questionService.criar).toHaveBeenCalledWith(body, imagemMock, "professor-1");
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      mensagem: "Questão criada com sucesso!",
      dados: questao,
    });
  });

  test("listar responde com questoes paginadas", async () => {
    const resposta: RespostaPaginada<RespostaQuestaoDto> = {
      dados: [criarQuestaoResposta()],
      metadados: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    questionService.listar.mockResolvedValue(resposta);

    const request = {
      query: { page: "1", limit: "10" },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock<RespostaPaginada<RespostaQuestaoDto>>();

    await controller.listar(request, response, next);

    expect(questionService.listar).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(resposta);
  });

  test("filtrar deve encaminhar os parametros de query para o service", async () => {
    const mockResposta = {
      dados: [criarQuestaoResposta()],
      metadados: { total: 1, pagina: 1, limite: 10, totalPaginas: 1 },
    };

    questionService.filtrar.mockResolvedValue(mockResposta);

    const request = {
      query: {
        tema: "Cardio",
        dificuldade: "MEDIA",
        tipo: "MULTIPLA_ESCOLHA",
        page: "1",
        limit: "10",
      },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock();

    await controller.filtrar(request, response, next);

    expect(questionService.filtrar).toHaveBeenCalledWith(
      expect.objectContaining({
        tema: "Cardio",
        dificuldade: "MEDIA",
      }),
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(mockResposta);
  });

  test("buscarPorId responde com questao encontrada", async () => {
    const questao = criarQuestaoResposta();
    questionService.buscarPorId.mockResolvedValue(questao);
    const request = { params: { id: "questao-1" } } as unknown as Request;
    const { response, status, json } = criarResponseMock<RespostaApiSucesso<RespostaQuestaoDto>>();

    await controller.buscarPorId(request, response, next);

    expect(questionService.buscarPorId).toHaveBeenCalledWith("questao-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      mensagem: MENSAGENS.questaoEncontrada,
      dados: questao,
    });
  });

  test("atualizar encaminha id e body para o service", async () => {
    const questao = criarQuestaoResposta();
    const usuarioId = "user-123";

    questionService.atualizar.mockResolvedValue(questao);

    const request = {
      params: { id: "questao-1" },
      body: { enunciado: "Novo enunciado" },
      usuario: { id: usuarioId },
    } as unknown as Request;

    const { response, status, json } = criarResponseMock<RespostaApiSucesso<RespostaQuestaoDto>>();

    await controller.atualizar(request, response, next);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      mensagem: MENSAGENS.questaoAtualizada,
      dados: questao,
    });
  });

  test("deve encaminhar erro para o middleware de erro se o service falhar no filtro", async () => {
    const erroFake = new Error("Erro de banco");
    questionService.filtrar.mockRejectedValue(erroFake);

    const request = { query: {} } as unknown as Request;
    const { response } = criarResponseMock();

    await controller.filtrar(request, response, next);

    expect(next).toHaveBeenCalledWith(erroFake);
  });

  test("remover responde questao desativada", async () => {
    const questao = criarQuestaoResposta();
    questionService.remover.mockResolvedValue(questao);
    const request = { params: { id: "questao-1" } } as unknown as Request;
    const { response, status, json } = criarResponseMock<RespostaApiSucesso<RespostaQuestaoDto>>();

    await controller.remover(request, response, next);

    expect(questionService.remover).toHaveBeenCalledWith("questao-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      mensagem: MENSAGENS.questaoRemovida,
      dados: questao,
    });
  });

  test("listar deve chamar next em caso de erro", async () => {
    const erro = new Error("Erro listar");
    questionService.listar.mockRejectedValue(erro);
    const request = { query: {} } as unknown as Request;
    const { response } = criarResponseMock();
    await controller.listar(request, response, next);
    expect(next).toHaveBeenCalledWith(erro);
  });

  test("criar deve chamar next em caso de erro", async () => {
    const erro = new Error("Erro criar");
    questionService.criar.mockRejectedValue(erro);
    const request = { body: {}, usuario: { id: "1" } } as unknown as Request;
    const { response } = criarResponseMock();
    await controller.criar(request, response, next);
    expect(next).toHaveBeenCalledWith(erro);
  });

  test("atualizar deve chamar next em caso de erro", async () => {
    const erro = new Error("Erro atualizar");
    questionService.atualizar.mockRejectedValue(erro);
    const request = { params: { id: "1" }, body: {}, usuario: { id: "1" } } as unknown as Request;
    const { response } = criarResponseMock();
    await controller.atualizar(request, response, next);
    expect(next).toHaveBeenCalledWith(erro);
  });

  test("remover deve chamar next em caso de erro", async () => {
    const erro = new Error("Erro remover");
    questionService.remover.mockRejectedValue(erro);
    const request = { params: { id: "1" } } as unknown as Request;
    const { response } = criarResponseMock();
    await controller.remover(request, response, next);
    expect(next).toHaveBeenCalledWith(erro);
  });

  test("atualizar deve reconstruir alternativas quando enviadas no formato flat (multipart/form-data)", async () => {
    const questao = criarQuestaoResposta();
    questionService.atualizar.mockResolvedValue(questao);

    const request = {
      params: { id: "questao-1" },
      body: {
        enunciado: "Novo enunciado",
        "alternativas[A]": "Opção A",
        "alternativas[B]": "Opção B",
      },
      usuario: { id: "user-123" },
    } as unknown as Request;

    const { response, status } = criarResponseMock();

    await controller.atualizar(request, response, next);

    expect(questionService.atualizar).toHaveBeenCalledWith(
      "questao-1",
      expect.objectContaining({
        alternativas: { A: "Opção A", B: "Opção B" },
      }),
      undefined,
      "user-123",
    );
    expect(status).toHaveBeenCalledWith(200);
  });

  test("criar deve usar string vazia se o id do usuário não estiver presente", async () => {
    const questao = criarQuestaoResposta();
    questionService.criar.mockResolvedValue(questao);

    const request = {
      body: { enunciado: "Teste" },
    } as unknown as Request;

    const { response } = criarResponseMock();

    await controller.criar(request, response, next);

    expect(questionService.criar).toHaveBeenCalledWith(expect.anything(), undefined, "");
  });
  test("buscarPorId deve chamar next em caso de erro", async () => {
    const erro = new Error("Erro buscar");
    questionService.buscarPorId.mockRejectedValue(erro);
    const request = { params: { id: "1" } } as unknown as Request;
    const { response } = criarResponseMock();
    await controller.buscarPorId(request, response, next);
    expect(next).toHaveBeenCalledWith(erro);
  });
});
