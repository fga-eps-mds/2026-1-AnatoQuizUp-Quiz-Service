import { z } from "zod";

import { TaxonomiaBloom, OrigemQuestao } from "@prisma/client";

import { TIPO_QUESTAO_API, DIFICULDADE_API } from "./dto/question.types";

// Schemas Zod de validacao das rotas de questoes. Usa discriminated union por "tipo"
// para exigir o conjunto certo de alternativas (A-E para multipla escolha; C/E para certo-errado).

// Texto de uma alternativa: obrigatorio, ate 1000 caracteres.
const alternativa = z.string().trim().min(1).max(1000);

// Campos de classificação pedagógica/anatômica — todos opcionais, compartilhados
// entre os schemas de criar e atualizar (ambos os ramos de cada discriminated union).
const camposClassificacao = {
  taxonomiaBloom: z.enum(TaxonomiaBloom).optional(),
  origemQuestao: z.enum(OrigemQuestao).optional(),
  regiaoAnatomica: z.string().trim().max(255).optional(),
  palavrasChave: z.union([z.string(), z.array(z.string())]).optional(),
};

// Valores aceitos de dificuldade (reaproveitados em varios schemas).
export const VALORES_DIFICULDADE = [
  DIFICULDADE_API.FACIL,
  DIFICULDADE_API.MEDIA,
  DIFICULDADE_API.DIFICIL,
] as const;

// Multipla escolha exige as cinco alternativas (A-E).
const schemaAlternativasMultiplaEscolha = z.object({
  A: alternativa,
  B: alternativa,
  C: alternativa,
  D: alternativa,
  E: alternativa,
});

// Certo/errado usa so C (verdadeiro) e E (falso).
const schemaAlternativasCertoErrado = z.object({
  C: alternativa,
  E: alternativa,
});

// Query de listagem paginada simples.
export const schemaListarQuestoes = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// Valida o id na rota de busca por id.
export const schemaBuscarQuestaoPorId = z.object({
  id: z.string().trim().min(1),
});

// Query de filtros do banco de questoes (tema/dificuldade/tipo/taxonomia).
export const schemaFiltrarQuestoes = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  tema: z.string().trim().optional(),
  dificuldade: z.enum(VALORES_DIFICULDADE).optional(),
  tipo: z.enum([TIPO_QUESTAO_API.MULTIPLA_ESCOLHA, TIPO_QUESTAO_API.CERTO_ERRADO]).optional(),
  taxonomiaBloom: z.enum(TaxonomiaBloom).optional(),
});

// Criacao: discriminada por "tipo"; cada ramo casa o gabarito e as alternativas certas.
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

// Edicao: campos opcionais (parcial); os refine garantem que algo foi enviado.
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
