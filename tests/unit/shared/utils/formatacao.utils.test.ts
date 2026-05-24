import { normalizarEspacos } from '../../../../src/shared/utils/formatacao.util'; 

describe('normalizarEspacos', () => {
  it('deve substituir múltiplos espaços entre palavras por um único espaço', () => {
    const resultado = normalizarEspacos('palavra1    palavra2      palavra3');
    expect(resultado).toBe('palavra1 palavra2 palavra3');
  });

  it('deve remover espaços extras no início e no fim da string', () => {
    const resultado = normalizarEspacos('   texto centralizado   ');
    expect(resultado).toBe('texto centralizado');
  });

  it('deve converter tabs e quebras de linha em espaços simples', () => {
    const resultado = normalizarEspacos('linha1\n\n\nlinha2\t\ttab');
    expect(resultado).toBe('linha1 linha2 tab');
  });

  it('deve retornar string vazia se receber uma string vazia', () => {
    const resultado = normalizarEspacos('');
    expect(resultado).toBe('');
  });

  it('deve retornar string vazia se receber apenas espaços e tabs', () => {
    const resultado = normalizarEspacos('   \n\t   ');
    expect(resultado).toBe('');
  });

  it('deve retornar a mesma string se ela já estiver normalizada', () => {
    const resultado = normalizarEspacos('texto perfeitamente normal');
    expect(resultado).toBe('texto perfeitamente normal');
  });
});