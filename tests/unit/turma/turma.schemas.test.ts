import {
  schemaAtualizarTurma,
  schemaCriarTurma,
  schemaListarTurmas,
  schemaParamsTurma,
  schemaParamsTurmaAluno,
  schemaVincularAlunoTurma
} from '@/modules/turma/turma.schemas';

describe('schemaListarTurmas', () => {
  it('deve validar com sucesso um objeto vazio, pois todos os campos sao opcionais', () => {
    const resultado = schemaListarTurmas.safeParse({});

    expect(resultado.success).toBe(true);
  });

  it('deve validar status, busca, semestre e ano quando forem passados corretamente', () => {
    const resultado = schemaListarTurmas.safeParse({
      status: 'ATIVA',
      busca: 'Anatomia',
      semestre: '2026.1',
      ano: '2026'
    });

    expect(resultado.success).toBe(true);

    if (resultado.success) {
      expect(resultado.data.ano).toBe(2026);
    }
  });

  it('deve invalidar quando o status for diferente de ATIVA/INATIVA', () => {
    const resultado = schemaListarTurmas.safeParse({
      status: 'PENDENTE'
    });

    expect(resultado.success).toBe(false);

    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe('Status deve ser ATIVA ou INATIVA');
      expect(resultado.error.issues[0].path[0]).toBe('status');
    }
  });

  it('deve invalidar quando busca ou semestre forem strings vazias', () => {
    const resultado = schemaListarTurmas.safeParse({
      busca: '',
      semestre: '   '
    });

    expect(resultado.success).toBe(false);
  });
});

describe('schemaCriarTurma', () => {
  it('deve validar uma turma completa', () => {
    const resultado = schemaCriarTurma.safeParse({
      codigo: 'ANAT-01',
      nome: 'Turma A',
      semestre: '2026.1',
      ano: 2026,
      descricao: 'Turma de Anatomia',
      status: 'ATIVA'
    });

    expect(resultado.success).toBe(true);
  });

  it('deve invalidar quando campos obrigatorios estiverem ausentes', () => {
    const resultado = schemaCriarTurma.safeParse({
      codigo: 'ANAT-01'
    });

    expect(resultado.success).toBe(false);
  });
});

describe('schemaAtualizarTurma', () => {
  it('deve validar uma atualizacao parcial', () => {
    const resultado = schemaAtualizarTurma.safeParse({
      nome: 'Turma B'
    });

    expect(resultado.success).toBe(true);
  });

  it('deve rejeitar body vazio', () => {
    const resultado = schemaAtualizarTurma.safeParse({});

    expect(resultado.success).toBe(false);
  });
});

describe('schemas de params e vinculo', () => {
  it('deve validar params de turma', () => {
    expect(schemaParamsTurma.safeParse({ id: 'turma-1' }).success).toBe(true);
  });

  it('deve validar params de turma e aluno', () => {
    expect(schemaParamsTurmaAluno.safeParse({ id: 'turma-1', alunoId: 'aluno-1' }).success).toBe(true);
  });

  it('deve validar body de vinculo de aluno', () => {
    expect(schemaVincularAlunoTurma.safeParse({ alunoId: 'aluno-1' }).success).toBe(true);
  });
});
