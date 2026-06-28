// DTOs (contratos de dados) do modulo de listas de questoes.

// Estatisticas de desempenho de um aluno em uma lista.
export interface EstatisticasAlunoDTO {
  alunoId: string;
  totalRespondidas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
}

// Estatisticas agregadas da turma, com o detalhe por aluno.
export interface EstatisticasTurmaDTO {
  turmaId: string;
  totalAlunos: number;
  alunosParticipantes: number;
  estatisticasAlunos: EstatisticasAlunoDTO[];
}

// Filtros aceitos na listagem de listas.
export interface FiltrosListaDTO {
  busca?: string;
  status?: 'PUBLICADA' | 'RASCUNHO';
}

// Dados para criar uma lista (questoes/turmas podem ser vinculadas ja na criacao).
export interface CriarListaQuestaoDTO {
  nome: string;
  questoesIds?: string[];
  turmasIds?: string[];
}

// Dados para atualizar uma lista.
export interface AtualizarListaQuestaoDTO {
  nome?: string;
}

// Payload para vincular questoes a uma lista.
export interface VincularQuestoesListaDTO {
  questoesIds: string[];
}

// Payload para reordenar as questoes (a ordem do array define a posicao).
export interface ReordenarQuestoesListaDTO {
  questoesIds: string[];
}

// Vinculo de turmas no formato legado (somente ids).
export interface VincularTurmasListaDTO {
  turmasIds: string[];
}

// Vinculo de uma turma com configuracao (prazo e liberacao de gabarito).
export interface VincularTurmaComConfigDTO {
  turmaId: string;
  prazo?: string | null;
  gabaritoLiberado?: boolean;
}

// Aceita os dois formatos de vinculo de turma.
export type VincularTurmasListaPayloadDTO =
  | VincularTurmasListaDTO
  | VincularTurmaComConfigDTO;

// Campos atualizaveis de um vinculo lista<->turma.
export interface AtualizarVinculoListaTurmaDTO {
  prazo?: string | null;
  gabaritoLiberado?: boolean;
}

// Representacao de um vinculo lista<->turma retornado pela API.
export interface VinculoListaTurmaDTO {
  id: string;
  listaQuestaoId: string;
  nome: string;
  quantidadeQuestoes: number;
  prazo: string | null;
  gabaritoLiberado: boolean;
}

// Lista de questoes como retornada ao cliente.
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
