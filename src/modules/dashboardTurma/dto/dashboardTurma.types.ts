export interface TemaDesempenhoDTO {
  nome: string;
  totalRespondidas: number;
  taxaAcerto: number; 
  status: 'Tranquilo' | 'Atenção' | 'Crítico';
}

export interface DashboardMacroResponseDTO {
  totalAlunos: number;
  totalQuestoesRespondidas: number;
  taxaMediaAcertos: number; 
  desempenhoPorTema: TemaDesempenhoDTO[];
}