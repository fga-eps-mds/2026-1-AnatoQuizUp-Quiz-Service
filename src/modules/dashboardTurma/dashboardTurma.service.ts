import type { TurmaDashboardRepository } from './dashboardTurma.repository';
import type { DesempenhoListaDTO } from './dto/dashboardTurma.types';

export class TurmaDashboardService {
  constructor(private readonly repository: TurmaDashboardRepository) {}

  async getDesempenhoIndividual(turmaId: string) {
    const alunosIds = await this.repository.findAlunosByTurmaId(turmaId);

    if (alunosIds.length === 0) {
      return { alunos: [] };
    }

    const resolucoes = await this.repository.findResolucoesByAlunos(alunosIds);

    type StatsAluno = {
      totalRespondidas: number;
      totalAcertos: number;
      ultimaAtividade: Date | null;
      temas: Map<string, { acertos: number; total: number }>;
    };

    const alunosMap = new Map<string, StatsAluno>();
    alunosIds.forEach((id) =>
      alunosMap.set(id, { totalRespondidas: 0, totalAcertos: 0, ultimaAtividade: null, temas: new Map() }),
    );

    resolucoes.forEach((resolucao) => {
      const acertou = resolucao.respostaMarcada === resolucao.questao.respostaCorreta;
      const nomeTema = resolucao.questao.tema.nome;
      const stats = alunosMap.get(resolucao.usuarioId)!;

      stats.totalRespondidas += 1;
      if (acertou) stats.totalAcertos += 1;

      if (!stats.ultimaAtividade || resolucao.criadoEm > stats.ultimaAtividade) {
        stats.ultimaAtividade = resolucao.criadoEm;
      }

      if (!stats.temas.has(nomeTema)) stats.temas.set(nomeTema, { acertos: 0, total: 0 });
      const t = stats.temas.get(nomeTema)!;
      t.total += 1;
      if (acertou) t.acertos += 1;
    });

    const alunos = Array.from(alunosMap.entries()).map(([alunoId, stats]) => {
      const taxaAcerto =
        stats.totalRespondidas > 0
          ? Math.round((stats.totalAcertos / stats.totalRespondidas) * 100)
          : 0;

      const desempenhoPorTema = Array.from(stats.temas.entries()).map(([nome, t]) => {
        const taxa = Math.round((t.acertos / t.total) * 100);
        let status = 'Crítico';
        if (taxa >= 70) status = 'Tranquilo';
        else if (taxa >= 40) status = 'Atenção';
        return { nome, totalRespondidas: t.total, taxaAcerto: taxa, status };
      });

      desempenhoPorTema.sort((a, b) => b.taxaAcerto - a.taxaAcerto);

      return {
        alunoId,
        totalRespondidas: stats.totalRespondidas,
        totalAcertos: stats.totalAcertos,
        taxaAcerto,
        ultimaAtividade: stats.ultimaAtividade?.toISOString() ?? null,
        desempenhoPorTema,
      };
    });

    alunos.sort((a, b) => b.taxaAcerto - a.taxaAcerto);

    return { alunos };
  }

  async getMacroDashboard(turmaId: string, professorId: string) {
    void professorId;
    const alunosIds = await this.repository.findAlunosByTurmaId(turmaId);
    
    if (alunosIds.length === 0) {
      return { totalAlunos: 0, totalQuestoesRespondidas: 0, taxaMediaAcertos: 0, desempenhoPorTema: [] };
    }

    const resolucoes = await this.repository.findResolucoesByAlunos(alunosIds);

    if (resolucoes.length === 0) {
      return { totalAlunos: alunosIds.length, totalQuestoesRespondidas: 0, taxaMediaAcertos: 0, desempenhoPorTema: [] };
    }

    let totalAcertosGerais = 0;
    const temasMap = new Map<string, { acertos: number; total: number }>();

    resolucoes.forEach((resolucao) => {
      const acertou = resolucao.respostaMarcada === resolucao.questao.respostaCorreta;
      const nomeTema = resolucao.questao.tema.nome;

      if (acertou) totalAcertosGerais++;

      if (!temasMap.has(nomeTema)) {
        temasMap.set(nomeTema, { acertos: 0, total: 0 });
      }
      
      const statsTema = temasMap.get(nomeTema)!;
      statsTema.total += 1;
      if (acertou) statsTema.acertos += 1;
    });

    const taxaMediaAcertos = Math.round((totalAcertosGerais / resolucoes.length) * 100);

    const desempenhoPorTema = Array.from(temasMap.entries()).map(([nome, stats]) => {
      const taxa = Math.round((stats.acertos / stats.total) * 100);
      let status = 'Crítico';
      if (taxa >= 70) status = 'Tranquilo';
      else if (taxa >= 40) status = 'Atenção';

      return { nome, totalRespondidas: stats.total, taxaAcerto: taxa, status };
    });

    desempenhoPorTema.sort((a, b) => b.taxaAcerto - a.taxaAcerto);

    return {
      totalAlunos: alunosIds.length,
      totalQuestoesRespondidas: resolucoes.length,
      taxaMediaAcertos,
      desempenhoPorTema,
    };
  }

