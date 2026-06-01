import { schemaParamsDashboard } from '../../../src/modules/dashboardTurma/dashboardTruma.schemas';

describe('schemaParamsDashboard', () => {
  it('deve validar um ID cuid valido', () => {
    const result = schemaParamsDashboard.safeParse({ id: 'cmpsx9a2f00064hx26j7kukdo' });
    expect(result.success).toBe(true);
  });

  it('deve invalidar um ID com formato incorreto', () => {
    const result = schemaParamsDashboard.safeParse({ id: 'id-invalido' });
    expect(result.success).toBe(false);
  });

  it('deve falhar se o ID não for fornecido', () => {
    const result = schemaParamsDashboard.safeParse({});
    expect(result.success).toBe(false);
  });
});