import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';

export async function gerarPdfBase64(nomeTemplate: string, dados: Record<string, unknown>): Promise<string> {
  const caminhoTemplate = path.join(process.cwd(), 'src', 'shared', 'templates', `${nomeTemplate}.ejs`);
  
  const html = await ejs.renderFile(caminhoTemplate, dados);

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' }); 

  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return Buffer.from(pdfBuffer).toString('base64');
}