import { schemaListarTurmas } from '@/modules/turma/turma.schemas'; 

describe('schemaListarTurmas', () => {
  it('deve validar com sucesso um objeto vazio, pois todos os campos são opcionais', () => {
    const resultado = schemaListarTurmas.safeParse({});
    
    expect(resultado.success).toBe(true);
  });

  it('deve validar com sucesso quando status e busca forem passados corretamente', () => {
    const resultado = schemaListarTurmas.safeParse({
      status: 'ATIVA',
      busca: 'Anatomia'
    });
    
    expect(resultado.success).toBe(true);
  });

  it('deve invalidar e retornar a mensagem customizada quando o status for diferente de ATIVA/INATIVA', () => {
    const resultado = schemaListarTurmas.safeParse({
      status: 'PANDENTE' 
    });
    
    expect(resultado.success).toBe(false);
    
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe('Status deve ser ATIVA ou INATIVA');
      expect(resultado.error.issues[0].path[0]).toBe('status');
    }
  });

  it('deve invalidar e retornar a mensagem customizada quando a busca for uma string vazia', () => {
    const resultado = schemaListarTurmas.safeParse({
      busca: ''
    });
    
    expect(resultado.success).toBe(false);
    
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe('A busca não pode ser vazia');
      expect(resultado.error.issues[0].path[0]).toBe('busca');
    }
  });

  it('deve invalidar quando a busca for preenchida apenas com espaços (testando o .trim())', () => {
    const resultado = schemaListarTurmas.safeParse({
      busca: '      '
    });
    
    expect(resultado.success).toBe(false);
    
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe('A busca não pode ser vazia');
    }
  });
});