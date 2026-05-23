import {
  schemaAtualizarLista,
  schemaCriarLista,
  schemaEstatisticasParams,
  schemaListarListas,
  schemaParametroId,
  schemaParametroListaQuestao,
  schemaParametroListaTurma,
  schemaParametroTurmaId,
  schemaReordenarQuestoes,
  schemaVincularQuestoes,
  schemaVincularTurmas,
} from '../../../src/modules/lista/lista.schemas';

const cuid = 'clhq9z920000008l6f4x5c7u3';
const outroCuid = 'clhq9z920000008l6f4x5c7u4';

describe('ListaQuestao Schemas', () => {
  it('deve validar parametro id', () => {
    expect(schemaParametroId.safeParse({ id: cuid }).success).toBe(true);
    expect(schemaParametroId.safeParse({ id: 'invalido' }).success).toBe(false);
  });

  it('deve validar parametros de estatisticas', () => {
    expect(schemaEstatisticasParams.safeParse({ id: cuid, turmaId: outroCuid }).success).toBe(true);
    expect(schemaEstatisticasParams.safeParse({ id: cuid, turmaId: 'invalido' }).success).toBe(false);
  });

  it('deve validar parametro turmaId', () => {
    expect(schemaParametroTurmaId.safeParse({ turmaId: cuid }).success).toBe(true);
    expect(schemaParametroTurmaId.safeParse({ turmaId: 'invalido' }).success).toBe(false);
  });

  it('deve validar parametros de lista e questao', () => {
    expect(schemaParametroListaQuestao.safeParse({ id: cuid, questaoId: outroCuid }).success).toBe(
      true,
    );
    expect(schemaParametroListaQuestao.safeParse({ id: cuid, questaoId: 'invalido' }).success).toBe(
      false,
    );
  });

  it('deve validar parametros de lista e turma', () => {
    expect(schemaParametroListaTurma.safeParse({ id: cuid, turmaId: outroCuid }).success).toBe(true);
    expect(schemaParametroListaTurma.safeParse({ id: cuid, turmaId: 'invalido' }).success).toBe(
      false,
    );
  });

  it('deve validar filtros de listagem', () => {
    expect(schemaListarListas.safeParse({ busca: 'anatomia', status: 'PUBLICADA' }).success).toBe(
      true,
    );
    expect(schemaListarListas.safeParse({}).success).toBe(true);
    expect(schemaListarListas.safeParse({ status: 'INVALIDO' }).success).toBe(false);
  });

  it('deve validar criacao de lista', () => {
    expect(
      schemaCriarLista.safeParse({
        nome: 'Simulado',
        questoesIds: [cuid],
        turmasIds: [outroCuid],
      }).success,
    ).toBe(true);
    expect(schemaCriarLista.safeParse({ nome: '' }).success).toBe(false);
    expect(schemaCriarLista.safeParse({ nome: 'Simulado', questoesIds: ['x'] }).success).toBe(
      false,
    );
  });

  it('deve validar atualizacao de lista', () => {
    expect(schemaAtualizarLista.safeParse({ nome: 'Novo nome' }).success).toBe(true);
    expect(schemaAtualizarLista.safeParse({}).success).toBe(false);
    expect(schemaAtualizarLista.safeParse({ nome: '' }).success).toBe(false);
  });

  it('deve validar vinculo de questoes', () => {
    expect(schemaVincularQuestoes.safeParse({ questoesIds: [cuid] }).success).toBe(true);
    expect(schemaVincularQuestoes.safeParse({ questoesIds: [] }).success).toBe(false);
    expect(schemaVincularQuestoes.safeParse({ questoesIds: ['x'] }).success).toBe(false);
  });

  it('deve validar reordenacao de questoes', () => {
    expect(schemaReordenarQuestoes.safeParse({ questoesIds: [cuid, outroCuid] }).success).toBe(
      true,
    );
    expect(schemaReordenarQuestoes.safeParse({ questoesIds: [] }).success).toBe(false);
  });

  it('deve validar vinculo de turmas', () => {
    expect(schemaVincularTurmas.safeParse({ turmasIds: [cuid] }).success).toBe(true);
    expect(schemaVincularTurmas.safeParse({ turmasIds: [] }).success).toBe(false);
    expect(schemaVincularTurmas.safeParse({ turmasIds: ['x'] }).success).toBe(false);
  });
});
