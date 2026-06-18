import type { RespostaQuestaoQuizDto } from "./dto/responses/resposta_questao_quiz_dto";
import { type FiltroListarQuestoesQueryDto } from "../questoes/dto/question.types";
import type { RespostaPaginada } from "@/shared/types/api.types";
import type { QuizRepository } from "./quiz.repository";
import type { FeedbackQuizDto } from "./dto/responses/feedback_quiz_dto";
import type { ResponderQuestaoQuizDto } from "./dto/requests/responder_questao_quiz_dto";
import { MENSAGENS } from "@/shared/constants/mensagens";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { PAPEIS, type Papel } from "@/shared/constants/papeis";
import { converterParaRespostaQuestaoQuiz } from "./dto/mappers/converter_para_resposta_questao_quiz";
import {
  montarMetadadosPaginacao,
  resolverParametrosPaginacao,
} from "@/shared/utils/paginacao.util";
import type { QuantidadeQuestoesPorTema } from "./dto/responses/quantidade_questao_tema_dto";
import { type ResolucaoQuestaoUsuarioDto } from "./dto/responses/resolucao_questao_usuario_dto";
import { converterResolucaoQuestaoBancoToApi } from "./dto/mappers/historico_quiz.mapper";
import type { Dificuldade } from "@prisma/client";
import type { ConquistaService } from "../conquistas/conquistas.service";
import type { TierConquista } from "@prisma/client";

const MOEDAS_POR_DIFICULDADE: Record<Dificuldade, number> = {
  FACIL: 10,
  MEDIA: 25,
  DIFICIL: 50,
};

const MOEDAS_POR_TIER_DESBLOQUEIO: Record<TierConquista, number> = {
  BRONZE: 30,
  PRATA: 50,
  OURO: 70,
};

export class QuizService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly conquistaService: ConquistaService,
  ) {}

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

    if (!data || data.length === 0) {
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
    id_usuario: string,
    papel_usuario?: Papel,
  ): Promise<FeedbackQuizDto> {
    if (id_usuario === "") {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
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

    const tentativa_registrada = await this.quizRepository.registrarTentativa(data, id_usuario);

    if (!tentativa_registrada) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.ERRO_TENTATIVA,
        mensagem: MENSAGENS.erroTentativa,
      });
    }

    const correcao = gabarito.respostaCorreta === data.respostaMarcada;
    const alunoPodeReceberMoedas = papel_usuario === PAPEIS.ALUNO;

    const conquistas = await this.conquistaService.processarRespostaQuestao(
      id_usuario,
      gabarito.temaId,
      gabarito.tema.nome,
      correcao,
    );

    const conquistasDesbloqueadas = conquistas.map((conquista) => ({
      ...conquista,
      moedasConcedidas: MOEDAS_POR_TIER_DESBLOQUEIO[conquista.tier],
    }));

    if (conquistas.length > 0) {
      await this.quizRepository.concederMoedasPorConquistas(
        id_usuario,
        conquistas.map((desbloqueio) => ({
          desbloqueioId: desbloqueio.desbloqueioId,
          quantidade: MOEDAS_POR_TIER_DESBLOQUEIO[desbloqueio.tier],
        })),
      );
    }

    let moedasConcedidas = 0;
    let moedasJaConcedidas = false;

    if (correcao && alunoPodeReceberMoedas) {
      const resultado = await this.quizRepository.concederMoedasPorAcerto(
        id_usuario,
        data.questaoId,
        MOEDAS_POR_DIFICULDADE[gabarito.dificuldade],
      );

      moedasConcedidas = resultado.moedasConcedidas;
      moedasJaConcedidas = resultado.moedasJaConcedidas;
    }

    const saldoMoedas = await this.quizRepository.buscarSaldoMoedas(id_usuario);

    return {
      correcao,
      saibaMais: gabarito.saibaMais ?? "",
      respostaCorreta: gabarito.respostaCorreta,
      saldoMoedas,
      moedasConcedidas,
      moedasJaConcedidas,
      conquistasDesbloqueadas,
    };
  }

  async buscarSaldoMoedas(id_usuario: string): Promise<{ saldoMoedas: number }> {
    if (id_usuario === "") {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const saldoMoedas = await this.quizRepository.buscarSaldoMoedas(id_usuario);

    return { saldoMoedas };
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
      const quantidadePorDificuldade = { FACIL: 0, MEDIA: 0, DIFICIL: 0 };
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

  async buscarHistorico(
    usuarioId: string | undefined,
    query: FiltroListarQuestoesQueryDto,
  ): Promise<RespostaPaginada<ResolucaoQuestaoUsuarioDto>> {
    if (usuarioId === "" || usuarioId === undefined) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const paginacao = resolverParametrosPaginacao(query);
    const { data, total } = await this.quizRepository.listarQuestoesRespondidas(
      usuarioId,
      paginacao,
      query,
    );

    if (!data || data.length === 0) {
      return { dados: [], metadados: montarMetadadosPaginacao(paginacao, 0) };
    }

    const dados = data.map((item) => {
      return converterResolucaoQuestaoBancoToApi(item, 1, { [item.respostaMarcada]: 1 });
    });

    return {
      dados,
      metadados: montarMetadadosPaginacao(paginacao, total),
    };
  }
}
