import { MENSAGENS } from "@/shared/constants/mensagens";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

import type { DashboardAlunoRepository } from "./dashboardAluno.repository";
import type {
  DashboardAlunoDto,
  DesempenhoTemaAlunoDto,
  StatusDesempenhoTema,
} from "./dto/dashboardAluno.types";

const LIMITE_TRANQUILO = 70;
const LIMITE_ATENCAO = 40;

function classificarStatus(taxaAcerto: number): StatusDesempenhoTema {
  if (taxaAcerto >= LIMITE_TRANQUILO) return "Tranquilo";
  if (taxaAcerto >= LIMITE_ATENCAO) return "Atenção";
  return "Crítico";
}

function calcularPercentual(parte: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((parte / total) * 100);
}

type EstatisticaTema = { nome: string; total: number; acertos: number };

export class DashboardAlunoService {
  constructor(private readonly repository: DashboardAlunoRepository) {}

  async obterDashboard(usuarioId: string | undefined): Promise<DashboardAlunoDto> {
    if (usuarioId === "" || usuarioId === undefined) {
      throw new ErroAplicacao({
        codigoStatus: 401,
        codigo: CodigoDeErro.NAO_AUTORIZADO,
        mensagem: MENSAGENS.usuarioAutenticadoEncontrado,
      });
    }

    const resolucoes = await this.repository.buscarResolucoesPorUsuario(usuarioId);

    if (resolucoes.length === 0) {
      return { totalRespondidas: 0, totalAcertos: 0, totalErros: 0, taxaAcerto: 0, porTema: [] };
    }

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

    return {
      totalRespondidas,
      totalAcertos,
      totalErros,
      taxaAcerto: calcularPercentual(totalAcertos, totalRespondidas),
      porTema,
    };
  }
}
