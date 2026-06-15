import { z } from "zod";

import { TaxonomiaBloom, OrigemQuestao } from "@prisma/client";

import { TIPO_QUESTAO_API, DIFICULDADE_API } from "./dto/question.types";

const alternativa = z.string().trim().min(1).max(1000);

// Campos de classificação pedagógica/anatômica — todos opcionais, compartilhados
// entre os schemas de criar e atualizar (ambos os ramos de cada discriminated union).
const camposClassificacao = {
  taxonomiaBloom: z.enum(TaxonomiaBloom).optional(),
  origemQuestao: z.enum(OrigemQuestao).optional(),
  regiaoAnatomica: z.string().trim().max(255).optional(),
};

export const VALORES_DIFICULDADE = [
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

const schemaAlternativasCertoErrado = z.object({
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
  tipo: z.enum([TIPO_QUESTAO_API.MULTIPLA_ESCOLHA, TIPO_QUESTAO_API.CERTO_ERRADO]).optional(),
  taxonomiaBloom: z.enum(TaxonomiaBloom).optional(),
});

export const schemaCriarQuestao = z.discriminatedUnion("tipo", [
  z.object({
    tema: z.string().trim().min(1).max(120),
    enunciado: z.string().trim().min(1).max(5000),
    tipo: z.literal(TIPO_QUESTAO_API.MULTIPLA_ESCOLHA),
    dificuldade: z.enum(VALORES_DIFICULDADE),
    imagem: z.string().trim().url().max(2048).optional(),
    alternativaCorreta: z.enum(["A", "B", "C", "D", "E"]),
    saibaMais: z.string().trim().min(1).max(5000),
    ...camposClassificacao,
    alternativas: schemaAlternativasMultiplaEscolha,
  }),
  z.object({
    tema: z.string().trim().min(1).max(120),
    enunciado: z.string().trim().min(1).max(5000),
    tipo: z.literal(TIPO_QUESTAO_API.CERTO_ERRADO),
    dificuldade: z.enum(VALORES_DIFICULDADE),
    imagem: z.string().trim().url().max(2048).optional(),
    alternativaCorreta: z.enum(["C", "E"]),
    saibaMais: z.string().trim().min(1).max(5000),
    ...camposClassificacao,
    alternativas: schemaAlternativasCertoErrado,
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
        saibaMais: z.string().trim().min(1).max(5000).optional(),
        ...camposClassificacao,
        alternativas: schemaAlternativasMultiplaEscolha.optional(),
      })
      .refine((data) => data.tipo || Object.keys(data).length > 0),
    z
      .object({
        tema: z.string().trim().min(1).max(120).optional(),
        enunciado: z.string().trim().min(1).max(5000).optional(),
        tipo: z.literal(TIPO_QUESTAO_API.CERTO_ERRADO),
        dificuldade: z.enum(VALORES_DIFICULDADE).optional(),
        imagem: z.string().trim().url().max(2048).nullable().optional(),
        alternativaCorreta: z.enum(["C", "E"]).optional(),
        saibaMais: z.string().trim().min(1).max(5000).optional(),
        ...camposClassificacao,
        alternativas: schemaAlternativasCertoErrado.optional(),
      })
      .refine((data) => Object.keys(data).length > 0),
  ])
  .refine((data) => Object.keys(data).length > 0);
