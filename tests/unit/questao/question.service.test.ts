import type { QuestaoRepository } from "../../../src/modules/questao/questao.repository";
import { QuestaoService } from "../../../src/modules/questao/questao.service";
import type { CriarQuestaoDto, RegistroQuestaoCompleta } from "../../../src/modules/questao/dto/questao.types";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";

function criarQuestao(overrides: Partial<RegistroQuestaoCompleta> = {}): RegistroQuestaoCompleta {
  const agora = new Date("2026-05-09T12:00:00.000Z");

  return {
    id: "questao-1",
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
    ...overrides,
  };
}

function criarInputValido(): CriarQuestaoDto {
  return {
    tema: "Sistema cardiovascular",
    enunciado: "Qual estrutura bombeia sangue para a aorta?",
    tipo: "MULTIPLA_ESCOLHA",
    imagem: "https://cdn.example.com/coracao.png",
    alternativaCorreta: "B",
    explicacaoPedagogica: "O ventriculo esquerdo impulsiona sangue para a circulacao sistemica.",
    alternativas: {
      A: "Atrio direito",
      B: "Ventriculo esquerdo",
      C: "Atrio esquerdo",
      D: "Ventriculo direito",
      E: "Veia cava",
    },
  };
}

function criarRepositoryMock() {
  return {
    listar: jest.fn<QuestaoRepository["listar"]>(),
    buscarPorId: jest.fn<QuestaoRepository["buscarPorId"]>(),
    criar: jest.fn<QuestaoRepository["criar"]>(),
    atualizar: jest.fn<QuestaoRepository["atualizar"]>(),
    desativar: jest.fn<QuestaoRepository["desativar"]>(),
    filtrar: jest.fn<QuestaoRepository["filtrar"]>(),
  } as unknown as jest.Mocked<QuestaoRepository>;
}

