import { TIPO_QUESTAO_API, mapearTipoBancoParaApi } from "@/modules/questoes/dto/question.types";
import type { TipoQuestaoApi } from "@/modules/questoes/dto/question.types";
import type { ListarQuestoesRespondidasItem } from "../database/questoes_respondidas_banco_dto";
import type {
  AlternativasDto,
  ResolucaoQuestaoUsuarioDto,
} from "../responses/resolucao_questao_usuario_dto";

type Alternativas = {
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  alternativaE: string;
};

export function montarAlternativasResolucao(
  tipo: TipoQuestaoApi,
  alternativas: Alternativas | null,
): AlternativasDto | null {
  if (!alternativas) {
    return null;
  }

  if (tipo === TIPO_QUESTAO_API.VERDADEIRO_FALSO) {
    return {
      alternativaC: alternativas.alternativaC,
      alternativaE: alternativas.alternativaE,
    };
  }

  return {
    alternativaA: alternativas.alternativaA,
    alternativaB: alternativas.alternativaB,
    alternativaC: alternativas.alternativaC,
    alternativaD: alternativas.alternativaD,
    alternativaE: alternativas.alternativaE,
  };
}

export function converterResolucaoQuestaoBancoToApi(
  resolucaoQuestaoUsuarioBanco: ListarQuestoesRespondidasItem,
  tentativas: number,
  distribuicao: Record<string, number>,
): ResolucaoQuestaoUsuarioDto {
  const tipo = mapearTipoBancoParaApi(resolucaoQuestaoUsuarioBanco.questao.tipoQuestao);

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

      feitoPorIa: resolucaoQuestaoUsuarioBanco.questao.feitoPorIa,

      urlImagem: resolucaoQuestaoUsuarioBanco.questao.urlImagem,

      dificuldade: resolucaoQuestaoUsuarioBanco.questao.dificuldade,

      alternativas: montarAlternativasResolucao(
        tipo,
        resolucaoQuestaoUsuarioBanco.questao.alternativas,
      ),
    },
  };
}
