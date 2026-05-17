import type { RespostaQuestaoQuizDto } from "./dto/resposta_questao_quiz_dto";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { converterParaRespostaQuestaoQuiz } from "./dto/converter_para_resposta_questao_quiz";
import type { FiltroListarQuestoesQueryDto } from "@/modules/questoes/dto/question.types";
import {
  montarMetadadosPaginacao,
  resolverParametrosPaginacao,
} from "@/shared/utils/paginacao.util";
import type { RespostaPaginada } from "@/shared/types/api.types";
import type { QuizRepository } from "./quiz.repository";

export class QuizService {
  constructor(private readonly quizRepository: QuizRepository) {}

  async buscar_questoes_quiz(
    query: FiltroListarQuestoesQueryDto,
  ): Promise<RespostaPaginada<RespostaQuestaoQuizDto>> {
    const paginacao = resolverParametrosPaginacao(query);

    const num_questoes_quiz = await this.quizRepository.contarQuestoesQuiz(query);
    if (num_questoes_quiz) {
      const randomSkip = Math.floor(Math.random() * num_questoes_quiz);
      paginacao.skip = randomSkip;
    }
    const { data, total } = await this.quizRepository.filtrar_questoes_quiz(paginacao, query);

    if (!data) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: MENSAGENS.questaoNaoEncontrada,
      });
    }

    const questoes_quiz = data.map(converterParaRespostaQuestaoQuiz);
    const questoes_quiz_embaralhadas = this.embaralhar<RespostaQuestaoQuizDto>(questoes_quiz);

    return {
      dados: questoes_quiz_embaralhadas,
      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }

  embaralhar<T>(array: T[]): T[] {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }
}
