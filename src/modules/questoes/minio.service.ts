import * as Minio from "minio";

// Servico de upload de imagens das questoes no MinIO/S3.
export class MinioService {
  private minioClient: Minio.Client;
  private bucketName = "anatoquizup-imagens";

  constructor() {
    // Endpoint sem protocolo (o cliente usa hostname puro).
    const endpointRaw = process.env.MINIO_ENDPOINT || "localhost";
    const cleanEndPoint = endpointRaw.replace(/^https?:\/\//, "");

    // SSL em producao ou quando o endpoint ja vem como https.
    const useSSL = process.env.NODE_ENV === "production" || endpointRaw.startsWith("https");

    // Com SSL deixa a porta padrao; sem SSL usa a porta da API configurada.
    const port = useSSL ? undefined : parseInt(process.env.MINIO_API_PORT || "9000", 10);

    this.minioClient = new Minio.Client({
      endPoint: cleanEndPoint,
      port: port,
      useSSL: useSSL,
      accessKey: process.env.MINIO_ROOT_USER || "",
      secretKey: process.env.MINIO_ROOT_PASSWORD || "",
    });
  }

  // Envia a imagem ao bucket com nome unico e retorna sua URL publica.
  async uploadImagem(arquivo: Express.Multer.File): Promise<string> {
    // Prefixa com timestamp e troca espacos por "_" para evitar colisao/URL quebrada.
    const nomeOriginalLimpo = arquivo.originalname.replace(/\s/g, "_");
    const nomeArquivo = `${Date.now()}-${nomeOriginalLimpo}`;

    await this.minioClient.putObject(this.bucketName, nomeArquivo, arquivo.buffer, arquivo.size, {
      "Content-Type": arquivo.mimetype,
    });

    return this.gerarUrlPublica(nomeArquivo);
  }

  // Monta a URL publica do objeto conforme o ambiente/configuracao.
  private gerarUrlPublica(nomeArquivo: string): string {
    // URL publica explicita tem prioridade (ex.: CDN/dominio proprio).
    const publicUrl = process.env.MINIO_PUBLIC_URL;
    if (publicUrl) {
      const base = publicUrl.replace(/\/$/, "");
      return `${base}/${this.bucketName}/${nomeArquivo}`;
    }

    const endpointRaw = process.env.MINIO_ENDPOINT;

    // Em producao o endpoint ja inclui a porta/dominio final.
    if (process.env.NODE_ENV === "production") {
      return `${endpointRaw}/${this.bucketName}/${nomeArquivo}`;
    }

    // Em desenvolvimento concatena a porta da API explicitamente.
    const porta = process.env.MINIO_API_PORT;
    return `${endpointRaw}:${porta}/${this.bucketName}/${nomeArquivo}`;
  }
}
