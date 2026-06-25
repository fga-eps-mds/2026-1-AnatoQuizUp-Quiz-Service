import type { RankingRepository } from './ranking.repository';
import type { PontuacaoUsuario } from './ranking.types';

/**
 * Ordena pela regra da US de ranking: mais acertos primeiro; em caso de
 * empate, quem respondeu menos questões (mais eficiente) fica à frente; e,
 * persistindo o empate, quem atingiu a pontuação primeiro (atividade mais
 * antiga) fica à frente.
 */
export function compararPontuacoes(a: PontuacaoUsuario, b: PontuacaoUsuario): number {
  if (b.totalAcertos !== a.totalAcertos) {
    return b.totalAcertos - a.totalAcertos;
  }

  if (a.totalRespondidas !== b.totalRespondidas) {
    return a.totalRespondidas - b.totalRespondidas;
  }

  const dataA = a.ultimaAtividade ? new Date(a.ultimaAtividade).getTime() : Number.POSITIVE_INFINITY;
  const dataB = b.ultimaAtividade ? new Date(b.ultimaAtividade).getTime() : Number.POSITIVE_INFINITY;

  return dataA - dataB;
}

export class RankingService {
  constructor(private readonly repository: RankingRepository) {}

  async obterPontuacoes(usuarioIds?: string[]): Promise<PontuacaoUsuario[]> {
    const linhas = await this.repository.agregarPontuacoes(usuarioIds);

    const pontuacoes: PontuacaoUsuario[] = linhas.map((linha) => ({
      usuarioId: linha.usuarioId,
      totalAcertos: Number(linha.acertos),
      totalRespondidas: Number(linha.respondidas),
      ultimaAtividade: linha.ultimaAtividade ? linha.ultimaAtividade.toISOString() : null,
    }));

    pontuacoes.sort(compararPontuacoes);

    return pontuacoes;
  }
}
