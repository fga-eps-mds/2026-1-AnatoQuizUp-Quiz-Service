import type { StatusTurma } from '@prisma/client';

export interface FiltrosListagemTurma {
  professorId: string; 
  status?: StatusTurma;
  busca?: string;
  semestre?: string;
  ano?: number;
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

export interface CriarTurmaDto {
  codigo: string;
  nome: string;
  semestre: string;
  ano: number;
  descricao: string;
  status?: StatusTurma;
}

export type AtualizarTurmaDto = Partial<CriarTurmaDto>;

export interface VincularAlunoTurmaDto {
  alunoId: string;
}

export interface RespostaVinculoTurmaAluno {
  id: string;
  turmaId: string;
  alunoId: string;
  criadoEm: Date;
  atualizadoEm: Date;
}
