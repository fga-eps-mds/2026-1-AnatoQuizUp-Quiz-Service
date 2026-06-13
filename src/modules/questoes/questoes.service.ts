import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import type { RespostaPaginada } from "@/shared/types/api.types";
import {
  montarMetadadosPaginacao,
  resolverParametrosPaginacao,
} from "@/shared/utils/paginacao.util";
import type {
  AtualizarQuestaoDto,
  CriarQuestaoDto,
  ListarQuestoesQueryDto,
  FiltroListarQuestoesQueryDto,
  RespostaQuestaoDto,
  AlternativasQuestaoDto,
} from "./dto/question.types";
import {
  TIPO_QUESTAO_API,
  converterParaRespostaQuestao,
} from "./dto/question.types";
import type { QuestionRepository } from "./questoes.repository";
import type { AlternativaQuestao, Dificuldade } from "@prisma/client";
import type { MinioService } from "./minio.service";

export class QuestionService {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly minioService: MinioService,
  ) {}

  async listar(query: ListarQuestoesQueryDto): Promise<RespostaPaginada<RespostaQuestaoDto>> {
    const paginacao = resolverParametrosPaginacao(query);
    const { data, total } = await this.questionRepository.listar(paginacao);

    return {
      dados: data.map(converterParaRespostaQuestao),
      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }

  async buscarPorId(id: string): Promise<RespostaQuestaoDto> {
    const questao = await this.questionRepository.buscarPorId(id);

    if (!questao) {
      throw this.erroQuestaoNaoEncontrada(id);
    }

    return converterParaRespostaQuestao(questao);
  }

  async filtrar(
    query: FiltroListarQuestoesQueryDto,
  ): Promise<RespostaPaginada<RespostaQuestaoDto>> {
    const paginacao = resolverParametrosPaginacao(query);
    const { data, total } = await this.questionRepository.filtrar(paginacao, query);

    return {
      dados: data.map(converterParaRespostaQuestao),
      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }

  async criar(
    data: CriarQuestaoDto,
    arquivoImagem: Express.Multer.File | undefined,
    criadoPorId: string,
  ): Promise<RespostaQuestaoDto> {
    if (!criadoPorId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.tokenInvalido,
      });
    }

    this.validarQuestao(data);

    let urlImagemMinio: string | undefined = undefined;

    if (arquivoImagem) {
      urlImagemMinio = await this.minioService.uploadImagem(arquivoImagem);
    }

    const dadosParaSalvar = {
      ...data,
      imagem: urlImagemMinio ?? data.imagem ?? "",
    };

    const questao = await this.questionRepository.criar(dadosParaSalvar, criadoPorId);

    return converterParaRespostaQuestao(questao);
  }

  async atualizar(
    id: string,
    data: AtualizarQuestaoDto,
    arquivoImagem: Express.Multer.File | undefined,
    usuarioId: string,
  ): Promise<RespostaQuestaoDto> {
    const questaoAntiga = await this.questionRepository.buscarPorId(id);
    if (!questaoAntiga) throw this.erroQuestaoNaoEncontrada(id);

    let urlImagemFinal = questaoAntiga.urlImagem ?? "";

    if (arquivoImagem) {
      urlImagemFinal = await this.minioService.uploadImagem(arquivoImagem);
    }

    const dadosNovaQuestao: CriarQuestaoDto = {
      tema: data.tema ?? questaoAntiga.tema.nome,
      enunciado: data.enunciado ?? questaoAntiga.enunciado,
      tipo: data.tipo ?? questaoAntiga.tipoQuestao,
      dificuldade: (data.dificuldade ?? questaoAntiga.dificuldade) as Dificuldade,
      imagem: urlImagemFinal,
      alternativaCorreta: (data.alternativaCorreta ??
        questaoAntiga.respostaCorreta) as AlternativaQuestao,
      saibaMais: data.saibaMais ?? questaoAntiga.saibaMais ?? "",
      taxonomiaBloom: data.taxonomiaBloom ?? questaoAntiga.taxonomiaBloom ?? undefined,
      origemQuestao: data.origemQuestao ?? questaoAntiga.origemQuestao,
      regiaoAnatomica: data.regiaoAnatomica ?? questaoAntiga.regiaoAnatomica ?? undefined,
      estruturaAlvo: data.estruturaAlvo ?? questaoAntiga.estruturaAlvo ?? undefined,
      sistemaAnatomico: data.sistemaAnatomico ?? questaoAntiga.sistemaAnatomico ?? undefined,
      planoAnatomico: data.planoAnatomico ?? questaoAntiga.planoAnatomico ?? undefined,
      modalidade: data.modalidade ?? questaoAntiga.modalidade ?? undefined,
      alternativas: (data.alternativas ??
        this.extrairAlternativasAtuais(questaoAntiga)) as AlternativasQuestaoDto,
    };

    const novaQuestao = await this.questionRepository.atualizar(id, dadosNovaQuestao, usuarioId);

    return converterParaRespostaQuestao(novaQuestao);
  }

  async remover(id: string): Promise<RespostaQuestaoDto> {
    const questao = await this.questionRepository.buscarPorId(id);

    if (!questao) {
      throw this.erroQuestaoNaoEncontrada(id);
    }

    const questaoRemovida = await this.questionRepository.desativar(id);

    return converterParaRespostaQuestao(questaoRemovida);
  }

  private validarQuestao(data: CriarQuestaoDto) {
    if (!data.alternativaCorreta) {
      throw new ErroAplicacao({
        codigoStatus: 400,
        codigo: CodigoDeErro.ERRO_DE_VALIDACAO,
        mensagem: MENSAGENS.questaoGabaritoObrigatorio,
      });
    }

    if (!data.alternativas || Object.keys(data.alternativas).length === 0) {
      throw new ErroAplicacao({
        codigoStatus: 400,
        codigo: CodigoDeErro.ERRO_DE_VALIDACAO,
        mensagem: MENSAGENS.questaoAlternativasObrigatorias,
      });
    }

    if (data.tipo === TIPO_QUESTAO_API.MULTIPLA_ESCOLHA) {
      const alternativasObrigatorias = ["A", "B", "C", "D", "E"] as const;
      const possuiTodas = alternativasObrigatorias.every((alternativa) => {
        const valor = data.alternativas[alternativa as keyof typeof data.alternativas];

        return typeof valor === "string" && valor.trim().length > 0;
      });

      if (!possuiTodas) {
        throw new ErroAplicacao({
          codigoStatus: 400,
          codigo: CodigoDeErro.ERRO_DE_VALIDACAO,
          mensagem: MENSAGENS.questaoAlternativasObrigatorias,
        });
      }
    }

    if (data.tipo === TIPO_QUESTAO_API.CERTO_ERRADO) {
      const alternativas = data.alternativas;
      const possuiVerdadeiroFalso =
        typeof alternativas.C === "string" &&
        alternativas.C.trim().length > 0 &&
        typeof alternativas.E === "string" &&
        alternativas.E.trim().length > 0;

      if (!possuiVerdadeiroFalso) {
        throw new ErroAplicacao({
          codigoStatus: 400,
          codigo: CodigoDeErro.ERRO_DE_VALIDACAO,
          mensagem: MENSAGENS.questaoAlternativasObrigatorias,
        });
      }

      if (data.alternativaCorreta !== "C" && data.alternativaCorreta !== "E") {
        throw new ErroAplicacao({
          codigoStatus: 400,
          codigo: CodigoDeErro.ERRO_DE_VALIDACAO,
          mensagem: MENSAGENS.questaoGabaritoObrigatorio,
        });
      }
    }
  }

  private erroQuestaoNaoEncontrada(id: string) {
    return new ErroAplicacao({
      codigoStatus: 404,
      codigo: CodigoDeErro.NAO_ENCONTRADO,
      mensagem: MENSAGENS.questaoNaoEncontrada,
      detalhes: { id },
    });
  }

  private extrairAlternativasAtuais(
    questao: Awaited<ReturnType<QuestionRepository["buscarPorId"]>>,
  ) {
    if (!questao?.alternativas) {
      return {};
    }

    if (questao.tipoQuestao === "CERTO_ERRADO") {
      return {
        C: questao.alternativas.alternativaC,
        E: questao.alternativas.alternativaE,
      };
    }

    return {
      A: questao.alternativas.alternativaA,
      B: questao.alternativas.alternativaB,
      C: questao.alternativas.alternativaC,
      D: questao.alternativas.alternativaD,
      E: questao.alternativas.alternativaE,
    };
  }
}
