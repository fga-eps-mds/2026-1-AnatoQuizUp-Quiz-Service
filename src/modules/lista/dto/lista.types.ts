export interface EstatisticasAlunoDTO {
  alunoId: string;
  totalRespondidas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
}

export interface EstatisticasTurmaDTO {
  turmaId: string;
  totalAlunos: number;
  alunosParticipantes: number;
  estatisticasAlunos: EstatisticasAlunoDTO[];
}

export interface FiltrosListaDTO {
  busca?: string;
  status?: 'PUBLICADA' | 'RASCUNHO';
}

export interface ListaQuestaoRespostaDTO {
  id: string;
  nome: string;
  quantidadeQuestoes: number;
  status: 'PUBLICADA' | 'RASCUNHO';
  turmas: {
    id: string;
    nome: string;
  }[];
  criadoEm: Date;
  atualizadoEm: Date;
}