  async getDesempenhoPorListas(
    turmaId: string,
    professorId: string,
  ): Promise<DesempenhoListaDTO[]> {
    void professorId;

    const [alunosIds, listasTurma] = await Promise.all([
      this.repository.findAlunosByTurmaId(turmaId),
      this.repository.findDesempenhoPorListasDaTurma(turmaId),
    ]);

    const totalAlunos = alunosIds.length;

    return listasTurma.map((listaTurma) => {
      const totalSubmeteram = listaTurma.resolucoes.length;
      const totalPendentes = Math.max(totalAlunos - totalSubmeteram, 0);
      const respostas = listaTurma.resolucoes.flatMap((resolucao) => resolucao.respostas);
      const totalRespostas = respostas.length;
      const totalAcertos = respostas.filter(
        (resposta) => resposta.respostaMarcada === resposta.questao.respostaCorreta,
      ).length;
      const taxaMediaAcerto =
        totalRespostas > 0 ? Number(((totalAcertos / totalRespostas) * 100).toFixed(1)) : 0;

      return {
        listaTurmaId: listaTurma.id,
        nomeLista: listaTurma.listaQuestao.nome,
        totalAlunos,
        totalSubmeteram,
        totalPendentes,
        taxaMediaAcerto,
        prazo: listaTurma.prazo?.toISOString() ?? null,
      };
    });
  }

  async getDesempenhoAlunosNaLista(turmaId: string, listaTurmaId: string) {
    const [alunosIds, listaTurma] = await Promise.all([
      this.repository.findAlunosByTurmaId(turmaId),
      this.repository.findListaTurmaById(turmaId, listaTurmaId),
    ]);

    if (!listaTurma || listaTurma.turmaId !== turmaId) {
      throw new Error('Lista não encontrada ou não pertence a esta turma.');
    }

    const totalQuestoes = listaTurma.listaQuestao.itens.length;

    const resolucoesMap = new Map();
    listaTurma.resolucoes.forEach((res) => {
      resolucoesMap.set(res.alunoId, res);
    });

    const alunos = alunosIds.map((alunoId) => {
      const resolucao = resolucoesMap.get(alunoId);

      if (!resolucao || resolucao.status !== 'SUBMETIDA') {
        return {
          alunoId,
          status: resolucao?.status === 'EM_ANDAMENTO' ? 'EM_ANDAMENTO' : 'NAO_RESPONDEU',
          totalAcertos: 0,
          taxaAcerto: 0,
          submissaoEm: null,
          mensagem: resolucao?.status === 'EM_ANDAMENTO' ? 'Iniciou mas não submeteu' : 'Não respondeu',
        };
      }

      const totalAcertos = resolucao.respostas.filter(
        (r: { respostaMarcada: string | null; questao: { respostaCorreta: string } }) => 
          r.respostaMarcada === r.questao.respostaCorreta
      ).length;

      const taxaAcerto = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

      return {
        alunoId,
        status: 'SUBMETIDA',
        totalAcertos,
        taxaAcerto,
        submissaoEm: resolucao.submissaoEm?.toISOString() ?? null,
        mensagem: 'Respondida',
      };
    });

    alunos.sort((a, b) => b.taxaAcerto - a.taxaAcerto);

    return {
      listaTurmaId,
      nomeLista: listaTurma.listaQuestao.nome,
      totalQuestoes,
      desempenhoAlunos: alunos,
    };
  }
}
