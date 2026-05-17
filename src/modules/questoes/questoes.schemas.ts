import { z } from "zod";

import { TIPO_QUESTAO_API, DIFICULDADE_API } from "./dto/question.types";

const alternativa = z.string().trim().min(1).max(1000);

const VALORES_DIFICULDADE = [
  DIFICULDADE_API.FACIL,
  DIFICULDADE_API.MEDIA,
  DIFICULDADE_API.DIFICIL,
] as const;

const schemaAlternativasMultiplaEscolha = z.object({
  A: alternativa,
  B: alternativa,
  C: alternativa,
  D: alternativa,
  E: alternativa,
});

const schemaAlternativasVerdadeiroFalso = z.object({
  C: alternativa,
  E: alternativa,
});

export const schemaListarQuestoes = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const schemaBuscarQuestaoPorId = z.object({
  id: z.string().trim().min(1),
});

export const schemaFiltrarQuestoes = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  tema: z.string().trim().optional(),
  dificuldade: z.enum(VALORES_DIFICULDADE).optional(),
  tipo: z.enum([TIPO_QUESTAO_API.MULTIPLA_ESCOLHA, TIPO_QUESTAO_API.VERDADEIRO_FALSO]).optional(),
});

export const schemaCriarQuestao = z.discriminatedUnion("tipo", [
  z.object({
    tema: z.string().trim().min(1).max(120),
    enunciado: z.string().trim().min(1).max(5000),
    tipo: z.literal(TIPO_QUESTAO_API.MULTIPLA_ESCOLHA),
    dificuldade: z.enum(VALORES_DIFICULDADE),
    imagem: z.string().trim().url().max(2048).optional(),
    alternativaCorreta: z.enum(["A", "B", "C", "D", "E"]),
    explicacaoPedagogica: z.string().trim().min(1).max(5000),
    alternativas: schemaAlternativasMultiplaEscolha,
  }),
  z.object({
    tema: z.string().trim().min(1).max(120),
    enunciado: z.string().trim().min(1).max(5000),
    tipo: z.literal(TIPO_QUESTAO_API.VERDADEIRO_FALSO),
    dificuldade: z.enum(VALORES_DIFICULDADE),
    imagem: z.string().trim().url().max(2048).optional(),
    alternativaCorreta: z.enum(["C", "E"]),
    explicacaoPedagogica: z.string().trim().min(1).max(5000),
    alternativas: schemaAlternativasVerdadeiroFalso,
  }),
]);

export const schemaAtualizarQuestao = z
  .union([
    z
      .object({
        tema: z.string().trim().min(1).max(120).optional(),
        enunciado: z.string().trim().min(1).max(5000).optional(),
        tipo: z.literal(TIPO_QUESTAO_API.MULTIPLA_ESCOLHA).optional(),
        dificuldade: z.enum(VALORES_DIFICULDADE).optional(),
        imagem: z.string().trim().url().max(2048).nullable().optional(),
        alternativaCorreta: z.enum(["A", "B", "C", "D", "E"]).optional(),
        explicacaoPedagogica: z.string().trim().min(1).max(5000).optional(),
        alternativas: schemaAlternativasMultiplaEscolha.optional(),
      })
      .refine((data) => data.tipo || Object.keys(data).length > 0),
    z
      .object({
        tema: z.string().trim().min(1).max(120).optional(),
        enunciado: z.string().trim().min(1).max(5000).optional(),
        tipo: z.literal(TIPO_QUESTAO_API.VERDADEIRO_FALSO),
        dificuldade: z.enum(VALORES_DIFICULDADE).optional(),
        imagem: z.string().trim().url().max(2048).nullable().optional(),
        alternativaCorreta: z.enum(["C", "E"]).optional(),
        explicacaoPedagogica: z.string().trim().min(1).max(5000).optional(),
        alternativas: schemaAlternativasVerdadeiroFalso.optional(),
      })
      .refine((data) => Object.keys(data).length > 0),
  ])
  .refine((data) => Object.keys(data).length > 0);
