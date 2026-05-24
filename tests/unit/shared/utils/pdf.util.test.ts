jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

import { gerarPdfBase64 } from '../../../../src/shared/utils/pdf.util';
import puppeteer from 'puppeteer';
import ejs from 'ejs';
import fs from 'fs';

jest.mock('ejs');
jest.mock('fs');

describe('PDF Utility', () => {
  it('deve gerar e retornar o PDF em formato base64', async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue('<html>template falso</html>');
    (ejs.render as jest.Mock).mockReturnValue('<html>html renderizado</html>');

    const mockPdfBuffer = Buffer.from('conteudo-falso-do-pdf');
    const mockPage = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(mockPdfBuffer),
    };
    const mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    };
    
    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

    const dadosFalsos = { lista: { nome: 'Teste' } };
    const resultado = await gerarPdfBase64('prova', dadosFalsos);

    expect(resultado).toBe(mockPdfBuffer.toString('base64'));
  });
});