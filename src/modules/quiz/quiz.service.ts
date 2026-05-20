import type { RespostaQuestaoQuizDto } from "./dto/resposta_questao_quiz_dto";
import type { FiltroListarQuestoesQueryDto } from "../questoes/dto/question.types";
import type { RespostaPaginada } from "@/shared/types/api.types";
import type { QuizRepository, RegistroResolucaoQuestaoCompleta } from "./quiz.repository";
import type { FeedbackQuizDto } from "./dto/feedback_quiz_dto";
import type { ResponderQuestaoQuizDto } from "./dto/responder_questao_quiz_dto";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { converterParaRespostaQuestaoQuiz } from "./dto/converter_para_resposta_questao_quiz";
import {
  montarMetadadosPaginacao,
  resolverParametrosPaginacao,
} from "@/shared/utils/paginacao.util";
import type { QuantidadeQuestoesPorTema } from "./dto/quantidade_questao_tema_dto";

export class QuizService {
  constructor(private readonly quizRepository: QuizRepository) {}

  async buscarQuestoesQuiz(
    query: FiltroListarQuestoesQueryDto,
  ): Promise<RespostaPaginada<RespostaQuestaoQuizDto>> {
    const paginacao = resolverParametrosPaginacao(query);

    const num_questoes_quiz = await this.quizRepository.contarQuestoesQuiz(query);
    if (num_questoes_quiz) {
      const randomSkip = Math.floor(Math.random() * num_questoes_quiz);
      paginacao.skip = randomSkip;
    }
    const { data, total } = await this.quizRepository.filtrarQuestoesQuiz(paginacao, query);

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

  async responderQuestaoQuiz(
    data: ResponderQuestaoQuizDto,
    usuarioId: string,
  ): Promise<FeedbackQuizDto> {
    if (usuarioId === "") {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const tentativa_registrada = await this.quizRepository.registrarTentativa(data, usuarioId);

    if (!tentativa_registrada) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.ERRO_TENTATIVA,
        mensagem: MENSAGENS.erroTentativa,
      });
    }

    const gabarito = await this.quizRepository.buscarResposta(data.questaoId);

    if (!gabarito) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.ERRO_FEEDBACK,
        mensagem: MENSAGENS.erroFeedback,
      });
    }

    let feedback;
    if (gabarito?.respostaCorreta === data.respostaMarcada) {
      feedback = { correcao: true, saibaMais: gabarito?.saibaMais ?? "" };
    } else {
      feedback = { correcao: false, saibaMais: gabarito?.saibaMais ?? "" };
    }

    return feedback;
  }

  private embaralhar<T>(array: T[]): T[] {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  async buscarQuantidadeDeQuestoesPorTema(): Promise<QuantidadeQuestoesPorTema[]> {
    const temas = await this.quizRepository.buscarQuantidadeDeQuestoesPorTema();

    if (!temas) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.TEMAS_NAO_ENCONTRADOS,
        mensagem: MENSAGENS.temasNaoEncontrados,
      });
    }

    return temas.map((tema) => {
      const quantidadePorDificuldade = {
        FACIL: 0,
        MEDIA: 0,
        DIFICIL: 0,
      };

      tema.questoes.forEach((questao) => {
        quantidadePorDificuldade[questao.dificuldade]++;
      });

      return {
        nome: tema.nome,
        totalQuestoes: tema._count.questoes,
        porDificuldade: quantidadePorDificuldade,
      };
    });
  }

  async listarResolucaoQuestoesUsuario(
    usuarioId: string | undefined,
    query: FiltroListarQuestoesQueryDto,
  ): Promise<RespostaPaginada<RegistroResolucaoQuestaoCompleta>> {
    if (usuarioId === "" || usuarioId === undefined) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const paginacao = resolverParametrosPaginacao(query);
    const { data, total } = await this.quizRepository.listarResolucaoQuestoesUsuario(
      usuarioId,
      paginacao,
      query,
    );

    if (!data) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: MENSAGENS.questaoNaoEncontrada,
      });
    }

    return {
      dados: data,
      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }
}
