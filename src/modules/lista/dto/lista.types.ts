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

export interface CriarListaQuestaoDTO {
  nome: string;
  questoesIds?: string[];
  turmasIds?: string[];
}

export interface AtualizarListaQuestaoDTO {
  nome?: string;
}

export interface VincularQuestoesListaDTO {
  questoesIds: string[];
}

export interface ReordenarQuestoesListaDTO {
  questoesIds: string[];
}

export interface VincularTurmasListaDTO {
  turmasIds: string[];
}

export interface VincularTurmaComConfigDTO {
  turmaId: string;
  prazo?: string | null;
  gabaritoLiberado?: boolean;
}

export type VincularTurmasListaPayloadDTO =
  | VincularTurmasListaDTO
  | VincularTurmaComConfigDTO;

export interface AtualizarVinculoListaTurmaDTO {
  prazo?: string | null;
  gabaritoLiberado?: boolean;
}

export interface VinculoListaTurmaDTO {
  id: string;
  listaQuestaoId: string;
  nome: string;
  quantidadeQuestoes: number;
  prazo: string | null;
  gabaritoLiberado: boolean;
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
