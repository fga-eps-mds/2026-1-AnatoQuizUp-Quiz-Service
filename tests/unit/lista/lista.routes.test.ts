jest.mock('../../../src/shared/utils/pdf.util', () => ({
  gerarPdfBase64: jest.fn().mockResolvedValue('base64'),
}));

import { listaQuestaoRouter } from '../../../src/modules/lista';

type CamadaRota = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
  };
};

const listarRotas = () => (listaQuestaoRouter as unknown as { stack: CamadaRota[] }).stack;

const possuiRota = (path: string, metodo: string) =>
  listarRotas().some((camada) => camada.route?.path === path && camada.route.methods[metodo]);

describe('listaQuestaoRouter', () => {
  it('deve registrar a rota de listagem de vinculos por turma', () => {
    expect(possuiRota('/turma/:turmaId/vinculos', 'get')).toBe(true);
  });

  it('deve registrar a rota de atualizacao do vinculo lista-turma', () => {
    expect(possuiRota('/:id/turmas/:turmaId', 'patch')).toBe(true);
  });
});
