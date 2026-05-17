import * as Minio from 'minio';

export class MinioService {
  private minioClient: Minio.Client;
  private bucketName = 'anatoquizup-imagens';

  constructor() {
    const endpointRaw = process.env.MINIO_ENDPOINT || 'localhost';
    const cleanEndPoint = endpointRaw.replace(/^https?:\/\//, '');
    
    const useSSL = process.env.NODE_ENV === 'production' || endpointRaw.startsWith('https');
    
    const port = useSSL ? undefined : parseInt(process.env.MINIO_API_PORT || '9000', 10);

    this.minioClient = new Minio.Client({
      endPoint: cleanEndPoint,
      port: port,
      useSSL: useSSL,
      accessKey: process.env.MINIO_ROOT_USER || '',
      secretKey: process.env.MINIO_ROOT_PASSWORD || '',
    });
  }

  async uploadImagem(arquivo: Express.Multer.File): Promise<string> {
    const nomeOriginalLimpo = arquivo.originalname.replace(/\s/g, '_');
    const nomeArquivo = `${Date.now()}-${nomeOriginalLimpo}`;
    
    await this.minioClient.putObject(
      this.bucketName, 
      nomeArquivo, 
      arquivo.buffer, 
      arquivo.size,
      { 'Content-Type': arquivo.mimetype } 
    );

    return this.gerarUrlPublica(nomeArquivo);
  }

  private gerarUrlPublica(nomeArquivo: string): string {
    const endpointRaw = process.env.MINIO_ENDPOINT;
    
    if (process.env.NODE_ENV === 'production') {
      return `${endpointRaw}/${this.bucketName}/${nomeArquivo}`;
    }

    const porta = process.env.MINIO_API_PORT;
    return `${endpointRaw}:${porta}/${this.bucketName}/${nomeArquivo}`;
  }
}