import type { Prisma } from "@prisma/client";

import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";

import type {
  CriarQuestaoDto,
  FiltroListarQuestoesQueryDto,
  RegistroQuestaoCompleta,
  AlternativasMultiplaEscolhaDto,
  AlternativasCertoErradoDto,
} from "./dto/question.types";
import { montarFiltroPrisma } from "./dto/question.types";

// Repository de questoes (Prisma). Edicao usa versionamento: a questao antiga e
// inativada e uma nova e criada apontando para a original (questaoOriginalId),
// preservando o historico de resolucoes ja vinculado a versao anterior.

// Projecao padrao da questao com tema e alternativas.
const includeQuestaoCompleta = {
  tema: true,
  alternativas: true,
} as const;

export class QuestionRepository {
  /**
   * Lista paginada de questoes nao excluidas (mais recentes primeiro).
   *
   * @param paginacao Parametros de paginacao (skip/take).
   * @returns Pagina de questoes completas e o total.
   */
  async listar(paginacao: ParametrosPaginacao) {
    const where = { excluidoEm: null };

    const [data, total] = await prisma.$transaction([
      prisma.questao.findMany({
        where,
        include: includeQuestaoCompleta,
        skip: paginacao.skip,
        take: paginacao.limit,
        orderBy: {
          criadoEm: "desc",
        },
      }),
      prisma.questao.count({ where }),
    ]);

    return {
      data: data as RegistroQuestaoCompleta[],
      total,
    };
  }

  /**
   * Busca uma questao nao excluida por id, com tema e alternativas.
   *
   * @param id Id da questao.
   * @returns A questao completa ou null.
   */
  async buscarPorId(id: string) {
    return prisma.questao.findFirst({
      where: { id, excluidoEm: null },
      include: includeQuestaoCompleta,
    }) as Promise<RegistroQuestaoCompleta | null>;
  }

  /**
   * Lista paginada aplicando os filtros (tema, dificuldade, tipo...) no Prisma.
   *
   * @param paginacao Parametros de paginacao (skip/take).
   * @param filtros Filtros a aplicar na consulta.
   * @returns Pagina de questoes filtradas e o total.
   */
  async filtrar(paginacao: ParametrosPaginacao, filtros: FiltroListarQuestoesQueryDto) {
    const where = montarFiltroPrisma(filtros);

    const [data, total] = await prisma.$transaction([
      prisma.questao.findMany({
        where,
        include: includeQuestaoCompleta,
        skip: paginacao.skip,
        take: paginacao.limit,
        orderBy: { criadoEm: "desc" },
      }),
      prisma.questao.count({ where }),
    ]);

    return { data: data as RegistroQuestaoCompleta[], total };
  }

  /**
   * Cria uma questao (e o tema, se ainda nao existir) numa transacao.
   *
   * Retorna tambem temaCriado, sinal usado pelo service para emitir o evento que
   * cria a conquista do tema novo.
   *
   * @param data Dados da questao.
   * @param criadoPorId Professor autor.
   * @returns A questao criada e se o tema foi criado agora.
   */
  async criar(data: CriarQuestaoDto, criadoPorId: string) {
    return prisma.$transaction(async (transacao) => {
      // Reusa o tema existente ou cria um novo; temaCriado sinaliza tema inedito.
      const temaExistente = await transacao.tema.findFirst({
        where: { nome: data.tema, excluidoEm: null },
      });
      const temaCriado = !temaExistente;
      const tema = temaExistente ?? (await transacao.tema.create({ data: { nome: data.tema } }));

      const questao = await transacao.questao.create({
        data: {
          enunciado: data.enunciado,
          tipoQuestao: data.tipo,
          dificuldade: data.dificuldade,
          respostaCorreta: data.alternativaCorreta,
          saibaMais: data.saibaMais,
          urlImagem: data.imagem ?? null,
          taxonomiaBloom: data.taxonomiaBloom ?? null,
          origemQuestao: data.origemQuestao ?? undefined,
          regiaoAnatomica: data.regiaoAnatomica?.trim() || null,
          palavrasChave: this.normalizarPalavrasChave(data.palavrasChave),
          criadoPorId,
          temaId: tema.id,
          alternativas: {
            create: this.mapearAlternativas(data),
          },
        },
        include: includeQuestaoCompleta,
      });

      return {
        questao: questao as RegistroQuestaoCompleta,
        temaCriado,
      };
    });
  }

