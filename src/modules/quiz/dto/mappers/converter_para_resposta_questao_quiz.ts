import type { RegistroQuestaoCompleta } from "@/modules/questoes/dto/question.types";
import type { RespostaQuestaoQuizDto } from "../responses/resposta_questao_quiz_dto";
import { montarAlternativas } from "@/modules/questoes/dto/question.types";

// Converte a questao completa do banco no DTO enviado ao quiz, sem expor o gabarito.
export function converterParaRespostaQuestaoQuiz(
  questao: RegistroQuestaoCompleta,
): RespostaQuestaoQuizDto {
  const tipo = questao.tipoQuestao;
  // Monta as alternativas conforme o tipo (multipla escolha x certo/errado).
  const alternativas = montarAlternativas(tipo, questao.alternativas);

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
