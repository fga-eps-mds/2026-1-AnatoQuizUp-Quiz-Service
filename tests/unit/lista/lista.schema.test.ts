import { schemaParametroId,schemaListarListas, schemaEstatisticasParams, schemaParametroTurmaId } from '../../../src/modules/lista/lista.schemas';

describe('ListaQuestao Schemas', () => {
  describe('schemaParametroId', () => {
    it('deve validar um payload com id (cuid) válido', () => {
      const payload = { id: 'clhq9z920000008l6f4x5c7u3' };
      const resultado = schemaParametroId.safeParse(payload);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar um payload com id inválido', () => {
      const payload = { id: '123' }; 
      const resultado = schemaParametroId.safeParse(payload);
      
      expect(resultado.success).toBe(false);
      
      if (!resultado.success) {
        expect(resultado.error.issues[0].message).toBe('ID da lista inválido.');
      }
    });
  });

  describe('schemaEstatisticasParams', () => {
    it('deve validar parâmetros com id e turmaId corretos', () => {
      const payload = { 
        id: 'clhq9z920000008l6f4x5c7u3', 
        turmaId: 'clhq9z920000008l6f4x5c7u4' 
      };
      const resultado = schemaEstatisticasParams.safeParse(payload);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar se turmaId for inválido', () => {
      const payload = { 
        id: 'clhq9z920000008l6f4x5c7u3', 
        turmaId: 'id-invalido' 
      };
      const resultado = schemaEstatisticasParams.safeParse(payload);
      expect(resultado.success).toBe(false);
    });
  });

  describe('schemaParametroTurmaId', () => {
    it('deve validar um payload com turmaId (cuid) válido', () => {
      const payload = { turmaId: 'clhq9z920000008l6f4x5c7u3' };
      const resultado = schemaParametroTurmaId.safeParse(payload);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar um payload com turmaId inválido', () => {
      const payload = { turmaId: 'id-invalido' };
      const resultado = schemaParametroTurmaId.safeParse(payload);
      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(resultado.error.issues[0].message).toBe('ID da turma inválido.');
      }
    });
  });

  describe('schemaListarListas', () => {
    it('deve validar query com busca e status corretamente', () => {
      const payload = { busca: 'anatomia', status: 'PUBLICADA' };
      const resultado = schemaListarListas.safeParse(payload);
      expect(resultado.success).toBe(true);
    });
    it('deve validar query vazia (filtros opcionais)', () => {
      const payload = {};
      const resultado = schemaListarListas.safeParse(payload);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar query com status inválido', () => {
      const payload = { status: 'INVALIDO' };
      const resultado = schemaListarListas.safeParse(payload);
      expect(resultado.success).toBe(false);
    });
  });
});