  /**
   * Atualiza uma questao por versionamento: inativa a antiga e cria uma nova versao.
   *
   * A nova questao referencia a original via questaoOriginalId, preservando o
   * historico de resolucoes ligado a versao anterior. Tudo numa transacao.
   *
   * @param id Id da questao a versionar.
   * @param data Dados completos da nova versao.
   * @param criadoPorId Autor da edicao.
   * @returns A nova versao criada.
   */
  async atualizar(id: string, data: CriarQuestaoDto, criadoPorId: string) {
    return prisma.$transaction(async (transacao) => {
      // Inativa (soft delete) a versao atual antes de criar a nova.
      await transacao.questao.update({
        where: { id },
        data: {
          status: "INATIVO",
          excluidoEm: new Date(),
        },
      });

      const temaExistente = await transacao.tema.findFirst({
        where: { nome: data.tema, excluidoEm: null },
      });
      const tema = temaExistente ?? (await transacao.tema.create({ data: { nome: data.tema } }));

      return await transacao.questao.create({
        data: {
          enunciado: data.enunciado,
          tipoQuestao: data.tipo,
          dificuldade: data.dificuldade,
          respostaCorreta: data.alternativaCorreta,
          saibaMais: data.saibaMais,
          urlImagem: data.imagem ?? null,
          taxonomiaBloom: data.taxonomiaBloom ?? null,
          origemQuestao: data.origemQuestao ?? undefined,
          regiaoAnatomica: data.regiaoAnatomica?.trim() || null,
          palavrasChave: this.normalizarPalavrasChave(data.palavrasChave),
          questaoOriginalId: id,
          criadoPorId,
          temaId: tema.id,
          alternativas: {
            create: this.mapearAlternativas(data),
          },
        },
        include: includeQuestaoCompleta,
      });
    });
  }

  /**
   * Desativa a questao (soft delete: status INATIVO + excluidoEm).
   *
   * @param id Id da questao.
   * @returns A questao desativada.
   */
  async desativar(id: string) {
    return prisma.questao.update({
      where: { id },
      data: {
        status: "INATIVO",
        excluidoEm: new Date(),
      },
      include: includeQuestaoCompleta,
    }) as Promise<RegistroQuestaoCompleta>;
  }

  /**
   * Normaliza palavras-chave: aceita string CSV ou array, faz trim, remove vazios e duplicatas.
   *
   * @param valor Palavras-chave como CSV ou array (opcional).
   * @returns Lista normalizada e sem repeticoes.
   */
  private normalizarPalavrasChave(valor?: string | string[]): string[] {
    const lista = Array.isArray(valor) ? valor : valor ? valor.split(",") : [];

    return [...new Set(lista.map((palavra) => palavra.trim()).filter(Boolean))];
  }

  /**
   * Mapeia as alternativas para as colunas A-E; certo/errado usa so C (verdadeiro) e E (falso).
   *
   * @param data Tipo da questao e suas alternativas.
   * @returns Objeto com as cinco colunas de alternativa preenchidas.
   */
  private mapearAlternativas(data: Pick<CriarQuestaoDto, "tipo" | "alternativas">) {
    if (data.tipo === "CERTO_ERRADO") {
      const alternativas = data.alternativas as AlternativasCertoErradoDto;

      return {
        alternativaA: "",
        alternativaB: "",
        alternativaC: alternativas.C,
        alternativaD: "",
        alternativaE: alternativas.E,
      };
    }

    const alternativas = data.alternativas as AlternativasMultiplaEscolhaDto;

    return {
      alternativaA: alternativas.A,
      alternativaB: alternativas.B,
      alternativaC: alternativas.C,
      alternativaD: alternativas.D,
      alternativaE: alternativas.E,
    };
  }

  /**
   * Helper: retorna o tema pelo nome ou o cria, dentro de uma transacao.
   *
   * @param transacao Cliente de transacao do Prisma.
   * @param nome Nome do tema.
   * @returns O tema existente ou recem-criado.
   */
  private async buscarOuCriarTema(transacao: Prisma.TransactionClient, nome: string) {
    const temaExistente = await transacao.tema.findFirst({
      where: { nome, excluidoEm: null },
    });

    return temaExistente ?? transacao.tema.create({ data: { nome } });
  }
}
