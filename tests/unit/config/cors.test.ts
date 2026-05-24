import { parseCorsOrigins, criarOpcoesCors } from '../../../src/config/cors';
import { ErroAplicacao } from '@/shared/errors/erro-aplicacao';

describe('Configuração de CORS', () => {
  describe('parseCorsOrigins', () => {
    it('deve converter uma string separada por vírgulas em um array de origens', () => {
      const resultado = parseCorsOrigins('http://localhost:3000, https://meuapp.com ');
      expect(resultado).toEqual(['http://localhost:3000', 'https://meuapp.com']);
    });

    it('deve ignorar espaços em branco e valores vazios', () => {
      const resultado = parseCorsOrigins('http://localhost, ,  ,');
      expect(resultado).toEqual(['http://localhost']);
    });
  });

  describe('criarOpcoesCors', () => {
    it('deve permitir a requisição se a origem não for informada (undefined)', () => {
      const opcoes = criarOpcoesCors(['http://localhost']);
      const callback = jest.fn();

      if (typeof opcoes.origin === 'function') {
        opcoes.origin(undefined as unknown as string, callback);
      }

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('deve permitir a requisição se a origem estiver na lista de permitidas', () => {
      const opcoes = criarOpcoesCors(['http://localhost']);
      const callback = jest.fn();

      if (typeof opcoes.origin === 'function') {
        opcoes.origin('http://localhost', callback);
      }

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('deve bloquear a requisição e retornar ErroAplicacao se a origem não for permitida', () => {
      const opcoes = criarOpcoesCors(['http://localhost']);
      const callback = jest.fn();

      if (typeof opcoes.origin === 'function') {
        opcoes.origin('http://site-malicioso.com', callback);
      }

      expect(callback).toHaveBeenCalledWith(expect.any(ErroAplicacao));
    });
  });
});