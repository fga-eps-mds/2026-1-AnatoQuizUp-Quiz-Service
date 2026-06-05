import { AlternativaQuestao } from '@prisma/client';
import {
  schemaListarListas,
  schemaBuscarListaPorId,
  schemaSubmeterLista,
  schemaSalvarProgresso,
} from '../../../src/modules/resolucaoLista/resolucaoLista.schemas';

describe('ResolucaoLista Schemas', () => {
  const validCuid = 'cm0rxyz1234567890abcdefgh';

  describe('schemaListarListas', () => {
    it('deve validar um objeto vazio e aplicar valores padrao', () => {
      const result = schemaListarListas.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ page: 1, limit: 10 });
      }
    });

    it('deve validar com todos os campos corretos', () => {
      const result = schemaListarListas.safeParse({
        status: 'PENDENTE',
        busca: 'Tórax',
        page: 2,
        limit: 20,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          status: 'PENDENTE',
          busca: 'Tórax',
          page: 2,
          limit: 20,
        });
      }
    });

    it('deve falhar se o status for invalido', () => {
      const result = schemaListarListas.safeParse({ status: 'QUALQUER_COISA' });
      expect(result.success).toBe(false);
    });
  });

  describe('schemaBuscarListaPorId', () => {
    it('deve validar com um cuid valido', () => {
      const result = schemaBuscarListaPorId.safeParse({ id: validCuid });
      expect(result.success).toBe(true);
    });

    it('deve falhar e retornar mensagem customizada se o id nao for cuid', () => {
      const result = schemaBuscarListaPorId.safeParse({ id: '123' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('ID da lista inválido');
      }
    });
  });

  describe('schemaSubmeterLista', () => {
    it('deve validar com um cuid valido', () => {
      const result = schemaSubmeterLista.safeParse({ id: validCuid });
      expect(result.success).toBe(true);
    });

    it('deve falhar e retornar mensagem customizada se o id nao for cuid', () => {
      const result = schemaSubmeterLista.safeParse({ id: 'id-invalido' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('ID da lista inválido');
      }
    });
  });

  describe('schemaSalvarProgresso', () => {
    it('deve validar com cuid valido e alternativa valida', () => {
      const result = schemaSalvarProgresso.safeParse({
        questaoId: validCuid,
        alternativaMarcada: AlternativaQuestao.B,
      });
      expect(result.success).toBe(true);
    });

    it('deve falhar se o questaoId nao for cuid', () => {
      const result = schemaSalvarProgresso.safeParse({
        questaoId: 'invalido',
        alternativaMarcada: AlternativaQuestao.A,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('ID da questão inválido');
      }
    });

    it('deve falhar se a alternativa for invalida', () => {
      const result = schemaSalvarProgresso.safeParse({
        questaoId: validCuid,
        alternativaMarcada: 'F',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Alternativa inválida');
      }
    });
  });
});