describe("QuestaoService", () => {
  let repository: jest.Mocked<QuestaoRepository>;
  let service: QuestaoService;

  beforeEach(() => {
    repository = criarRepositoryMock();
    service = new QuestaoService(repository);
    jest.clearAllMocks();
  });

  test("cria questao de multipla escolha valida", async () => {
    const input = criarInputValido();
    repository.criar.mockResolvedValue(criarQuestao());

    const resposta = await service.criar(input, "professor-1");

    expect(repository.criar).toHaveBeenCalledWith(input, "professor-1");
    expect(resposta.tipo).toBe("MULTIPLA_ESCOLHA");
    expect(resposta.alternativaCorreta).toBe("B");
    expect(resposta.alternativas).toMatchObject({ A: "Atrio direito", E: "Veia cava" });
  });

  test("cria questao de verdadeiro/falso valida", async () => {
    const input: CriarQuestaoDto = {
      tema: "Histologia",
      enunciado: "Epitelios possuem matriz extracelular abundante.",
      tipo: "VERDADEIRO_FALSO",
      imagem: "https://cdn.example.com/histologia.png",
      alternativaCorreta: "E",
      explicacaoPedagogica: "Epitelios possuem pouca matriz extracelular.",
      alternativas: {
        C: "Verdadeiro",
        E: "Falso",
      },
    };
    repository.criar.mockResolvedValue(
      criarQuestao({
        tipoQuestao: "CERTO_ERRADO",
        respostaCorreta: "E",
        alternativas: {
          ...criarQuestao().alternativas!,
          alternativaA: "",
          alternativaB: "",
          alternativaC: "Verdadeiro",
          alternativaD: "",
          alternativaE: "Falso",
        },
      }),
    );

    const resposta = await service.criar(input, "professor-1");

    expect(repository.criar).toHaveBeenCalledWith(input, "professor-1");
    expect(resposta.tipo).toBe("VERDADEIRO_FALSO");
    expect(resposta.alternativas).toEqual({ C: "Verdadeiro", E: "Falso" });
  });

  test("impede criacao sem alternativas", async () => {
    const input = {
      ...criarInputValido(),
      alternativas: {},
    } as CriarQuestaoDto;

    await expect(service.criar(input, "professor-1")).rejects.toMatchObject({
      codigoStatus: 400,
      codigo: CodigoDeErro.ERRO_DE_VALIDACAO,
      message: MENSAGENS.questaoAlternativasObrigatorias,
    });
    expect(repository.criar).not.toHaveBeenCalled();
  });

  test("impede criacao sem gabarito", async () => {
    const input = {
      ...criarInputValido(),
      alternativaCorreta: undefined,
    } as unknown as CriarQuestaoDto;

    await expect(service.criar(input, "professor-1")).rejects.toMatchObject({
      codigoStatus: 400,
      codigo: CodigoDeErro.ERRO_DE_VALIDACAO,
      message: MENSAGENS.questaoGabaritoObrigatorio,
    });
    expect(repository.criar).not.toHaveBeenCalled();
  });

  test("lista apenas dados mapeados para API", async () => {
    repository.listar.mockResolvedValue({ data: [criarQuestao()], total: 1 });

    const resposta = await service.listar({ page: 1, limit: 10 });

    expect(repository.listar).toHaveBeenCalledWith({ page: 1, limit: 10, skip: 0 });
    expect(resposta.metadados.total).toBe(1);
    expect(resposta.dados[0]?.tema.nome).toBe("Sistema cardiovascular");
  });

  test("filtrar deve chamar o repository com filtros e paginacao processada", async () => {
    const mockRepoReturn = { data: [criarQuestao()], total: 1 };
    repository.filtrar.mockResolvedValue(mockRepoReturn);

    const filtros = {
      tema: "Anatomia",
      dificuldade: "FACIL" as const,
      page: 2,
      limit: 5
    };

    const resultado = await service.filtrar(filtros);

    expect(repository.filtrar).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        limit: 5
      }),
      expect.objectContaining({
        tema: "Anatomia",
        dificuldade: "FACIL"
      })
    );

    expect(resultado.metadados.total).toBe(1);
    expect(resultado.dados).toHaveLength(1);
  });

  test("deve disparar erro ao tentar buscar questão inexistente por ID", async () => {
  repository.buscarPorId.mockResolvedValue(null);

  await expect(service.buscarPorId("id-invalido"))
    .rejects.toThrow(); 
  });

  test("retorna 404 ao buscar questao inexistente", async () => {
    repository.buscarPorId.mockResolvedValue(null);

    await expect(service.buscarPorId("questao-inexistente")).rejects.toMatchObject({
      codigoStatus: 404,
      codigo: CodigoDeErro.NAO_ENCONTRADO,
      message: MENSAGENS.questaoNaoEncontrada,
    });
  });

  test("atualiza questao existente preservando dados usados na validacao", async () => {
    const questaoExistente = criarQuestao(); 
    const usuarioId = "user-123";
    
    repository.buscarPorId.mockResolvedValue(questaoExistente);
    repository.atualizar.mockResolvedValue(criarQuestao({ enunciado: "Enunciado atualizado" }));

    const resposta = await service.atualizar("questao-1", {
      enunciado: "Enunciado atualizado",
    }, usuarioId);

    expect(repository.atualizar).toHaveBeenCalledWith(
      "questao-1", 
      expect.objectContaining({
        enunciado: "Enunciado atualizado",
        tema: questaoExistente.tema.nome, 
        tipo: expect.any(String)
      }),
      usuarioId
    );
    
    expect(resposta.enunciado).toBe("Enunciado atualizado");
  });

  test("deve lançar erro se tentar atualizar uma questão inexistente", async () => {
    repository.buscarPorId.mockResolvedValue(null);

    await expect(
      service.atualizar("id-fantasma", { enunciado: "..." }, "user-1")
    ).rejects.toThrow(); 
  });

  test("deve lançar erro se tentar remover questão inexistente", async () => {
    repository.buscarPorId.mockResolvedValue(null);
    await expect(service.remover("id-fake")).rejects.toThrow();
  });

  test("remove questao com soft delete", async () => {
    const removida = criarQuestao({
      status: "INATIVO",
      excluidoEm: new Date("2026-05-09T13:00:00.000Z"),
    });
    repository.buscarPorId.mockResolvedValue(criarQuestao());
    repository.desativar.mockResolvedValue(removida);

    const resposta = await service.remover("questao-1");

    expect(repository.desativar).toHaveBeenCalledWith("questao-1");
    expect(resposta.status).toBe("INATIVO");
    expect(resposta.excluidoEm).toBe("2026-05-09T13:00:00.000Z");
  });
});
