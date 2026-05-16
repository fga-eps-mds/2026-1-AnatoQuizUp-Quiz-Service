import type { StatusTurma } from '@prisma/client';

export interface FiltrosListagemTurma {
  professorId: string; 
  status?: StatusTurma;
  busca?: string;
}

export interface RespostaTurma {
  id: string;
  codigo: string;
  nome: string;
  semestre: string;
  ano: number;
  descricao: string;
  status: StatusTurma;
  professorId: string;
  criadoEm: Date;
}