import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

import type { DashboardAlunoRepository } from "./dashboardAluno.repository";
import type {
  DashboardAlunoDto,
  DesempenhoTemaAlunoDto,
  StatusDesempenhoTema,
  DesempenhoListaAlunoDto,
} from "./dto/dashboardAluno.types";

// Service do dashboard do aluno: agrega as proprias resolucoes e listas em metricas
// de desempenho (geral, por tema e por lista).

// Faixas de classificacao da taxa de acerto por tema.
const LIMITE_TRANQUILO = 70;
const LIMITE_ATENCAO = 40;

// Classifica a taxa de acerto em status visual (Tranquilo/Atencao/Critico).
function classificarStatus(taxaAcerto: number): StatusDesempenhoTema {
  if (taxaAcerto >= LIMITE_TRANQUILO) return "Tranquilo";
  if (taxaAcerto >= LIMITE_ATENCAO) return "Atenção";
  return "Crítico";
}

// Percentual inteiro de "parte" sobre "total", protegido contra divisao por zero.
function calcularPercentual(parte: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((parte / total) * 100);
}

type EstatisticaTema = { nome: string; total: number; acertos: number };

export class DashboardAlunoService {
  constructor(private readonly repository: DashboardAlunoRepository) {}

  /**
   * Monta o dashboard de desempenho do proprio aluno.
   *
   * Agrega as resolucoes em totais e estatisticas por tema, e as listas em desempenho
   * por lista (acertos/taxa/status). Busca resolucoes e listas em paralelo.
   *
   * @param usuarioId Aluno autenticado.
   * @returns Metricas gerais, por tema e por lista.
   * @throws ErroAplicacao 401 se nao houver usuario.
   */
  async obterDashboard(usuarioId: string | undefined): Promise<DashboardAlunoDto> {
    if (!usuarioId) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const [resolucoes, listas] = await Promise.all([
      this.repository.buscarResolucoesPorUsuario(usuarioId),
      this.repository.buscarListasDoUsuario(usuarioId),
    ]);

    // Acumula acertos totais e estatisticas por tema percorrendo as resolucoes.
    let totalAcertos = 0;
    const temasMap = new Map<string, EstatisticaTema>();

    for (const resolucao of resolucoes) {
      const acertou = resolucao.respostaMarcada === resolucao.questao.respostaCorreta;
      if (acertou) totalAcertos += 1;

      const { id: temaId, nome } = resolucao.questao.tema;
      const estatistica = temasMap.get(temaId) ?? { nome, total: 0, acertos: 0 };
      estatistica.total += 1;
      if (acertou) estatistica.acertos += 1;
      temasMap.set(temaId, estatistica);
    }

    const totalRespondidas = resolucoes.length;
    const totalErros = totalRespondidas - totalAcertos;

    const porTema: DesempenhoTemaAlunoDto[] = Array.from(temasMap.entries()).map(
      ([temaId, estatistica]) => {
        const taxaAcerto = calcularPercentual(estatistica.acertos, estatistica.total);
        return {
          temaId,
          nome: estatistica.nome,
          totalRespondidas: estatistica.total,
          acertos: estatistica.acertos,
          erros: estatistica.total - estatistica.acertos,
          taxaAcerto,
          status: classificarStatus(taxaAcerto),
        };
      },
    );

    porTema.sort((a, b) => b.taxaAcerto - a.taxaAcerto);

    // Desempenho por lista: status, acertos e taxa (so quem tem resolucao registrada).
    const porLista: DesempenhoListaAlunoDto[] = listas.map((lista) => {
      const totalQuestoes = lista.listaQuestao._count.itens;
      const resolucao = lista.resolucoes[0];

      let acertos = 0;
      let taxaAcerto = 0;
      let status: "SUBMETIDA" | "EM_ANDAMENTO" | "NAO_RESPONDEU" = "NAO_RESPONDEU";
      let submissaoEm: string | null = null;

      if (resolucao) {
        status = resolucao.status as "SUBMETIDA" | "EM_ANDAMENTO" | "NAO_RESPONDEU";
        submissaoEm = resolucao.submissaoEm?.toISOString() ?? null;

        acertos = resolucao.respostas.filter(
          (r: { respostaMarcada: string | null; questao: { respostaCorreta: string } }) =>
            r.respostaMarcada === r.questao.respostaCorreta
        ).length;

        taxaAcerto = calcularPercentual(acertos, totalQuestoes);
      }

      return {
        listaTurmaId: lista.id,
        nomeLista: lista.listaQuestao.nome,
        totalQuestoes,
        acertos,
        taxaAcerto,
        status,
        submissaoEm,
        prazo: lista.prazo?.toISOString() ?? null,
      };
    });

    return {
      totalRespondidas,
      totalAcertos,
      totalErros,
      taxaAcerto: calcularPercentual(totalAcertos, totalRespondidas),
      porTema,
      porLista,
    };
  }
}