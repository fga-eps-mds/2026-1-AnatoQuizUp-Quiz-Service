export type StatusDesempenhoTema = "Tranquilo" | "Atenção" | "Crítico";
export type StatusResolucaoLista = "SUBMETIDA" | "EM_ANDAMENTO" | "NAO_RESPONDEU";

export interface DesempenhoTemaAlunoDto {
  temaId: string;
  nome: string;
  totalRespondidas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
  status: StatusDesempenhoTema;
}

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

export interface DashboardAlunoDto {
  totalRespondidas: number;
  totalAcertos: number;
  totalErros: number;
  taxaAcerto: number;
  porTema: DesempenhoTemaAlunoDto[];
  porLista: DesempenhoListaAlunoDto[]; 
}