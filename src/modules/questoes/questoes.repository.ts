import type { Prisma } from "@prisma/client";

import { prisma } from "@/config/db";
import type { ParametrosPaginacao } from "@/shared/utils/paginacao.util";

import type { CriarQuestaoDto, FiltroListarQuestoesQueryDto, RegistroQuestaoCompleta } from "./dto/question.types";
import type {
  AlternativasMultiplaEscolhaDto,
  AlternativasVerdadeiroFalsoDto,
} from "./dto/question.types";
import { mapearTipoApiParaBanco } from "./dto/question.types";


const includeQuestaoCompleta = {
  tema: true,
  alternativas: true,
} as const;

export class QuestionRepository {
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

  async buscarPorId(id: string) {
    return prisma.questao.findFirst({
      where: { id, excluidoEm: null },
      include: includeQuestaoCompleta,
    }) as Promise<RegistroQuestaoCompleta | null>;
  }

  async filtrar(paginacao: ParametrosPaginacao, filtros: FiltroListarQuestoesQueryDto) {
    const where: Prisma.QuestaoWhereInput = {
      excluidoEm: null,
      status: "ATIVO",
    };

   if (filtros.tema) {
      where.tema = { nome: { contains: filtros.tema, mode: 'insensitive' } };
    }
    
    if (filtros.dificuldade) {
      where.dificuldade = filtros.dificuldade;
    }
    
    if (filtros.tipo) {
      where.tipoQuestao = mapearTipoApiParaBanco(filtros.tipo);
    }

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

  async criar(data: CriarQuestaoDto, criadoPorId: string) {
    return prisma.$transaction(async (transacao) => {
      const temaExistente = await transacao.tema.findFirst({
        where: { nome: data.tema, excluidoEm: null },
      });
      const tema = temaExistente ?? (await transacao.tema.create({ data: { nome: data.tema } }));

      const questao = await transacao.questao.create({
        data: {
          enunciado: data.enunciado,
          tipoQuestao: mapearTipoApiParaBanco(data.tipo),
          dificuldade: data.dificuldade,
          respostaCorreta: data.alternativaCorreta,
          saibaMais: data.explicacaoPedagogica,
          urlImagem: data.imagem ?? null,
          criadoPorId,
          temaId: tema.id,
          alternativas: {
            create: this.mapearAlternativas(data),
          },
        },
        include: includeQuestaoCompleta,
      });

      return questao as RegistroQuestaoCompleta;
    });
  }

  async atualizar(id: string, data: CriarQuestaoDto, criadoPorId: string) {
    return prisma.$transaction(async (transacao) => {
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
          tipoQuestao: mapearTipoApiParaBanco(data.tipo),
          dificuldade: data.dificuldade,
          respostaCorreta: data.alternativaCorreta,
          saibaMais: data.explicacaoPedagogica,
          urlImagem: data.imagem ?? null,
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

  private mapearAlternativas(data: Pick<CriarQuestaoDto, "tipo" | "alternativas">) {
    if (data.tipo === "VERDADEIRO_FALSO") {
      const alternativas = data.alternativas as AlternativasVerdadeiroFalsoDto;

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

  private async buscarOuCriarTema(transacao: Prisma.TransactionClient, nome: string) {
    const temaExistente = await transacao.tema.findFirst({
      where: { nome, excluidoEm: null },
    });

    return temaExistente ?? transacao.tema.create({ data: { nome } });
  }
}
