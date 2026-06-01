export type StatusDesempenhoTema = "Tranquilo" | "Atenção" | "Crítico";

export interface DesempenhoTemaAlunoDto {
  temaId: string;
  nome: string;
  totalRespondidas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
  status: StatusDesempenhoTema;
}

export interface DashboardAlunoDto {
  totalRespondidas: number;
  totalAcertos: number;
  totalErros: number;
  taxaAcerto: number;
  porTema: DesempenhoTemaAlunoDto[];
}
