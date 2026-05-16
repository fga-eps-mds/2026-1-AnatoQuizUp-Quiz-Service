import type { RegistroQuestaoCompleta } from "@/modules/questao/dto/questao.types";
import type { RespostaQuestaoQuizDto } from "./resposta_questao_quiz_dto";
import { mapearTipoBancoParaApi, TIPO_QUESTAO_API } from "@/modules/questao/dto/questao.types";

export function converterParaRespostaQuestaoQuiz(
  questao: RegistroQuestaoCompleta,
): RespostaQuestaoQuizDto {
  const tipo = mapearTipoBancoParaApi(questao.tipoQuestao);
  const alternativas =
    tipo === TIPO_QUESTAO_API.VERDADEIRO_FALSO
      ? {
          C: questao.alternativas?.alternativaC,
          E: questao.alternativas?.alternativaE,
        }
      : {
          A: questao.alternativas?.alternativaA,
          B: questao.alternativas?.alternativaB,
          C: questao.alternativas?.alternativaC,
          D: questao.alternativas?.alternativaD,
          E: questao.alternativas?.alternativaE,
        };

  return {
    id: questao.id,
    tema: {
      id: questao.tema.id,
      nome: questao.tema.nome,
    },
    enunciado: questao.enunciado,
    tipo,
    dificuldade: questao.dificuldade,
    imagem: questao.urlImagem,
    alternativas,
    status: questao.status,
  };
}
