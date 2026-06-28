import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';

// Renderiza um template EJS em HTML e o converte em PDF (base64) via Puppeteer.
export async function gerarPdfBase64(nomeTemplate: string, dados: Record<string, unknown>): Promise<string> {
  // Resolve o caminho do template em src/shared/templates.
  const caminhoTemplate = path.join(process.cwd(), 'src', 'shared', 'templates', `${nomeTemplate}.ejs`);

  const html = await ejs.renderFile(caminhoTemplate, dados);

  // Browser headless; flags de sandbox necessarias em ambientes de container.
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });

  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  // Sempre fecha o browser para nao vazar processos.
  await browser.close();

  return Buffer.from(pdfBuffer).toString('base64');
}