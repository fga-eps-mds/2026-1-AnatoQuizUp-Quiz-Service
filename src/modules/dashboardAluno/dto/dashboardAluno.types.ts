// DTOs do dashboard do aluno (formato consumido pelo front).

// Faixas de status calculadas a partir da taxa de acerto por tema.
export type StatusDesempenhoTema = "Tranquilo" | "Atenção" | "Crítico";
// Estado da resolucao de uma lista pelo aluno.
export type StatusResolucaoLista = "SUBMETIDA" | "EM_ANDAMENTO" | "NAO_RESPONDEU";

// Desempenho do aluno em um tema especifico.
export interface DesempenhoTemaAlunoDto {
  temaId: string;
  nome: string;
  totalRespondidas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
  status: StatusDesempenhoTema;
}

// Desempenho do aluno em uma lista atribuida.
export interface DesempenhoListaAlunoDto {
  listaTurmaId: string;
  nomeLista: string;
  totalQuestoes: number;
  acertos: number;
  taxaAcerto: number;
  status: StatusResolucaoLista;
  submissaoEm: string | null;
  prazo: string | null;
}

// Payload completo do dashboard: totais gerais + recortes por tema e por lista.
export interface DashboardAlunoDto {
  totalRespondidas: number;
  totalAcertos: number;
  totalErros: number;
  taxaAcerto: number;
  porTema: DesempenhoTemaAlunoDto[];
  porLista: DesempenhoListaAlunoDto[]; 
}