import { TIPO_QUESTAO_API } from "@/modules/questoes/dto/question.types";
import type { TipoQuestaoApi } from "@/modules/questoes/dto/question.types";
import type { ListarQuestoesRespondidasItem } from "../database/questoes_respondidas_banco_dto";
import type {
  AlternativasDto,
  ResolucaoQuestaoUsuarioDto,
} from "../responses/resolucao_questao_usuario_dto";

// Mappers do historico do quiz: convertem o registro do banco no DTO da API.

// Formato cru das alternativas vindas do banco (sempre as cinco colunas).
type Alternativas = {
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  alternativaE: string;
};

// Seleciona apenas as alternativas relevantes ao tipo da questao.
export function montarAlternativasResolucao(
  tipo: TipoQuestaoApi,
  alternativas: Alternativas | null,
): AlternativasDto | null {
  if (!alternativas) {
    return null;
  }

  // Certo/errado usa apenas C e E.
  if (tipo === TIPO_QUESTAO_API.CERTO_ERRADO) {
    return {
      alternativaC: alternativas.alternativaC,
      alternativaE: alternativas.alternativaE,
    };
  }

  // Multipla escolha expoe as cinco alternativas.
  return {
    alternativaA: alternativas.alternativaA,
    alternativaB: alternativas.alternativaB,
    alternativaC: alternativas.alternativaC,
    alternativaD: alternativas.alternativaD,
    alternativaE: alternativas.alternativaE,
  };
}

// Converte a resolucao do banco no DTO da API, agregando tentativas e distribuicao.
export function converterResolucaoQuestaoBancoToApi(
  resolucaoQuestaoUsuarioBanco: ListarQuestoesRespondidasItem,
  tentativas: number,
  distribuicao: Record<string, number>,
): ResolucaoQuestaoUsuarioDto {
  const tipo = resolucaoQuestaoUsuarioBanco.questao.tipoQuestao;

  return {
    id: resolucaoQuestaoUsuarioBanco.id,
    criadoEm: resolucaoQuestaoUsuarioBanco.criadoEm,
    respostaMarcada: resolucaoQuestaoUsuarioBanco.respostaMarcada,
    questaoId: resolucaoQuestaoUsuarioBanco.questaoId,
    tentativas,
    distribuicao,

    questao: {
      tema: {
        id: resolucaoQuestaoUsuarioBanco.questao.tema.id,
        nome: resolucaoQuestaoUsuarioBanco.questao.tema.nome,
      },

      enunciado: resolucaoQuestaoUsuarioBanco.questao.enunciado,

      tipoQuestao: tipo,

      respostaCorreta: resolucaoQuestaoUsuarioBanco.questao.respostaCorreta,

      saibaMais: resolucaoQuestaoUsuarioBanco.questao.saibaMais,

      status: resolucaoQuestaoUsuarioBanco.questao.status,

      origemQuestao: resolucaoQuestaoUsuarioBanco.questao.origemQuestao,

      urlImagem: resolucaoQuestaoUsuarioBanco.questao.urlImagem,

      dificuldade: resolucaoQuestaoUsuarioBanco.questao.dificuldade,

      alternativas: montarAlternativasResolucao(
        tipo,
        resolucaoQuestaoUsuarioBanco.questao.alternativas,
      ),
    },
  };
}
